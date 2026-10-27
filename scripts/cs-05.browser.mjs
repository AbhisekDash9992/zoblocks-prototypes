// Public-safe local reference QA. Uses existing tooling; no private evidence input.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

assert.ok(process.env.PLAYWRIGHT_MODULE && process.env.BROWSER_PATH, 'Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing tooling.')
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const base = (process.argv[2] ?? 'http://127.0.0.1:6015').replace(/\/$/, '')
const output = '.local-context/cs05-batch2-browser'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
page.setDefaultTimeout(12000)
const errors = [], passed = [], badgeMeasurements = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) errors.push(message.text()) })
page.on('response', response => { if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`) })
const story = async (id, args = '', docs = false) => {
  await page.goto(`${base}/iframe.html?id=cs-05-tabs--${id}&viewMode=${docs ? 'docs' : 'story'}${args ? `&args=${encodeURIComponent(args)}` : ''}`)
  await page.locator(docs ? '.cs05-docs' : '.cs05-reference').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
}
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
const variants = ['underline', 'underline-icons', 'pills', 'pills-brand', 'pills-brand-border']
try {
  await story('parent-styles')
  assert.equal(await page.locator('[data-parent-style]').count(), 5)
  assert.equal(await page.locator('.cs05-reference').locator('button,a,[role],[aria-controls],[tabindex]').count(), 0)
  for (const variant of variants) {
    const specimen = page.locator(`[data-parent-style="${variant}"]`)
    assert.equal(await specimen.locator('.ox-tab').count(), 4)
    assert.equal(await specimen.locator('[data-selected="true"]').count(), 1)
    assert.deepEqual(await specimen.locator('.ox-tabs__list').evaluate(el => [el.getBoundingClientRect().height, getComputedStyle(el).gap]), variant === 'pills-brand-border' ? [38,'6px'] : [30,'16px'])
  }
  await story('source-atom-states')
  assert.equal(await page.locator('[data-atom-case]').count(), 12)
  for (const sample of await page.locator('[data-atom-case]').all()) {
    const atom = sample.locator('.ox-tab')
    const before = await atom.evaluate(el => ({ fill:getComputedStyle(el).backgroundColor, color:getComputedStyle(el).color, height:el.getBoundingClientRect().height }))
    await atom.hover()
    assert.deepEqual(await atom.evaluate(el => ({ fill:getComputedStyle(el).backgroundColor, color:getComputedStyle(el).color, height:el.getBoundingClientRect().height })), before)
    assert.equal(before.height, (await sample.getAttribute('data-atom-case')).startsWith('pill-brand-underline') ? 38 : 32)
    assert.equal(await atom.getAttribute('tabindex'), '-1')
  }
  await story('content-configurations')
  assert.equal(await page.locator('[data-content-case]').count(), 8)
  for (let mask=0; mask<8; mask++) {
    const specimen = page.locator(`[data-content-case="${mask}"]`)
    assert.equal(await specimen.locator('svg').count(), Number(!!(mask&4))+Number(!!(mask&1)))
    assert.equal(await specimen.locator('.ox-tab__badge').count(), Number(!!(mask&2)))
  }
  for (const badge of await page.locator('.ox-tab__badge').all()) {
    const measurement = await badge.evaluate(el => { const css=getComputedStyle(el); return { size:el.dataset.sourceSize, shape:el.dataset.sourceShape, height:el.getBoundingClientRect().height, padding:css.padding, fill:css.backgroundColor, edge:css.boxShadow, font:[css.fontSize,css.lineHeight,css.fontWeight], children:el.querySelectorAll('button,a,[tabindex]').length } })
    assert.deepEqual(measurement, { size:'Medium',shape:'Round',height:20,padding:'2px 10px',fill:'rgb(242, 243, 245)',edge:'rgb(209, 213, 220) 0px 0px 0px 1px inset',font:['11px','16px','500'],children:0 })
    badgeMeasurements.push(measurement)
  }
  passed.push('Five static parents, twelve stable atom states, eight content configurations and four contextual shared Medium Badges')

  for (const variant of variants) {
    await story('playground-example',`variant:${variant};showLeadIcon:true;showBadge:true;showTailIcon:true`)
    const tabs=page.getByRole('tab')
    assert.equal(await tabs.count(),4)
    assert.equal(await tabs.evaluateAll(els => els.every(el => document.getElementById(el.getAttribute('aria-controls'))?.getAttribute('aria-labelledby')===el.id)),true)
    await page.keyboard.press('Tab'); await page.keyboard.press('ArrowRight')
    assert.equal(await tabs.nth(1).evaluate(el=>document.activeElement===el && el.matches(':focus-visible') && getComputedStyle(el).outlineWidth==='2px'),true)
    assert.equal(await tabs.first().getAttribute('aria-selected'),'true')
    await page.keyboard.press('End'); await page.keyboard.press('Enter')
    await page.getByRole('tabpanel').filter({hasText:'Files: example attachments.'}).waitFor()
    await page.keyboard.press('ArrowRight')
    assert.equal(await tabs.first().evaluate(el=>document.activeElement===el),true)
    assert.equal(await tabs.last().getAttribute('aria-selected'),'true')
    await page.keyboard.press('Home'); await page.keyboard.press('Space')
    await page.getByRole('tabpanel').filter({hasText:'Overview: example summary.'}).waitFor()
    await page.keyboard.press('Tab')
    assert.equal(await page.getByRole('tabpanel').evaluate(el=>document.activeElement===el),true)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await tabs.first().evaluate(el=>document.activeElement===el),true)
    for (const slot of [0,1]) {
      const target=tabs.nth(slot+1), icon=target.locator('.ox-tab__icon svg').nth(slot), box=await icon.boundingBox()
      await page.mouse.click(box.x+box.width/2,box.y+box.height/2)
      await page.waitForFunction(el=>el.getAttribute('aria-selected')==='true',await target.elementHandle())
      assert.equal(await target.getAttribute('aria-selected'),'true')
      assert.equal(await target.evaluate(el=>document.activeElement===el),true)
      assert.equal(await icon.evaluate(el=>el.hasAttribute('tabindex') || el.matches(':focus') || getComputedStyle(el).outlineStyle!=='none' || getComputedStyle(el).boxShadow!=='none'),false)
    }
  }
  await page.keyboard.press('ArrowLeft')
  await page.emulateMedia({forcedColors:'active'})
  assert.equal(await page.locator('[role="tab"]:focus').evaluate(el=>el.matches(':focus-visible') && getComputedStyle(el).outlineStyle==='solid'),true)
  assert.equal(await page.locator('[aria-selected="true"] .ox-tab__label').evaluate(el=>getComputedStyle(el).textDecorationLine),'underline')
  await page.screenshot({path:`${output}/forced-colors.png`,fullPage:true})
  await page.emulateMedia({forcedColors:'none'})
  passed.push('All five live styles: manual activation, wrap/Home/End, focus versus selection, panel traversal, reciprocal IDs, both icon pointer paths and forced colors')

  await story('docs','',true)
  for (const heading of ['Overview','Playground','Parent styles and source mapping','Atom variants and states','Optional content','Anatomy and geometry','Colors, tokens and provenance','Component composition','Usage guidance','Accessibility','QA, limitations and publication status']) await page.locator('.cs05-docs > h2').filter({hasText:heading}).waitFor()
  assert.equal(await page.locator('.docblock-argstable tbody tr').count(),8)
  const controls=page.getByRole('region',{name:'Tabs Controls',exact:true})
  const select=controls.locator('select[id$="-variant"]')
  for (const variant of variants) { await select.selectOption(variant); await page.locator(`#story--cs-05-tabs--playground-example .ox-tabs--${variant}`).waitFor() }
  const playground=page.locator('#story--cs-05-tabs--playground-example')
  await controls.locator('select[id$="-selectedItem"]').selectOption('details')
  await playground.getByRole('tabpanel').filter({hasText:'Details: example item properties.'}).waitFor()
  for(const name of ['showLeadIcon','showBadge','showTailIcon']) {const input=controls.locator(`input[name="${name}"]`);await input.focus();await input.press('Space')}
  await playground.locator('.ox-tab__badge').first().waitFor()
  await controls.locator('select[id$="-leadIcon"]').selectOption('Star')
  await controls.locator('select[id$="-tailIcon"]').selectOption('FileText')
  await playground.locator('.lucide-star').first().waitFor();await playground.locator('.lucide-file-text').first().waitFor()
  await controls.locator('textarea[name="label"]').fill('Workspace')
  await playground.getByRole('tab',{name:'Workspace 2',exact:true}).waitFor()
  await controls.getByRole('button',{name:'Reset controls',exact:true}).click()
  await playground.getByRole('tab',{name:'Overview',exact:true}).waitFor()
  assert.equal(await playground.locator('.ox-tab__badge,.ox-tab svg').count(),0)
  assert.equal(await playground.getByRole('tab',{selected:true}).textContent(),'Overview')
  const ids=await page.locator('[id]').evaluateAll(els=>els.map(el=>el.id))
  assert.equal(ids.length,new Set(ids).size,'Cross-instance Docs IDs')
  assert.equal(await page.getByRole('link',{name:'Example panel link',exact:true}).count(),0)
  assert.doesNotMatch(await page.locator('.cs05-docs').innerText(),/figma\.com|drive\.google|\b\d{2,}:\d{2,}\b|C:\\Users\\/)
  passed.push('All Docs sections, eight native Controls, five variants, selection/icon/label changes and reset, unique cross-instance IDs, no private references')

  for(const width of [1280,768,390,320]) {
    await page.setViewportSize({width,height:1000})
    await story('docs','',true);await noOverflow()
    for(const region of await page.locator('.cs05-scroll,.zw-docs-controls').all()) {
      assert.ok(await region.getAttribute('aria-label'));assert.equal(await region.getAttribute('tabindex'),'0')
      if(await region.evaluate(el=>el.scrollWidth>el.clientWidth)) {
        await region.focus();await region.press('ArrowRight')
        await page.waitForFunction(el=>el.scrollLeft>0,await region.elementHandle())
      }
    }
    await page.screenshot({path:`${output}/docs-${width}.png`,fullPage:true})
    for(const name of ['playground-example','parent-styles','source-atom-states','content-configurations','usage-examples']) {await story(name);await noOverflow()}
    await story('usage-examples')
    for(let scenario=0;scenario<6;scenario++) {
      await page.getByLabel('Example configuration').selectOption(String(scenario))
      const tabs=page.getByRole('tab');await tabs.first().focus();await page.keyboard.press('End')
      assert.equal(await tabs.first().getAttribute('aria-selected'),'true')
      await page.keyboard.press('Enter');await page.waitForFunction(el=>el.getAttribute('aria-selected')==='true',await tabs.last().elementHandle())
      await tabs.first().click()
      await page.waitForFunction(el=>el.getAttribute('aria-selected')==='true',await tabs.first().elementHandle())
      await noOverflow()
    }
    await page.keyboard.press('End')
    const last=page.getByRole('tab').last()
    assert.equal(await last.evaluate(el=>{const r=el.getBoundingClientRect(),s=el.closest('.ox-tabs__scroller').getBoundingClientRect();return r.left>=s.left+4&&r.right<=s.right-4}),true)
    await page.screenshot({path:`${output}/usage-${width}.png`,fullPage:true})
  }
  passed.push('320/390/768/1280px Docs/stories, named keyboard-scrollable tables, six usage configurations and local overflow focus clearance')
  await page.setViewportSize({width:1280,height:1000})
  for(const id of ['cs-01-icon-button','cs-02-tooltip','cs-03-badge','cs-04-button']) {
    await page.goto(`${base}/iframe.html?id=${id}--docs&viewMode=docs`)
    await page.locator('.zw-docs').waitFor()
    await page.locator('svg[class*="anatomy"],svg[role="img"]').first().waitFor()
  }
  await page.goto(`${base}/iframe.html?id=cs-01-icon-button--playground-example&viewMode=story`)
  await page.getByRole('button',{name:'Filter',exact:true}).click()
  assert.equal(await page.getByRole('status').textContent(),'Activations: 1')
  await page.goto(`${base}/iframe.html?id=cs-02-tooltip--label-only&viewMode=story`)
  await page.getByRole('button',{name:'Filter',exact:true}).focus();await page.getByRole('tooltip').waitFor()
  await page.keyboard.press('Escape');await page.getByRole('tooltip').waitFor({state:'hidden'})
  await page.goto(`${base}/iframe.html?id=cs-03-badge--playground-example&viewMode=story`)
  await page.locator('.cs03-badge').waitFor();assert.equal(await page.locator('.cs03-badge').textContent(),'Tag Label')
  await page.goto(`${base}/iframe.html?id=cs-04-button--native-behavior&viewMode=story`)
  const action=page.getByRole('button',{name:'Try Primary',exact:true})
  await action.click();await action.press('Enter');await action.press('Space')
  assert.equal(await page.getByRole('status').first().textContent(),'Activations: 3')
  const appBase=process.argv[3]??new URL('../zoblocks-prototypes/',`${base}/`).href
  await page.goto(`${appBase.replace(/\/$/,'')}/#/data-grid`)
  await page.getByRole('table',{name:'Synthetic caseload',exact:true}).waitFor()
  assert.equal(await page.locator('.dg-views .dg-view-selected').textContent(),'View 1')
  await page.getByRole('button',{name:'View 2',exact:true}).focus()
  await page.getByRole('region',{name:'View 2 saved configuration preview',exact:true}).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'View settings',exact:true}).click();await page.locator('.dg-view-settings').waitFor();await page.keyboard.press('Escape')
  await page.getByRole('button',{name:'Filter',exact:true}).click();await page.locator('.dg-picker').waitFor();await page.keyboard.press('Escape')
  passed.push('CS-01/02/03/04 Docs and behavior smoke; Data Grid table, saved-view preview, View Settings and Filter entry')
  assert.deepEqual(errors,[])
  await writeFile(`${output}/results.json`,JSON.stringify({status:'PASS',passed,badgeMeasurements,errors},null,2))
  console.log(passed.map(message=>`PASS: ${message}`).join('\n'))
} catch(error) {
  await writeFile(`${output}/failure.json`,JSON.stringify({passed,errors,failure:error.stack},null,2))
  await page.screenshot({path:`${output}/failure.png`,fullPage:true}).catch(()=>{})
  throw error
} finally {await browser.close()}
