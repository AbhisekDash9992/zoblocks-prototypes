// External PLAYWRIGHT_MODULE / installed BROWSER_PATH, as in Batch 3B.5.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
page.setDefaultTimeout(10000)
const url = process.argv[2] ?? 'http://127.0.0.1:5173/zoblocks-prototypes/#/data-grid'
const errors = [], evidence = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
const toolbar = () => page.getByRole('toolbar', { name: 'Data grid toolbar' })
const button = name => page.getByRole('button', { name, exact: true })
const trigger = () => toolbar().getByRole('button', { name: 'View settings', exact: true })
const settings = () => page.getByRole('dialog', { name: 'View settings', exact: true })
const density = () => settings().getByRole('button', { name: 'Density', exact: true })
const picker = () => page.getByRole('listbox', { name: 'Density options', exact: true })
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const focusLabel = label => page.waitForFunction(expected => document.activeElement?.getAttribute('aria-label') === expected, label)
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 0.5, `${actual} != ${expected}`)
const ring = locator => locator.evaluate(el => ({ focused: el === document.activeElement, outlineStyle: getComputedStyle(el).outlineStyle, outlineWidth: getComputedStyle(el).outlineWidth, dismissal: el.hasAttribute('data-dismissal-focus') }))
const open = async keyboard => {
  await trigger().scrollIntoViewIfNeeded(); await settle()
  if (keyboard) { await button('Full screen').focus(); await page.keyboard.press('Tab'); await focusLabel('View settings'); await page.keyboard.press('Enter') }
  else await trigger().click()
  await settings().waitFor(); await settle()
  assert.equal(await settings().evaluate(el => el === document.activeElement), true)
  assert.equal(await settings().getByRole('textbox', { name: 'View name' }).evaluate(el => el.matches(':focus')), false)
}
const openDensity = async keyboard => {
  if (keyboard) { await page.keyboard.press('Tab'); await focusLabel('View name'); await page.keyboard.press('Tab'); await focusLabel('Density'); await page.keyboard.press('Enter') }
  else await density().click()
  await picker().waitFor(); await settle()
}
const geometry = async label => {
  await settle()
  const rects = await picker().evaluate(el => {
    const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } }
    return { chevron: rect(document.querySelector('.dg-density-row .lucide-chevron-down')), popup: rect(el), viewport: { width: innerWidth, height: innerHeight } }
  })
  const { chevron, popup, viewport } = rects
  const below = chevron.bottom + 6
  const top = below + popup.height <= viewport.height - 8 ? below : chevron.y - popup.height - 6
  near(popup.y, Math.max(8, Math.min(top, viewport.height - popup.height - 8)))
  near(popup.x, Math.max(8, Math.min(chevron.right - popup.width, viewport.width - popup.width - 8)))
  assert.ok(popup.x >= 8 && popup.y >= 8 && popup.right <= viewport.width - 7.5 && popup.bottom <= viewport.height - 7.5)
  assert.equal(await settings().count(), 1)
  evidence.push({ label, ...rects, gap: popup.y - chevron.bottom })
  return rects
}
const capture = async (name, locator) => {
  if (!process.env.ARTIFACT_DIR) return
  await mkdir(process.env.ARTIFACT_DIR, { recursive: true })
  const box = await locator.boundingBox()
  await page.screenshot({ path: join(process.env.ARTIFACT_DIR, `${name}.png`), clip: { x: Math.max(0, box.x - 6), y: Math.max(0, box.y - 6), width: box.width + 12, height: box.height + 12 } })
}
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  // A-C: real chevron anchoring and nested Escape in both pointer/keyboard flows.
  for (const keyboard of [false, true]) {
    await open(keyboard); await openDensity(keyboard)
    const rects = await geometry(keyboard ? 'keyboard-open' : 'pointer-open')
    near(rects.popup.y - rects.chevron.bottom, 6)
    near(rects.popup.right, rects.chevron.right)
    await capture(`${keyboard ? 'keyboard' : 'pointer'}-density-anchor`, settings())
    await page.keyboard.press('Escape'); await focusLabel('Density'); await settle()
    assert.equal(await picker().count(), 0); assert.equal(await settings().count(), 1)
    const restored = await ring(density())
    assert.equal(restored.focused, true); assert.equal(restored.outlineStyle, 'none'); assert.equal(restored.dismissal, true)
    await capture(`${keyboard ? 'keyboard' : 'pointer'}-first-escape`, settings())
    // Repeated Escape retains quiet focus, and only the second event closes parent.
    await page.keyboard.press('Escape'); await focusLabel('View settings'); await settle()
    assert.equal(await settings().count(), 0); assert.equal(await trigger().getAttribute('aria-expanded'), 'false')
    assert.equal((await ring(trigger())).focused, true); assert.equal((await ring(trigger())).outlineStyle, 'none')
    await capture(`${keyboard ? 'keyboard' : 'pointer'}-second-escape`, trigger())
    // Real Shift+Tab / Tab re-arms the trigger, without losing the focus target.
    await page.keyboard.press('Shift+Tab'); await focusLabel('Full screen')
    await page.keyboard.press('Tab'); await focusLabel('View settings')
    assert.equal((await ring(trigger())).outlineWidth, '2px'); assert.equal((await ring(trigger())).dismissal, false)
    await page.keyboard.press('Tab'); await focusLabel('Hide criteria')
    await page.keyboard.press('Shift+Tab'); await focusLabel('View settings')
    assert.equal((await ring(trigger())).outlineWidth, '2px')
  }
  await open(true); await openDensity(true); await page.keyboard.press('Escape'); await focusLabel('Density')
  await page.keyboard.press('Shift+Tab'); await focusLabel('View name')
  await page.keyboard.press('Tab'); await focusLabel('Density')
  assert.equal((await ring(density())).outlineWidth, '2px'); assert.equal((await ring(density())).dismissal, false)
  await page.keyboard.press('Tab'); await focusLabel('Filter')
  await page.keyboard.press('Shift+Tab'); await focusLabel('Density')
  assert.equal((await ring(density())).outlineWidth, '2px')
  await page.keyboard.press('ArrowRight'); await picker().waitFor()
  assert.equal(await picker().getByRole('option', { name: 'Standard', exact: true }).evaluate(el => el === document.activeElement && getComputedStyle(el).outlineWidth === '2px'), true)
  // D: all modes retain exact selection/check semantics and real table heights.
  for (const [label, mode, height] of [['Patient', 'patient', 52], ['Clinical', 'clinical', 30], ['Standard', 'standard', 40]]) {
    await picker().getByRole('option', { name: label, exact: true }).click(); await settle()
    assert.equal(await picker().count(), 0); assert.equal(await settings().count(), 1); await focusLabel('Density')
    assert.equal(await page.locator('.dg-working-region').getAttribute('data-density'), mode)
    assert.equal(await page.locator('.dg-table tbody tr').first().evaluate(el => el.getBoundingClientRect().height), height)
    await density().click(); await picker().waitFor(); await density().focus(); await page.mouse.move(5, 5)
    assert.equal(await picker().locator('.lucide-check').count(), 1)
    assert.equal(await picker().getByRole('option', { name: label, exact: true }).getAttribute('aria-selected'), 'true')
    assert.ok(await picker().getByRole('option').evaluateAll(elements => elements.every(el => getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)')))
  }
  // A/E: child follows scrolling and parent moves, using actual rendered frames.
  const before = await geometry('before-document-scroll')
  const previousScroll = await page.evaluate(() => scrollY)
  await page.mouse.move(5, 5); await page.mouse.wheel(0, 40)
  await page.waitForFunction(previous => scrollY > previous, previousScroll)
  const after = await geometry('after-document-scroll')
  near(after.popup.y - before.popup.y, after.chevron.y - before.chevron.y)
  await page.setViewportSize({ width: 480, height: 420 }); await geometry('narrow-resize')
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await focusLabel('View settings')
  await page.setViewportSize({ width: 280, height: 280 }); await open(false); await openDensity(false)
  await geometry('short-viewport')
  await settings().evaluate(el => { el.scrollTop = 16 }); await geometry('parent-scroll')
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await focusLabel('View settings')
  await page.setViewportSize({ width: 1440, height: 1200 }); await open(false)
  await page.mouse.move(5, 5)
  const openAppearance = await trigger().evaluate(el => { const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.borderRadius, el.getBoundingClientRect().width, el.getBoundingClientRect().height] })
  assert.deepEqual(openAppearance, ['rgb(242, 243, 245)', 'rgb(74, 85, 101)', '4px', 24, 24])
  for (const name of ['Filter', 'Sort', 'Search', 'Full screen', 'Hide criteria']) {
    await toolbar().getByRole('button', { name, exact: true }).hover(); await settle()
    assert.equal(await settings().count(), 1); assert.equal(await page.getByRole('tooltip').count(), 0)
  }
  await page.locator('.dg-table tbody td').first().hover(); await settle(); assert.equal(await settings().count(), 1)
  await page.evaluate(() => document.dispatchEvent(new Event('scroll'))); await settle(); assert.equal(await settings().count(), 1)
  await page.mouse.click(5, 5); await focusLabel('View settings'); assert.equal(await settings().count(), 0)
  assert.equal(await page.getByRole('tooltip').count(), 0)
  await trigger().hover(); await page.getByRole('tooltip').filter({ hasText: /^View settings$/ }).waitFor()
  // F: swap exact icon identities, retaining actions/names/tooltips/geometry in
  // expanded, collapsed and compact viewport states of this same control.
  const criteria = async visible => {
    const control = toolbar().getByRole('button', { name: visible ? 'Hide criteria' : 'Show criteria', exact: true })
    assert.equal(await control.getAttribute('aria-expanded'), String(visible))
    assert.equal(await control.getAttribute('aria-controls'), 'dg-criteria-area')
    assert.equal(await control.locator(visible ? '.lucide-panel-top-open' : '.lucide-panel-top-close').count(), 1)
    assert.equal(await control.locator(visible ? '.lucide-panel-top-close' : '.lucide-panel-top-open').count(), 0)
    assert.deepEqual(await control.evaluate(el => [el.getBoundingClientRect().width, el.getBoundingClientRect().height, getComputedStyle(el).borderRadius]), [24, 24, '4px'])
    await page.mouse.move(5, 5); await control.hover(); await page.getByRole('tooltip').waitFor()
    assert.equal(await page.getByRole('tooltip').innerText(), visible ? 'Hide criteria' : 'Show criteria')
    return control
  }
  for (const [collapsed, width] of [[false, 1440], [true, 1440], [true, 480], [false, 480]]) {
    await page.setViewportSize({ width, height: 1200 })
    const collapseButton = collapsed ? 'Collapse controls' : 'Expand controls'
    if (await button(collapseButton).count()) await button(collapseButton).click()
    await (await criteria(true)).click(); await settle()
    assert.equal(await page.locator('.dg-summary').count(), 0)
    await (await criteria(false)).click(); await settle()
    assert.equal(await page.locator('.dg-summary').count(), 1)
    await criteria(true)
  }
  await page.setViewportSize({ width: 1440, height: 1200 })
  await button('Group by: Status').click(); assert.equal(await page.locator('.dg-editor-group').count(), 1)
  await criteria(true) // Editor, not just Summary, uses the same icon assignment.
  await button('Cancel').click(); assert.equal(await page.locator('.dg-editor-group').count(), 0)
  assert.deepEqual(errors, [])
  if (process.env.ARTIFACT_DIR) await writeFile(join(process.env.ARTIFACT_DIR, 'geometry.json'), JSON.stringify({ url, evidence }, null, 2))
  console.log(`GEOMETRY: ${JSON.stringify(evidence)}`)
  console.log(`PASS: Batch 3C.1d A-G, chevron anchor/gap and containment, quiet nested Escape, genuine keyboard rings, density/state, lifecycle, Criteria icon identities/actions/variants: ${url}`)
} finally { await browser.close() }
