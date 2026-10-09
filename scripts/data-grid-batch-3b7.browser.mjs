// Same external Playwright / BROWSER_PATH setup as the Batch 3B.5 regression.
// BASELINE_ONLY=1 records accepted pre-change geometry without new assertions.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
const url = process.argv[2] ?? 'http://127.0.0.1:5173/zoblocks-prototypes/#/data-grid'
const baseline = process.env.BASELINE_ONLY === '1'
const errors = []
page.on('pageerror', error => errors.push(error.message))
const button = name => page.getByRole('button', { name, exact: true })
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const away = async () => { await page.mouse.move(5, 5); await settle() }
const opacity = () => page.locator('.dg-collapse-affordance').evaluate(el => getComputedStyle(el).opacity)
const option = name => page.getByRole('option', { name, exact: true })
const select = async (name, value) => { await button(name).click(); await option(value).click(); await settle() }
const geometry = async label => {
  const result = await page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right } }
    const stack = document.querySelector('.dg-editor-advanced .dg-condition-stack')
    return {
      viewport: window.innerWidth, stack: { ...rect(stack), clientWidth: stack.clientWidth, scrollWidth: stack.scrollWidth },
      workspace: rect(document.querySelector('.dg-editor-advanced .dg-conditions')),
      surfaces: [...stack.querySelectorAll('.dg-rule-surface')].map(el => ({ ...rect(el), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth })),
      rows: [...stack.querySelectorAll('.dg-rule-controls')].map(el => ({
        ...rect(el), clientWidth: el.clientWidth, scrollWidth: el.scrollWidth,
        controls: [...el.querySelectorAll('button, input')].map(control => ({ label: control.getAttribute('aria-label'), ...rect(control) })),
        date: el.querySelector('.dg-date-range') ? (() => {
          const input = el.querySelector('.dg-date-range'), css = getComputedStyle(input), canvas = document.createElement('canvas')
          const context = canvas.getContext('2d'); context.font = css.font
          return { value: input.value, textWidth: context.measureText(input.value).width, availableTextWidth: input.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight), scrollWidth: input.scrollWidth, clientWidth: input.clientWidth }
        })() : null,
      })),
    }
  })
  console.log(JSON.stringify({ label, ...result }))
  if (!baseline) {
    assert.ok(result.stack.scrollWidth <= result.stack.clientWidth + 1)
    assert.ok(result.surfaces.every(surface => Math.abs(surface.width - result.surfaces[0].width) < 1))
    for (const surface of result.surfaces) assert.ok(surface.scrollWidth <= surface.clientWidth + 1)
    for (const row of result.rows) {
      assert.equal(row.height, 32)
      assert.ok(row.scrollWidth <= row.clientWidth + 1)
      const first = row.controls[0]
      for (const control of row.controls) {
        assert.ok(Math.abs(control.y + control.height / 2 - first.y - first.height / 2) < 1, `${control.label} must share the condition centerline`)
        assert.ok(control.right <= row.right + 1)
      }
      assert.equal(first.width, 160); assert.equal(row.controls[1].width, 136)
      assert.ok(row.controls[2].width >= 180 && row.controls[2].width <= 320)
      if (row.date) assert.ok(row.date.availableTextWidth >= row.date.textWidth, 'Entire demo date range must remain readable')
    }
  }
  return result
}
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  // Capture semantic badge styling so the working radius cannot alter other treatments.
  const badges = await page.locator('.dg-risk-chip').evaluateAll(els => els.map(el => {
    const css = getComputedStyle(el)
    return { text: el.textContent, radius: css.borderRadius, height: el.getBoundingClientRect().height, padding: css.padding, fontSize: css.fontSize, fontWeight: css.fontWeight, color: css.color, background: css.backgroundColor }
  }))
  console.log(JSON.stringify({ badges }))
  if (!baseline) {
    assert.ok(badges.every(badge => badge.radius === '4px' && badge.height === 22 && badge.padding === '0px 7px'))
    const treatments = {
      'Passive ideation': ['rgb(20, 71, 246)', 'rgb(226, 238, 255)'],
      'Ideation, no plan': ['rgb(20, 71, 246)', 'rgb(226, 238, 255)'],
      'Ideation with plan': ['rgb(180, 35, 24)', 'rgb(254, 243, 242)'],
      'None reported': ['rgb(74, 85, 101)', 'rgb(242, 243, 245)'],
    }
    for (const badge of badges) {
      assert.equal(badge.fontSize, '11px'); assert.equal(badge.fontWeight, '700')
      assert.deepEqual([badge.color, badge.background], treatments[badge.text])
    }
    assert.equal(await page.locator('.dg-table .dg-risk-chip').count(), badges.length)
    assert.equal(await page.locator('.dg-table .dg-value-state').filter({ hasText: 'Restricted' }).locator('.dg-risk-chip').count(), 0)
    assert.equal(await page.locator('.dg-chip').first().evaluate(el => getComputedStyle(el).borderRadius), '999px')
    await away(); assert.equal(await opacity(), '0')
    await button('View 1').hover(); assert.equal(await opacity(), '1')
    await away(); assert.equal(await opacity(), '0')
    for (let iteration = 0; iteration < 3; iteration++) {
      await button('Collapse controls').click(); await away(); assert.equal(await opacity(), '0')
      await button('Expand controls').click(); await away(); assert.equal(await opacity(), '0')
    }
    await button('More views').focus(); await page.keyboard.press('Tab'); await away()
    assert.equal(await button('Collapse controls').evaluate(el => el === document.activeElement), true)
    assert.equal(await opacity(), '1')
    assert.equal(await button('Collapse controls').evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
    await page.keyboard.press('Enter'); await away(); assert.equal(await opacity(), '1')
    await page.keyboard.press(' '); await away(); assert.equal(await opacity(), '1')
    // Pointer activation must also clear browser heuristics inherited from keyboard focus.
    await button('Collapse controls').click(); await away(); assert.equal(await opacity(), '0')
    await button('Expand controls').click(); await away(); assert.equal(await opacity(), '0')
    await button('More views').focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await away()
    assert.equal(await opacity(), '0')
  }
  await page.getByRole('button', { name: /Advanced filter .*3 rules/ }).click()
  const shortOnly = await geometry('short-only')
  if (!baseline) assert.ok(shortOnly.stack.width < shortOnly.workspace.width - 32, 'Short-only surfaces retain natural width')
  await select('Value for Level 1 condition 3', 'Date range')
  const primary = await geometry('primary-date')
  await button('Add Nested Filter to Level 1 condition 1').click()
  await option('Next Contact').click()
  await select('Value for Level 2 condition 1 in Level 1 condition 1', 'Date range')
  const nested = await geometry('nested-date')
  if (!baseline) {
    assert.ok(nested.rows.find(row => row.controls[0].label === 'Field for Level 1 condition 2').controls[2].width > 240, 'Shorter Priority row grows into available width')
    // Anchor remains aligned with the resized Value control.
    const value = button('Value for Level 2 condition 1 in Level 1 condition 1')
    await value.click()
    const anchor = await value.boundingBox(), picker = await page.getByRole('listbox', { name: 'Value for Level 2 condition 1 in Level 1 condition 1', exact: true }).boundingBox()
    assert.equal(picker.x, anchor.x); assert.equal(picker.y, anchor.y + anchor.height + 4)
    await page.keyboard.press('Escape'); assert.equal(await value.evaluate(el => el === document.activeElement), true)
    const date = page.getByRole('textbox', { name: 'Date range for Level 2 condition 1 in Level 1 condition 1', exact: true })
    await value.focus(); await page.keyboard.press('Tab'); assert.equal(await date.evaluate(el => el === document.activeElement), true)
    await date.fill('2 Oct 2026 – 8 Oct 2026'); await page.keyboard.press('Tab')
    assert.equal(await button('Remove Condition').nth(1).evaluate(el => el === document.activeElement), true)
    await button('Apply').click()
    await page.getByRole('button', { name: /Advanced filter .*4 rules/ }).click()
    assert.equal(await date.inputValue(), '2 Oct 2026 – 8 Oct 2026')
    await geometry('committed-nested-date')
    await page.setViewportSize({ width: 600, height: 900 })
    await geometry('narrow-nested-date')
    // The established horizontally scrollable working surface contains the fixed review workspace.
    await date.focus(); await page.keyboard.press('Tab'); await settle()
    assert.equal(await page.locator('.dg-scroll').evaluate(el => getComputedStyle(el).overflowX), 'auto')
    const access = await button('Remove Condition').nth(1).evaluate(el => {
      const rect = el.getBoundingClientRect(), bounds = el.closest('.dg-scroll').getBoundingClientRect()
      return rect.left >= bounds.left && rect.right <= bounds.right
    })
    assert.equal(access, true, 'Tab must reveal the narrow-screen Delete target within the working surface')
    await page.keyboard.press('Enter')
    assert.equal(await page.locator('.dg-nested-row').count(), 0)
    assert.equal(await page.locator('.dg-editor').evaluate(el => el === document.activeElement), true)
    await page.setViewportSize({ width: 1440, height: 1200 })
    await button('Cancel').click()
    await page.getByRole('button', { name: /Advanced filter .*4 rules/ }).click()
    assert.equal(await page.locator('.dg-nested-row').count(), 1)
    await select('Field for Level 1 condition 1', 'Next Contact')
    await select('Value for Level 1 condition 1', 'Date range')
    await geometry('primary-and-nested-date-in-same-group')
    await button('Remove Condition').first().hover()
    assert.equal(await page.getByRole('tooltip').filter({ hasText: 'Remove Condition' }).count(), 1)
    await away(); assert.equal(await page.getByRole('tooltip').count(), 0)
    await button('Clear all').click(); assert.equal(await page.locator('.dg-rule-surface').count(), 1)
    await button('Cancel').click()
    assert.deepEqual(errors, [])
    console.log(`PASS: Batch 3B.7 toolbar focus, Advanced single-line geometry, date/picker/keyboard/delete, responsive containment and Risk Screen badges: ${url}`)
  } else console.log(JSON.stringify({ baseline: true, primaryWidth: primary.rows[2].width, nestedWidth: nested.rows[1].width }))
} finally { await browser.close() }
