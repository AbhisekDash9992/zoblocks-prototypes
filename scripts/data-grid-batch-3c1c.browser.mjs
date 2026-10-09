// External PLAYWRIGHT_MODULE / installed BROWSER_PATH, as in Batch 3B.5.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
page.setDefaultTimeout(10000)
const url = process.argv[2] ?? 'http://127.0.0.1:5173/zoblocks-prototypes/#/data-grid'
const errors = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
const toolbar = () => page.getByRole('toolbar', { name: 'Data grid toolbar' })
const trigger = () => toolbar().getByRole('button', { name: 'View settings', exact: true })
const settings = () => page.getByRole('dialog', { name: 'View settings', exact: true })
const density = () => settings().getByRole('button', { name: 'Density', exact: true })
const picker = () => page.getByRole('listbox', { name: 'Density options', exact: true })
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const focusLabel = label => page.waitForFunction(expected => document.activeElement?.getAttribute('aria-label') === expected, label)
const styles = () => trigger().evaluate(el => {
  const css = getComputedStyle(el), rect = el.getBoundingClientRect()
  return { backgroundColor: css.backgroundColor, color: css.color, iconColor: getComputedStyle(el.querySelector('svg')).color, borderRadius: css.borderRadius, width: rect.width, height: rect.height }
})
const remainsOpen = async () => {
  await settle(); assert.equal(await settings().count(), 1)
  assert.equal(await trigger().getAttribute('aria-expanded'), 'true')
  assert.equal(await page.getByRole('tooltip').count(), 0)
  assert.equal(await trigger().evaluate(el => el.classList.contains('dg-applied')), false)
}
const open = async () => { await trigger().scrollIntoViewIfNeeded(); await settle(); await trigger().click(); await settings().waitFor(); await remainsOpen() }
const closed = async () => {
  await settle(); assert.equal(await settings().count(), 0)
  assert.equal(await trigger().getAttribute('aria-expanded'), 'false')
  assert.equal(await page.getByRole('tooltip').filter({ hasText: /^View settings$/ }).count(), 0)
}
const contained = async locator => {
  const rect = await locator.boundingBox(), viewport = page.viewportSize()
  assert.ok(rect.x >= 8 && rect.y >= 8 && rect.x + rect.width <= viewport.width - 7 && rect.y + rect.height <= viewport.height - 7)
}
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  await page.mouse.move(5, 5)
  // A-E: compare the actual winning hover styles, not the earlier icon selector
  // overridden by generic ghost-button hover styling further down the CSS.
  const resting = await styles()
  assert.deepEqual(resting, { backgroundColor: 'rgba(0, 0, 0, 0)', color: 'rgb(74, 85, 101)', iconColor: 'rgb(74, 85, 101)', borderRadius: '4px', width: 24, height: 24 })
  assert.equal(await trigger().getAttribute('aria-haspopup'), 'dialog')
  assert.equal(await trigger().getAttribute('aria-expanded'), 'false')
  await trigger().hover(); const hover = await styles()
  assert.deepEqual(hover, { ...resting, backgroundColor: 'rgb(242, 243, 245)' })
  await page.getByRole('tooltip').filter({ hasText: /^View settings$/ }).waitFor()
  await open(); await page.mouse.move(5, 5); await remainsOpen()
  const openStyles = await styles()
  assert.deepEqual(openStyles, hover)
  assert.equal(await settings().evaluate(el => el === document.activeElement), true)
  assert.equal(await settings().getByRole('textbox', { name: 'View name' }).evaluate(el => el.matches(':focus')), false)
  await page.evaluate(() => {
    window.passiveOverlayClaims = []
    window.recordPassiveClaims = event => window.passiveOverlayClaims.push(event.detail)
    window.addEventListener('dg-overlay-change', window.recordPassiveClaims)
  })
  // F-H/R: movement, hover, and non-dismissal focus changes cannot transfer the
  // configuration overlay's ownership to tooltips or delayed Saved View previews.
  for (const name of ['Filter', 'Sort', 'Search', 'Full screen', 'Hide criteria', 'Save View', 'More views']) {
    await toolbar().getByRole('button', { name, exact: true }).hover()
    await remainsOpen(); assert.deepEqual(await styles(), hover)
  }
  await toolbar().getByRole('button', { name: 'View 2', exact: true }).hover()
  await page.waitForTimeout(250) // The existing preview has an intentional 200ms timer.
  assert.equal(await page.getByRole('region', { name: 'View 2 saved configuration preview' }).count(), 0)
  await remainsOpen()
  await page.locator('.dg-table tbody td').first().hover(); await remainsOpen()
  await settings().getByRole('textbox', { name: 'View name' }).focus(); await remainsOpen()
  await density().focus(); await remainsOpen()
  await toolbar().getByRole('button', { name: 'Search', exact: true }).focus(); await remainsOpen()
  assert.deepEqual(await page.evaluate(() => window.passiveOverlayClaims), [])
  await page.evaluate(() => window.removeEventListener('dg-overlay-change', window.recordPassiveClaims))
  // I: unrelated scroll targets no longer dismiss settings, including actual
  // document scrolling. The parent follows its moved anchor rather than drifting.
  await page.evaluate(() => document.querySelector('.dg-table-viewport').dispatchEvent(new Event('scroll', { bubbles: true })))
  await remainsOpen()
  const before = { anchor: await trigger().boundingBox(), popup: await settings().boundingBox(), scroll: await page.evaluate(() => scrollY) }
  await page.mouse.move(5, 5); await page.mouse.wheel(0, 60)
  await page.waitForFunction(previous => scrollY > previous, before.scroll); await remainsOpen()
  const after = { anchor: await trigger().boundingBox(), popup: await settings().boundingBox() }
  assert.equal(after.popup.y - before.popup.y, after.anchor.y - before.anchor.y)
  await contained(settings())
  // M-O: child opening, scroll placement, selection and Escape preserve parent.
  await density().click(); await picker().waitFor(); await remainsOpen()
  const childBefore = await picker().boundingBox(), densityBefore = await density().boundingBox()
  await page.mouse.move(5, 5); await page.mouse.wheel(0, 30)
  await page.waitForFunction(previous => scrollY > previous, before.scroll + 60); await remainsOpen(); await settle()
  const childAfter = await picker().boundingBox(), densityAfter = await density().boundingBox()
  assert.equal(childAfter.y - childBefore.y, densityAfter.y - densityBefore.y)
  await contained(picker())
  await picker().getByRole('option', { name: 'Patient', exact: true }).click(); await remainsOpen()
  assert.equal(await picker().count(), 0); await focusLabel('Density')
  assert.equal(await page.locator('.dg-working-region').getAttribute('data-density'), 'patient')
  assert.equal(await page.locator('.dg-table tbody tr').first().evaluate(el => el.getBoundingClientRect().height), 52)
  await density().click(); await picker().getByRole('option', { name: 'Standard', exact: true }).click(); await remainsOpen()
  await density().focus(); await page.keyboard.press('ArrowRight'); await picker().waitFor()
  await page.keyboard.press('Escape'); assert.equal(await picker().count(), 0); await remainsOpen(); await focusLabel('Density')
  await page.keyboard.press('Escape'); await closed(); await focusLabel('View settings')
  // S/L: keyboard restoration retains focus-visible feedback; a later pointer
  // dismissal returns to the resting surface, while genuine hover still works.
  await page.keyboard.press('Enter'); await settings().waitFor(); await page.mouse.move(5, 5); await remainsOpen()
  assert.deepEqual(await styles(), hover)
  await page.keyboard.press('Escape'); await closed(); await focusLabel('View settings')
  assert.equal(await trigger().evaluate(el => el.matches(':focus-visible')), true)
  assert.equal(await trigger().evaluate(el => getComputedStyle(el).outlineWidth), '2px')
  await open(); await page.mouse.click(5, 5); await closed(); await focusLabel('View settings')
  // Restored keyboard-visible focus may retain its existing focus surface.
  // Remove focus deliberately to compare the closed, unhovered resting state.
  await trigger().evaluate(el => el.blur())
  assert.deepEqual(await styles(), resting)
  // J: toggle closes with normal hover still present under the pointer.
  await open(); await trigger().click(); await closed(); assert.deepEqual(await styles(), hover)
  await page.mouse.move(5, 5); await trigger().evaluate(el => el.blur()); assert.deepEqual(await styles(), resting)
  // K: touch dismissal uses the same intentional outside-pointer boundary.
  await open()
  await page.locator('body').dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true, button: 0 })
  await closed(); await focusLabel('View settings')
  // P: keyboard activation of another explicit overlay has no outside pointer
  // event; its ownership transition must still close the persistent settings.
  await open(); await toolbar().getByRole('button', { name: 'Filter', exact: true }).focus(); await remainsOpen()
  await page.keyboard.press('Enter'); await page.getByRole('dialog', { name: 'Add Filter', exact: true }).waitFor()
  assert.equal(await settings().count(), 0); assert.equal(await trigger().getAttribute('aria-expanded'), 'false')
  await focusLabel('Search fields'); await page.keyboard.press('Escape')
  // Default pickers retain their scroll dismissal and passive tooltip behavior.
  await toolbar().getByRole('button', { name: 'Filter', exact: true }).hover(); await page.getByRole('tooltip').waitFor()
  await page.mouse.move(5, 5); await toolbar().getByRole('button', { name: 'Filter', exact: true }).click()
  await page.getByRole('dialog', { name: 'Add Filter', exact: true }).waitFor()
  await page.evaluate(() => document.dispatchEvent(new Event('scroll'))); await settle()
  assert.equal(await page.getByRole('dialog', { name: 'Add Filter', exact: true }).count(), 0)
  await toolbar().getByRole('button', { name: 'View 2', exact: true }).hover()
  await page.getByRole('region', { name: 'View 2 saved configuration preview' }).waitFor()
  await page.mouse.move(5, 5); await page.getByRole('region', { name: 'View 2 saved configuration preview' }).waitFor({ state: 'hidden' })
  // Q: existing routes continue to close settings and reach the accepted editor.
  for (const [name, destination] of [['Group', 'Field for group 1'], ['Sort', 'Field for sort 1'], ['Filter', 'Search fields']]) {
    await open(); await settings().getByRole('button', { name, exact: true }).click(); await focusLabel(destination)
    assert.equal(await settings().count(), 0)
    if (name === 'Filter') await page.keyboard.press('Escape')
    else await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  }
  // T: 3C.1b geometry and Density resting selection remain. Short/narrow viewports
  // and the parent's own scrolling keep both overlays bounded and anchored.
  await open()
  assert.deepEqual(await settings().evaluate(el => [el.getBoundingClientRect().width, getComputedStyle(el).padding, getComputedStyle(el.querySelector('.dg-view-settings-content')).gap]), [320, '4px', '8px'])
  assert.deepEqual(await settings().getByRole('group').evaluateAll(elements => elements.map(el => getComputedStyle(el).padding)), ['0px', '0px', '0px'])
  assert.equal(await settings().getByRole('separator').count(), 2)
  assert.ok(await settings().locator('.dg-settings-row').evaluateAll(elements => elements.every(el => el.getBoundingClientRect().height === 36 && getComputedStyle(el).padding === '0px 8px')))
  await density().click(); await density().focus(); await page.mouse.move(5, 5)
  assert.equal(await picker().locator('.lucide-check').count(), 1)
  assert.ok(await picker().getByRole('option').evaluateAll(elements => elements.every(el => getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)')))
  await page.setViewportSize({ width: 480, height: 420 }); await settle(); await remainsOpen(); await contained(settings()); await contained(picker())
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await closed()
  await page.setViewportSize({ width: 280, height: 280 }); await open(); await contained(settings())
  await density().click(); await picker().waitFor()
  await settings().evaluate(el => { el.scrollTop = 16 }); await settle(); await remainsOpen(); await contained(settings()); await contained(picker())
  const densityBounds = await density().boundingBox(), childBounds = await picker().boundingBox()
  assert.equal(childBounds.y, densityBounds.y + densityBounds.height + 4)
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await closed()
  await page.setViewportSize({ width: 1440, height: 1200 }); await open()
  await page.locator('.dg-back').click(); await settle(); assert.equal(await settings().count(), 0)
  await page.goto(url); await trigger().hover(); await page.getByRole('tooltip').filter({ hasText: /^View settings$/ }).waitFor()
  assert.deepEqual(errors, [])
  console.log(`STYLES: ${JSON.stringify({ resting, hover, open: openStyles })}`)
  console.log(`PASS: Batch 3C.1c A-U, exact hover association, passive hover/scroll persistence, anchoring/viewport, explicit dismissal/overlay/navigation, Density and existing routes: ${url}`)
} finally { await browser.close() }
