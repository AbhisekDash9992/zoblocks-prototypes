// External Playwright / BROWSER_PATH setup matches the prior browser suites.
// BASELINE_ONLY=1 records pre-change geometry without the new layout assertions.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
const baseline = process.env.BASELINE_ONLY === '1'
const url = process.argv[2] ?? 'http://127.0.0.1:5173/zoblocks-prototypes/#/data-grid'
const errors = []
page.on('pageerror', error => errors.push(error.message))
const button = name => page.getByRole('button', { name, exact: true })
const option = name => page.getByRole('option', { name, exact: true })
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const choose = async (name, value) => {
  await button(name).scrollIntoViewIfNeeded(); await settle()
  if (await button(name).getAttribute('aria-expanded') !== 'true') await button(name).click()
  try { await option(value).click({ timeout: 5000 }) }
  catch (error) {
    console.log(JSON.stringify(await page.evaluate(() => ({ active: document.activeElement?.getAttribute('aria-label'), pickers: [...document.querySelectorAll('.dg-picker')].map(el => ({ label: el.getAttribute('aria-label'), text: el.textContent })), expanded: [...document.querySelectorAll('[aria-expanded="true"]')].map(el => el.getAttribute('aria-label')) }))))
    throw error
  }
  await settle()
}
const primary = 'Level 1 condition 1', nested = 'Level 2 condition 1 in Level 1 condition 1', third = 'Level 2 condition 2 in Level 1 condition 1'
const priority = async context => {
  await choose(`Field for ${context}`, 'Priority')
  await choose(`Operator for ${context}`, 'is any of')
  await button(`Value for ${context}`).click()
  await page.getByRole('checkbox', { name: 'High', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Medium', exact: true }).check()
  await page.keyboard.press('Escape'); await settle()
}
const date = async context => {
  await choose(`Field for ${context}`, 'Next Contact')
  await choose(`Value for ${context}`, 'Date range')
}
const dismissAutoPicker = async field => {
  await page.getByRole('listbox', { name: await field.getAttribute('aria-label'), exact: true }).waitFor()
  await page.keyboard.press('Escape'); await settle()
}
const addNested = async () => {
  await button('Add Nested Filter to Level 1 condition 1').click()
  await dismissAutoPicker(page.locator('.dg-editor-advanced .dg-nested-row .dg-rule-field').last())
}
const capture = async label => {
  const result = await page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom } }
    const stack = document.querySelector('.dg-editor-advanced .dg-condition-stack')
    return {
      viewport: window.innerWidth,
      stack: { ...rect(stack), clientWidth: stack.clientWidth, scrollWidth: stack.scrollWidth },
      surfaces: [...stack.querySelectorAll('.dg-rule-surface')].map(surface => {
        const css = getComputedStyle(surface), bounds = rect(surface)
        return {
          ...bounds, padding: css.padding, clientWidth: surface.clientWidth, scrollWidth: surface.scrollWidth,
          inner: { x: bounds.x + parseFloat(css.paddingLeft), right: bounds.right - parseFloat(css.paddingRight), width: bounds.width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight) },
          rows: [...surface.querySelectorAll('.dg-rule-controls')].map(row => {
            const controls = [...row.querySelectorAll('button, input')], value = row.querySelector('.dg-rule-value')
            const input = row.querySelector('.dg-date-range'), remove = row.querySelector('.dg-rule-delete'), wrapper = remove?.closest('.dg-tooltip-anchor')
            const range = input ? (() => {
              const css = getComputedStyle(input), canvas = document.createElement('canvas'), context = canvas.getContext('2d'); context.font = css.font
              return { ...rect(input), value: input.value, textWidth: context.measureText(input.value).width, availableText: input.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight), clientWidth: input.clientWidth, scrollWidth: input.scrollWidth, icon: rect(row.querySelector('.dg-date-range-control > svg')), textStart: input.getBoundingClientRect().left + parseFloat(css.paddingLeft) }
            })() : null
            return {
              ...rect(row), clientWidth: row.clientWidth, scrollWidth: row.scrollWidth,
              controls: controls.map(el => ({ label: el.getAttribute('aria-label'), text: el instanceof HTMLInputElement ? el.value : el.textContent, ...rect(el) })),
              valueMax: value ? getComputedStyle(value).maxWidth : null,
              delete: remove ? rect(remove) : null, wrapper: wrapper ? rect(wrapper) : null,
              deleteClearance: wrapper ? bounds.right - wrapper.getBoundingClientRect().right : null,
              deleteGap: wrapper ? wrapper.getBoundingClientRect().left - controls.at(-2).getBoundingClientRect().right : null,
              range,
            }
          }),
        }
      }),
    }
  })
  console.log(JSON.stringify({ label, ...result }))
  if (!baseline) {
    assert.ok(result.stack.scrollWidth <= result.stack.clientWidth)
    assert.ok(result.surfaces.every(surface => surface.width === result.surfaces[0].width))
    for (const surface of result.surfaces) {
      assert.equal(surface.padding, '8px'); assert.ok(surface.scrollWidth <= surface.clientWidth)
      for (const row of surface.rows) {
        assert.equal(row.height, 32); assert.ok(row.scrollWidth <= row.clientWidth)
        const first = row.controls[0], center = first.y + first.height / 2
        for (const control of row.controls) {
          assert.equal(control.y + control.height / 2, center, control.label)
          assert.ok(control.x >= surface.inner.x && control.right <= surface.inner.right + 0.02, `${control.label} inside padded surface`)
        }
        if (row.wrapper) {
          assert.equal(row.wrapper.width, 24); assert.equal(row.delete.width, 24)
          assert.equal(row.wrapper.x, row.delete.x); assert.equal(row.wrapper.right, row.delete.right)
          assert.ok(row.wrapper.bottom <= surface.bottom - 8); assert.ok(row.deleteClearance >= 8 - 0.02)
          assert.ok(Math.abs(row.deleteGap - 8) <= 0.02, 'Delete follows last visible control with 8px gap')
        }
        assert.equal(first.width, 160)
        if (row.controls.length > 2) {
          assert.equal(row.controls[1].width, 136); assert.equal(row.valueMax, 'none')
        } else assert.equal(row.width, 192, 'Select field + 8px + Delete hugs content')
        if (row.range) {
          assert.ok(row.range.availableText >= row.range.textWidth, 'Full selected date text fits')
          assert.ok(row.range.scrollWidth <= row.range.clientWidth, 'Date input has no text clipping')
          assert.equal(row.range.icon.width, 16); assert.ok(row.range.icon.right <= row.range.textStart)
          assert.ok(row.range.icon.x >= row.range.x && row.range.icon.bottom <= row.range.bottom)
        }
      }
    }
  }
  return result
}
const allRows = result => result.surfaces.flatMap(surface => surface.rows)
const contextRow = (result, context) => allRows(result).find(row => row.controls[0].label === `Field for ${context}`)
const sameValueLayout = (before, after, context) => {
  const a = contextRow(before, context), b = contextRow(after, context)
  for (const property of ['x', 'width', 'right']) {
    assert.equal(a.controls[2][property], b.controls[2][property], `Value ${property} must not change on selection`)
    assert.equal(a.wrapper[property], b.wrapper[property], `Delete wrapper ${property} must not change on selection`)
    assert.equal(a.delete[property], b.delete[property], `Delete target ${property} must not change on selection`)
  }
  assert.deepEqual(before.surfaces.map(surface => surface.width), after.surfaces.map(surface => surface.width))
}
try {
  await page.goto(url); await page.evaluate(() => document.fonts.ready)
  await page.getByRole('button', { name: /Advanced filter .*3 rules/ }).click()
  await priority(primary)
  await addNested()
  await capture('nested-field-only')
  await choose(`Field for ${nested}`, 'Next Contact')
  await capture('partially-populated-nested')
  await choose(`Value for ${nested}`, 'Date range')
  const mixed = await capture('priority-with-nested-date')
  if (!baseline) {
    assert.ok(allRows(mixed).filter(row => row.controls.length > 2 && !row.range).every(row => row.controls[2].width > 320))
  }
  await page.getByRole('textbox', { name: `Date range for ${nested}`, exact: true }).fill('12 Oct 2026 – 28 Oct 2026')
  const fullDate = await capture('full-two-digit-date')
  if (!baseline) {
    const range = page.getByRole('textbox', { name: `Date range for ${nested}`, exact: true })
    await range.fill('')
    const emptyDate = await capture('empty-date-invalid-draft')
    sameValueLayout(fullDate, emptyDate, nested)
    assert.equal(await button('Apply').isDisabled(), true, 'Empty date remains invalid even though Value stretches')
    await range.fill('12 Oct 2026 – 28 Oct 2026'); await settle()
    assert.equal(await button('Apply').isDisabled(), false)
  }
  // Stress the same layout with a reserved scrollbar gutter, representing less available inline space.
  await page.locator('.dg-editor-advanced .dg-condition-stack').evaluate(el => { el.style.scrollbarGutter = 'stable' })
  await capture('reserved-scrollbar-gutter')
  await page.locator('.dg-editor-advanced .dg-condition-stack').evaluate(el => { el.style.scrollbarGutter = '' })
  await settle()
  await date(primary); await priority(nested)
  await capture('swapped-primary-date-nested-priority')
  await addNested(); await capture('third-field-only')
  // Batch 3B.9: third nested Priority, default "is", Value still "Select value".
  await choose(`Field for ${third}`, 'Priority')
  const emptyPriority = await capture('third-priority-select-value')
  if (!baseline) {
    const row = contextRow(emptyPriority, third)
    assert.equal(row.controls[1].text, 'is'); assert.equal(row.controls[2].text, 'Select value')
    assert.equal(row.controls[2].width, row.width - 160 - 136 - 24 - 3 * 8)
    assert.ok(row.controls[2].width > 320, 'Placeholder Value already expands without the old cap')
    assert.equal(await button('Apply').isDisabled(), true, 'Layout growth must not make the incomplete draft valid')
  }
  await choose(`Value for ${third}`, 'Medium')
  const selectedPriority = await capture('third-priority-medium')
  if (!baseline) {
    assert.equal(contextRow(selectedPriority, third).controls[2].text, 'Medium')
    sameValueLayout(emptyPriority, selectedPriority, third)
    assert.equal(await button('Apply').isDisabled(), false)
  }
  await choose(`Operator for ${third}`, 'is not')
  const changedOperator = await capture('third-priority-operator-cleared-value')
  if (!baseline) {
    sameValueLayout(selectedPriority, changedOperator, third)
    assert.equal(contextRow(changedOperator, third).controls[2].text, 'Select value')
    assert.equal(await button('Apply').isDisabled(), true)
  }
  await choose(`Value for ${third}`, 'High')
  if (!baseline) assert.equal(await button('Apply').isDisabled(), false)
  await choose(`Field for ${third}`, 'Status'); await capture('third-partial')
  if (!baseline) assert.equal(await button('Apply').isDisabled(), true)
  await choose(`Value for ${third}`, 'Active'); await capture('third-completed')
  if (!baseline) assert.equal(await button('Apply').isDisabled(), false)
  if (!baseline) {
    // Picker placement and keyboard focus stay connected to the newly stretched Value.
    await button(`Value for ${third}`).click()
    const anchor = await button(`Value for ${third}`).boundingBox(), picker = await page.getByRole('listbox', { name: `Value for ${third}`, exact: true }).boundingBox()
    assert.equal(picker.x, anchor.x); assert.equal(picker.y, anchor.y + anchor.height + 4)
    await page.keyboard.press('Escape'); assert.equal(await button(`Value for ${third}`).evaluate(el => el === document.activeElement), true)
    await button('Apply').click()
    await page.getByRole('button', { name: /Advanced filter .*5 rules/ }).click()
    await capture('committed-mixed-group')
    await page.setViewportSize({ width: 600, height: 900 }); await capture('narrow-mixed-group')
    await page.getByRole('textbox', { name: `Date range for ${primary}`, exact: true }).focus(); await page.keyboard.press('Tab'); await settle()
    assert.equal(await button('Remove Condition').first().evaluate(el => {
      const r = el.getBoundingClientRect(), bounds = el.closest('.dg-scroll').getBoundingClientRect()
      return document.activeElement === el && r.left >= bounds.left && r.right <= bounds.right
    }), true)
    await page.setViewportSize({ width: 1440, height: 1200 })
  }
  await priority(primary); await date(nested)
  const wide = await capture('before-remove-date')
  await button('Remove Condition').nth(1).click(); await settle()
  const removed = await capture('removed-date-condition')
  if (!baseline) assert.ok(removed.surfaces[0].width < wide.surfaces[0].width, 'Removing widest date condition recomputes natural shared width')
  // New primary and nested incomplete rules remain compact alongside completed groups.
  await page.locator('.dg-editor-advanced .dg-workspace-actions').getByRole('button', { name: 'Add Filter', exact: true }).click()
  await dismissAutoPicker(button('Field for Level 1 condition 4')); await capture('primary-field-only')
  await choose('Field for Level 1 condition 4', 'Status'); await capture('primary-partial')
  await choose('Value for Level 1 condition 4', 'Active'); await capture('primary-completed')
  await addNested(); await capture('incomplete-in-shared-surfaces')
  if (!baseline) {
    await button('Hide criteria').click(); await page.getByRole('dialog', { name: 'Unsaved filter changes', exact: true }).waitFor()
    await button('Keep editing').click(); await button('Cancel').click()
    await page.getByRole('button', { name: /Advanced filter .*5 rules/ }).click()
    assert.equal(await page.locator('.dg-rule-surface').count(), 3)
    // Simple retains its original preferred width and cap.
    await button('Cancel').click(); await button('Status is Active').click()
    assert.equal(await page.locator('.dg-editor-simple .dg-rule-value').evaluate(el => el.getBoundingClientRect().width), 240)
    assert.equal(await page.locator('.dg-editor-simple .dg-rule-value').evaluate(el => getComputedStyle(el).maxWidth), '320px')
    assert.deepEqual(errors, [])
    console.log(`PASS: Batches 3B.8/3B.9 dynamic widths, placeholder/selected Value stability, validation, containment, dates, narrow keyboard access and draft/committed regression: ${url}`)
  }
} finally { await browser.close() }
