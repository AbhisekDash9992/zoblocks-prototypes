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
  if (expected === 'auto') expected = t.bottom + 6 + r.height <= v.height - 8 ? 'below' : t.top - 6 - r.height >= 8 ? 'above' : 'fallback'
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
  assert.deepEqual(await trigger.evaluate(el => {
    const rect = node => { const box = node.getBoundingClientRect(); return [box.width, box.height] }
    const root = el.getBoundingClientRect(), slot = el.querySelector('.cs01-icon-slot').getBoundingClientRect(), glyph = el.querySelector('svg').getBoundingClientRect(), css = getComputedStyle(el)
    const centered = box => Math.abs(box.x + box.width / 2 - root.x - root.width / 2) < .5 && Math.abs(box.y + box.height / 2 - root.y - root.height / 2) < .5
    return { root: rect(el), slot: rect(el.querySelector('.cs01-icon-slot')), glyph: rect(el.querySelector('svg')), padding: css.padding, radius: css.borderRadius, slotCentered: centered(slot), glyphCentered: centered(glyph), type: el.getAttribute('data-cs01-type'), anchors: el.closest('.cs02-icon-context').querySelectorAll('.dg-tooltip-anchor').length }
  }), { root: [24, 24], slot: [16, 16], glyph: [14, 14], padding: '4px', radius: '6px', slotCentered: true, glyphCentered: true, type: 'ghost', anchors: 1 })
  await trigger.hover(); await described(trigger)
  assert.equal(await trigger.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(242, 243, 245)')
  await page.evaluate(() => document.fonts.ready)
  assert.deepEqual(await tip().evaluate(el => {
    const css = getComputedStyle(el), box = el.getBoundingClientRect()
    return { portal: el.parentElement === document.body, className: el.className, children: el.children.length, height: box.height, padding: css.padding, radius: css.borderRadius, background: css.backgroundColor, color: css.color, font: css.fontFamily, weight: css.fontWeight, size: css.fontSize, line: css.lineHeight, shadow: css.boxShadow.replace(/ 0px$/, ''), pointer: css.pointerEvents }
  }), { portal: true, className: 'dg-tooltip cs02-tooltip-reference', children: 0, height: 28, padding: '4px 10px', radius: '8px', background: 'rgb(16, 24, 40)', color: 'rgb(255, 255, 255)', font: '"DM Sans", system-ui, sans-serif', weight: '400', size: '14px', line: '20px', shadow: 'rgba(24, 24, 27, 0.05) 0px 1px 2px', pointer: 'none' })
  await page.mouse.move(1, 1); await absent(trigger)
  await page.locator('body').click({ position: { x: 1, y: 1 } }); await page.keyboard.press('Tab'); await described(trigger)
  assert.equal(await trigger.evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true)
  assert.deepEqual(await trigger.evaluate(el => { const css = getComputedStyle(el); return { shadow: css.boxShadow, background: css.backgroundColor, outline: css.outlineStyle } }), { shadow: 'rgb(255, 255, 255) 0px 0px 0px 2px, rgb(74, 85, 101) 0px 0px 0px 4px', background: 'rgb(242, 243, 245)', outline: 'none' })
  await page.emulateMedia({ forcedColors: 'active' })
  assert.equal(await trigger.evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
  await page.emulateMedia({ forcedColors: 'none' })
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
  passed.push('Reused 24/16/14px centered CS-01 Icon Button, one outer tooltip, Ghost hover/focus and forced-colors outline; label-only CSS and all dismissal interactions')

  await story('popup-suppression')
  const options = button('Demo options')
  await options.hover(); await described(options); await options.click(); await absent(options)
  assert.equal(await options.getAttribute('aria-expanded'), 'true')
  await page.mouse.move(1, 1); await options.hover(); assert.equal(await tip().count(), 0)
  await button('Close demo options').click(); assert.equal(await options.evaluate(el => el === document.activeElement), true); await absent(options)
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await described(options)
  passed.push('Popup suppression, focus restoration stays suppressed, new blur/focus re-arms')

  await story('shortcut-hint-proposal')
  const increment = button('Increment demo count'), reset = button('Reset demo count'), input = page.getByRole('textbox', { name: 'Keyboard shortcut safety test' })
  assert.equal(await reset.isDisabled(), true); assert.equal(await reset.getAttribute('aria-keyshortcuts'), null)
  await reset.hover(); await tip().waitFor(); assert.equal(await tip().locator('.dg-tooltip-key').count(), 0)
  await page.mouse.move(1, 1); await tip().waitFor({ state: 'detached' })
  assert.equal(await increment.evaluate(el => el.classList.contains('dg-button-secondary') && el.getBoundingClientRect().height === 32), true)
  assert.equal(await input.getAttribute('aria-describedby') !== null, true)
  assert.ok((await page.locator('.cs02-safety-test').textContent()).includes('Type R here. The letter should be entered normally without resetting the demo count.'))
  await increment.click(); await page.keyboard.press('Tab'); await described(reset)
  assert.equal(await reset.getAttribute('aria-keyshortcuts'), 'R'); assert.equal(await tip().locator('.dg-tooltip-key').textContent(), 'R')
  assert.deepEqual(await tip().locator('.dg-tooltip-key').evaluate(el => {
    const css = getComputedStyle(el), r = el.getBoundingClientRect(), parent = el.parentElement.getBoundingClientRect(), label = el.previousElementSibling.getBoundingClientRect()
    return { tag: el.tagName, height: r.height, minWidth: css.minWidth, padding: css.padding, sizing: css.boxSizing, border: css.border, radius: css.borderRadius, color: css.color, background: css.backgroundColor, family: css.fontFamily, size: css.fontSize, line: css.lineHeight, weight: css.fontWeight, centered: Math.abs(r.y + r.height / 2 - parent.y - parent.height / 2) < .5, gap: r.left - label.right, tooltipHeight: parent.height }
  }), { tag: 'SPAN', height: 20, minWidth: '20px', padding: '1px 6px', sizing: 'border-box', border: '1px solid rgb(106, 114, 130)', radius: '4px', color: 'rgb(234, 236, 240)', background: 'rgba(0, 0, 0, 0)', family: '"DM Sans", system-ui, sans-serif', size: '12px', line: '16px', weight: '500', centered: true, gap: 12, tooltipHeight: 28 })
  assert.equal(await reset.evaluate(el => el === document.activeElement && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), true)
  // Probe longer key strings on the existing span; no nonfunctional story is advertised.
  await tip().locator('.dg-tooltip-key').evaluate(el => { el.textContent = 'Ctrl+Shift+R' })
  await settle(); await placement(reset, 'Longer keycap presentation', 'below')
  assert.equal(await tip().evaluate(el => el.getBoundingClientRect().height), 28)
  await tip().locator('.dg-tooltip-key').evaluate(el => { el.textContent = 'R' })
  await tip().locator('.dg-tooltip-label').evaluate(el => { el.textContent = 'Reset the nonzero demo count in this context using the available shortcut' })
  await settle(); await placement(reset, 'Wrapped action label with outlined key', 'below')
  assert.ok(await tip().evaluate(el => el.getBoundingClientRect().height > 28))
  assert.equal(await tip().locator('.dg-tooltip-key').evaluate(el => el.getBoundingClientRect().height), 20)
  await tip().locator('.dg-tooltip-label').evaluate(el => { el.textContent = 'Reset demo count' })
  await page.keyboard.press('r'); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 0'); assert.equal(await reset.getAttribute('aria-keyshortcuts'), null)
  await increment.click(); await input.focus(); await page.keyboard.type('R'); assert.equal(await input.inputValue(), 'R'); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 1')
  await increment.focus()
  // Test key guards without invoking browser-level shortcuts.
  const countBefore = await page.getByRole('status').textContent()
  await increment.evaluate(el => { for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { repeat: true }, { isComposing: true }]) el.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true, ...options })) })
  assert.equal(await page.getByRole('status').textContent(), countBefore)
  await page.keyboard.press('r'); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 0'); assert.equal(await increment.evaluate(el => el === document.activeElement), true)
  await increment.click()
  await reset.click(); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 0')
  await increment.click(); await page.locator('body').click({ position: { x: 1, y: 1 } }); await page.keyboard.press('r'); assert.equal(await page.getByRole('status').textContent(), 'Demo count: 1')
  passed.push('Outlined 20px keycap / 28px tooltip, exact proposed colors/type/padding, longer key and wrapped label; native text-button focus, R action and separate typing-safety test without focus movement')

  for (const width of [1280, 760, 480, 360]) {
    await page.setViewportSize({ width, height: 1000 })
    await story('long-label'); await button('Show the selected columns in this demo grid').hover(); await tip().waitFor()
    assert.ok(await tip().evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.height >= 28 }))
    await page.goto(`${storybook}/iframe.html?id=cs-02-tooltip--docs&viewMode=docs`)
    const controls = page.getByRole('region', { name: 'Tooltip Controls', exact: true })
    await controls.waitFor(); await page.locator('textarea[name="label"]').fill('Demo filter')
    const playground = page.locator('.cs02-panel').first(), renamed = playground.getByRole('button', { name: 'Demo filter', exact: true })
    await renamed.waitFor(); await renamed.hover(); await page.getByRole('tooltip', { name: 'Demo filter', exact: true }).waitFor()
    await placement(renamed, `Docs default ${width}px`, 'auto')
    await page.mouse.wheel(0, 200); await absent(renamed)
    await page.mouse.move(1, 1); await settle()
    assert.equal(await page.locator('.cs02-legend li').count(), 4)
    const leaders = await page.locator('.cs02-callout').evaluateAll(groups => groups.map(group => {
      const line = group.querySelector('polyline'), anchor = group.querySelector('.cs02-anchor'), marker = group.querySelector('.cs02-number-marker'), last = line.points.getItem(line.points.numberOfItems - 1)
      return { feature: group.getAttribute('data-feature'), end: [last.x, last.y], anchor: [Number(anchor.getAttribute('cx')), Number(anchor.getAttribute('cy'))], markerRadius: marker.getAttribute('r'), marker: [Number(marker.getAttribute('cx')), Number(marker.getAttribute('cy'))], number: group.querySelector('.cs02-number').textContent }
    }))
    assert.deepEqual(leaders.map(leader => leader.number), ['1', '2', '3', '4'])
    for (const leader of leaders) { assert.deepEqual(leader.end, leader.anchor); assert.equal(leader.markerRadius, '14'); assert.ok(leader.marker[0] < 92 || leader.marker[0] > 348) }
    const features = Object.fromEntries(leaders.map(leader => [leader.feature, leader.anchor]))
    const diagram = await page.locator('.cs02-anatomy-diagram').evaluate(el => {
      const box = selector => { const node = el.querySelector(selector); return { x: node.x.baseVal.value, y: node.y.baseVal.value, width: node.width.baseVal.value, height: node.height.baseVal.value } }
      const shadow = el.querySelector('feDropShadow'), leader = getComputedStyle(el.querySelector('.cs02-leader'))
      return { root: box('.cs02-anatomy-root'), guide: box('.cs02-label-guide'), shadowOffset: shadow.dy.baseVal, stroke: leader.stroke, weight: leader.strokeWidth }
    })
    assert.equal(features.surface[0], diagram.root.x)
    assert.ok(features.surface[1] > diagram.root.y + 32 && features.surface[1] < diagram.root.y + diagram.root.height - 32)
    assert.ok(features.padding[1] > diagram.root.y && features.padding[1] < diagram.guide.y)
    assert.deepEqual(features.label, [diagram.guide.x + diagram.guide.width, diagram.guide.y + diagram.guide.height / 2])
    assert.equal(features.shadow[1], diagram.root.y + diagram.root.height + diagram.shadowOffset)
    assert.ok(features.shadow[0] > diagram.root.x + 32 && features.shadow[0] < diagram.root.x + diagram.root.width - 32)
    assert.equal(diagram.stroke, 'rgb(74, 85, 101)'); assert.equal(diagram.weight, '1px')
    assert.deepEqual(await page.locator('.cs02-anatomy-root').evaluate(el => [el.getAttribute('width'), el.getAttribute('height'), el.getAttribute('rx')]), ['256', '112', '32'])
    assert.equal(await page.locator('.cs02-anatomy-diagram').getAttribute('role'), 'img')
    assert.equal(await page.getByRole('table').filter({ hasText: 'Verified geometry' }).count(), 1)
    assert.ok(await page.locator('.cs02-anatomy').evaluate(el => el.scrollWidth <= el.clientWidth))
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Docs overflow at ${width}px`)
    const text = await page.locator('body').textContent()
    for (const expected of ['317:890', '64 × 28px', 'No shortcut slot', 'Open issues']) assert.ok(text.includes(expected))
  }
  passed.push('Native Docs Controls, four numbered anatomy leaders ending on surface/padding/label-line-box/shadow, exact 4x geometry and containment at 1280/760/480/360px')

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
  await armPaintProbe(); await docsTrigger.hover(); await placement(docsTrigger, 'Docs default 360x760', 'auto', true)
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
  await page.mouse.move(1, 1); await tip().waitFor({ state: 'detached' })
  await page.locator('textarea[name="label"]').fill('Short demo label')
  await page.waitForFunction(() => document.querySelector('[data-cs02-position-probe] button')?.getAttribute('aria-label') === 'Short demo label')
  await tallTrigger.hover(); await placement(tallTrigger, 'Changed label geometry', 'below')
  // Resize an isolated, focus-open story: Docs reflow can legitimately emit a
  // scroll event, which must continue to dismiss rather than preserve a tooltip.
  await story('long-label')
  const resizeTrigger = button('Show the selected columns in this demo grid')
  await resizeTrigger.locator('..').evaluate(el => { el.style.position = 'fixed'; el.style.right = '8px'; el.style.top = '100px' })
  await page.mouse.move(1, 1); await resizeTrigger.focus(); await placement(resizeTrigger, 'Before viewport resize', 'below')
  await page.setViewportSize({ width: 760, height: 1000 }); await settle()
  await placement(resizeTrigger, 'Open tooltip after viewport resize', 'below')
  passed.push('Measured label/shortcut/long-label placement at four widths; first-painted-frame stability, right-edge association, bottom flips, ordinary narrow Docs, tall-label fallback, viewport resize and changed content')
  await story('anatomy-reference'); assert.equal(await page.locator('.cs02-callout').count(), 4)
  await page.setViewportSize({ width: 1280, height: 1000 })
  await page.goto(`${storybook}/?path=/docs/cs-02-tooltip--docs`); await page.frameLocator('#storybook-preview-iframe').getByRole('region', { name: 'Tooltip Controls', exact: true }).waitFor()
  passed.push('Storybook manager Docs deep link')

  await page.goto(app)
  const toolbar = page.getByRole('toolbar', { name: 'Data grid toolbar' })
  await toolbar.waitFor(); const filter = toolbar.getByRole('button', { name: 'Filter', exact: true })
  await filter.hover(); await described(filter)
  assert.equal(await tip().getAttribute('class'), 'dg-tooltip dg-tooltip-shortcut')
  assert.equal(await tip().evaluate(el => getComputedStyle(el).padding), '6px 10px')
  assert.deepEqual(await tip().locator('.dg-tooltip-key').evaluate(el => { const css = getComputedStyle(el); return { border: css.borderWidth, radius: css.borderRadius, size: css.fontSize, weight: css.fontWeight } }), { border: '0px', radius: '0px', size: '12px', weight: '400' })
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
