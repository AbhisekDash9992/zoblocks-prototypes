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
const trigger = () => page.getByRole('toolbar', { name: 'Data grid toolbar' }).getByRole('button', { name: 'View settings', exact: true })
const settings = () => page.getByRole('dialog', { name: 'View settings', exact: true })
const input = () => settings().getByRole('textbox', { name: 'View name', exact: true })
const row = name => settings().getByRole('button', { name, exact: true })
const tooltip = () => page.getByRole('tooltip').filter({ hasText: /^View settings$/ })
const picker = () => page.getByRole('listbox', { name: 'Density options' })
const option = name => picker().getByRole('option', { name, exact: true })
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const focusLabel = label => page.waitForFunction(expected => document.activeElement?.getAttribute('aria-label') === expected, label)
const noTooltip = async () => { await settle(); assert.equal(await tooltip().count(), 0) }
const background = locator => locator.evaluate(el => getComputedStyle(el).backgroundColor)
const open = async () => { await trigger().click(); await settings().waitFor(); await settle() }
const close = async () => { await page.keyboard.press('Escape'); await focusLabel('View settings'); await noTooltip() }
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  // A/B/D: pointer activation removes the tooltip in the same render and enters
  // the dialog surface, without a caret or an initial input focus treatment.
  await trigger().hover(); await tooltip().waitFor()
  await page.evaluate(() => {
    window.settingsTooltipOverlap = false
    window.settingsTooltipObserver = new MutationObserver(() => {
      if (document.querySelector('.dg-view-settings') && [...document.querySelectorAll('[role="tooltip"]')].some(el => el.textContent === 'View settings')) window.settingsTooltipOverlap = true
    })
    window.settingsTooltipObserver.observe(document.body, { childList: true, subtree: true })
  })
  await open(); await noTooltip()
  assert.equal(await settings().evaluate(el => el === document.activeElement), true)
  assert.equal(await input().evaluate(el => el === document.activeElement || el.matches(':focus')), false)
  assert.equal(await input().evaluate(el => getComputedStyle(el).borderColor), 'rgb(209, 213, 220)')
  assert.equal(await input().evaluate(el => getComputedStyle(el).outlineStyle), 'none')
  assert.equal(await input().getAttribute('readonly'), '')
  // G-L: outer padding remains the sole group inset; list-row contents retain 8px.
  const geometry = await settings().evaluate(el => {
    const bounds = node => { const rect = node.getBoundingClientRect(); return [rect.left, rect.right] }
    const groups = [...el.querySelectorAll('.dg-view-settings-group')]
    const config = el.querySelector('.dg-data-configuration')
    const content = el.querySelector('.dg-view-settings-content')
    return {
      width: el.getBoundingClientRect().width, padding: getComputedStyle(el).padding,
      groups: groups.map(group => [getComputedStyle(group).paddingLeft, getComputedStyle(group).paddingRight, getComputedStyle(group).margin]),
      identityTop: getComputedStyle(groups[0]).paddingTop,
      groupGap: getComputedStyle(content).gap, identityGap: getComputedStyle(groups[0]).gap,
      alignment: [...el.querySelectorAll('input, .dg-settings-row, hr')].map(bounds), contentBounds: bounds(content),
      rows: [...el.querySelectorAll('.dg-settings-row')].map(item => [item.getBoundingClientRect().height, getComputedStyle(item).padding]),
      iconGaps: [...el.querySelectorAll('.dg-settings-leading')].map(item => getComputedStyle(item).gap),
      configGaps: [...config.querySelectorAll('button')].slice(1).map((item, index) => item.getBoundingClientRect().top - config.querySelectorAll('button')[index].getBoundingClientRect().bottom),
      separators: [...el.querySelectorAll('hr')].map(item => [getComputedStyle(item).margin, getComputedStyle(item).borderTopWidth]),
      gaps: [...content.children].slice(1).map((item, index) => item.getBoundingClientRect().top - content.children[index].getBoundingClientRect().bottom),
    }
  })
  assert.equal(geometry.width, 320); assert.equal(geometry.padding, '4px')
  assert.deepEqual(geometry.groups, [['0px', '0px', '0px'], ['0px', '0px', '0px'], ['0px', '0px', '0px']])
  assert.equal(geometry.identityTop, '0px'); assert.equal(geometry.groupGap, '8px'); assert.equal(geometry.identityGap, '4px')
  assert.ok(geometry.alignment.every(bounds => JSON.stringify(bounds) === JSON.stringify(geometry.contentBounds)))
  assert.ok(geometry.rows.every(([height, padding]) => height === 36 && padding === '0px 8px'))
  assert.ok(geometry.iconGaps.every(gap => gap === '12px'))
  assert.deepEqual(geometry.configGaps, [0, 0, 0]); assert.deepEqual(geometry.gaps, [8, 8, 8, 8])
  assert.deepEqual(geometry.separators, [['0px', '1px'], ['0px', '1px']])
  // C: Tab enters the read-only input deliberately and skips both disabled rows.
  for (const label of ['View name', 'Density', 'Filter', 'Group', 'Sort']) {
    await page.keyboard.press('Tab'); await focusLabel(label)
    assert.equal(await page.evaluate(() => document.activeElement.disabled), false)
  }
  await close()
  await page.keyboard.press('Enter'); await settings().waitFor(); await settle()
  assert.equal(await settings().evaluate(el => el === document.activeElement), true)
  assert.equal(await input().evaluate(el => getComputedStyle(el).borderColor), 'rgb(209, 213, 220)')
  await page.keyboard.press('ArrowDown'); await focusLabel('View name')
  await page.keyboard.press('Tab'); await focusLabel('Density')
  await page.keyboard.press('End'); await focusLabel('Sort')
  await close()
  // D-F: neither hover nor focus can steal ownership while settings is open.
  // Outside, Escape and trigger-toggle dismissal do not reopen the tooltip when
  // focus is restored. A later pointer entry or actual blur/focus re-arms it.
  for (const dismissal of ['outside', 'escape', 'trigger']) {
    await page.mouse.move(5, 5); await trigger().hover(); await tooltip().waitFor()
    await open()
    await page.mouse.move(5, 5); await trigger().hover(); await noTooltip()
    await trigger().focus(); await noTooltip(); assert.equal(await settings().count(), 1)
    await row('Density').focus()
    if (dismissal === 'outside') await page.mouse.click(5, 5)
    if (dismissal === 'escape') await page.keyboard.press('Escape')
    if (dismissal === 'trigger') await trigger().click()
    await focusLabel('View settings'); assert.equal(await settings().count(), 0); await noTooltip()
    await page.mouse.move(5, 5); await trigger().hover(); await tooltip().waitFor()
    await page.mouse.move(5, 5); await noTooltip()
    await page.getByRole('button', { name: 'Full screen', exact: true }).focus()
    await page.keyboard.press('Tab'); await focusLabel('View settings'); await tooltip().waitFor()
    await page.keyboard.press('Escape'); await noTooltip()
  }
  assert.equal(await page.evaluate(() => window.settingsTooltipOverlap), false)
  await page.evaluate(() => window.settingsTooltipObserver.disconnect())
  // M/N: selected and unselected Density options have the same resting surface;
  // selected semantics/checkmark remain, with independent hover/active/focus.
  await open(); assert.equal(await row('Density').innerText(), 'Density\nStandard')
  await row('Density').click(); await picker().waitFor()
  assert.deepEqual(await picker().getByRole('option').allTextContents(), ['Patient', 'Standard', 'Clinical'])
  assert.equal(await option('Standard').getAttribute('aria-selected'), 'true')
  assert.equal(await option('Standard').locator('.lucide-check').count(), 1)
  assert.equal(await picker().locator('.lucide-check').count(), 1)
  assert.equal(await option('Standard').evaluate(el => el.lastElementChild.classList.contains('lucide-check')), true)
  await row('Density').focus(); await page.mouse.move(5, 5)
  assert.deepEqual(await picker().getByRole('option').evaluateAll(elements => elements.map(el => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color])), Array(3).fill(['rgba(0, 0, 0, 0)', 'rgb(16, 24, 40)']))
  for (const label of ['Standard', 'Patient']) {
    await option(label).hover(); assert.equal(await background(option(label)), 'rgb(242, 243, 245)')
    await page.mouse.down(); assert.equal(await background(option(label)), 'rgb(234, 236, 240)')
    await page.mouse.move(5, 5); await page.mouse.up()
  }
  await page.keyboard.press('Escape'); await row('Density').focus()
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('End')
  assert.equal(await option('Clinical').evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true)
  assert.equal(await background(option('Clinical')), 'rgb(242, 243, 245)')
  assert.equal(await option('Clinical').evaluate(el => getComputedStyle(el).outlineWidth), '2px')
  await page.keyboard.press('Home'); assert.equal(await option('Patient').evaluate(el => el === document.activeElement), true)
  await page.keyboard.press('ArrowDown'); assert.equal(await option('Standard').evaluate(el => el === document.activeElement), true)
  assert.equal(await background(option('Standard')), 'rgb(242, 243, 245)')
  await page.keyboard.press('Escape'); await close()
  // O: tooltip defaults and shared picker autofocus/selected surfaces still work.
  for (const label of ['Filter', 'Sort', 'Search', 'Hide criteria']) {
    const control = page.getByRole('button', { name: label, exact: true })
    await control.hover(); assert.equal(await page.getByRole('tooltip').count(), 1)
    assert.match(await page.getByRole('tooltip').innerText(), new RegExp(label === 'Hide criteria' ? 'criteria' : label, 'i'))
    await page.mouse.move(5, 5); assert.equal(await page.getByRole('tooltip').count(), 0)
  }
  await page.getByRole('button', { name: 'Filter', exact: true }).click(); await focusLabel('Search fields')
  await page.keyboard.press('Escape')
  await open(); await row('Group').click(); await focusLabel('Field for group 1')
  await page.getByRole('button', { name: 'Field for group 1', exact: true }).click(); await focusLabel('Search fields')
  const selectedField = page.getByRole('option', { name: 'Status', exact: true })
  assert.equal(await selectedField.getAttribute('aria-selected'), 'true')
  await page.mouse.move(5, 5)
  assert.equal(await background(selectedField), 'rgb(249, 250, 251)')
  await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await open(); await row('Sort').click(); await focusLabel('Field for sort 1')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  assert.deepEqual(errors, [])
  console.log(`PASS: Batch 3C.1b A-O, neutral initial focus, keyboard access, tooltip event ordering/recovery, exact group/row spacing, Density states and picker/route regressions: ${url}`)
} finally { await browser.close() }
