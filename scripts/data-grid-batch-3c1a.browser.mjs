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
const button = name => page.getByRole('button', { name, exact: true })
const settings = () => page.getByRole('dialog', { name: 'View settings', exact: true })
const picker = () => page.getByRole('listbox', { name: 'Density options', exact: true })
const densityButton = () => settings().getByRole('button', { name: 'Density', exact: true })
const openSettings = async () => {
  await button('View settings').scrollIntoViewIfNeeded(); await settle()
  await button('View settings').click(); await settings().waitFor()
}
const entry = async name => { await openSettings(); await settings().getByRole('button', { name, exact: true }).click() }
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const choose = async (name, value) => {
  if (await button(name).getAttribute('aria-expanded') !== 'true') await button(name).click()
  await page.getByRole('option', { name: value, exact: true }).click(); await settle()
}
const focusLabel = label => page.waitForFunction(expected => document.activeElement?.getAttribute('aria-label') === expected, label)
const chips = () => page.locator('.dg-summary .dg-chip-open').allTextContents()
const rowHeight = () => page.locator('.dg-table tbody tr').first().evaluate(el => el.getBoundingClientRect().height)
const density = () => page.locator('.dg-working-region').getAttribute('data-density')
const setDensity = async label => {
  await densityButton().click(); await picker().waitFor()
  await picker().getByRole('option', { name: label, exact: true }).click(); await settle()
  assert.equal(await settings().count(), 1); assert.equal(await picker().count(), 0)
  await focusLabel('Density')
  assert.equal(await densityButton().innerText(), `Density\n${label}`)
}
const contained = async locator => {
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  assert.ok(box.x >= 8 && box.y >= 8 && box.x + box.width <= viewport.width - 8 + 1 && box.y + box.height <= viewport.height - 8 + 1)
}
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  // A/B: restored toolbar architecture and exact control ordering.
  const toolbar = page.getByRole('toolbar', { name: 'Data grid toolbar', exact: true })
  assert.equal(await toolbar.getByRole('button', { name: 'Group', exact: true }).count(), 0)
  assert.deepEqual(await page.locator('.dg-toolbar-right button').evaluateAll(elements => elements.map(el => el.getAttribute('aria-label') ?? el.textContent)), ['Collapse controls', 'Save View', 'Filter', 'Sort', 'Search', 'Full screen', 'View settings', 'Hide criteria'])
  assert.equal(await toolbar.evaluate(el => el.getBoundingClientRect().height), 40)
  assert.equal(await toolbar.evaluate(el => getComputedStyle(el).borderRadius), '0px')
  assert.equal(await button('Filter').getAttribute('aria-keyshortcuts'), 'F')
  await openSettings(); await focusLabel('View name')
  // C–F: hierarchy, identity, grounded supporting values and working geometry.
  assert.deepEqual(await settings().getByRole('group').evaluateAll(elements => elements.map(el => el.getAttribute('aria-label'))), ['View identity', 'Data configuration', 'View actions'])
  assert.equal(await settings().getByRole('separator').count(), 2)
  assert.equal(await settings().getByRole('textbox', { name: 'View name', exact: true }).inputValue(), 'View 1')
  assert.equal(await settings().getByRole('textbox', { name: 'View name', exact: true }).getAttribute('readonly'), '')
  assert.match(await settings().getByRole('group', { name: 'View identity' }).innerText(), /Review-only current view/)
  assert.equal(await page.locator('.dg-views [aria-current="true"]').innerText(), 'View 1')
  assert.equal(await settings().locator('label').count(), 0)
  assert.equal(await settings().getByRole('button', { name: 'Manage columns', exact: true }).innerText(), 'Manage columns\n5 shown')
  assert.equal(await settings().getByRole('button', { name: 'Filter', exact: true }).innerText(), 'Filter\n4 active')
  assert.equal(await settings().getByRole('button', { name: 'Group', exact: true }).innerText(), 'Group\nStatus')
  assert.equal(await settings().getByRole('button', { name: 'Sort', exact: true }).innerText(), 'Sort\n2 active')
  const geometry = await settings().evaluate(el => {
    const css = getComputedStyle(el), identity = el.querySelector('.dg-view-identity'), config = el.querySelector('.dg-data-configuration')
    const row = config.querySelector('button')
    return {
      width: el.getBoundingClientRect().width, padding: css.padding,
      groupGap: getComputedStyle(el.querySelector('.dg-view-settings-content')).gap,
      identityPadding: getComputedStyle(identity).padding, identityGap: getComputedStyle(identity).gap,
      inputHeight: identity.querySelector('input').getBoundingClientRect().height,
      rows: [...el.querySelectorAll('.dg-settings-row')].map(item => item.getBoundingClientRect().height),
      configPadding: getComputedStyle(config).padding, rowPadding: getComputedStyle(row).padding,
      iconGap: getComputedStyle(row.querySelector('.dg-settings-leading')).gap,
      rowRadius: getComputedStyle(row).borderRadius,
      configGaps: [...config.querySelectorAll('button')].slice(1).map((item, index) => item.getBoundingClientRect().top - config.querySelectorAll('button')[index].getBoundingClientRect().bottom),
    }
  })
  assert.equal(geometry.width, 320); assert.equal(geometry.padding, '4px'); assert.equal(geometry.groupGap, '8px')
  assert.equal(geometry.identityPadding, '8px 8px 0px'); assert.equal(geometry.identityGap, '4px'); assert.equal(geometry.inputHeight, 32)
  assert.ok(geometry.rows.every(height => height === 36)); assert.equal(geometry.configPadding, '0px 8px')
  assert.equal(geometry.rowPadding, '0px 8px'); assert.equal(geometry.iconGap, '12px'); assert.equal(geometry.rowRadius, '8px')
  assert.deepEqual(geometry.configGaps, [0, 0, 0])
  assert.deepEqual(await settings().locator('.dg-data-configuration button').evaluateAll(elements => elements.map(el => el.getAttribute('aria-label'))), ['Manage columns', 'Filter', 'Group', 'Sort'])
  assert.equal(await density(), 'standard'); assert.equal(await rowHeight(), 40)
  assert.equal(await densityButton().innerText(), 'Density\nStandard'); assert.equal(await densityButton().locator('svg').count(), 1)
  assert.equal(await densityButton().locator('.lucide-chevron-right').count(), 1)
  // G–J: one compact selector, selected check, ChevronDown, real state/CSS updates.
  const originalChips = await chips()
  await setDensity('Standard')
  assert.equal(await button('Save View').evaluate(el => el.classList.contains('dg-modified')), false)
  await densityButton().focus(); await page.keyboard.press('ArrowRight'); await picker().waitFor()
  await page.keyboard.press('Tab')
  await focusLabel('Filter'); assert.equal(await picker().count(), 0); assert.equal(await settings().count(), 1)
  await densityButton().click(); await picker().waitFor()
  assert.deepEqual(await picker().getByRole('option').allTextContents(), ['Patient', 'Standard', 'Clinical'])
  assert.equal(await picker().getByRole('radio').count(), 0); assert.equal(await picker().getByRole('separator').count(), 0)
  assert.equal(await picker().locator('svg').count(), 1)
  assert.equal(await picker().getByRole('option', { name: 'Standard', exact: true }).getAttribute('aria-selected'), 'true')
  assert.equal(await picker().getByRole('option', { name: 'Standard', exact: true }).evaluate(el => el === document.activeElement), true)
  assert.equal(await densityButton().locator('.lucide-chevron-down').count(), 1)
  assert.equal(await densityButton().getAttribute('aria-expanded'), 'true')
  assert.equal(await picker().evaluate(el => el.getBoundingClientRect().width), 120)
  assert.equal(await picker().evaluate(el => getComputedStyle(el).padding), '4px')
  assert.deepEqual(await picker().getByRole('option').evaluateAll(elements => elements.map(el => [el.getBoundingClientRect().height, getComputedStyle(el).padding, getComputedStyle(el).gap])), [[36, '0px 8px', '0px'], [36, '0px 8px', '0px'], [36, '0px 8px', '0px']])
  await page.keyboard.press('End'); await page.keyboard.press('Enter'); await focusLabel('Density')
  assert.equal(await settings().count(), 1); assert.equal(await density(), 'clinical'); assert.equal(await rowHeight(), 30)
  await setDensity('Patient'); assert.equal(await density(), 'patient'); assert.equal(await rowHeight(), 52)
  await densityButton().click()
  assert.equal(await picker().getByRole('option', { name: 'Patient', exact: true }).getAttribute('aria-selected'), 'true')
  assert.equal(await picker().getByRole('option', { name: 'Patient', exact: true }).locator('svg').count(), 1)
  await page.keyboard.press('Escape'); assert.equal(await settings().count(), 1); assert.equal(await picker().count(), 0)
  await focusLabel('Density'); assert.equal(await densityButton().locator('.lucide-chevron-right').count(), 1)
  await setDensity('Standard'); assert.equal(await rowHeight(), 40); assert.deepEqual(await chips(), originalChips)
  assert.equal(await button('Save View').evaluate(el => el.classList.contains('dg-modified')), true)
  // P/Q: deferred actions, readonly identity, parent dismissal and focus.
  assert.equal(await settings().getByRole('button', { name: 'Manage columns', exact: true }).isDisabled(), true)
  assert.equal(await settings().getByRole('button', { name: 'Delete view', exact: true }).isDisabled(), true)
  await page.keyboard.press('Escape'); assert.equal(await settings().count(), 0); await focusLabel('View settings')
  await openSettings(); await page.mouse.click(5, 5); assert.equal(await settings().count(), 0); await focusLabel('View settings')
  // K–O: existing Group/Summary entry, new Group and Filter/Sort destinations.
  await entry('Group'); assert.equal(await settings().count(), 0)
  assert.equal(await page.locator('.dg-group-row').count(), 1); assert.equal(await button('Apply').isDisabled(), true)
  assert.equal(await button('Field for group 1').innerText(), 'Status'); await focusLabel('Field for group 1')
  await button('Cancel').click(); await button('Group by: Status').click(); assert.equal(await button('Apply').isDisabled(), true); await button('Cancel').click()
  await entry('Sort'); assert.equal(await page.locator('.dg-sort-row').count(), 2); assert.equal(await button('Apply').isDisabled(), true); await focusLabel('Field for sort 1'); await button('Cancel').click()
  await entry('Filter'); await page.getByRole('dialog', { name: 'Add Filter', exact: true }).waitFor(); await focusLabel('Search fields')
  await page.getByRole('dialog', { name: 'Add Filter', exact: true }).getByRole('button', { name: 'Status', exact: true }).click()
  assert.equal(await page.locator('.dg-editor-simple').count(), 1); await button('Cancel').click()
  await button('Clear All').click(); await button('Hide criteria').click(); await entry('Group'); await focusLabel('Search fields')
  assert.equal(await button('Apply').isDisabled(), true); assert.equal(await button('Field for group 1').innerText(), 'Select field')
  assert.equal(await page.locator('.dg-summary .dg-chip').count(), 0); await button('Cancel').click()
  await entry('Sort'); await focusLabel('Search fields'); assert.equal(await page.locator('.dg-sort-row').count(), 1); assert.equal(await button('Apply').isDisabled(), true); await button('Cancel').click()
  // S: density preserves unfinished drafts; every implicit settings route guards.
  await button('Reset to default').click()
  for (const [mode, open, field, value, guardSubject] of [
    ['group', () => entry('Group'), 'Order for group 1', 'Z to A', 'group'],
    ['sort', () => entry('Sort'), 'Direction for sort 1', 'Low to High', 'sort'],
    ['simple', () => button('Status is Active').click(), 'Value for condition 1', 'Inactive', 'filter'],
    ['advanced', () => button('Advanced filter · 3 rules').click(), 'Value for Level 1 condition 1', 'Inactive', 'filter'],
  ]) {
    await open(); await choose(field, value); assert.equal(await button('Apply').isEnabled(), true)
    const committed = await chips()
    await openSettings(); await setDensity('Patient'); await page.keyboard.press('Escape'); await focusLabel('View settings')
    assert.equal(await page.locator(`.dg-editor-${mode}`).count(), 1)
    assert.equal(await button(field).innerText(), value); assert.equal(await button('Apply').isEnabled(), true); assert.deepEqual(await chips(), committed)
    await entry('Group'); await page.getByRole('dialog', { name: `Unsaved ${guardSubject} changes`, exact: true }).waitFor()
    assert.equal(await settings().count(), 0); await button('Keep editing').click(); assert.equal(await button(field).innerText(), value)
    await entry('Sort'); await button('Discard changes').click(); assert.equal(await page.locator('.dg-editor-sort').count(), 1)
    assert.equal(await button('Direction for sort 1').innerText(), 'High to Low'); await button('Cancel').click()
  }
  await entry('Group'); await choose('Order for group 1', 'Z to A'); await entry('Filter')
  await page.getByRole('dialog', { name: 'Unsaved group changes', exact: true }).waitFor(); await button('Discard changes').click()
  await page.getByRole('dialog', { name: 'Add Filter', exact: true }).waitFor(); await focusLabel('Search fields'); await page.keyboard.press('Escape')
  // R: collapsed controls, narrow collision/overflow, resize and keyboard access.
  await button('Collapse controls').click(); await entry('Group'); assert.equal(await page.locator('.dg-editor-group').count(), 1); await button('Cancel').click()
  await page.setViewportSize({ width: 480, height: 420 }); await openSettings(); await contained(settings())
  await densityButton().click(); await contained(picker()); assert.equal(await settings().count(), 1)
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await focusLabel('View settings')
  await page.setViewportSize({ width: 280, height: 280 }); await openSettings(); await contained(settings())
  await densityButton().click(); await contained(picker())
  await page.keyboard.press('Escape')
  await settings().getByRole('button', { name: 'Sort', exact: true }).focus()
  assert.equal(await settings().evaluate(el => el.scrollHeight > el.clientHeight), true)
  await contained(settings()); await page.keyboard.press('Escape'); await focusLabel('View settings')
  await page.setViewportSize({ width: 1440, height: 1200 }); await button('Reset to default').click(); await openSettings()
  await page.setViewportSize({ width: 760, height: 500 }); await contained(settings())
  await densityButton().click(); await page.setViewportSize({ width: 480, height: 420 }); await contained(settings()); await contained(picker())
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
  // Baseline remains an explicit review mode, without a fourth Density option.
  await page.setViewportSize({ width: 1440, height: 1200 })
  await page.locator('.dg-review label').filter({ hasText: 'Density' }).locator('select').selectOption('baseline'); await openSettings()
  assert.equal(await densityButton().innerText(), 'Density\nFigma baseline (review)')
  await densityButton().click(); assert.deepEqual(await picker().getByRole('option').allTextContents(), ['Patient', 'Standard', 'Clinical'])
  await page.keyboard.press('Escape'); await setDensity('Standard'); assert.equal(await density(), 'standard')
  await page.keyboard.press('Escape'); assert.deepEqual(errors, [])
  console.log(`PASS: Batch 3C.1a A–T, settings hierarchy/geometry, grounded counts, density/state/drafts, routing/guards, dismissal/focus and collision/overflow: ${url}`)
} finally { await browser.close() }
