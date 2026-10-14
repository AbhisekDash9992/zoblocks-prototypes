// Existing external Playwright and installed browser only; no downloads or public artifacts.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

assert.ok(process.env.PLAYWRIGHT_MODULE && process.env.BROWSER_PATH, 'Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing local tooling.')
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true, timeout: 15000 })
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
page.setDefaultTimeout(10000)
const storybook = (process.argv[2] ?? 'http://127.0.0.1:6006').replace(/\/$/, '')
const app = process.argv[3] ?? 'http://127.0.0.1:5173/zoblocks-prototypes/#/data-grid'
const errors = [], passed = [], positioning = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`) })
const button = name => page.getByRole('button', { name, exact: true })
const tip = () => page.getByRole('tooltip')
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const story = async name => { await page.goto(`${storybook}/iframe.html?id=cs-02-tooltip--${name}&viewMode=story`); await page.locator('.cs02-reference').first().waitFor(); await settle() }
const absent = async target => { await tip().waitFor({ state: 'detached' }); assert.equal(await target.getAttribute('aria-describedby'), null) }
const described = async target => { await tip().waitFor(); await settle(); assert.equal(await target.getAttribute('aria-describedby'), await tip().getAttribute('id')) }
const armPaintProbe = () => page.evaluate(() => {
  window.cs02PositionFrames = []
  const observer = new MutationObserver(() => {
    const tooltip = document.querySelector('[role="tooltip"]')
    if (!tooltip) return
    observer.disconnect()
    const sample = () => {
      window.cs02PositionFrames.push(tooltip.getBoundingClientRect().toJSON())
      if (window.cs02PositionFrames.length < 4) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  observer.observe(document.body, { childList: true })
})
const placement = async (target, context, expected = 'below', paintProbe = false) => {
  await tip().waitFor(); await settle()
  const geometry = await target.evaluate(el => {
    const anchor = el.closest('.dg-tooltip-anchor') ?? el
    return { trigger: anchor.getBoundingClientRect().toJSON(), tooltip: document.querySelector('[role="tooltip"]').getBoundingClientRect().toJSON(), viewport: { width: innerWidth, height: innerHeight } }
  })
  const { trigger: t, tooltip: r, viewport: v } = geometry
  const near = (actual, expected) => Math.abs(actual - expected) < 1
  assert.ok(r.width <= v.width - 16 && r.height <= v.height - 16, `${context}: feasible size`)
  assert.ok(r.left >= 7.5 && r.right <= v.width - 7.5 && r.top >= 7.5 && r.bottom <= v.height - 7.5, `${context}: 8px gutter containment`)
  assert.ok(Math.min(t.right, r.right) - Math.max(t.left, r.left) > 0, `${context}: horizontal overlap`)
  assert.ok(near(r.left, t.left) || near(r.right, t.right) || near(r.left, 8) || near(r.right, v.width - 8), `${context}: natural edge alignment or viewport clamp`)
  if (expected === 'fallback') {
    assert.ok(t.bottom + 6 + r.height > v.height - 8 && t.top - 6 - r.height < 8, `${context}: neither side fits ${JSON.stringify(geometry)}`)
    assert.ok(near(r.top, 8) || near(r.bottom, v.height - 8), `${context}: predictable contained fallback`)
  } else assert.ok(expected === 'below' ? near(r.top - t.bottom, 6) : near(t.top - r.bottom, 6), `${context}: ${expected} with 6px gap`)
  const stable = await tip().evaluate(async el => {
    const frames = []
    for (let index = 0; index < 4; index++) { await new Promise(resolve => requestAnimationFrame(resolve)); frames.push(el.getBoundingClientRect().toJSON()) }
    return frames
  })
  const same = frame => ['left', 'top', 'width', 'height'].every(key => near(frame[key], r[key]))
  assert.ok(stable.every(same), `${context}: settled geometry remains stable`)
  if (paintProbe) {
    await page.waitForFunction(() => window.cs02PositionFrames?.length === 4)
    assert.ok((await page.evaluate(() => window.cs02PositionFrames)).every(same), `${context}: correct from first painted frame`)
  }
  positioning.push({ context, ...geometry, horizontalOverlap: Math.min(t.right, r.right) - Math.max(t.left, r.left), bottomOverflow: Math.max(0, r.bottom - v.height), side: expected })
}

try {
  await story('label-only')
  const trigger = button('Filter')
  assert.equal(await trigger.getAttribute('aria-label'), 'Filter')
  assert.equal(await trigger.getAttribute('aria-describedby'), null)
  await trigger.hover(); await described(trigger)
  await page.evaluate(() => document.fonts.ready)
  assert.deepEqual(await tip().evaluate(el => {
    const css = getComputedStyle(el), box = el.getBoundingClientRect()
    return { portal: el.parentElement === document.body, className: el.className, children: el.children.length, height: box.height, padding: css.padding, radius: css.borderRadius, background: css.backgroundColor, color: css.color, font: css.fontFamily, weight: css.fontWeight, size: css.fontSize, line: css.lineHeight, shadow: css.boxShadow.replace(/ 0px$/, ''), pointer: css.pointerEvents }
  }), { portal: true, className: 'dg-tooltip cs02-tooltip-reference', children: 0, height: 28, padding: '4px 10px', radius: '8px', background: 'rgb(16, 24, 40)', color: 'rgb(255, 255, 255)', font: '"DM Sans", system-ui, sans-serif', weight: '400', size: '14px', line: '20px', shadow: 'rgba(24, 24, 27, 0.05) 0px 1px 2px', pointer: 'none' })
  await page.mouse.move(1, 1); await absent(trigger)
  await page.locator('body').click({ position: { x: 1, y: 1 } }); await page.keyboard.press('Tab'); await described(trigger)
  assert.equal(await trigger.evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true)
  await page.keyboard.press('Escape'); await absent(trigger)
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await described(trigger)
  await page.keyboard.press('Shift+Tab'); await absent(trigger)
  await trigger.focus(); await described(trigger)
  await page.keyboard.press('Enter'); await absent(trigger); assert.equal(await page.getByRole('status').textContent(), 'Activations: 1')
  await trigger.evaluate(el => el.blur()); await trigger.focus(); await described(trigger)
  await page.keyboard.press('Space'); await absent(trigger); assert.equal(await page.getByRole('status').textContent(), 'Activations: 2')
  await trigger.evaluate(el => el.blur()); await trigger.hover(); await described(trigger)
  const box = await trigger.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await absent(trigger); await page.mouse.up()
  await page.mouse.move(1, 1); await trigger.hover(); await described(trigger)
  await trigger.evaluate(el => el.click()); await absent(trigger)
  await page.mouse.move(1, 1); await trigger.hover(); await described(trigger)
  await page.evaluate(() => window.dispatchEvent(new Event('scroll'))); await absent(trigger)
  passed.push('Body portal, exact label-only CSS, independent name, role/description cleanup, hover/leave, Tab/blur, Escape, Enter/Space, pointer down, click and scroll dismissal')

  await story('popup-suppression')
  const options = button('Demo options')
  await options.hover(); await described(options); await options.click(); await absent(options)
  assert.equal(await options.getAttribute('aria-expanded'), 'true')
  await page.mouse.move(1, 1); await options.hover(); assert.equal(await tip().count(), 0)
  await button('Close demo options').click(); assert.equal(await options.evaluate(el => el === document.activeElement), true); await absent(options)
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await described(options)
  passed.push('Popup suppression, focus restoration stays suppressed, new blur/focus re-arms')

  await story('shortcut-hint-proposal')
  const increment = button('Increment demo count'), reset = button('Reset demo count'), input = page.getByRole('textbox', { name: 'Typing sandbox' })
  assert.equal(await reset.isDisabled(), true); assert.equal(await reset.getAttribute('aria-keyshortcuts'), null)
  await increment.click(); await reset.focus(); await described(reset)
  assert.equal(await reset.getAttribute('aria-keyshortcuts'), 'R'); assert.equal(await tip().locator('.dg-tooltip-key').textContent(), 'R')
  await page.keyboard.press('r'); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 0'); assert.equal(await reset.getAttribute('aria-keyshortcuts'), null)
  await increment.click(); await input.focus(); await page.keyboard.type('r'); assert.equal(await input.inputValue(), 'r'); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 1')
  await increment.focus()
  // Test key guards without invoking browser-level shortcuts.
  const countBefore = await page.getByRole('status').textContent()
  await increment.evaluate(el => { for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { repeat: true }, { isComposing: true }]) el.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true, ...options })) })
  assert.equal(await page.getByRole('status').textContent(), countBefore)
  await reset.click(); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 0')
  await increment.click(); await page.locator('body').click({ position: { x: 1, y: 1 } }); await page.keyboard.press('r'); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 1')
  passed.push('Working contextual R and button action; active hint only; typing, modified keys, repeats, composition and outside focus ignored')

  for (const width of [1280, 760, 480, 360]) {
    await page.setViewportSize({ width, height: 1000 })
    await story('long-label'); await button('Show the selected columns in this demo grid').hover(); await tip().waitFor()
    assert.ok(await tip().evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.height >= 28 }))
    await page.goto(`${storybook}/iframe.html?id=cs-02-tooltip--docs&viewMode=docs`)
    const controls = page.getByRole('region', { name: 'Tooltip Controls', exact: true })
    await controls.waitFor(); await page.locator('textarea[name="label"]').fill('Demo filter')
    const playground = page.locator('.cs02-panel').first(), renamed = playground.getByRole('button', { name: 'Demo filter', exact: true })
    await renamed.waitFor(); await renamed.hover(); await page.getByRole('tooltip', { name: 'Demo filter', exact: true }).waitFor()
    await placement(renamed, `Docs default ${width}px`)
    await page.mouse.wheel(0, 200); await absent(renamed)
    await page.mouse.move(1, 1); await settle()
    assert.equal(await page.locator('.cs02-legend li').count(), 2)
    assert.equal(await page.getByRole('table').filter({ hasText: 'Verified geometry' }).count(), 1)
    assert.ok(await page.locator('.cs02-anatomy').evaluate(el => el.scrollWidth <= el.clientWidth))
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Docs overflow at ${width}px`)
    const text = await page.locator('body').textContent()
    for (const expected of ['317:890', '64 × 28px', 'No shortcut slot', 'Open issues']) assert.ok(text.includes(expected))
  }
  passed.push('Long-label portal containment and native Docs Controls/anatomy/tokens at 1280/760/480/360px')

  // Actual rendered geometry: normal placement and right/bottom collisions for every presentation.
  for (const width of [1280, 760, 480, 360]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const [name, label] of [['label-only', 'Filter'], ['shortcut-hint-proposal', 'Reset demo count'], ['long-label', 'Show the selected columns in this demo grid']]) {
      await story(name); await page.evaluate(() => document.fonts.ready)
      if (name === 'shortcut-hint-proposal') await button('Increment demo count').click()
      const target = button(label)
      await armPaintProbe(); await target.hover(); await placement(target, `${name} normal ${width}px`, 'below', true)
      await page.mouse.move(1, 1); await tip().waitFor({ state: 'detached' })
      await target.locator('..').evaluate(el => { el.style.position = 'fixed'; el.style.right = '8px'; el.style.top = '100px' })
      await armPaintProbe(); await target.hover(); await placement(target, `${name} right edge ${width}px`, 'below', true)
      await page.mouse.move(1, 1); await tip().waitFor({ state: 'detached' })
      await target.locator('..').evaluate(el => { el.style.top = ''; el.style.bottom = '8px' })
      await armPaintProbe(); await target.hover(); await placement(target, `${name} right/bottom edge ${width}px`, 'above', true)
    }
  }
  // Ordinary narrow Docs reproduction, without moving the trigger.
  await page.setViewportSize({ width: 360, height: 760 })
  await page.goto(`${storybook}/iframe.html?id=cs-02-tooltip--docs&viewMode=docs`)
  const docsTrigger = page.locator('.cs02-panel').first().getByRole('button', { name: 'Filter', exact: true })
  await docsTrigger.waitFor(); await page.evaluate(() => document.fonts.ready)
  await armPaintProbe(); await docsTrigger.hover(); await placement(docsTrigger, 'Docs default 360x760', 'above', true)
  // A genuinely tall label fits the viewport but cannot fit on either side of a central trigger.
  await page.mouse.move(1, 1); await tip().waitFor({ state: 'detached' })
  await page.setViewportSize({ width: 480, height: 500 })
  const tallLabel = Array.from({ length: 15 }, (_, index) => `Demo line ${index + 1}`).join('\n')
  await page.locator('textarea[name="label"]').fill(tallLabel)
  await page.waitForFunction(label => document.querySelector('.cs02-panel button')?.getAttribute('aria-label') === label, tallLabel)
  // Docs Canvas transforms create a fixed-position containing block. Remove those
  // transforms for this synthetic probe while preserving React's event ancestry.
  await page.locator('.cs02-panel').first().locator('button').locator('..').evaluate(el => {
    el.setAttribute('data-cs02-position-probe', '')
    for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      if (getComputedStyle(parent).transform !== 'none') parent.style.transform = 'none'
    }
    el.style.position = 'fixed'; el.style.left = '16px'; el.style.top = '235px'
  })
  const tallTrigger = page.locator('[data-cs02-position-probe] button')
  await armPaintProbe(); await tallTrigger.hover(); await placement(tallTrigger, 'Tall label neither-side fallback 480x500', 'fallback', true)
  // The observer tracks content geometry; resize updates placement without reopening.
  await page.setViewportSize({ width: 760, height: 1000 }); await settle()
  await placement(tallTrigger, 'Open tooltip after viewport resize', 'below')
  await page.mouse.move(1, 1); await tip().waitFor({ state: 'detached' })
  await page.locator('textarea[name="label"]').fill('Short demo label')
  await page.waitForFunction(() => document.querySelector('[data-cs02-position-probe] button')?.getAttribute('aria-label') === 'Short demo label')
  await tallTrigger.hover(); await placement(tallTrigger, 'Changed label geometry', 'below')
  passed.push('Measured label/shortcut/long-label placement at four widths; first-painted-frame stability, right-edge association, bottom flips, ordinary narrow Docs, tall-label fallback, viewport resize and changed content')
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto(`${storybook}/?path=/docs/cs-02-tooltip--docs`); await page.frameLocator('#storybook-preview-iframe').getByRole('region', { name: 'Tooltip Controls', exact: true }).waitFor()
  passed.push('Storybook manager Docs deep link')

  await page.goto(app)
  const toolbar = page.getByRole('toolbar', { name: 'Data grid toolbar' })
  await toolbar.waitFor(); const filter = toolbar.getByRole('button', { name: 'Filter', exact: true })
  await filter.hover(); await described(filter)
  assert.equal(await tip().getAttribute('class'), 'dg-tooltip dg-tooltip-shortcut')
  assert.equal(await tip().evaluate(el => getComputedStyle(el).padding), '6px 10px')
  assert.equal(await page.locator('.cs02-reference, .cs02-tooltip-reference').count(), 0)
  await placement(filter, 'Data Grid legacy toolbar tooltip')
  await filter.click(); await tip().waitFor({ state: 'detached' })
  await page.reload(); await toolbar.waitFor()
  const boundedAnchor = page.locator('.dg-summary .dg-tooltip-anchor').filter({ has: button('Remove sort criterion') })
  const boundedTrigger = boundedAnchor.locator('button').first()
  await boundedTrigger.hover(); await tip().waitFor()
  assert.ok((await tip().getAttribute('class')).includes('dg-tooltip-bounded'))
  await placement(boundedTrigger, 'Data Grid bounded Sort summary')
  await page.mouse.move(1, 1); await tip().waitFor({ state: 'detached' })
  await boundedAnchor.evaluate(el => { el.style.position = 'fixed'; el.style.right = '8px'; el.style.bottom = '8px' })
  await boundedTrigger.hover(); await placement(boundedTrigger, 'Data Grid bounded Sort summary right/bottom', 'above')
  await page.reload(); await toolbar.waitFor()
  await page.getByRole('link', { name: /All prototypes/ }).click(); await page.getByRole('link', { name: /Data Grid/ }).click(); await toolbar.waitFor()
  passed.push('Data Grid original tooltip classes/padding, no CS-02 styling, popup dismissal and route/reload smoke')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ browser: process.env.BROWSER_PATH, passed, positioning, errors }, null, 2))
} finally { await browser.close() }
