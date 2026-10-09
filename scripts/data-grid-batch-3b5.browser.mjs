// Run with an externally installed Playwright; no repository dependency required.
// PLAYWRIGHT_MODULE: absolute path to playwright/index.mjs.
// BROWSER_PATH: installed Chrome/Edge executable. Optional argv[2]: Data Grid URL.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })
const errors = []
page.on('pageerror', error => errors.push(error.message))
const url = process.argv[2] ?? 'http://127.0.0.1:5173/zoblocks-prototypes/#/data-grid'
const button = name => page.getByRole('button', { name, exact: true })
const rows = () => page.locator('.dg-sort-row')
const handle = () => page.locator('.dg-sort-handle').first()
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const away = async () => { await page.mouse.move(5, 5); await settle() }
const openSort = async () => { await button('Sort').click(); await settle() }
const order = () => rows().locator('.dg-rule-field').allTextContents()
const grip = locator => locator.locator('.dg-sort-grip').evaluate(el => getComputedStyle(el).opacity)
const measure = async state => {
  const result = await page.evaluate(() => {
    const toolbar = document.querySelector('.dg-toolbar'), css = getComputedStyle(toolbar), stroke = getComputedStyle(toolbar, '::after')
    const area = document.querySelector('.dg-criteria-area'), surface = document.querySelector('.dg-criteria-surface')
    const summary = document.querySelector('.dg-summary'), editor = document.querySelector('.dg-editor-header')
    return {
      toolbar: toolbar.getBoundingClientRect().height,
      padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
      radius: css.borderRadius, shadow: css.boxShadow,
      divider: { content: stroke.content, position: stroke.position, top: stroke.top, height: stroke.height, zIndex: stroke.zIndex, pointerEvents: stroke.pointerEvents },
      controls: [...toolbar.querySelectorAll('button')].map(el => el.getBoundingClientRect().height),
      criteriaPadding: area ? [getComputedStyle(area).paddingTop, getComputedStyle(area).paddingRight, getComputedStyle(area).paddingBottom, getComputedStyle(area).paddingLeft] : null,
      criteriaFootprint: area ? area.getBoundingClientRect().height : 0,
      summary: summary?.getBoundingClientRect().height,
      header: editor?.getBoundingClientRect().height,
      contiguous: editor ? document.querySelector('.dg-editor').getBoundingClientRect().bottom === summary.getBoundingClientRect().top : null,
      outerExtra: area ? area.getBoundingClientRect().height - surface.getBoundingClientRect().height : 0,
      criteriaTopGap: area ? surface.getBoundingClientRect().top - toolbar.getBoundingClientRect().bottom : 0,
    }
  })
  assert.equal(result.toolbar, 40)
  assert.deepEqual(result.padding, ['8px', '0px', '8px', '0px'])
  assert.equal(result.radius, '0px')
  assert.ok(result.controls.every(height => height === 24))
  assert.equal(result.shadow, 'none')
  if (state === 'hidden') {
    assert.equal(result.divider.content, '""'); assert.equal(result.divider.position, 'absolute')
    assert.equal(result.divider.top, '40px'); assert.equal(result.divider.height, '1px')
    assert.equal(result.divider.pointerEvents, 'none'); assert.equal(result.criteriaFootprint, 0)
  }
  else {
    assert.equal(result.divider.content, 'none'); assert.deepEqual(result.criteriaPadding, ['0px', '0px', '8px', '0px'])
    assert.equal(result.outerExtra, 8); assert.equal(result.criteriaTopGap, 0); assert.equal(result.summary, 40)
    if (state === 'editor') { assert.equal(result.header, 48); assert.equal(result.contiguous, true) }
  }
  console.log(JSON.stringify({ state, ...result }))
}
const measureDirectBoundary = async () => {
  await page.evaluate(() => window.scrollTo(0, 0))
  await settle()
  const result = await page.evaluate(() => {
    const toolbar = document.querySelector('.dg-toolbar'), rect = toolbar.getBoundingClientRect()
    const stroke = getComputedStyle(toolbar, '::after')
    const viewport = document.querySelector('.dg-table-viewport'), table = document.querySelector('.dg-table')
    const headers = [...document.querySelectorAll('.dg-table th')]
    return {
      directSibling: toolbar.nextElementSibling === viewport,
      toolbarBottom: rect.bottom, dividerTop: rect.top + parseFloat(stroke.top), dividerHeight: parseFloat(stroke.height),
      viewportTop: viewport.getBoundingClientRect().top, headerTop: headers[0].getBoundingClientRect().top,
      toolbarLeft: rect.left, toolbarRight: rect.right,
      tableLeft: table.getBoundingClientRect().left, tableRight: table.getBoundingClientRect().right,
      dividerColor: stroke.backgroundColor, dividerZIndex: Number(stroke.zIndex),
      headers: headers.map(el => {
        const css = getComputedStyle(el)
        return { top: el.getBoundingClientRect().top, height: el.getBoundingClientRect().height, border: css.borderTopWidth, color: css.borderTopColor, zIndex: Number(css.zIndex) }
      }),
    }
  })
  assert.equal(result.directSibling, true)
  assert.equal(result.dividerTop, result.toolbarBottom)
  assert.equal(result.dividerTop, result.viewportTop)
  assert.equal(result.dividerTop, result.headerTop)
  assert.equal(result.dividerHeight, 1)
  assert.equal(result.toolbarLeft, result.tableLeft); assert.equal(result.toolbarRight, result.tableRight)
  for (const header of result.headers) {
    assert.equal(header.top, result.dividerTop); assert.equal(header.height, 28); assert.equal(header.border, '1px')
    assert.equal(header.color, result.dividerColor); assert.ok(result.dividerZIndex > header.zIndex)
  }
  console.log(JSON.stringify({ directBoundary: result }))
}
const dragStart = async () => {
  const box = await handle().boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  return box
}
const clean = async () => {
  await away()
  assert.equal(await page.locator('.dg-sort-drag-preview, .dg-sort-dragging, [data-pointer-held]').count(), 0)
  assert.equal(await grip(handle()), '0')
  assert.equal(await handle().evaluate(el => getComputedStyle(el).cursor), 'grab')
}
try {
  await page.goto(url)
  await measure('summary')
  await button('Hide criteria').click(); await measure('hidden')
  await page.getByRole('switch', { name: 'Caseload context visible', exact: true }).uncheck()
  await page.getByRole('switch', { name: 'Held arrivals visible', exact: true }).uncheck()
  await measureDirectBoundary()
  await button('Collapse controls').click(); await measure('hidden')
  await measureDirectBoundary()
  await button('Show criteria').click(); await measure('summary')
  await button('Expand controls').click()
  await page.getByRole('switch', { name: 'Caseload context visible', exact: true }).check()
  await page.getByRole('switch', { name: 'Held arrivals visible', exact: true }).check()
  await openSort(); await measure('editor')
  await away(); assert.equal(await grip(handle()), '0')
  await rows().first().locator('.dg-rule-field').hover()
  assert.equal(await grip(handle()), '1')
  await clean()
  await handle().hover()
  assert.equal(await handle().evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
  await dragStart()
  assert.equal(await handle().evaluate(el => getComputedStyle(el).cursor), 'grabbing')
  assert.equal(await handle().evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)')
  await page.mouse.up(); await clean()
  // Repeat after genuine keyboard focus, where browser :focus-visible heuristics can persist.
  await page.locator('.dg-editor-sort .dg-conditions').focus(); await page.keyboard.press('Tab')
  assert.equal(await handle().evaluate(el => el === document.activeElement), true)
  assert.equal(await grip(handle()), '1')
  assert.equal(await handle().evaluate(el => getComputedStyle(el).outlineStyle), 'solid')
  await page.keyboard.press('ArrowDown'); await settle()
  assert.deepEqual(await order(), ['Next Contact', 'Priority'])
  assert.match(await page.locator('.dg-sort-assistive[role="status"]').textContent(), /Priority moved to precedence 2 of 2/)
  assert.equal(await page.locator('.dg-sort-handle').nth(1).evaluate(el => el === document.activeElement), true)
  await page.keyboard.press('ArrowUp'); await settle()
  await dragStart(); await page.mouse.up(); await clean()
  for (const selector of ['.dg-rule-field', '.dg-rule-operator', '.dg-rule-delete']) {
    await rows().first().locator(selector).focus(); await away(); assert.equal(await grip(handle()), '0')
  }
  const target = await rows().nth(1).boundingBox()
  await dragStart(); await page.mouse.move(target.x + 12, target.y + target.height - 1, { steps: 12 }); await settle()
  assert.equal(await page.locator('[data-drop-after]').count(), 1)
  await page.mouse.up(); await settle(); await clean()
  assert.deepEqual(await order(), ['Next Contact', 'Priority'])
  await button('Apply').click(); await openSort()
  assert.deepEqual(await order(), ['Next Contact', 'Priority']); await clean()
  // Active drag cancellations and no-drag pointer cancellation preserve draft order.
  for (const reason of ['escape', 'pointercancel', 'lostpointercapture', 'blur', 'outside', 'tab']) {
    const original = await order(), box = await dragStart()
    await page.mouse.move(box.x + 12, box.y + 16 + 8); await settle()
    if (reason === 'escape') await page.keyboard.press('Escape')
    else if (reason === 'tab') await page.keyboard.press('Tab')
    else if (reason === 'blur') await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    else if (reason === 'outside') await page.mouse.move(5, 5)
    else await handle().evaluate((el, type) => el.dispatchEvent(new PointerEvent(type, { pointerId: 1, bubbles: true })), reason)
    await page.mouse.up(); await settle(); await clean(); assert.deepEqual(await order(), original)
  }
  await dragStart()
  await handle().evaluate(el => el.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })))
  await page.mouse.up(); await clean()
  // Add every remaining field; dropdown must exclude already-selected fields.
  for (const field of ['Status', 'Client', 'Risk Screen', 'PHQ-9']) {
    await button('Add Sort').click()
    await page.getByRole('option', { name: field, exact: true }).waitFor()
    assert.equal(await page.getByRole('option', { name: 'Priority', exact: true }).count(), 0)
    await page.getByRole('option', { name: field, exact: true }).click(); await away()
    assert.equal(await grip(rows().last().locator('.dg-sort-handle')), '0')
  }
  const stack = page.locator('.dg-editor-sort .dg-condition-stack')
  await stack.evaluate(el => { el.style.maxHeight = '100px'; el.scrollTop = 0 })
  await dragStart()
  const bounds = await stack.boundingBox()
  await page.mouse.move(bounds.x + 12, bounds.y + bounds.height - 2)
  await page.waitForFunction(() => document.querySelector('.dg-editor-sort .dg-condition-stack').scrollTop > 25)
  await page.keyboard.press('Escape'); await page.mouse.up(); await clean()
  await button('Hide criteria').click()
  await page.getByRole('dialog', { name: 'Unsaved sort changes' }).waitFor()
  await button('Keep editing').click(); assert.equal(await rows().count(), 6)
  await button('Hide criteria').click(); await button('Discard changes').click(); await openSort()
  assert.deepEqual(await order(), ['Next Contact', 'Priority'])
  await button('Add Sort').click(); await page.getByRole('option', { name: 'Status', exact: true }).click()
  await button('Cancel').click()
  await openSort(); assert.deepEqual(await order(), ['Next Contact', 'Priority']); await button('Cancel').click()
  // Simple Filter Apply and Cancel still route through the shared criteria surface.
  await button('Status is Active').click()
  await page.getByRole('button', { name: /Value for/ }).click()
  await page.getByRole('option', { name: 'Inactive', exact: true }).click()
  await button('Apply').click(); await button('Status is Inactive').click()
  await button('Cancel').click()
  // Advanced draft guard, apply, summary, and focus restoration.
  await page.getByRole('button', { name: /Advanced filter .*3 rules/ }).click()
  await page.getByRole('button', { name: 'Level 1 condition relationship', exact: true }).click()
  await page.getByRole('option', { name: 'Or', exact: true }).click()
  await button('Hide criteria').click()
  await page.getByRole('dialog', { name: 'Unsaved filter changes' }).waitFor()
  await button('Keep editing').click(); await button('Apply').click()
  assert.equal(await page.locator('.dg-summary').evaluate(el => el === document.activeElement), true)
  await page.getByRole('button', { name: /Advanced filter .*3 rules/ }).click()
  assert.equal(await button('Level 1 condition relationship').textContent(), 'Or')
  await button('Cancel').click()
  await button('Hide criteria').click(); await measure('hidden')
  await page.setViewportSize({ width: 600, height: 900 }); await measure('hidden')
  await button('Show criteria').click(); await measure('summary')
  assert.deepEqual(errors, [])
  console.log(`PASS: Batch 3B.6 geometry and divider alignment; Batch 3B.5 pointer/keyboard reorder, cleanup, autoscroll, draft/committed state, filters and dirty guards: ${url}`)
} finally { await browser.close() }
