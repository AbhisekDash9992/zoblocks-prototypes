import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { docsPath, projectPrefix, validateArtifact } from './assemble-pages.mjs'

const args = process.argv.slice(2)
assert.ok(args.filter(arg => arg !== '--static-only').length <= 1, 'Usage: node scripts/pages-artifact.browser.mjs [artifact-dir] [--static-only]')
const root = path.resolve(args.find(arg => arg !== '--static-only') ?? 'pages-artifact')
const inventory = await validateArtifact(root)
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' }
const serverErrors = []
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if ([projectPrefix.slice(0, -1), `${projectPrefix}storybook`].includes(pathname)) {
      response.writeHead(301, { Location: `${pathname}/${new URL(request.url, 'http://localhost').search}` }); response.end(); return
    }
    if (!pathname.startsWith(projectPrefix)) throw new Error('outside project')
    const relative = pathname.slice(projectPrefix.length)
    const target = path.resolve(root, relative || 'index.html')
    const contained = path.relative(root, target)
    if (contained.startsWith('..') || path.isAbsolute(contained)) throw new Error('outside artifact')
    const filename = (await stat(target)).isDirectory() ? path.join(target, 'index.html') : target
    response.writeHead(200, { 'Content-Type': mime[path.extname(filename)] ?? 'application/octet-stream' })
    response.end(await readFile(filename))
  } catch {
    if (request.url !== '/favicon.ico') serverErrors.push(request.url)
    response.writeHead(404); response.end('Not found')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const base = `${origin}${projectPrefix}`
const storybook = `${base}storybook/`
const passed = [], failures = [], requests = []
let browser
try {
  for (const name of inventory) assert.equal((await fetch(`${base}${name}`)).status, 200, `Unservable file: ${name}`)
  // Follow declarative entry/CSS references as well as checking the file inventory.
  for (const name of inventory.filter(name => /\.(?:html|css)$/.test(name))) {
    const text = await readFile(path.join(root, name), 'utf8')
    const pattern = name.endsWith('.html') ? /<(?:script|link|img|source)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g : /url\(\s*["']?([^\s"')]+)["']?\s*\)/g
    for (const match of text.matchAll(pattern)) {
      const reference = match[1]
      if (reference.startsWith('data:') || reference.startsWith('#')) continue
      const url = new URL(reference, `${base}${name}`)
      assert.equal(url.origin, origin, `Remote entry/CSS reference in ${name}`)
      const expected = name.startsWith('storybook/') ? `${projectPrefix}storybook/` : projectPrefix
      assert.ok(url.pathname.startsWith(expected), `Asset reference escaped base in ${name}`)
      assert.equal((await fetch(url)).status, 200, `Unresolved reference in ${name}: ${reference}`)
    }
  }
  const redirect = await fetch(`${base}storybook${docsPath}`, { redirect: 'manual' })
  assert.equal(redirect.status, 301)
  assert.equal(redirect.headers.get('location'), `${projectPrefix}storybook/${docsPath}`)
  const appHTML = await (await fetch(base)).text()
  assert.ok(appHTML.includes(`${projectPrefix}assets/`), 'Application base changed')
  assert.equal((await fetch(`${storybook}iframe.html?id=cs-01-icon-button--playground-example&viewMode=story`)).status, 200)
  // Explicitly record the optional host-root favicon fallback; other 404s fail.
  const faviconStatus = (await fetch(`${origin}/favicon.ico`)).status
  passed.push('Artifact contract, content scan, every output URL, application asset base, iframe and trailing-slash redirect')
  if (!args.includes('--static-only')) {
    assert.ok(process.env.PLAYWRIGHT_MODULE && process.env.BROWSER_PATH, 'Set PLAYWRIGHT_MODULE and BROWSER_PATH to existing local tooling')
    const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
    browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH, headless: true })
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    page.setDefaultTimeout(15000)
    context.on('request', request => {
      const url = request.url()
      if (!url.startsWith(origin)) { if (!url.startsWith('data:')) failures.push(`Unexpected remote request: ${url}`); return }
      requests.push({ url: url.slice(origin.length), type: request.resourceType() })
      if (request.frame()?.url().includes(`${projectPrefix}storybook/`) && !url.startsWith(storybook) && !url.endsWith('/favicon.ico')) failures.push(`Storybook path escaped: ${url}`)
    })
    context.on('requestfailed', request => failures.push(`${request.failure()?.errorText}: ${request.url()}`))
    context.on('response', response => { if (response.status() >= 400 && response.url() !== `${origin}/favicon.ico`) failures.push(`HTTP ${response.status()}: ${response.url()}`) })
    page.on('pageerror', error => failures.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && message.location().url !== `${origin}/favicon.ico`) failures.push(`Console: ${message.text()}`) })
    await page.goto(base)
    await page.getByRole('link', { name: /Data Grid/ }).click()
    const toolbar = page.getByRole('toolbar', { name: 'Data grid toolbar' })
    await toolbar.waitFor(); assert.ok(page.url().endsWith('#/data-grid'))
    await page.reload(); await toolbar.waitFor()
    // Existing Group/View Settings surfaces, in addition to the focused CS-01 regression suite below.
    await toolbar.getByRole('button', { name: 'View settings', exact: true }).click()
    await page.getByRole('dialog', { name: 'View settings', exact: true }).getByRole('button', { name: 'Group', exact: true }).click()
    await page.locator('.dg-editor-group').waitFor()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await toolbar.getByRole('button', { name: 'View settings', exact: true }).click()
    await page.getByRole('dialog', { name: 'View settings', exact: true }).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog', { name: 'View settings', exact: true }).waitFor({ state: 'hidden' })
    assert.equal(await page.locator('[data-cs01-type], .cs01-reference').count(), 0)
    passed.push('App root, Data Grid hash/reload, Group and View Settings open/close, no reference styling in app')

    await page.goto(storybook.slice(0, -1))
    await page.locator('#storybook-preview-iframe').waitFor()
    assert.ok(page.url().startsWith(storybook), 'Browser did not follow the Storybook directory redirect')
    await page.goto(`${storybook}${docsPath}`)
    const preview = page.frameLocator('#storybook-preview-iframe')
    await preview.locator('.cs01-panel').first().waitFor()
    await page.reload(); await preview.locator('.cs01-panel').first().waitFor()
    await preview.locator('select[id$="-type"]').selectOption('Ghost-primary')
    const playground = preview.locator('.cs01-panel').filter({ hasText: 'Activations:' }).first()
    await playground.locator('[data-cs01-type="ghost-primary"]').waitFor()
    await preview.locator('textarea[name="label"]').fill('Publication QA button')
    await preview.getByRole('button', { name: 'Publication QA button', exact: true }).waitFor()
    const font = await preview.locator('.cs01-panel').first().evaluate(async element => {
      await document.fonts.ready
      return { family: getComputedStyle(element).fontFamily, loaded: document.fonts.check('14px "DM Sans"') }
    })
    assert.ok(font.family.includes('DM Sans') && font.loaded, 'Docs font did not load')
    await page.getByRole('link', { name: 'Playground', exact: true }).click()
    await preview.locator('.cs01-panel [data-cs01-type]').waitFor()
    assert.ok(page.url().includes('/story/cs-01-icon-button--playground-example'), 'Manager did not navigate to Playground')
    await page.getByRole('link', { name: 'Docs', exact: true }).click()
    await preview.locator('.cs01-panel').first().waitFor()
    await page.goto(`${storybook}iframe.html?id=cs-01-icon-button--playground-example&viewMode=story`)
    await page.getByRole('button', { name: 'Filter', exact: true }).waitFor()
    await page.reload(); await page.getByRole('button', { name: 'Filter', exact: true }).waitFor()
    passed.push('Bare manager/directory redirect, Docs deep link/reload/navigation, inline stories, working type/label Controls, DM Sans and direct iframe/reload')
    await context.close(); await browser.close(); browser = undefined
    // Preserve and reuse the existing acceptance tests; no duplicate component/state model.
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.resolve('scripts/cs-01.browser.mjs'), storybook.slice(0, -1), `${base}#/data-grid`], { stdio: 'inherit', env: process.env })
      child.on('error', reject)
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Existing CS-01 regression suite failed: ${code}`)))
    })
    passed.push('Existing CS-01 geometry, keyboard, context and Data Grid Filter/Sort/header/Clear/Undo/snackbar regression suite')
    for (const type of ['script', 'stylesheet', 'font']) assert.ok(requests.some(request => request.type === type && request.url.startsWith(`${projectPrefix}storybook/`)), `No observed Storybook ${type} requests`)
  }
  assert.deepEqual(failures, [], 'Critical browser/network failures')
  assert.deepEqual(serverErrors, [], 'Unexpected server 404s (including regression suite)')
  console.log(JSON.stringify({ mode: args.includes('--static-only') ? 'static-only' : 'browser', browser: process.env.BROWSER_PATH, origin, files: inventory.length, passed, requests, failures, serverErrors, optionalFavicon: { url: '/favicon.ico', status: faviconStatus }, limitations: ['Pattern scan cannot certify absence of PHI or unknown credentials; review source content.', 'Local server redirects do not certify future GitHub Pages behavior.', 'Full browser QA uses external tooling; CI runs static checks without new dependencies.'] }, null, 2))
} catch (error) {
  console.error(JSON.stringify({ failures, serverErrors, requests }, null, 2))
  throw error
} finally {
  if (browser) await browser.close()
  await new Promise(resolve => server.close(resolve))
}
