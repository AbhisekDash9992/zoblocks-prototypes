// Same external PLAYWRIGHT_MODULE / BROWSER_PATH setup as Batch 3B.5.
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
const button = name => page.getByRole('button', { name, exact: true })
const option = name => page.getByRole('option', { name, exact: true })
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const choose = async (name, value) => {
  if (await button(name).getAttribute('aria-expanded') !== 'true') await button(name).click()
  await option(value).click(); await settle()
}
const groupChip = field => button(`Group by: ${field}`)
const openGroup = async () => { await button('Group').click(); await page.locator('.dg-editor-group').waitFor(); await settle() }
const focused = async name => {
  await page.waitForFunction(label => document.activeElement?.getAttribute('aria-label') === label, name)
}
const unchangedOthers = async expected => assert.deepEqual(await page.locator('.dg-summary .dg-chip-open').allTextContents(), expected)
const geometry = async () => {
  const result = await page.evaluate(() => {
    const rect = selector => document.querySelector(selector).getBoundingClientRect()
    const row = document.querySelector('.dg-group-row .dg-rule-controls')
    return {
      header: rect('.dg-editor-header').height, summary: rect('.dg-summary').height,
      contiguous: rect('.dg-editor').bottom === rect('.dg-summary').top,
      toolbar: rect('.dg-toolbar').height,
      controls: [...row.querySelectorAll('button')].map(el => { const r = el.getBoundingClientRect(); return { center: r.y + r.height / 2, right: r.right } }),
      rowRight: row.getBoundingClientRect().right,
      rowOverflow: row.scrollWidth > row.clientWidth,
      documentOverflow: document.documentElement.scrollWidth > window.innerWidth,
    }
  })
  assert.equal(result.header, 48); assert.equal(result.summary, 40); assert.equal(result.toolbar, 40)
  assert.equal(result.contiguous, true); assert.equal(result.rowOverflow, false); assert.equal(result.documentOverflow, false)
  assert.ok(result.controls.every(control => Math.abs(control.center - result.controls[0].center) < 1 && control.right <= result.rowRight + 1))
}
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  await groupChip('Status').waitFor()
  // Sample state, selected chip, exact one-row reopening, idempotent field selection.
  await groupChip('Status').click(); await settle()
  assert.equal(await page.locator('.dg-group-row').count(), 1)
  assert.equal(await button('Apply').isDisabled(), true)
  assert.equal(await groupChip('Status').getAttribute('aria-pressed'), 'true')
  assert.equal(await groupChip('Status').locator('..').evaluate(el => el.classList.contains('dg-chip-selected')), true)
  assert.equal(await button('Order for group 1').innerText(), 'A to Z')
  await geometry()
  await choose('Order for group 1', 'Z to A'); assert.equal(await button('Apply').isEnabled(), true)
  await choose('Field for group 1', 'Status'); assert.equal(await button('Order for group 1').innerText(), 'Z to A')
  await choose('Order for group 1', 'A to Z'); assert.equal(await button('Apply').isDisabled(), true)
  await choose('Field for group 1', 'Priority'); assert.equal(await button('Order for group 1').innerText(), 'High to Low')
  await choose('Field for group 1', 'Status'); assert.equal(await button('Apply').isDisabled(), true)
  await choose('Order for group 1', 'Z to A'); await button('Cancel').click()
  assert.equal(await page.getByRole('dialog', { name: 'Unsaved group changes' }).count(), 0)
  await groupChip('Status').click(); assert.equal(await button('Order for group 1').innerText(), 'A to Z')
  await button('Cancel').click()

  // New entry from Hidden, searchable bottom-start picker, empty validity.
  await button('Clear All').click(); await button('Hide criteria').click(); await openGroup()
  await focused('Search fields')
  assert.equal(await button('Apply').isDisabled(), true); assert.equal(await button('Cancel').isEnabled(), true)
  assert.equal(await page.locator('.dg-summary .dg-chip').count(), 0)
  const anchor = await button('Field for group 1').boundingBox()
  const popup = await page.getByRole('dialog', { name: 'Field for group 1', exact: true }).boundingBox()
  assert.equal(popup.x, anchor.x); assert.equal(popup.y, anchor.y + anchor.height + 4)
  assert.deepEqual(await page.locator('.dg-picker').getByRole('option').allTextContents(), ['Status', 'Priority', 'Assigned Provider', 'Program', 'PHQ-9', 'Risk Screen', 'Disengagement', 'Next Contact'])
  await page.getByRole('textbox', { name: 'Search fields' }).fill('sta')
  assert.deepEqual(await page.locator('.dg-picker').getByRole('option').allTextContents(), ['Status'])
  await page.keyboard.press('ArrowDown')
  assert.equal(await option('Status').evaluate(el => el === document.activeElement), true)
  await page.keyboard.press('Enter'); await settle(); await focused('Field for group 1')
  assert.equal(await button('Order for group 1').innerText(), 'A to Z'); assert.equal(await button('Apply').isEnabled(), true)
  for (const [field, order, options] of [
    ['Priority', 'High to Low', ['High to Low', 'Low to High']],
    ['Next Contact', 'Newest to Oldest', ['Newest to Oldest', 'Oldest to Newest']],
    ['Assigned Provider', 'A to Z', ['A to Z', 'Z to A']],
    ['Program', 'A to Z', ['A to Z', 'Z to A']],
    ['PHQ-9', 'High to Low', ['High to Low', 'Low to High']],
    ['Risk Screen', 'A to Z', ['A to Z', 'Z to A']],
    ['Disengagement', 'High to Low', ['High to Low', 'Low to High']],
  ]) {
    await choose('Field for group 1', field)
    assert.equal(await button('Order for group 1').innerText(), order)
    await button('Order for group 1').click(); assert.deepEqual(await page.locator('.dg-picker').getByRole('option').allTextContents(), options)
    await page.keyboard.press('Escape'); await settle()
  }
  await choose('Field for group 1', 'Status')
  assert.equal(await button('Add Subgroup').isDisabled(), true)
  assert.equal(await button('More group options (deferred)').isDisabled(), true)
  assert.equal(await button('AI Group (deferred)').isDisabled(), true)
  assert.equal(await page.locator('.dg-workspace-actions').getByRole('button', { name: 'Clear all', exact: true }).count(), 0)
  await button('Remove Group').click(); assert.equal(await page.locator('.dg-group-row').count(), 1)
  assert.equal(await button('Field for group 1').innerText(), 'Select field'); assert.equal(await button('Apply').isDisabled(), true)
  assert.equal(await button('Clear group').count(), 0)
  await button('Remove Group').click(); assert.equal(await page.locator('.dg-group-row').count(), 1)
  await choose('Field for group 1', 'Status'); await button('Apply').click(); await groupChip('Status').waitFor()
  assert.equal(await page.locator('.dg-editor').count(), 0)
  assert.equal(await groupChip('Status').getAttribute('aria-pressed'), 'false')
  assert.ok(await button('Save View').evaluate(el => el.classList.contains('dg-modified')))

  // Existing empty starter, explicit Cancel restoration, clear-only Group and Undo.
  await button('Reset to default').click(); await groupChip('Status').click()
  await choose('Order for group 1', 'Z to A'); await button('Apply').click()
  const others = (await page.locator('.dg-summary .dg-chip-open').allTextContents()).slice(1)
  await groupChip('Status').click(); await button('Remove Group').click()
  assert.equal(await button('Clear group').isEnabled(), true)
  assert.equal(await button('Apply').count(), 0)
  await button('Cancel').click(); await groupChip('Status').click()
  assert.equal(await button('Order for group 1').innerText(), 'Z to A')
  await button('Remove Group').click(); await button('Clear group').click()
  assert.equal(await page.locator('.dg-editor').count(), 0); await unchangedOthers(others)
  await button('Undo').click(); await groupChip('Status').click()
  assert.equal(await button('Order for group 1').innerText(), 'Z to A'); assert.equal(await button('Apply').isDisabled(), true)
  await button('Cancel').click(); await button('Remove group criterion').click(); await unchangedOthers(others)
  await button('Undo').click(); await groupChip('Status').click()
  assert.equal(await button('Order for group 1').innerText(), 'Z to A')

  // Shared implicit-navigation guard, Keep/Discard and focus restoration.
  await choose('Field for group 1', 'Next Contact'); await button('Sort').click()
  await page.getByRole('dialog', { name: 'Unsaved group changes', exact: true }).waitFor()
  await page.keyboard.press('Escape'); await focused('Field for group 1')
  assert.equal(await button('Order for group 1').innerText(), 'Newest to Oldest')
  await button('Hide criteria').click(); await button('Discard changes').click()
  assert.equal(await page.locator('.dg-criteria-area').count(), 0)
  await button('Show criteria').click(); await groupChip('Status').click()
  assert.equal(await button('Order for group 1').innerText(), 'Z to A'); await button('Cancel').click()
  await button('Clear All').click(); await button('Undo').click(); await groupChip('Status').click()
  assert.equal(await button('Order for group 1').innerText(), 'Z to A'); await button('Cancel').click()

  // Collapsed-toolbar settings entry, immediate active removal, sample/reset migration.
  await button('Collapse controls').click(); await button('View settings').click()
  await page.getByRole('dialog', { name: 'View settings', exact: true }).getByRole('button', { name: 'Group', exact: true }).click()
  assert.equal(await page.locator('.dg-editor-group').count(), 1)
  await button('Remove group criterion').click(); assert.equal(await page.locator('.dg-editor').count(), 0)
  await page.getByRole('switch', { name: 'Sample committed summary' }).click()
  assert.equal(await page.locator('.dg-summary .dg-chip').count(), 0)
  await page.getByRole('switch', { name: 'Sample committed summary' }).click(); await groupChip('Status').waitFor()
  await button('Reset to default').click(); await groupChip('Status').click()
  assert.equal(await button('Order for group 1').innerText(), 'A to Z')
  await groupChip('Status').hover(); await page.getByRole('tooltip').waitFor()
  assert.match(await page.getByRole('tooltip').innerText(), /Status: A to Z/)
  assert.deepEqual((await page.locator('.dg-summary .dg-chip-open').allTextContents()).slice(0, 3), ['Group by: Status', 'Sort · 2 fields', 'Advanced filter · 3 rules'])
  await page.mouse.move(0, 0)
  await page.setViewportSize({ width: 760, height: 900 }); await geometry()
  await page.setViewportSize({ width: 480, height: 900 })
  await button('Order for group 1').scrollIntoViewIfNeeded(); await button('Order for group 1').focus()
  await page.keyboard.press('ArrowDown'); await page.getByRole('listbox', { name: 'Order for group 1', exact: true }).waitFor()
  await page.keyboard.press('Escape'); await focused('Order for group 1')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false)
  await button('Cancel').click()
  await page.setViewportSize({ width: 1440, height: 1200 })
  // Dynamic chip and exact removal/Undo must also handle a non-preset field/order.
  await openGroup(); await choose('Field for group 1', 'Priority')
  await choose('Order for group 1', 'Low to High'); await button('Apply').click()
  await groupChip('Priority').waitFor(); assert.equal(await groupChip('Status').count(), 0)
  await button('Remove group criterion').click(); await button('Undo').click(); await groupChip('Priority').click()
  assert.equal(await button('Order for group 1').innerText(), 'Low to High')
  assert.equal(await page.locator('.dg-group-row').count(), 1); assert.equal(await button('Apply').isDisabled(), true)
  await button('Cancel').click(); await button('Remove group criterion').click()
  await openGroup(); await focused('Search fields'); await choose('Field for group 1', 'Next Contact')
  await button('Cancel').click()
  assert.equal(await page.locator('.dg-summary .dg-chip-open').filter({ hasText: /^Group/ }).count(), 0)
  assert.equal(await page.getByRole('dialog', { name: 'Unsaved group changes' }).count(), 0)
  assert.deepEqual(errors, [])
  console.log(`PASS: Batch 3C.1 A–O, all field types, shared dirty guard, exact snapshots/Undo, geometry, keyboard, tooltips and narrow access: ${url}`)
} finally { await browser.close() }
