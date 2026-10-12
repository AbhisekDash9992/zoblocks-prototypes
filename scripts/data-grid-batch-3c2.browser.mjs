// External PLAYWRIGHT_MODULE / installed BROWSER_PATH; no repository dependency.
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
const button = name => page.getByRole('button', { name, exact: true })
const option = name => page.getByRole('option', { name, exact: true })
const rows = () => page.locator('.dg-group-row')
const handle = index => rows().nth(index).locator('.dg-sort-handle')
const chip = () => page.locator('.dg-summary .dg-chip-open').filter({ hasText: /^Group/ })
const clear = () => page.locator('.dg-workspace-actions').getByRole('button', { name: 'Clear all', exact: true })
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const focused = label => page.waitForFunction(expected => document.activeElement?.getAttribute('aria-label') === expected, label)
const values = () => rows().evaluateAll(elements => elements.map(el => ({ field: el.querySelector('.dg-rule-field').textContent, order: el.querySelector('.dg-rule-operator')?.textContent ?? '' })))
const ids = () => rows().evaluateAll(elements => elements.map(el => el.getAttribute('data-group-id')))
const choose = async (name, value) => {
  if (await button(name).getAttribute('aria-expanded') !== 'true') await button(name).click()
  await option(value).click(); await settle()
}
const open = async () => {
  await button('View settings').click()
  await page.getByRole('dialog', { name: 'View settings', exact: true }).getByRole('button', { name: 'Group', exact: true }).click()
  await page.locator('.dg-editor-group').waitFor(); await settle()
}
const add = async field => {
  await button('Add Subgroup').click(); await focused('Search fields')
  assert.equal(await button('Add Subgroup').isDisabled(), true)
  assert.equal(await button('Apply').isDisabled(), true)
  const rank = await rows().count()
  assert.equal(await page.getByRole('dialog', { name: `Field for group ${rank}`, exact: true }).count(), 1)
  await choose(`Field for group ${rank}`, field)
  assert.equal(await button('Add Subgroup').isEnabled(), true)
  assert.equal(await button('Apply').isEnabled(), true)
}
const keyMove = async (index, key) => {
  const id = (await ids())[index]
  await handle(index).focus(); await page.keyboard.press(key); await settle()
  assert.equal(await page.locator(`[data-group-id="${id}"] .dg-sort-handle`).evaluate(el => el === document.activeElement), true)
  assert.equal(await page.locator(`[data-group-id="${id}"] .dg-sort-handle`).getAttribute('data-keyboard-focus'), 'true')
  assert.equal(await page.locator('.dg-picker').count(), 0)
}
const drag = async (index, targetIndex, after = false, cancel = false, outside = false) => {
  const id = (await ids())[index], h = await handle(index).boundingBox(), target = await rows().nth(targetIndex).boundingBox()
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down()
  await page.mouse.move(outside ? 5 : h.x + h.width / 2, target.y + (after ? target.height - 2 : 2), { steps: 10 })
  await page.locator('.dg-sort-drag-preview').waitFor()
  assert.equal(await page.locator('.dg-picker').count(), 0)
  if (cancel) await page.keyboard.press('Escape')
  await page.mouse.up(); await settle()
  assert.equal(await page.locator('.dg-sort-drag-preview').count(), 0)
  assert.equal(await page.locator('.dg-sort-dragging').count(), 0)
  assert.equal(await page.locator('[data-pointer-held]').count(), 0)
  assert.equal(await page.locator(`[data-group-id="${id}"] .dg-sort-handle`).evaluate(el => el === document.activeElement), true)
}
const tooltip = async expected => {
  await page.mouse.move(5, 5); await chip().hover(); await page.getByRole('tooltip').waitFor()
  assert.equal(await page.getByRole('tooltip').innerText(), `Group by:\n${expected.map((r, i) => `${i + 1}. ${r.field}: ${r.order}`).join('\n')}`)
  await page.mouse.move(5, 5); await settle()
}
const capture = async name => {
  if (!process.env.ARTIFACT_DIR) return
  await mkdir(process.env.ARTIFACT_DIR, { recursive: true })
  await page.locator('.dg-criteria-area').screenshot({ path: join(process.env.ARTIFACT_DIR, `${name}.png`) })
}
const geometry = async label => {
  const result = await page.evaluate(() => {
    const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } }
    return { header: rect('.dg-editor-header'), summary: rect('.dg-summary'), editor: rect('.dg-editor'), documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth }
  })
  assert.equal(result.header.height, 48); assert.equal(result.summary.height, 40)
  assert.equal(result.editor.bottom, result.summary.y)
  // The existing shared shell has a 320px minimum; do not change shared styling.
  assert.ok(result.documentWidth <= Math.max(320, result.viewportWidth))
  evidence.push({ label, ...result })
}
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  const others = (await page.locator('.dg-summary .dg-chip-open').allTextContents()).slice(1)
  await button('Remove group criterion').click(); await open(); await focused('Search fields')
  assert.equal(await rows().count(), 1); assert.equal(await button('Apply').isDisabled(), true)
  assert.equal(await button('Add Subgroup').isDisabled(), true); assert.equal(await clear().count(), 0)
  const anchor = await button('Field for group 1').boundingBox()
  const popup = await page.getByRole('dialog', { name: 'Field for group 1', exact: true }).boundingBox()
  assert.equal(popup.x, anchor.x); assert.equal(popup.y, anchor.y + anchor.height + 4)
  const catalog = ['Status', 'Priority', 'Assigned Provider', 'Program', 'PHQ-9', 'Risk Screen', 'Disengagement', 'Next Contact']
  assert.deepEqual(await page.locator('.dg-picker').getByRole('option').allTextContents(), catalog)
  for (const [field, order] of [['Status', 'A to Z'], ['Priority', 'High to Low'], ['Assigned Provider', 'A to Z'], ['Program', 'A to Z'], ['PHQ-9', 'High to Low'], ['Risk Screen', 'A to Z'], ['Disengagement', 'High to Low'], ['Next Contact', 'Newest to Oldest']]) {
    await choose('Field for group 1', field)
    assert.equal(await button('Order for group 1').innerText(), order)
  }
  await choose('Field for group 1', 'Status'); await choose('Order for group 1', 'Z to A')
  await add('Priority'); await choose('Order for group 2', 'Low to High')
  assert.equal(await clear().count(), 1); await geometry('two-row draft')
  await add('Next Contact'); await choose('Order for group 3', 'Oldest to Newest')
  const committed = await values(), committedIds = await ids()
  assert.equal(new Set(committedIds).size, 3)
  await button('Apply').click(); assert.equal(await chip().innerText(), 'Group · 3 fields')
  assert.deepEqual((await page.locator('.dg-summary .dg-chip-open').allTextContents()).slice(1), others)
  await tooltip(committed); await chip().click(); await settle()
  assert.deepEqual(await values(), committed); assert.deepEqual(await ids(), committedIds)
  assert.equal(await rows().count(), 3); assert.equal(await button('Apply').isDisabled(), true)
  assert.equal(await page.locator('.dg-picker').count(), 0)
  assert.match(await page.locator('.dg-conditions-heading').innerText(), /top to bottom/)
  await geometry('three-row committed'); await capture('three-row-committed')

  // Menu/focus changes stay clean; reselecting a field preserves chosen Order.
  await choose('Field for group 1', 'Status')
  assert.equal(await button('Order for group 1').innerText(), 'Z to A')
  await button('Order for group 2').click(); await page.keyboard.press('Escape')
  assert.equal(await button('Apply').isDisabled(), true)
  await choose('Order for group 2', 'High to Low'); assert.equal(await button('Apply').isEnabled(), true)
  await choose('Order for group 2', 'Low to High'); assert.equal(await button('Apply').isDisabled(), true)

  // Keyboard reorder preserves IDs/pairs/focus; restoring order restores clean Apply.
  await keyMove(1, 'ArrowUp'); assert.deepEqual(await values(), [committed[1], committed[0], committed[2]])
  assert.deepEqual(await ids(), [committedIds[1], committedIds[0], committedIds[2]])
  assert.equal(await button('Apply').isEnabled(), true); await tooltip(committed)
  await keyMove(0, 'ArrowDown'); assert.deepEqual(await values(), committed)
  assert.equal(await button('Apply').isDisabled(), true)
  await keyMove(0, 'ArrowUp'); assert.equal(await button('Apply').isDisabled(), true)
  assert.match(await page.locator('.dg-editor-group [role="status"]').innerText(), /remains at precedence 1 of 3/)

  // Pointer preview/cancel/outside drop and committed precedence.
  await drag(0, 2, true, true); assert.deepEqual(await values(), committed)
  assert.equal(await button('Apply').isDisabled(), true)
  await drag(0, 2, true, false, true); assert.deepEqual(await values(), committed)
  assert.equal(await button('Apply').isDisabled(), true)
  await button('Order for group 1').click()
  await drag(0, 2, true); assert.deepEqual(await values(), [committed[1], committed[2], committed[0]])
  assert.equal(await button('Apply').isEnabled(), true)
  await capture('reordered-draft'); await tooltip(committed)
  await drag(2, 0); assert.deepEqual(await values(), committed)
  assert.equal(await button('Apply').isDisabled(), true)
  await keyMove(2, 'ArrowUp'); await button('Cancel').click()
  assert.equal(await page.getByRole('dialog', { name: 'Unsaved group changes' }).count(), 0)
  await chip().click(); assert.deepEqual(await values(), committed)
  await drag(2, 0); const reordered = await values(), reorderedIds = await ids()
  await button('Apply').click(); await tooltip(reordered); await chip().click(); await settle()
  assert.deepEqual(await values(), reordered); assert.deepEqual(await ids(), reorderedIds)
  assert.equal(await button('Apply').isDisabled(), true)

  // Incomplete added row gates Apply; removing it restores semantic equality.
  await button('Add Subgroup').click(); await focused('Search fields')
  assert.equal(await button('Apply').isDisabled(), true)
  await page.keyboard.press('Escape'); await rows().nth(3).getByRole('button', { name: 'Remove Group', exact: true }).click(); await settle()
  assert.deepEqual(await values(), reordered); assert.equal(await button('Apply').isDisabled(), true)
  await add('Program'); await rows().nth(3).getByRole('button', { name: 'Remove Group', exact: true }).click(); await settle()
  assert.equal(await button('Apply').isDisabled(), true)
  await rows().nth(1).getByRole('button', { name: 'Remove Group', exact: true }).click(); await settle()
  assert.equal(await button('Apply').isEnabled(), true); assert.equal(await clear().count(), 1)
  assert.equal(await button('Field for group 2').evaluate(el => el === document.activeElement), true)
  await button('Cancel').click(); await chip().click(); assert.deepEqual(await values(), reordered)

  // Implicit guard Keep and Discard reuse the shared session; Cancel bypasses it.
  await keyMove(1, 'ArrowUp'); const guardedDraft = await values()
  await button('Sort').click(); await page.getByRole('dialog', { name: 'Unsaved group changes', exact: true }).waitFor()
  await page.keyboard.press('Escape'); await settle(); assert.deepEqual(await values(), guardedDraft)
  assert.equal(await handle(0).evaluate(el => el === document.activeElement), true)
  await button('View settings').click()
  await page.getByRole('dialog', { name: 'View settings', exact: true }).getByRole('button', { name: 'Filter', exact: true }).click()
  await page.getByRole('dialog', { name: 'Unsaved group changes', exact: true }).waitFor()
  await button('Discard changes').click(); await page.getByRole('dialog', { name: 'Add Filter', exact: true }).waitFor()
  await page.keyboard.press('Escape'); await chip().click(); assert.deepEqual(await values(), reordered)
  await keyMove(1, 'ArrowUp'); await button('Hide criteria').click(); await button('Discard changes').click()
  assert.equal(await page.locator('.dg-criteria-area').count(), 0)
  await button('Show criteria').click(); await chip().click(); assert.deepEqual(await values(), reordered)

  // Clear is draft-only; committed destructive removal/Undo preserves all families.
  await clear().click(); await settle(); assert.equal(await rows().count(), 1)
  assert.equal(await clear().count(), 0); assert.equal(await button('Field for group 1').innerText(), 'Select field')
  assert.equal(await button('Clear group').isEnabled(), true); assert.equal(await button('Apply').count(), 0)
  await tooltip(reordered); await button('Cancel').click(); await chip().click(); assert.deepEqual(await values(), reordered)
  await clear().click(); await button('Clear group').click()
  assert.equal(await chip().count(), 0); assert.deepEqual(await page.locator('.dg-summary .dg-chip-open').allTextContents(), others)
  await button('Undo').click(); await chip().click(); assert.deepEqual(await values(), reordered); assert.deepEqual(await ids(), reorderedIds)
  while (await rows().count() > 1) await rows().last().getByRole('button', { name: 'Remove Group', exact: true }).click()
  assert.equal(await clear().count(), 0); await button('Remove Group').click(); await settle()
  assert.equal(await rows().count(), 1); assert.equal(await button('Clear group').isEnabled(), true)
  await button('Clear group').click(); await button('Undo').click(); await tooltip(reordered)
  await button('Remove group criterion').click(); await button('Undo').click(); await tooltip(reordered)
  await button('Clear All').click(); await button('Undo').click(); await tooltip(reordered)
  assert.deepEqual((await page.locator('.dg-summary .dg-chip-open').allTextContents()).slice(1), others)

  // Generated row IDs never make otherwise equal semantics dirty.
  await button('Reset to default').click(); await chip().click(); const initialId = (await ids())[0]
  await button('Remove Group').click(); await choose('Field for group 1', 'Status')
  assert.notEqual((await ids())[0], initialId); assert.equal(await button('Apply').isDisabled(), true)
  await button('Cancel').click(); await chip().click(); assert.equal((await ids())[0], initialId)

  // Existing catalog is retained (no inferred uniqueness or screenshot depth cap).
  await add('Status'); await button('Field for group 2').click()
  assert.deepEqual(await page.locator('.dg-picker').getByRole('option').allTextContents(), catalog)
  await page.keyboard.press('Escape')
  for (let count = 2; count < 9; count++) await add(catalog[count % catalog.length])
  assert.equal(await rows().count(), 9); assert.equal(new Set(await ids()).size, 9)
  const longDraft = await values()
  await handle(0).scrollIntoViewIfNeeded(); await settle()
  const grip = await handle(0).boundingBox(), stack = await page.locator('.dg-editor-group .dg-condition-stack').boundingBox()
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2); await page.mouse.down()
  await page.mouse.move(grip.x + grip.width / 2, stack.y + stack.height - 4, { steps: 10 })
  await page.locator('.dg-sort-drag-preview').waitFor()
  await page.waitForFunction(() => document.querySelector('.dg-editor-group .dg-condition-stack').scrollTop > 0)
  await page.mouse.wheel(0, 600)
  await page.waitForFunction(() => { const s = document.querySelector('.dg-editor-group .dg-condition-stack'); return s.scrollTop >= s.scrollHeight - s.clientHeight - 1 })
  await page.mouse.up(); await settle()
  assert.deepEqual(await values(), [...longDraft.slice(1), longDraft[0]])
  assert.equal(await page.locator('.dg-sort-drag-preview, [data-pointer-held]').count(), 0)
  await button('Cancel').click()

  // Narrow picker containment, stacked scroll, focus indicators and lifecycle.
  await page.setViewportSize({ width: 480, height: 900 }); await open(); await add('Priority'); await add('Next Contact')
  await geometry('480px'); await capture('narrow-multi-group')
  await page.setViewportSize({ width: 280, height: 420 }); await button('Add Subgroup').click(); await focused('Search fields')
  const picker = page.getByRole('dialog', { name: 'Field for group 4', exact: true })
  const bounds = await picker.boundingBox()
  assert.ok(bounds.x >= 8 && bounds.x + bounds.width <= 272 && bounds.y >= 8 && bounds.y + bounds.height <= 412)
  await page.keyboard.press('Escape'); await focused('Field for group 4')
  assert.equal(await button('Apply').isDisabled(), true); await geometry('280px')
  await choose('Field for group 4', 'Program'); await keyMove(3, 'ArrowUp')
  assert.equal(await handle(2).evaluate(el => getComputedStyle(el).outlineWidth), '2px')
  await page.keyboard.press('Tab'); await focused('Field for group 3')
  await button('Cancel').click(); assert.equal(await page.locator('.dg-picker, .dg-sort-drag-preview').count(), 0)
  await page.setViewportSize({ width: 1440, height: 1200 }); await chip().click()
  assert.deepEqual(await values(), [{ field: 'Status', order: 'A to Z' }]); assert.equal(await button('Apply').isDisabled(), true)
  assert.deepEqual(errors, [])
  if (process.env.ARTIFACT_DIR) await writeFile(join(process.env.ARTIFACT_DIR, 'geometry.json'), JSON.stringify(evidence, null, 2))
  console.log(`PASS: Batch 3C.2 multi-group, field defaults, reorder/identity, draft validity, commits/Cancel, Clear/Undo, guards, catalog and narrow keyboard/overlay coverage: ${url}`)
} finally { await browser.close() }
