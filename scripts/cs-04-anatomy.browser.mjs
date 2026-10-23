// Local refinement/review QA using existing external tooling. No private Figma
// evidence is needed; screenshots/results are written only to ignored context.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

assert.ok(process.env.PLAYWRIGHT_MODULE && process.env.BROWSER_PATH, 'Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing tooling.')
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const base = (process.argv[2] ?? 'http://127.0.0.1:6013').replace(/\/$/, '')
const output = '.local-context/cs04-anatomy-qa'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
page.setDefaultTimeout(12000)
const errors = [], passed = [], measurements = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`) })
const story = async (id, docs = false) => {
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=${docs ? 'docs' : 'story'}`)
  await page.locator(docs ? '.zw-docs' : '#storybook-root > *').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
}
const features = ['surface', 'leading-icon', 'label', 'trailing-icon', 'padding', 'spacing', 'radius', 'focus']
const near = (a, b) => Math.abs(a - b) < 0.02
function checkLeaders(callouts) {
  const segments = callouts.flatMap((callout, group) => callout.points.slice(1).map((point, index) => ({ group, a: callout.points[index], b: point })))
  for (const first of segments) for (const second of segments) {
    if (first.group >= second.group) continue
    const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    const on = (a, b, p) => near(cross(a, b, p), 0) && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]) && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1])
    const c1 = cross(first.a, first.b, second.a), c2 = cross(first.a, first.b, second.b)
    const c3 = cross(second.a, second.b, first.a), c4 = cross(second.a, second.b, first.b)
    assert.ok(!(c1 * c2 < 0 && c3 * c4 < 0) && !on(first.a, first.b, second.a) && !on(first.a, first.b, second.b) && !on(second.a, second.b, first.a) && !on(second.a, second.b, first.b), 'Leader lines must not cross')
  }
  for (const [index, callout] of callouts.entries()) for (const segment of segments) {
    if (segment.group === index) continue
    const dx = segment.b[0] - segment.a[0], dy = segment.b[1] - segment.a[1]
    const t = Math.max(0, Math.min(1, ((callout.marker[0] - segment.a[0]) * dx + (callout.marker[1] - segment.a[1]) * dy) / (dx * dx + dy * dy)))
    assert.ok(Math.hypot(callout.marker[0] - segment.a[0] - t * dx, callout.marker[1] - segment.a[1] - t * dy) > callout.radius, 'Leader must not collide with another marker')
  }
}
async function inspectAnatomy(context) {
  const anatomy = page.locator('.cs04-anatomy')
  await anatomy.locator('.cs04-anatomy-diagram').waitFor()
  const data = await anatomy.evaluate(root => {
    const svg = root.querySelector('.cs04-anatomy-diagram'), scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
    const rect = selector => {
      const node = svg.querySelector(selector), css = getComputedStyle(node)
      return { x: +node.getAttribute('x'), y: +node.getAttribute('y'), width: +node.getAttribute('width'), height: +node.getAttribute('height'), radius: +node.getAttribute('rx'), fill: css.fill, dash: css.strokeDasharray }
    }
    return {
      viewBox: [svg.viewBox.baseVal.width, svg.viewBox.baseVal.height], scale,
      surface: rect('.cs04-diagram-surface'), outer: rect('.cs04-diagram-focus-outer'), inner: rect('.cs04-diagram-focus-inner'),
      leading: rect('[data-anatomy-box="leading-icon"]'), label: rect('[data-anatomy-box="label"]'), trailing: rect('[data-anatomy-box="trailing-icon"]'),
      accessibleIds: svg.getAttribute('aria-labelledby').split(' ').map(id => ({ tag: document.getElementById(id)?.tagName, text: document.getElementById(id)?.textContent })),
      callouts: [...svg.querySelectorAll('.cs04-callout')].map(node => {
        const marker = node.querySelector('.cs04-number-marker'), anchor = node.querySelector('.cs04-anchor'), text = node.querySelector('.cs04-number')
        const box = text.getBBox()
        return { feature: node.dataset.feature, number: text.textContent, marker: [+marker.getAttribute('cx'), +marker.getAttribute('cy')], radius: parseFloat(getComputedStyle(marker).r), anchor: [+anchor.getAttribute('cx'), +anchor.getAttribute('cy')], points: [...node.querySelector('polyline').points].map(p => [p.x, p.y]), numberBox: [box.x, box.y, box.width, box.height], fontPixels: parseFloat(getComputedStyle(text).fontSize) * scale }
      }),
      legend: [...root.querySelectorAll('.cs04-legend li')].map(node => ({ feature: node.dataset.feature, text: node.textContent })),
      actualHeight: root.querySelector('.cs04-anatomy-specimen .ox-button').getBoundingClientRect().height,
      mediumGeometry: root.querySelector('table tbody tr:nth-child(2)').textContent,
    }
  })
  assert.deepEqual(data.callouts.map(item => item.feature), features)
  assert.deepEqual(data.legend.map(item => item.feature), features)
  assert.deepEqual(data.callouts.map(item => item.number), ['1', '2', '3', '4', '5', '6', '7', '8'])
  assert.deepEqual(data.accessibleIds.map(item => item.tag), ['title', 'desc'])
  assert.ok(data.accessibleIds.every(item => item.text.length > 30))
  assert.deepEqual([data.surface.height, data.surface.radius], [30 * 5, 8 * 5])
  assert.deepEqual([data.leading.width, data.leading.height, data.trailing.width, data.trailing.height], [80, 80, 80, 80])
  assert.equal(data.label.height, 22 * 5)
  assert.equal(data.leading.x - data.surface.x, 12 * 5)
  assert.equal(data.label.y - data.surface.y, 4 * 5)
  assert.equal(data.label.x - data.leading.x - data.leading.width, 6 * 5)
  assert.equal(data.trailing.x - data.label.x - data.label.width, 6 * 5)
  assert.equal(data.surface.x - data.inner.x, 2 * 5); assert.equal(data.surface.x - data.outer.x, 4 * 5)
  assert.equal(data.inner.fill, 'rgb(255, 255, 255)'); assert.equal(data.outer.fill, 'rgb(21, 93, 252)')
  assert.equal(data.inner.dash, 'none'); assert.equal(data.outer.dash, 'none')
  assert.equal(data.actualHeight, 30)
  assert.match(data.mediumGeometry, /30 \/ 30px4 × 12px6 \/ 16px8px14 \/ 22px/)
  const anchors = data.callouts.map(item => item.anchor)
  assert.ok(anchors[0][0] > data.surface.x && anchors[0][0] < data.leading.x)
  assert.deepEqual(anchors[1], [data.leading.x + data.leading.width / 2, data.leading.y])
  assert.deepEqual(anchors[2], [data.label.x + data.label.width / 2, data.label.y])
  assert.deepEqual(anchors[3], [data.trailing.x + data.trailing.width / 2, data.trailing.y])
  assert.ok(anchors[4][1] > data.label.y + data.label.height && anchors[4][1] < data.surface.y + data.surface.height)
  assert.equal(anchors[5][0], (data.label.x + data.label.width + data.trailing.x) / 2)
  assert.ok(near(Math.hypot(anchors[6][0] - (data.surface.x + data.surface.width - data.surface.radius), anchors[6][1] - (data.surface.y + data.surface.radius)), data.surface.radius))
  assert.ok(anchors[7][1] > data.inner.y + data.inner.height && anchors[7][1] < data.outer.y + data.outer.height)
  checkLeaders(data.callouts)
  for (const item of data.callouts) {
    const [x, y, width, height] = item.numberBox
    assert.ok(x >= 0 && y >= 0 && x + width <= data.viewBox[0] && y + height <= data.viewBox[1], `${context}: number ${item.number} unclipped`)
    assert.ok(item.marker[0] - item.radius >= 0 && item.marker[0] + item.radius <= data.viewBox[0] && item.marker[1] - item.radius >= 0 && item.marker[1] + item.radius <= data.viewBox[1])
    assert.ok(item.fontPixels >= 12, `${context}: number ${item.number} readable (${item.fontPixels}px)`)
    for (const other of data.callouts) if (other.number !== item.number) assert.ok(Math.hypot(item.marker[0] - other.marker[0], item.marker[1] - other.marker[1]) > item.radius + other.radius)
  }
  for (const item of await anatomy.locator('.cs04-legend li').all()) {
    await item.scrollIntoViewIfNeeded()
    assert.equal(await item.isVisible(), true)
    assert.equal(await item.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth }), true)
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  measurements.push({ context, svgScale: data.scale, callouts: 8, smallestNumberPixels: Math.min(...data.callouts.map(item => item.fontPixels)), actualHeight: data.actualHeight })
  await anatomy.locator('.cs04-anatomy-panel').screenshot({ path: `${output}/${context}.png` })
}
try {
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await story('cs-04-button--anatomy-geometry'); await inspectAnatomy(`story-${width}`)
    await story('cs-04-button--docs', true); await inspectAnatomy(`docs-${width}`)
  }
  passed.push('Anatomy story and Docs at 1280/390/320px: eight readable/unclipped markers, matching visible legend, precise endpoints, no crossed leaders/collisions, solid focus layers, preserved source geometry and actual-size specimen')
  await page.setViewportSize({ width: 1280, height: 1000 })
  await story('cs-04-button--native-behavior')
  const first = page.getByRole('button', { name: 'Try Primary', exact: true })
  await first.click(); await first.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space')
  assert.equal(await page.getByRole('status').first().textContent(), 'Activations: 3')
  assert.match(await first.evaluate(el => getComputedStyle(el).boxShadow), /4px/)
  const disabled = page.getByRole('button', { name: 'Unavailable action', exact: true })
  assert.equal(await disabled.isDisabled(), true); await disabled.evaluate(el => el.click())
  assert.equal(await page.getByRole('status').first().textContent(), 'Activations: 3')
  await page.getByRole('button', { name: 'Try Text secondary', exact: true }).focus(); await page.keyboard.press('Tab')
  assert.equal(await page.getByRole('button', { name: 'Focus first action', exact: true }).evaluate(el => el === document.activeElement), true)
  await page.keyboard.press('Enter'); assert.equal(await first.evaluate(el => el === document.activeElement), true)
  await page.getByRole('button', { name: 'Default type action', exact: true }).click()
  assert.equal(await page.getByRole('status').nth(1).textContent(), 'Submissions: 0')
  await page.getByRole('button', { name: 'Submit sample', exact: true }).click()
  assert.equal(await page.getByRole('status').nth(1).textContent(), 'Submissions: 1')
  await story('cs-04-button--icons'); assert.equal(await page.locator('[data-cs04-icons]').count(), 24)
  assert.equal(await page.locator('.cs04-icons svg:not([aria-hidden="true"]), .cs04-icons svg:not([focusable="false"])').count(), 0)
  await story('cs-04-button--full-state-matrix'); assert.equal(await page.locator('[data-cs04-case]').count(), 120)
  passed.push('CS-04 behavior smoke: click/Enter/Space, native disabled, Tab skip, ref focus, form types, icon examples and 120-state matrix')
  await story('cs-04-button--docs', true)
  const select = page.locator('select[id$="-variant"]'), label = page.locator('textarea[name="label"]')
  assert.equal(await page.locator('.docblock-argstable tbody tr').count(), 7)
  await select.selectOption('secondary'); await page.locator('.cs04-panel .ox-button--secondary').first().waitFor()
  const input = page.locator('input[name="iconRight"]'); await input.focus(); await input.press('Space')
  await page.waitForFunction(() => document.querySelector('.cs04-panel .ox-button').querySelectorAll('svg').length === 1)
  await label.fill('Review sample'); await page.locator('.cs04-panel .ox-button').first().filter({ hasText: 'Review sample' }).waitFor()
  await page.getByRole('button', { name: 'Reset controls', exact: true }).click()
  await page.locator('.cs04-panel .ox-button--primary').first().filter({ hasText: 'Save changes' }).waitFor()
  await page.waitForFunction(() => document.querySelector('.cs04-panel .ox-button').querySelectorAll('svg').length === 0)
  passed.push('Seven native CS-04 Controls; independent variant/icon/label edits and reset')
  for (const [id, selector, count] of [['cs-01-icon-button--docs', '.cs01-anatomy [data-feature]', 6], ['cs-02-tooltip--docs', '.cs02-anatomy [data-feature]', 4], ['cs-03-badge--docs', '.cs03-anatomy [data-feature]', 5]]) {
    await page.goto(`${base}/?path=/docs/${id}`)
    const frame = page.frameLocator('#storybook-preview-iframe'); await frame.locator('.zw-docs').waitFor()
    assert.equal(await frame.locator(selector).count(), count)
  }
  passed.push('CS-01/02/03 Storybook manager/Docs regression: pages render with accepted anatomy structures')
  assert.deepEqual(errors, [])
  await writeFile(`${output}/results.json`, JSON.stringify({ passed, measurements, errors }, null, 2))
  console.log(passed.map(message => `PASS: ${message}`).join('\n'))
} catch (error) {
  console.error(error.stack)
  await page.screenshot({ path: `${output}/failure.png` }).catch(() => {})
  await writeFile(`${output}/failure.json`, JSON.stringify({ passed, measurements, errors, failure: error.message }, null, 2))
  process.exitCode = 1
} finally { await browser.close() }
