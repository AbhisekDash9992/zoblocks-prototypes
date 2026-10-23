// Focused CS-04 QA. Uses existing external Playwright and Chrome/Edge only.
// Private evidence and generated screenshots stay in ignored local context.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

assert.ok(process.env.PLAYWRIGHT_MODULE && process.env.BROWSER_PATH, 'Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing tooling.')
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const base = (process.argv[2] ?? 'http://127.0.0.1:6013').replace(/\/$/, '')
const output = '.local-context/cs04-qa'
await mkdir(output, { recursive: true })
const evidence = await readFile('.local-context/CS04_Button_Figma_Inspector_Evidence_2026-10-22.md', 'utf8')
const cases = evidence.split(/\r?\n/).filter(line => /^\| (Square|Round) \|/.test(line)).map(line => {
  const [shape, variant, size, state, , height, padding, gap, radius, fill, border, text, font, icons, shadow] = line.split('|').slice(1, -1).map(part => part.trim())
  return { shape: shape.toLowerCase(), variant: variant.toLowerCase().replaceAll(' ', '-'), size: size.toLowerCase(), state: state === 'Focused' ? 'focus-visible' : state.toLowerCase(), height: Number(height), padding: padding.split('/').map(Number), gap: Number(gap), radius: Number(radius), fill, border, text, font: font.split('/').map(Number), icon: Number(icons.split('/')[0]), shadow }
})
assert.equal(cases.length, 120, 'Complete source evidence is required')
const key = row => `${row.shape}/${row.variant}/${row.size}/${row.state}`
assert.equal(new Set(cases.map(key)).size, 120)
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 950 } })
page.setDefaultTimeout(12000)
const errors = [], passed = []
page.on('pageerror', error => errors.push(error.message))
page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`) })
page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
const story = async id => {
  await page.goto(`${base}/iframe.html?id=cs-04-button--${id}&viewMode=story`)
  await page.locator('.cs04-reference').waitFor()
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.locator('.cs04-reference').getAttribute('data-oxygen-mode'), 'light')
  assert.equal(await page.locator('.cs04-reference').evaluate(el => !!el.closest('.dg-page')), false)
}
const snapshot = locator => locator.evaluate(el => {
  const css = getComputedStyle(el), rect = el.getBoundingClientRect()
  return { width: rect.width, height: rect.height, padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft], gap: css.gap, radius: css.borderRadius, fill: css.backgroundColor, text: css.color, size: css.fontSize, line: css.lineHeight, shadow: css.boxShadow, weight: css.fontWeight, opacity: css.opacity }
})
const compare = (actual, expected, context) => { for (const [property, value] of Object.entries(expected)) assert.deepEqual(actual[property], value, `${context}: ${property}`) }
try {
  await story('full-state-matrix')
  await page.locator('[data-cs04-case]').last().waitFor()
  assert.equal(await page.locator('[data-cs04-case]').count(), 120)
  const staticStyles = {}
  for (const row of cases) {
    const button = page.locator(`[data-cs04-case="${key(row)}"] .ox-button`)
    const actual = await snapshot(button)
    const expectedColors = await page.evaluate(row => {
      const probe = document.createElement('span'); document.body.append(probe)
      const canonical = (value, property = 'color') => { probe.style[property] = value; return getComputedStyle(probe)[property] }
      const color = value => value.match(/#[0-9A-F]{6}/i)?.[0] ?? 'transparent'
      const text = row.text.includes('/ 0.5') ? 'rgb(255 255 255 / 50%)' : color(row.text)
      const edge = color(row.border)
      let shadow = `inset 0 0 0 1px ${edge}`
      if (row.state === 'focus-visible') {
        const colors = [...row.shadow.matchAll(/#[0-9A-F]{6}/gi)].map(match => match[0])
        shadow += `, 0 0 0 2px ${colors[1]}, 0 0 0 4px ${colors[0]}`
      } else if (row.variant === 'secondary' && row.state === 'default') shadow += ', 0 1px 2px rgb(16 24 40 / 5%)'
      else if (row.state === 'default') shadow += ', 0 0 #0000'
      const result = { fill: canonical(color(row.fill)), text: canonical(text), shadow: canonical(shadow, 'boxShadow') }
      probe.remove(); return result
    }, row)
    compare(actual, { height: row.height, padding: row.padding.map(value => `${value}px`), gap: `${row.gap}px`, radius: `${row.radius}px`, size: `${row.font[0]}px`, line: `${row.font[1]}px`, weight: '500', opacity: '1', ...expectedColors }, key(row))
    assert.equal(await button.isDisabled(), row.state === 'disabled')
    assert.equal(await button.getAttribute('tabindex'), '-1')
    staticStyles[key(row)] = actual
  }
  passed.push('All 120 source cases: unique axes, height, padding, gaps, radii, font size/line, fill, text alpha, border and shadow/focus layers')
  await page.screenshot({ path: `${output}/matrix-wide.png` })

  // Enable pointer targeting only for this test; the comparison defaults remain static in Storybook.
  await page.addStyleTag({ content: '.cs04-matrix [data-cs04-reference="default"] .ox-button { pointer-events: auto; }' })
  for (const row of cases.filter(row => row.state === 'default')) {
    const button = page.locator(`[data-cs04-case="${key(row)}"] .ox-button`)
    await button.hover()
    compare(await snapshot(button), staticStyles[key({ ...row, state: 'hover' })], `${key(row)} actual hover`)
    await page.keyboard.press('Tab'); await button.focus()
    assert.equal(await button.evaluate(el => el.matches(':focus-visible')), true)
    compare(await snapshot(button), staticStyles[key({ ...row, state: 'focus-visible' })], `${key(row)} actual focus-visible`)
    await button.evaluate(el => el.blur()); await page.mouse.move(0, 0)
  }
  passed.push('All 30 shape/variant/size combinations: actual hover and keyboard focus match static references')

  await story('icons')
  for (const shape of ['square', 'round']) for (const [size, side, gap] of [['large', 18, 8], ['medium', 16, 6], ['small', 14, 4]]) {
    const initial = await snapshot(page.locator(`[data-cs04-icons="${shape}/${size}/none"] .ox-button`))
    for (const [config, count] of [['none', 0], ['leading', 1], ['trailing', 1], ['both', 2]]) {
      const button = page.locator(`[data-cs04-icons="${shape}/${size}/${config}"] .ox-button`)
      assert.equal(await button.locator('svg').count(), count)
      const current = await snapshot(button)
      assert.equal(current.height, initial.height)
      assert.ok(Math.abs(current.width - initial.width - count * (side + gap)) < 0.1, `${shape}/${size}/${config} content width`)
      for (const icon of await button.locator('svg').all()) {
        assert.equal(await icon.getAttribute('aria-hidden'), 'true'); assert.equal(await icon.getAttribute('focusable'), 'false'); assert.equal(await icon.getAttribute('tabindex'), '-1')
        assert.deepEqual(await icon.evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, stroke: getComputedStyle(el).stroke, color: getComputedStyle(el.parentElement).color })), { width: side, height: side, stroke: current.text, color: current.text })
      }
    }
  }
  for (const button of await page.locator('.cs04-icons .ox-button:disabled').all()) {
    assert.equal((await snapshot(button)).text, 'rgba(255, 255, 255, 0.5)')
    assert.equal(await button.locator('svg').first().evaluate(el => getComputedStyle(el).stroke), 'rgba(255, 255, 255, 0.8)')
  }
  passed.push('24 icon configurations: dimensions, content widths/gaps, SVG semantics, inherited colors; disabled text 50% and icons 80% white')

  await story('native-behavior')
  const first = page.getByRole('button', { name: 'Try Primary', exact: true })
  await page.keyboard.press('Tab'); assert.equal(await first.evaluate(el => document.activeElement === el), true)
  await page.keyboard.press('Enter'); await page.keyboard.press('Space'); await first.click()
  assert.equal(await page.getByRole('status').first().textContent(), 'Activations: 3')
  const disabled = page.getByRole('button', { name: 'Unavailable action', exact: true })
  assert.equal(await disabled.isDisabled(), true)
  await disabled.evaluate(el => el.click())
  assert.equal(await page.getByRole('status').first().textContent(), 'Activations: 3')
  await page.getByRole('button', { name: 'Try Text secondary', exact: true }).focus(); await page.keyboard.press('Tab')
  const focusAction = page.getByRole('button', { name: 'Focus first action', exact: true })
  assert.equal(await focusAction.evaluate(el => document.activeElement === el), true)
  await page.keyboard.press('Enter'); assert.equal(await first.evaluate(el => document.activeElement === el), true)
  assert.match((await snapshot(first)).shadow, /4px/)
  const defaultType = page.getByRole('button', { name: 'Default type action', exact: true })
  assert.equal(await defaultType.getAttribute('type'), 'button'); await defaultType.click()
  assert.equal(await page.getByRole('status').nth(1).textContent(), 'Submissions: 0')
  await page.getByRole('button', { name: 'Submit sample', exact: true }).click()
  assert.equal(await page.getByRole('status').nth(1).textContent(), 'Submissions: 1')
  await page.screenshot({ path: `${output}/behavior-wide.png` })
  await page.emulateMedia({ forcedColors: 'active' }); await page.keyboard.press('Tab'); await first.focus()
  assert.equal(await first.evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
  assert.equal(await first.evaluate(el => getComputedStyle(el).outlineWidth), '2px')
  await page.emulateMedia({ forcedColors: 'none' })
  passed.push('Pointer/Enter/Space activation; native disabled activation block and Tab skip; forwarded-ref focus; default button vs explicit submit; forced-colors outline')

  await page.goto(`${base}/?path=/docs/cs-04-button--docs`)
  const frame = page.frameLocator('#storybook-preview-iframe')
  await frame.locator('.cs04-docs').waitFor()
  const panel = frame.locator('.cs04-panel').first()
  const button = panel.locator('.ox-button')
  const control = name => frame.locator(`select[id$="-${name}"]`)
  const liveFrame = page.frames().find(candidate => candidate.url().includes('iframe.html'))
  const toggle = async (name, enabled) => {
    const input = frame.locator(`input[name="${name}"]`)
    if (await input.isChecked() !== enabled) {
      const left = name === 'iconLeft' ? enabled : await frame.locator('input[name="iconLeft"]').isChecked()
      const right = name === 'iconRight' ? enabled : await frame.locator('input[name="iconRight"]').isChecked()
      await input.focus(); await input.press('Space')
      // Allow Storybook's manager/preview args round trip before the next edit,
      // matching the existing CS-03 switch QA helper.
      await input.evaluate(() => new Promise(resolve => setTimeout(resolve, 150)))
      await liveFrame.waitForFunction(({ name, enabled, left, right }) => {
        const button = document.querySelector('.cs04-panel .ox-button')
        const config = [...document.querySelectorAll('.cs04-panel .zw-docs-config dd')].at(-1).textContent
        return document.querySelector(`input[name="${name}"]`).checked === enabled && (name === 'disabled' ? button.disabled === enabled : config === (left && right ? 'Both' : left ? 'Leading' : right ? 'Trailing' : 'None'))
      }, { name, enabled, left, right })
    }
  }
  assert.equal(await frame.locator('.docblock-argstable tbody tr').count(), 7)
  for (const [name, options] of [['variant', ['primary', 'secondary', 'danger', 'text-primary', 'text-secondary']], ['shape', ['square', 'round']], ['size', ['large', 'medium', 'small']]]) assert.deepEqual(await control(name).locator('option[value]').allTextContents(), options)
  for (const variant of ['primary', 'secondary', 'danger', 'text-primary', 'text-secondary']) for (const shape of ['square', 'round']) for (const size of ['large', 'medium', 'small']) {
    for (const [name, value] of [['variant', variant], ['shape', shape], ['size', size]]) {
      await control(name).selectOption(value)
      await control(name).evaluate(() => new Promise(resolve => setTimeout(resolve, 150)))
    }
    await panel.locator(`.ox-button--${variant}.ox-button--${shape}.ox-button--${size}`).waitFor()
    for (const [left, right] of [[false, false], [true, false], [false, true], [true, true]]) {
      await toggle('iconLeft', left); await toggle('iconRight', right)
      await liveFrame.waitForFunction(count => document.querySelector('.cs04-panel .ox-button').querySelectorAll('svg').length === count, Number(left) + Number(right))
      assert.equal(await button.textContent(), 'Save changes')
    }
  }
  await toggle('disabled', true); await liveFrame.waitForFunction(() => document.querySelector('.cs04-panel .ox-button').disabled)
  await frame.getByRole('button', { name: 'Reset controls', exact: true }).click()
  await panel.locator('.ox-button--primary.ox-button--square.ox-button--medium:not(:disabled)').waitFor()
  await liveFrame.waitForFunction(() => document.querySelector('.cs04-panel .ox-button').querySelectorAll('svg').length === 0)
  for (const name of ['variant', 'shape', 'size']) {
    await control(name).selectOption({ label: 'Choose option...' })
    await control(name).evaluate(() => new Promise(resolve => setTimeout(resolve, 150)))
  }
  assert.deepEqual((await panel.locator('.zw-docs-config dd').allTextContents()).slice(0, 3), ['primary', 'square', 'medium'])
  const label = frame.locator('textarea[name="label"]')
  await label.fill('  '); await button.waitFor({ state: 'detached' }); await panel.getByText('Enter a meaningful visible label', { exact: false }).waitFor()
  await label.fill('Review this deliberately long synthetic example label with both optional icons'); await toggle('iconLeft', true); await toggle('iconRight', true); await button.waitFor()
  await page.screenshot({ path: `${output}/docs-controls-wide.png` })
  await frame.getByRole('button', { name: 'Reset controls', exact: true }).click()
  passed.push('Native Docs Controls: 30 axis configurations × all 4 icon settings; independent args, native disabled, reset and empty/long labels')

  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 })
    for (const id of ['playground-example', 'full-state-matrix', 'icons', 'native-behavior', 'anatomy-geometry']) {
      await story(id)
      await page.locator('.cs04-reference > :last-child').waitFor()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${id} page overflow at ${width}`)
    }
    await page.goto(`${base}/iframe.html?id=cs-04-button--docs&viewMode=docs`)
    await page.locator('.cs04-docs .cs04-matrix [data-cs04-case]').last().waitFor()
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Docs overflow at ${width}`)
    assert.deepEqual(await page.evaluate(rows => rows.flatMap(row => {
      const key = `${row.shape}/${row.variant}/${row.size}/${row.state}`
      const button = document.querySelector(`[data-cs04-case="${key}"] .ox-button`)
      return button.getBoundingClientRect().height === row.height ? [] : [key]
    }), cases), [], `All 120 comparison heights remain source-accurate at ${width}px`)
    if (width === 320) {
      const region = page.getByRole('region', { name: 'Square Primary state comparison', exact: true })
      await region.focus(); await page.keyboard.press('ArrowRight')
      await page.waitForFunction(() => document.querySelector('[aria-label="Square Primary state comparison"]').scrollLeft > 0)
      await page.screenshot({ path: `${output}/matrix-narrow.png` })
      await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `${output}/docs-narrow.png` })
      await page.locator('textarea[name="label"]').fill('Review this deliberately long synthetic example label with both optional icons')
      for (const name of ['iconLeft', 'iconRight']) {
        const input = page.locator(`input[name="${name}"]`)
        await input.focus(); await input.press('Space')
        await page.waitForFunction(name => document.querySelector(`input[name="${name}"]`).checked, name)
        await page.waitForFunction(count => document.querySelector('.cs04-panel .ox-button').querySelectorAll('svg').length === count, name === 'iconLeft' ? 1 : 2)
      }
      const longButton = page.locator('.cs04-panel .ox-button').first()
      assert.ok((await snapshot(longButton)).height > 30, 'Long label wraps rather than truncates at 320px')
      assert.equal(await longButton.evaluate(el => el.scrollWidth <= el.clientWidth), true)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      await longButton.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${output}/long-label-narrow.png` })
    }
  }
  passed.push('All five stories and Docs at 1280/768/390/320px: no page overflow; all 120 comparison heights preserved; keyboard-scrollable tables; long-label wrapping')
  assert.deepEqual(errors, [])
  passed.push('No unexpected browser console, runtime or network errors')
  await writeFile(`${output}/results.json`, JSON.stringify({ cases: 120, actualStatePairs: 30, controlIconConfigurations: 120, passed, errors }, null, 2))
  console.log(passed.map(message => `PASS: ${message}`).join('\n'))
} catch (error) {
  console.error(error.stack)
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {})
  await writeFile(`${output}/failure.json`, JSON.stringify({ passed, errors, failure: error.message }, null, 2))
  process.exitCode = 1
} finally { await browser.close() }
