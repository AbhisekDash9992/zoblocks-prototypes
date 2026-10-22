// Existing external Playwright and installed Chrome/Edge only. No prototype browser suite.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

assert.ok(process.env.PLAYWRIGHT_MODULE && process.env.BROWSER_PATH, 'Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing tooling.')
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const data = JSON.parse(await readFile('src/oxygen-reference-tokens/catalog.json', 'utf8'))
const runtimeCss = await readFile('src/oxygen-reference-tokens/tokens.css', 'utf8')
const previewCss = await readFile('stories/foundations/oxygen-tokens.css', 'utf8')
const base = (process.argv[2] ?? 'http://127.0.0.1:6011').replace(/\/$/, '')
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true, timeout: 15000 })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.setDefaultTimeout(15000)
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`) })
const story = async id => { await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`); await page.locator('#storybook-root > *').first().waitFor(); await page.evaluate(() => document.fonts.ready) }
const styles = root => root.evaluate(element => [element, ...element.querySelectorAll('*')].map(node => ({
  tag: node.tagName, css: Object.fromEntries([...getComputedStyle(node)].filter(key => !key.startsWith('--')).map(key => [key, getComputedStyle(node).getPropertyValue(key)])),
})))
try {
  // Compare all rendered CSS properties before/after injecting the new styles into each accepted pilot.
  for (const [id, selector] of [['cs-01-icon-button--playground-example', '.cs01-panel'], ['cs-02-tooltip--label-only', '.cs02-panel'], ['cs-03-badge--playground-example', '.cs03-panel']]) {
    await story(id)
    const root = page.locator(selector).first()
    await root.waitFor()
    const before = await styles(root)
    await page.addStyleTag({ content: `${runtimeCss}\n${previewCss}` })
    assert.deepEqual(await styles(root), before, `CSS leakage: ${id}`)
    assert.equal(await root.evaluate(el => getComputedStyle(el).getPropertyValue('--ox-color-blue-700')), '')
    if (id.startsWith('cs-01')) {
      const button = page.getByRole('button', { name: 'Filter', exact: true })
      await button.click(); assert.equal(await page.getByRole('status').textContent(), 'Activations: 1')
      await button.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space')
      assert.equal(await page.getByRole('status').textContent(), 'Activations: 3')
      assert.equal(await button.evaluate(el => getComputedStyle(el).color), 'rgb(16, 24, 40)')
    } else if (id.startsWith('cs-02')) {
      const button = page.getByRole('button', { name: 'Filter', exact: true })
      await button.focus(); await page.getByRole('tooltip').waitFor()
      await page.keyboard.press('Escape'); await page.getByRole('tooltip').waitFor({ state: 'detached' })
    } else assert.equal(await page.locator('.cs03-badge-label').textContent(), 'Tag Label')
  }
  console.log('PASS: CS-01/02/03 computed-style isolation and focused behavior smoke')

  await story('foundations-oxygen-reference-tokens--catalog')
  const catalog = page.locator('.tf01-catalog')
  await catalog.waitFor()
  assert.equal(await page.locator('[data-tf01-primitive]').count(), 124)
  assert.equal(await page.locator('[data-tf01-semantic]').count(), 174)
  assert.equal(await page.locator('[data-tf01-style]').count(), 12)
  assert.equal(await page.locator('[data-tf01-semantic][style]').count(), 0, 'No preview white overrides')
  const failures = await page.evaluate(data => {
    const failures = []
    const cssName = key => `--ox-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    const probe = document.createElement('span'); document.body.append(probe)
    const canonical = color => { probe.style.backgroundColor = color; return getComputedStyle(probe).backgroundColor }
    for (const [family, values] of Object.entries(data.primitives)) for (const [level, hex] of Object.entries(values)) {
      const swatch = document.querySelector(`[data-tf01-primitive="${family}/${level}"] .tf01-swatch`)
      if (getComputedStyle(swatch).backgroundColor !== canonical(hex)) failures.push(`${family}/${level}`)
    }
    for (const [name, color] of Object.entries(data.specialPrimitives)) {
      const [family, level] = color.alias?.split('/') ?? []
      const expected = color.alias ? data.primitives[family][level] : color.alpha === 0 ? 'rgb(0 0 0 / 0%)' : color.value
      const swatch = document.querySelector(`[data-tf01-primitive="${name}"] .tf01-swatch`)
      if (getComputedStyle(swatch).backgroundColor !== canonical(expected)) failures.push(`Special ${name}`)
    }
    for (const [name, aliases] of Object.entries(data.semantics)) for (const mode of ['light', 'dark']) {
      const alias = aliases[mode]
      const [family, level] = alias.split('/')
      const expected = alias === 'white' ? data.specialPrimitives.white.value : alias.startsWith('FFFFFF@') ? `rgb(255 255 255 / ${alias.split('@')[1]})` : data.primitives[family][level]
      const swatch = document.querySelector(`[data-tf01-semantic="${name}"][data-oxygen-mode="${mode}"] .tf01-swatch`)
      if (getComputedStyle(swatch).backgroundColor !== canonical(expected)) failures.push(`${mode} ${name}`)
    }
    for (const [name, style] of Object.entries(data.textStyles)) {
      const computed = getComputedStyle(document.querySelector(`[data-tf01-style="${name}"]`))
      if (computed.fontSize !== `${style.size}px` || computed.lineHeight !== `${style.lineHeight}px` || !computed.fontFamily.includes('DM Sans')) failures.push(`Style ${name}`)
    }
    const light = document.createElement('div'), dark = document.createElement('div'), nestedLight = document.createElement('div')
    light.dataset.oxygenMode = 'light'; dark.dataset.oxygenMode = 'dark'; nestedLight.dataset.oxygenMode = 'light'
    light.append(dark); dark.append(nestedLight); document.body.append(light)
    for (const scope of [light, dark, nestedLight]) {
      const mode = scope.dataset.oxygenMode
      scope.style.backgroundColor = 'var(--ox-bg-primary)'
      if (getComputedStyle(scope).backgroundColor !== canonical(mode === 'light' ? '#F9FAFB' : '#101828')) failures.push(`Nested ${mode}`)
      const target = document.createElement('span'); scope.append(target)
      for (const [name, aliases] of Object.entries(data.semantics)) {
        const alias = aliases[mode], [family, level] = alias.split('/')
        const expected = alias === 'white' ? data.specialPrimitives.white.value : alias.startsWith('FFFFFF@') ? `rgb(255 255 255 / ${alias.split('@')[1]})` : data.primitives[family][level]
        target.style.backgroundColor = `var(${cssName(name)})`
        if (getComputedStyle(target).backgroundColor !== canonical(expected)) failures.push(`Nested ${mode} ${name}`)
      }
      target.remove()
      if (getComputedStyle(scope).getPropertyValue('--ox-unresolved-white') !== '') failures.push('Obsolete white fallback still defined')
      if (getComputedStyle(scope).getPropertyValue('--ox-shadow-xl') !== '') failures.push('Full xl unexpectedly defined')
    }
    if (getComputedStyle(document.body).getPropertyValue(cssName('bg/primary')) !== '') failures.push('Tokens leaked to body')
    light.remove(); probe.remove()
    return failures
  }, data)
  assert.deepEqual(failures, [])
  // Browser shadow parsing must retain both visible layers.
  for (const name of ['sm', 'md', 'lg']) assert.equal(await catalog.evaluate((el, name) => {
    const probe = document.createElement('span'); probe.style.boxShadow = `var(--ox-shadow-${name})`; el.append(probe)
    const count = getComputedStyle(probe).boxShadow.split(/,\s*(?![^()]*\))/).length; probe.remove(); return count
  }, name), 2)
  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    // Use a fresh document: resizing a focused fragment target can preserve a
    // previous scroll position instead of exercising a new anchor navigation.
    await story('foundations-oxygen-reference-tokens--catalog')
    await catalog.waitFor()
    await page.evaluate(() => document.fonts.ready)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}`)
    const effects = page.getByRole('navigation', { name: 'Token categories' }).getByRole('link', { name: 'Effects', exact: true })
    await effects.focus(); await page.keyboard.press('Enter')
    await page.waitForFunction(() => location.hash === '#tf01-effects')
    try { await page.waitForFunction(() => Math.abs(document.querySelector('#tf01-effects').getBoundingClientRect().top) < 100) }
    catch (error) {
      console.log('Anchor diagnostics', await page.evaluate(() => ({ width: innerWidth, hash: location.hash, top: document.querySelector('#tf01-effects').getBoundingClientRect().top, scrollY, active: document.activeElement.outerHTML.slice(0, 200) })))
      throw error
    }
    const region = page.getByRole('region', { name: 'bg semantic tokens', exact: true })
    await region.focus()
    assert.equal(await region.evaluate(el => document.activeElement === el), true)
    if (width <= 390) {
      await page.keyboard.press('ArrowRight')
      await page.waitForFunction(() => document.querySelector('[aria-label="bg semantic tokens"]').scrollLeft > 0)
    }
  }
  console.log('PASS: 124 primitive swatches, 174 semantic/mode resolutions, 12 styles, all nested-mode aliases, verified white without overrides, shadow layers, keyboard navigation and 320–1280px widths')

  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`${base}/?path=/docs/foundations-oxygen-reference-tokens--docs`)
  const frame = page.frameLocator('#storybook-preview-iframe')
  await frame.locator('.tf01-catalog').waitFor()
  await page.getByText('Oxygen Reference Tokens', { exact: true }).first().waitFor()
  await page.getByRole('link', { name: 'Token catalog', exact: true }).click()
  await page.waitForURL('**/?path=/story/foundations-oxygen-reference-tokens--catalog')
  await frame.locator('.tf01-catalog').waitFor()
  for (const id of ['cs-01-icon-button--docs', 'cs-02-tooltip--docs', 'cs-03-badge--docs']) {
    await page.goto(`${base}/?path=/docs/${id}`)
    await page.frameLocator('#storybook-preview-iframe').locator('.zw-docs').first().waitFor()
  }
  assert.deepEqual(errors, [])
  console.log('PASS: Foundations manager/Docs navigation, CS-01/02/03 Docs rendering, no unexpected browser/network errors (optional favicon.ico excluded)')
} finally { await browser.close() }
