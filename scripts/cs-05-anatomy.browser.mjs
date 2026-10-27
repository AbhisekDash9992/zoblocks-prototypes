// Local geometry/annotation QA using existing browser tooling and public specimens.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

assert.ok(process.env.PLAYWRIGHT_MODULE && process.env.BROWSER_PATH, 'Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing tooling.')
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const base = (process.argv[2] ?? 'http://127.0.0.1:6015').replace(/\/$/, '')
const output = '.local-context/cs05-geometry-tables'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
page.setDefaultTimeout(12000)
const errors=[],measurements=[],tableMeasurements=[]
page.on('pageerror',error=>errors.push(error.message))
page.on('console',message=>{if(message.type()==='error'&&!message.location().url.endsWith('/favicon.ico'))errors.push(message.text())})
const near=(a,b)=>Math.abs(a-b)<0.02
const features=['surface','leading-icon','label','badge','trailing-icon','padding','spacing','radius-border','indicator']
const scenarios=[
  {width:1280,docs:false},{width:1280,docs:true},
  {width:768,docs:false},{width:768,docs:true},
  {width:390,docs:false},{width:390,docs:true},
  {width:320,docs:false},{width:320,docs:true},
  {width:1280,docs:true,embedded:540},{width:1280,docs:true,embedded:300},
]
function checkLeaders(callouts) {
  const segments=callouts.flatMap((item,group)=>item.points.slice(1).map((point,index)=>({group,a:item.points[index],b:point})))
  for(const first of segments)for(const second of segments) {
    if(first.group>=second.group)continue
    const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    const on=(a,b,p)=>near(cross(a,b,p),0)&&p[0]>=Math.min(a[0],b[0])&&p[0]<=Math.max(a[0],b[0])&&p[1]>=Math.min(a[1],b[1])&&p[1]<=Math.max(a[1],b[1])
    assert.ok(!(cross(first.a,first.b,second.a)*cross(first.a,first.b,second.b)<0&&cross(second.a,second.b,first.a)*cross(second.a,second.b,first.b)<0)&&!on(first.a,first.b,second.a)&&!on(first.a,first.b,second.b)&&!on(second.a,second.b,first.a)&&!on(second.a,second.b,first.b),'Leaders must not cross')
  }
  for(const [index,item]of callouts.entries())for(const segment of segments) {
    if(index===segment.group)continue
    const dx=segment.b[0]-segment.a[0],dy=segment.b[1]-segment.a[1]
    const t=Math.max(0,Math.min(1,((item.marker[0]-segment.a[0])*dx+(item.marker[1]-segment.a[1])*dy)/(dx*dx+dy*dy)))
    assert.ok(Math.hypot(item.marker[0]-segment.a[0]-t*dx,item.marker[1]-segment.a[1]-t*dy)>item.radius,'Leaders clear other markers')
  }
}
async function verifyTouchScroll(region) {
  await region.scrollIntoViewIfNeeded();await region.evaluate(el=>{el.scrollLeft=0})
  const box=await region.boundingBox(),session=await page.context().newCDPSession(page)
  await session.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1})
  const start=box.x+box.width-20,end=box.x+20,y=box.y+box.height/2
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]})
  for(let step=1;step<=8;step++){
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start+(end-start)*step/8,y}]})
    await page.waitForTimeout(20)
  }
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await page.waitForFunction(el=>el.scrollLeft>0,await region.elementHandle())
  await session.send('Emulation.setTouchEmulationEnabled',{enabled:false});await session.detach()
  await region.evaluate(el=>new Promise(resolve=>{
    let previous=el.scrollLeft,idleFrames=0
    const settle=()=>{idleFrames=el.scrollLeft===previous?idleFrames+1:0;previous=el.scrollLeft;if(idleFrames>=8)resolve();else requestAnimationFrame(settle)}
    requestAnimationFrame(settle)
  }))
  await region.evaluate(el=>{el.scrollLeft=0})
}

async function inspectGeometryTables(anatomy,context) {
  const section=anatomy.locator('.cs05-geometry')
  assert.equal(await section.locator('svg,figure,[data-geometry-figure]').count(),0,'Geometry uses tables only')
  assert.equal(await anatomy.locator('svg[role="img"]').count(),1,'Only the accepted annotated Anatomy SVG remains; actual-size decorative icons are preserved')
  assert.equal(await section.locator('table').count(),2)
  assert.match(await section.innerText(),/Active \(selected\), Hover and Inactive/)
  const standalone=section.getByRole('table',{name:'Standalone atom geometry',exact:true})
  assert.deepEqual(await standalone.locator('tbody tr').evaluateAll(rows=>rows.map(row=>[...row.cells].map(cell=>cell.textContent))),[
    ['Undeline','40 × 32px','4 / 8 / 4 / 8px; 8px','Active root indicator; thickness unresolved'],
    ['Pill on gray','48 × 32px','4 / 12 / 4 / 12px; 8px','6px in Active and Hover'],
    ['Pill with brand color','48 × 32px','4 / 12 / 4 / 12px; 8px','6px in Active'],
    ['Pill with brand underline','40 × 38px','Root 4 / 0 / 4 / 0px; root gap 8px','Nested 40 × 30px; 4 / 8 / 4 / 8px; gap 6px; radius 8px; Active edge 1px'],
  ])
  const provenance=section.getByRole('table',{name:'Geometry provenance and context',exact:true})
  const rows=await provenance.locator('tbody tr').evaluateAll(rows=>Object.fromEntries(rows.map(row=>[row.cells[0].textContent,[...row.cells].slice(1).map(cell=>cell.textContent).join(' ')])))
  for(const [row,pattern]of [
    ['Parent row',/30px height \/ 16px gap; brand border 38px height \/ 6px gap/],
    ['Label',/DM Sans Medium 500; 14px \/ 22px; tracking 0/],
    ['Decorative icon slots',/14 × 14px/],
    ['Badge identity',/Round \/ Outlined \/ Medium \/ Default/],
    ['Badge in Tabs',/27 × 20px; padding 2px \/ 10px; type 500, 11px \/ 16px.*content|27 × 20px; padding 2px \/ 10px; type 500, 11px \/ 16px.*Hug/],
    ['Badge standalone',/Medium: minimum 24px; padding 4px \/ 10px/],
    ['Borders / fill',/1px #BEDBFF.*1px inside #D1D5DC; fill #F2F3F5.*alignment is local.*alignment is verified/],
    ['Selected indicator',/#155DFC verified; source thickness unresolved.*LOCAL \/ PROVISIONAL: 2px/],
    ['Evidence / bindings',/does not establish component bindings.*remain unverified/],
  ])assert.match(rows[row],pattern,`${context}: ${row}`)
  for(const region of await section.locator('.cs05-scroll').all()){
    assert.equal(await region.getAttribute('role'),'region');assert.ok(await region.getAttribute('aria-label'));assert.equal(await region.getAttribute('tabindex'),'0')
    const table=region.locator('table'),caption=await table.locator('caption').textContent()
    assert.equal(await table.locator('caption').evaluate(el=>el.getBoundingClientRect().width<=el.closest('.cs05-scroll').clientWidth),true,'Caption fits the visible table region')
    assert.ok(await table.locator('thead th[scope="col"]').count()>=3)
    assert.equal(await table.locator('tbody tr').count(),await table.locator('tbody th[scope="row"]').count())
    const overflow=await region.evaluate(el=>el.scrollWidth>el.clientWidth)
    if(overflow){
      await region.focus();await region.press('ArrowRight');await page.waitForFunction(el=>el.scrollLeft>0,await region.elementHandle())
      assert.equal(await region.evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle==='solid'),true)
      // Finish the browser's key-scroll animation before capturing either edge.
      await region.evaluate(el=>new Promise(resolve=>{
        let previous=el.scrollLeft,idleFrames=0
        const settle=()=>{idleFrames=el.scrollLeft===previous?idleFrames+1:0;previous=el.scrollLeft;if(idleFrames>=8)resolve();else requestAnimationFrame(settle)}
        requestAnimationFrame(settle)
      }))
      await region.evaluate(el=>{el.scrollLeft=el.scrollWidth});await region.screenshot({path:`${output}/${context}-${caption.startsWith('Standalone')?'standalone':'provenance'}-right.png`})
      await region.evaluate(el=>{el.scrollLeft=0})
    }
    tableMeasurements.push({context,caption,rows:await table.locator('tbody tr').count(),overflow})
  }
  await section.screenshot({path:`${output}/${context}-tables.png`})
}
try {
  for(const {width,docs,embedded} of scenarios) {
    await page.setViewportSize({width,height:1000})
    await page.goto(`${base}/iframe.html?id=cs-05-tabs--${docs?'docs':'anatomy-geometry'}&viewMode=${docs?'docs':'story'}`)
    const anatomy=page.locator('.cs05-anatomy');await anatomy.waitFor();await page.evaluate(()=>document.fonts.ready)
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    // Constrain a real Docs ancestor while keeping the viewport wide. Container
    // layout must respond to available content width, not only media queries.
    if(embedded)await page.locator('.sbdocs-content').evaluate((el,size)=>{el.style.width=`${size}px`;el.style.maxWidth=`${size}px`},embedded)
    const data=await anatomy.evaluate(root=>{
      const svg=root.querySelector('svg'),scale=svg.getBoundingClientRect().width/svg.viewBox.baseVal.width
      const geometry=el=>Object.fromEntries(['x','y','width','height','rx'].map(key=>[key,Number(el.getAttribute(key))]))
      const bounds=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}
      const boxes=Object.fromEntries([...svg.querySelectorAll('[data-anatomy-box]')].map(el=>[el.dataset.anatomyBox,geometry(el)]))
      return {scale,boxes,viewBox:[svg.viewBox.baseVal.width,svg.viewBox.baseVal.height],
        viewport:[innerWidth,innerHeight],card:bounds(root.querySelector('.cs05-card')),svg:bounds(svg),
        layout:bounds(root.querySelector('.cs05-anatomy-layout')),column:bounds(root.querySelector('.cs05-diagram-column')),
        scroll:bounds(root.querySelector('.cs05-diagram-scroll')),legendBounds:bounds(root.querySelector('.cs05-legend')),
        hierarchy:{title:bounds(root.querySelector('.cs05-card > h3')),geometry:bounds(root.querySelector('.cs05-geometry')),actual:bounds(root.querySelector('.cs05-actual')),notes:bounds(root.querySelector('.cs05-reference-notes')),
          children:[...root.querySelector('.cs05-card').children].map(el=>el.tagName),columnChildren:[...root.querySelector('.cs05-diagram-column').children].map(el=>el.className),
          paragraphsInPair:root.querySelectorAll('.cs05-anatomy-layout p').length,notesCount:root.querySelectorAll('.cs05-reference-notes').length,
          descriptionInNotes:root.querySelector('.cs05-reference-notes').contains(document.getElementById(root.querySelector('.cs05-diagram-scroll').getAttribute('aria-describedby')))},
        actualBounds:bounds(root.querySelector('.cs05-actual .ox-tab')),badgeBounds:bounds(root.querySelector('.cs05-actual .ox-tab__badge')),
        actualStyle:(()=>{const el=root.querySelector('.cs05-actual .ox-tab'),css=getComputedStyle(el),content=el.querySelector('.ox-tab__content');return {fontSize:css.fontSize,lineHeight:css.lineHeight,weight:css.fontWeight,transform:css.transform,scale:css.scale,contentWidth:content.getBoundingClientRect().width,icons:[...content.querySelectorAll('.ox-tab__icon')].map(icon=>[icon.getBoundingClientRect().width,icon.getBoundingClientRect().height])}})(),
        insideEdges:['surface','badge'].map(key=>{const el=svg.querySelector(`[data-anatomy-box="${key}"]`),id=el.getAttribute('clip-path').slice(5,-1);return {key,stroke:parseFloat(getComputedStyle(el).strokeWidth),clip:geometry(document.getElementById(id).querySelector('rect'))}}),
        ids:svg.getAttribute('aria-labelledby').split(' ').map(id=>({tag:document.getElementById(id)?.tagName,text:document.getElementById(id)?.textContent})),
        callouts:[...svg.querySelectorAll('.cs05-callout')].map(el=>{
          const marker=el.querySelector('.cs05-number-marker'),anchor=el.querySelector('.cs05-anchor'),text=el.querySelector('.cs05-number'),box=text.getBBox()
          return {feature:el.dataset.feature,number:text.textContent,marker:[+marker.getAttribute('cx'),+marker.getAttribute('cy')],radius:parseFloat(getComputedStyle(marker).r),anchor:[+anchor.getAttribute('cx'),+anchor.getAttribute('cy')],stroke:getComputedStyle(anchor).stroke,dash:getComputedStyle(el.querySelector('polyline')).strokeDasharray,points:[...el.querySelector('polyline').points].map(p=>[p.x,p.y]),numberBox:[box.x,box.y,box.width,box.height],fontPixels:parseFloat(getComputedStyle(text).fontSize)*scale}
        }),
        legend:[...root.querySelectorAll('.cs05-legend li')].map(el=>({feature:el.dataset.feature,bold:el.firstElementChild.tagName==='STRONG'&&+getComputedStyle(el.firstElementChild).fontWeight>=600,weight:getComputedStyle(el).fontWeight,fontSize:parseFloat(getComputedStyle(el).fontSize),bounds:bounds(el)})),
        actual:root.querySelector('.cs05-actual .ox-tab').getBoundingClientRect().height,
        badge:root.querySelector('.cs05-actual .ox-tab__badge').getBoundingClientRect().height}
    })
    const b=data.boxes,a=data.callouts.map(item=>item.anchor)
    assert.deepEqual(data.hierarchy.children,['H3','H4','DIV','SECTION','DIV','ASIDE'],'Title, Anatomy, anatomy pair, Geometry & spacing, actual-size specimen, notes')
    assert.deepEqual(data.hierarchy.columnChildren,['cs05-diagram-scroll'],'Left column contains only the schematic viewport')
    assert.equal(data.hierarchy.paragraphsInPair,0);assert.equal(data.hierarchy.notesCount,1)
    assert.equal(data.hierarchy.descriptionInNotes,true,'Diagram description points to the secondary scroll instructions')
    assert.ok(data.hierarchy.title.bottom<=data.layout.y)
    assert.ok(data.hierarchy.geometry.y>=data.layout.bottom)
    assert.ok(data.hierarchy.actual.y>=data.hierarchy.geometry.bottom)
    assert.ok(data.hierarchy.notes.y>=data.hierarchy.actual.bottom)
    assert.equal(b.root.height,38*5);assert.equal(b.surface.height,30*5);assert.equal(b.surface.y-b.root.y,4*5)
    assert.equal(b.surface.rx,8*5)
    for(const edge of data.insideEdges){assert.equal(edge.stroke/2,5);assert.deepEqual(edge.clip,b[edge.key])}
    assert.deepEqual([b['leading-icon'].width,b['leading-icon'].height,b['trailing-icon'].width,b['trailing-icon'].height],[70,70,70,70])
    assert.equal(b.label.height,22*5)
    assert.deepEqual([b.badge.width,b.badge.height],[27*5,20*5])
    assert.equal(b['leading-icon'].x-b.surface.x,8*5)
    assert.equal(b.label.y-b.surface.y,4*5)
    for(const [left,right]of [['leading-icon','label'],['label','badge'],['badge','trailing-icon']]) assert.equal(b[right].x-b[left].x-b[left].width,6*5)
    assert.equal(b.surface.x+b.surface.width-b['trailing-icon'].x-b['trailing-icon'].width,8*5)
    assert.deepEqual(data.callouts.map(item=>item.feature),features)
    assert.deepEqual(data.legend.map(item=>item.feature),features)
    assert.ok(data.legend.every(item=>item.bold))
    assert.ok(data.legend.every(item=>item.weight==='400'&&item.fontSize>=14))
    for(let index=1;index<data.legend.length;index++)assert.ok(data.legend[index].bounds.y>=data.legend[index-1].bounds.bottom,'One vertical legend in numeric order')
    const sideBySide=width===1280&&!embedded
    if(sideBySide){
      assert.ok(data.column.right<data.legendBounds.x,'Diagram left, legend right')
      assert.ok(near(data.legendBounds.x-data.column.right,24),'24px column gap')
      assert.ok(near(data.column.y+data.column.height/2,data.legendBounds.y+data.legendBounds.height/2),'Vertical alignment')
      assert.ok(data.column.width/data.layout.width>=.44&&data.column.width/data.layout.width<=.48)
    }else assert.ok(data.legendBounds.y>=data.column.bottom,'Narrow container stacks diagram above legend')
    assert.ok(data.svg.width>=420&&data.svg.width<=520,'Compact but legible diagram bounds')
    assert.equal(data.viewport[0],width)
    if(embedded)assert.ok(data.card.width<=embedded,'Embedded Docs ancestor actually constrains available width')
    assert.deepEqual(data.ids.map(item=>item.tag),['title','desc']);assert.ok(data.ids.every(item=>item.text.length>30))
    assert.ok(a[0][0]>b.surface.x&&a[0][0]<b['leading-icon'].x)
    for(const [index,key]of [[1,'leading-icon'],[2,'label'],[3,'badge'],[4,'trailing-icon']])assert.deepEqual(a[index],[b[key].x+b[key].width/2,b[key].y])
    assert.ok(a[5][1]>b.label.y+b.label.height&&a[5][1]<b.surface.y+b.surface.height)
    assert.equal(a[6][0],(b.label.x+b.label.width+b.badge.x)/2)
    assert.ok(near(Math.hypot(a[7][0]-(b.surface.x+b.surface.width-b.surface.rx),a[7][1]-(b.surface.y+b.surface.rx)),b.surface.rx))
    assert.ok(a[8][0]>b.indicator.x&&a[8][0]<b.indicator.x+b.indicator.width&&a[8][1]>b.indicator.y&&a[8][1]<b.indicator.y+b.indicator.height)
    checkLeaders(data.callouts)
    for(const [index,item]of data.callouts.entries()) {
      assert.equal(item.number,String(index+1));assert.equal(item.stroke,'none');assert.equal(item.dash,'none')
      assert.ok(item.points.at(-1).every((value,index)=>near(value,item.anchor[index])))
      assert.ok(item.fontPixels>=14,`Marker ${item.number}: ${item.fontPixels}px at ${width}px ${docs?'Docs':'story'}`)
      assert.ok(item.marker[0]-item.radius>=0&&item.marker[0]+item.radius<=data.viewBox[0]&&item.marker[1]-item.radius>=0&&item.marker[1]+item.radius<=data.viewBox[1])
      const [x,y,w,h]=item.numberBox
      assert.ok(x>=item.marker[0]-item.radius&&x+w<=item.marker[0]+item.radius&&y>=item.marker[1]-item.radius&&y+h<=item.marker[1]+item.radius,'Numbers fit circular markers')
      for(const other of data.callouts)if(other!==item)assert.ok(Math.hypot(item.marker[0]-other.marker[0],item.marker[1]-other.marker[1])>item.radius+other.radius)
    }
    assert.equal(data.actual,38);assert.equal(data.badge,20)
    assert.equal(await anatomy.locator('.cs05-padding-guide').count(),0,'No painted padding/gap overlays')
    assert.equal(await anatomy.locator('svg').first().locator('[data-anatomy-box="label"]').evaluate(el=>getComputedStyle(el).stroke),'none')
    for(const [feature,anchor]of [['padding',a[5]],['spacing',a[6]]])assert.equal(await anatomy.locator(`[data-anatomy-guide="${feature}"]`).evaluate((el,p)=>el.isPointInStroke(new DOMPoint(...p)),anchor),true)
    // Hug width follows font metrics; source does not prescribe a fixed composed
    // width. Verify intrinsic, unstretched geometry instead of fixing a pixel width.
    assert.ok(near(data.actualBounds.width,data.actualStyle.contentWidth));assert.ok(near(data.badgeBounds.width,26.4375))
    assert.deepEqual(data.actualStyle,{fontSize:'14px',lineHeight:'22px',weight:'500',transform:'none',scale:'none',contentWidth:data.actualBounds.width,icons:[[14,14],[14,14]]})
    assert.ok(data.actualBounds.y>data.legendBounds.bottom,'Actual-size specimen below explanation')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
    for(const item of await anatomy.locator('.cs05-legend li').all())assert.equal(await item.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}),true)
    const context=`${docs?'docs':'story'}-${width}${embedded?`-embedded-${embedded}`:''}`
    const region=anatomy.getByRole('region',{name:'Tab anatomy diagram, nine numbered callouts',exact:true})
    assert.equal(await region.getAttribute('tabindex'),'0')
    assert.ok(await region.getAttribute('aria-describedby'))
    const overflow=await region.evaluate(el=>el.scrollWidth>el.clientWidth)
    let touchScrollingVerified=false
    if(overflow){
      await region.focus();await page.keyboard.press('ArrowRight')
      await page.waitForFunction(el=>el.scrollLeft>0,await region.elementHandle())
      assert.equal(await region.evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle==='solid'),true)
      await region.evaluate(el=>{el.scrollLeft=0})
      await region.screenshot({path:`${output}/${context}-diagram-left.png`})
      for(let step=0;step<12;step++)await page.keyboard.press('ArrowRight')
      await page.waitForFunction(el=>el.scrollLeft>=el.scrollWidth-el.clientWidth-1,await region.elementHandle())
      // Every numbered feature must be revealable inside the local viewport.
      for(const marker of await anatomy.locator('.cs05-number-marker').all()){
        await marker.scrollIntoViewIfNeeded()
        assert.equal(await marker.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.closest('.cs05-diagram-scroll').getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1}),true)
      }
      await region.evaluate(el=>{el.scrollLeft=el.scrollWidth})
      await region.screenshot({path:`${output}/${context}-diagram-right.png`})
      await region.evaluate(el=>{el.scrollLeft=0})
      if(width===320&&docs){
        await verifyTouchScroll(region)
        touchScrollingVerified=true
      }
    }
    const componentPixels=[data.boxes.root.width*data.scale,data.boxes.root.height*data.scale]
    await inspectGeometryTables(anatomy,context)
    measurements.push({context,viewport:data.viewport,cardWidth:data.card.width,diagramWidth:data.svg.width,legendWidth:data.legendBounds.width,componentPixels,sideBySide,localDiagramOverflow:overflow,touchScrollingVerified,smallestNumberPixels:Math.min(...data.callouts.map(item=>item.fontPixels)),actualHeight:data.actual,badgeHeight:data.badge,callouts:9})
    await anatomy.locator('.cs05-card').screenshot({path:`${output}/${context}.png`})
    await anatomy.locator('.cs05-anatomy-layout').screenshot({path:`${output}/${context}-anatomy.png`})
    await anatomy.locator('.cs05-actual').screenshot({path:`${output}/${context}-actual.png`})
    await anatomy.evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-16))
    const viewportImage=await page.screenshot({path:`${output}/${context}-viewport.png`})
    assert.equal(viewportImage.readUInt32BE(16),width,'Viewport screenshot width is distinct from cropped card width')
  }
  assert.deepEqual(errors,[])
  await page.emulateMedia({forcedColors:'active'})
  const tableRegion=page.locator('.cs05-geometry .cs05-scroll').first()
  await tableRegion.focus()
  assert.equal(await tableRegion.evaluate(el=>getComputedStyle(el).outlineStyle==='solid'),true)
  await tableRegion.screenshot({path:`${output}/forced-colors-table.png`})
  await page.emulateMedia({forcedColors:'none'})
  assert.deepEqual(errors,[])
  await writeFile(`${output}/results.json`,JSON.stringify({status:'PASS',measurements,tableMeasurements,errors},null,2))
  console.log('PASS: Accepted Anatomy unchanged; two semantic geometry tables preserve source/provisional values; responsive keyboard scrolling and forced colors; unchanged actual-size TabAtom and shared Badge')
}catch(error){
  await writeFile(`${output}/failure.json`,JSON.stringify({measurements,errors,failure:error.stack},null,2))
  await page.screenshot({path:`${output}/failure.png`,fullPage:true}).catch(()=>{})
  throw error
}finally{await browser.close()}
