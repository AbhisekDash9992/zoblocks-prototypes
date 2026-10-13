import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cp, mkdir, readdir, readFile, stat, lstat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const projectPrefix = '/zoblocks-prototypes/'
export const docsPath = '?path=/docs/cs-01-icon-button--docs'

export async function filesIn(root, relative = '') {
  const result = []
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const name = path.posix.join(relative, entry.name)
    assert.ok(!entry.isSymbolicLink(), `Symbolic link is not public output: ${name}`)
    if (entry.isDirectory()) result.push(...await filesIn(root, name))
    else { assert.ok(entry.isFile(), `Unsupported output: ${name}`); result.push(name) }
  }
  return result.sort()
}

async function required(root, names, directories = []) {
  for (const name of names) assert.ok((await stat(path.join(root, name))).isFile(), `Missing file: ${name}`)
  for (const name of directories) {
    assert.ok((await stat(path.join(root, name))).isDirectory(), `Missing directory: ${name}`)
    assert.ok((await filesIn(path.join(root, name))).length > 0, `Empty directory: ${name}`)
  }
}

export async function auditPublicOutput(root) {
  const inventory = await filesIn(root)
  for (const name of inventory) {
    assert.ok(!/(^|\/)(?:\.git|\.local-context|node_modules|\.env[^/]*)(\/|$)/i.test(name), `Private output path: ${name}`)
    assert.ok(!/\.(?:zip|7z|tar|gz|map|md|mdx|tsx?|docx?|xlsx?|pdf|png|jpe?g)$/i.test(name), `Source/evidence or unapproved image in output: ${name}`)
    if (!/\.(?:html|js|css|json|svg|txt)$/i.test(name)) continue
    const text = await readFile(path.join(root, name), 'utf8')
    const rules = [
      ['credential signature', /AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-proj-[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
      ['local/private path', /[A-Za-z]:[\\/]+(?:Users|Windows|workspace)[\\/]|file:\/\/\/|\.local-context/i],
      ['private design/document link', /https?:\/\/(?:drive\.google\.com|docs\.google\.com|(?:www\.)?figma\.com)\//i],
    ]
    for (const [reason, pattern] of rules) assert.ok(!pattern.test(text), `${reason} in ${name}`)
  }
  return inventory
}

export async function validateArtifact(root) {
  await required(root, ['index.html', 'storybook/index.html', 'storybook/iframe.html', 'storybook/index.json'],
    ['assets', 'storybook/assets', 'storybook/sb-manager', 'storybook/sb-addons', 'storybook/sb-common-assets'])
  const index = JSON.parse(await readFile(path.join(root, 'storybook/index.json'), 'utf8'))
  assert.equal(index.entries['cs-01-icon-button--docs']?.type, 'docs', 'CS-01 Docs entry missing')
  return auditPublicOutput(root)
}

export async function assemble(app = 'dist', storybook = 'storybook-static', output = 'pages-artifact') {
  const [appRoot, storyRoot, outRoot] = [app, storybook, output].map(value => path.resolve(value))
  const overlaps = (a, b) => { const relative = path.relative(a, b); return !relative || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)) }
  for (const input of [appRoot, storyRoot]) assert.ok(!overlaps(input, outRoot) && !overlaps(outRoot, input), 'Output must be separate from build inputs')
  assert.ok(!overlaps(appRoot, storyRoot) && !overlaps(storyRoot, appRoot), 'Build inputs must be separate')
  await required(appRoot, ['index.html'], ['assets'])
  await required(storyRoot, ['index.html', 'iframe.html', 'index.json'], ['assets', 'sb-manager', 'sb-addons', 'sb-common-assets'])
  const appFiles = await auditPublicOutput(appRoot)
  await auditPublicOutput(storyRoot)
  assert.ok(!(await readdir(appRoot)).some(name => name.toLowerCase() === 'storybook'), 'App output collides with storybook/')
  // Never delete or replace an existing directory. A fresh checkout or a new output path is required.
  try { await lstat(outRoot); throw new Error(`Output already exists; use a fresh directory: ${outRoot}`) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  await mkdir(path.dirname(outRoot), { recursive: true })
  await cp(appRoot, outRoot, { recursive: true, force: false, errorOnExist: true })
  await cp(storyRoot, path.join(outRoot, 'storybook'), { recursive: true, force: false, errorOnExist: true })
  for (const name of appFiles) {
    const digest = async root => createHash('sha256').update(await readFile(path.join(root, name))).digest('hex')
    assert.equal(await digest(outRoot), await digest(appRoot), `Application bytes changed: ${name}`)
  }
  const inventory = await validateArtifact(outRoot)
  console.log(JSON.stringify({ output: outRoot, files: inventory.length, appFilesPreserved: appFiles.length, storybookBase: './' }, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2)
  assert.ok(args.length === 0 || args.length === 3, 'Usage: node scripts/assemble-pages.mjs [app-dir storybook-dir output-dir]')
  await assemble(...args)
}
