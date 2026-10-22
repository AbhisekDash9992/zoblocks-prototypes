import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const data = JSON.parse(await readFile('src/oxygen-reference-tokens/catalog.json', 'utf8'))
const css = await readFile('src/oxygen-reference-tokens/tokens.css', 'utf8')
const name = value => `--ox-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
const blocks = [...clean.matchAll(/([^{}]+)\{([^{}]+)\}/g)].map(([, selector, body]) => ({
  selector: selector.trim(), entries: [...body.matchAll(/(--ox-[\w-]+)\s*:\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]),
}))
assert.equal(blocks.length, 3)
for (const block of blocks) {
  assert.match(block.selector, /^:where\(\[data-oxygen-mode="(?:light|dark)"\]/)
  assert.equal(block.entries.length, new Set(block.entries.map(([key]) => key)).size, 'Duplicate declaration')
}
// Runtime CSS may declare custom properties only, never rendered styles or global selectors.
assert.equal(clean.replace(/[^{}]+\{/g, '').replace(/--ox-[\w-]+\s*:\s*[^;]+;/g, '').replace(/[}\s]/g, ''), '')
const common = Object.fromEntries(blocks[0].entries)
const modes = Object.fromEntries(['light', 'dark'].map((mode, i) => [mode, Object.fromEntries(blocks[i + 1].entries)]))
const primitiveEntries = Object.entries(data.primitives).flatMap(([family, values]) => Object.entries(values).map(([level, hex]) => [`${family}/${level}`, hex]))
assert.equal(primitiveEntries.length, 121)
assert.equal(primitiveEntries.length + Object.keys(data.specialPrimitives).length, 124)
assert.equal(Object.keys(common).filter(key => key.startsWith('--ox-color-')).length, 124)
for (const [key, hex] of primitiveEntries) assert.equal(common[name(`color/${key}`)], hex, key)
assert.deepEqual(data.specialPrimitives, { white: { value: '#FFFFFF' }, black: { alias: 'gray/950' }, transparent: { value: '#000000', alpha: 0 } })
assert.equal(common['--ox-color-white'], data.specialPrimitives.white.value)
assert.equal(common['--ox-color-black'], `var(${name(`color/${data.specialPrimitives.black.alias}`)})`)
assert.equal(common['--ox-color-transparent'], 'rgb(0 0 0 / 0%)')
const superseded = [
  { name: 'border/brand-primary', mode: 'light', previous: 'blue/500', current: 'blue/600' },
  { name: 'icon/danger-primary', mode: 'dark', previous: 'red/700', current: 'red/500' },
]
assert.deepEqual(data.supersededAliases, superseded)
assert.deepEqual(data.sourceNameNormalizations, { 'bg/success-disbaled': 'bg/success-disabled' })
assert.equal(data.semantics['border/brand-primary'].dark, 'blue/500')
assert.equal(data.semantics['icon/danger-primary'].light, 'red/700')
assert.equal(data.semantics['bg/success-disbaled'], undefined)
let whiteAliases = 0
assert.equal(Object.keys(data.semantics).length, 87)
assert.deepEqual(['bg', 'text', 'icon', 'border'].map(role => Object.keys(data.semantics).filter(key => key.startsWith(`${role}/`)).length), [36, 18, 18, 15])
for (const [mode, entries] of Object.entries(modes)) {
  assert.equal(Object.keys(entries).length, 87)
  for (const [key, aliases] of Object.entries(data.semantics)) {
    const alias = aliases[mode]
    const expected = alias.startsWith('FFFFFF@') ? `rgb(255 255 255 / ${alias.split('@')[1]})` : `var(${name(`color/${alias}`)})`
    assert.equal(entries[name(key)], expected, `${mode} ${key}`)
    if (alias === 'white') whiteAliases++
  }
  assert.equal(entries['--ox-text-on-dark'], 'var(--ox-color-white)')
  assert.equal(entries['--ox-icon-on-dark'], 'var(--ox-color-white)')
  assert.equal(entries['--ox-text-on-dark-disabled'], 'rgb(255 255 255 / 50%)')
  assert.equal(entries['--ox-icon-on-dark-disabled'], 'rgb(255 255 255 / 80%)')
  assert.equal(entries['--ox-bg-success-disbaled'], undefined)
}
assert.equal(whiteAliases, 9)
for (const block of blocks) for (const [, value] of block.entries) for (const [, ref] of value.matchAll(/var\((--ox-[\w-]+)\)/g)) {
  assert.ok(common[ref], `Unknown alias ${ref}`)
}
assert.equal(Object.keys(data.typography).length, 23)
for (const [key, value] of Object.entries(data.typography)) assert.equal(common[name(key)], key.startsWith('font/family/') ? `"${value}"` : String(value))
for (const [group, count] of [['space', 14], ['radius', 7]]) {
  assert.equal(Object.keys(data[group]).length, count)
  for (const [key, value] of Object.entries(data[group])) assert.equal(common[name(key)], `${value}px`)
}
assert.equal(Object.keys(data.textStyles).length, 12)
for (const [key, style] of Object.entries(data.textStyles)) {
  const size = Object.entries(data.typography).find(([token, value]) => token.startsWith('font/size/') && value === style.size)[0]
  const height = style.lineHeight === 22 ? '22px' : `calc(var(--ox-line-height-${style.lineHeight}) * 1px)`
  assert.equal(common[name(`type/${key}`)], `var(--ox-css-weight-${style.weight.split('/').at(-1)}) calc(var(${name(size)}) * 1px)/${height} var(--ox-font-family-dm-sans), system-ui, sans-serif`)
}
assert.equal(Object.keys(data.shadows).length, 7)
assert.equal(Object.values(data.shadows).flatMap(shadow => shadow.layers).length, 10)
for (const [key, shadow] of Object.entries(data.shadows)) {
  shadow.layers.forEach((layer, index) => assert.equal(common[`${name(key)}-layer-${index + 1}`], `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px rgb(24 24 27 / ${layer.opacity}%)`))
  assert.equal(common[`${name(key)}${shadow.uninspectedHiddenLayer ? '-visible' : ''}`], shadow.layers.map((_, i) => `var(${name(key)}-layer-${i + 1})`).join(', '))
}
assert.equal(data.gradients.length, 5)
assert.equal(data.gradients.filter(gradient => gradient.name === 'Gradient').length, 2)
assert.ok(data.gradients.every(gradient => gradient.angle === null))
for (const missing of ['--ox-unresolved-white', '--ox-line-height-22', '--ox-type-label', '--ox-shadow-xl', '--ox-shadow-xl-layer-2']) assert.equal(common[missing], undefined, missing)
assert.doesNotMatch(clean, /--ox-unresolved-white/)
assert.doesNotMatch(clean, /gradient\(/i)
assert.doesNotMatch(JSON.stringify(data), /VariableID:|com\.figma\.|targetVariableId|drive\.google\.com|figma\.com/)

// Read private native sources only in this Node check, never in runtime or Storybook imports.
const nativeRoot = process.argv[3] ?? '.local-context/TF01_JSON_RECONCILIATION/sources'
let nativePresent = false
try { await readdir(nativeRoot); nativePresent = true }
catch (error) { if (process.argv[3] || error.code !== 'ENOENT') throw error }
if (nativePresent) {
  const readNative = async file => JSON.parse((await readFile(`${nativeRoot}/${file}`, 'utf8')).replace(/^\uFEFF/, ''))
  const [primitiveSource, lightSource, darkSource, typographySource, spacingSource] = await Promise.all([
    'Tailwind_primitive_Light.tokens.json', 'Tailwind_Semantic_Light.tokens.json', 'Tailwind_Semantic_Dark.tokens.json', 'Typography.tokens.json', 'Spacing.tokens.json',
  ].map(readNative))
  function flatten(node, path = '') {
    if (Object.hasOwn(node, '$value')) return [[path, node]]
    return Object.entries(node).filter(([key]) => !key.startsWith('$')).flatMap(([key, child]) => flatten(child, path ? `${path}/${key}` : key))
  }
  const nativePrimitives = Object.fromEntries(flatten(primitiveSource))
  assert.equal(Object.keys(nativePrimitives).length, 102)
  assert.equal(nativePrimitives['brand-1/50'], undefined)
  assert.equal(nativePrimitives['brand-2/50'], undefined)
  const colorValue = (node, hex, alpha = 1) => {
    assert.equal(node.$type, 'color')
    assert.equal(node.$value.colorSpace, 'srgb')
    assert.equal(node.$value.hex.toUpperCase(), hex)
    assert.ok(Math.abs(node.$value.alpha - alpha) < 1e-6, 'Native alpha mismatch')
  }
  let overlappingScales = 0
  for (const [key, node] of Object.entries(nativePrimitives)) {
    if (!key.includes('/')) continue
    const [family, level] = key.split('/')
    colorValue(node, data.primitives[family][level]); overlappingScales++
  }
  assert.equal(overlappingScales, 99)
  colorValue(nativePrimitives.white, data.specialPrimitives.white.value)
  colorValue(nativePrimitives.transparent, data.specialPrimitives.transparent.value, data.specialPrimitives.transparent.alpha)
  assert.equal(nativePrimitives.black.$type, 'color')
  assert.equal(nativePrimitives.black.$value, `{${data.specialPrimitives.black.alias.replace('/', '.')}}`)
  assert.deepEqual(nativePrimitives.transparent.$value.components, [0, 0, 0])
  let normalizations = 0
  for (const [mode, source] of [['light', lightSource], ['dark', darkSource]]) {
    const entries = flatten(source)
    assert.equal(entries.length, 87)
    for (const [sourceName, node] of entries) {
      const publicName = data.sourceNameNormalizations[sourceName] ?? sourceName
      if (sourceName !== publicName) normalizations++
      const alias = data.semantics[publicName][mode]
      const nativeAlias = node.$extensions?.['com.figma.aliasData']?.targetVariableName
      if (alias.startsWith('FFFFFF@')) {
        assert.equal(nativeAlias, undefined, 'Alpha color is a direct native value, not an alias')
        colorValue(node, data.specialPrimitives.white.value, Number.parseInt(alias.split('@')[1], 10) / 100)
      } else {
        assert.equal(nativeAlias, alias, `${mode} ${publicName} native alias`)
        const [family, level] = alias.split('/')
        colorValue(node, alias === 'white' ? data.specialPrimitives.white.value : data.primitives[family][level])
      }
    }
  }
  assert.equal(normalizations, 2, 'Source spelling normalized in both modes')
  const nativeTypography = flatten(typographySource)
  assert.equal(nativeTypography.length, 23)
  for (const [key, node] of nativeTypography) assert.equal(data.typography[key], node.$value, key)
  const nativeSpacing = flatten(spacingSource)
  assert.equal(nativeSpacing.length, 21)
  for (const [key, node] of nativeSpacing) assert.equal(data[key.split('/')[0]][key], node.$value, key)
  console.log('PASS: all five native exports; 99 overlapping scale colors + 3 specials, 87 aliases/values in each mode, 23 typography and 21 spacing/radius values; source typo normalized in both modes')
} else console.log('SKIP: private native sources unavailable; catalog/CSS and older-register checks still run')

// Compare derived data to the private register when available; never bundle that register.
let source
try { source = await readFile(process.argv[2] ?? '.local-context/TF01_OXYGEN_TOKENS_SOURCE.md', 'utf8') }
catch (error) { if (process.argv[2] || error.code !== 'ENOENT') throw error }
if (source) {
  const sourceRows = source.split('\n').filter(line => line.startsWith('|')).map(line => line.trim().slice(1, -1).split('|').map(cell => cell.trim()))
  const unquote = value => value.replace(/^`([^`]+)`$/, '$1')
  let primitives = 0, semantics = 0, typography = 0, dimensions = 0, styles = 0, layers = 0, gradients = 0, corrections = 0
  const levels = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
  for (const row of sourceRows) {
    const key = unquote(row[0])
    if (row.length === 12 && data.primitives[key]) {
      levels.forEach((level, i) => assert.equal(data.primitives[key][level], row[i + 1])); primitives += 11
    } else if (row.length === 3 && /^(bg|text|icon|border)\//.test(key)) {
      const oldAliases = { light: row[1].match(/`([^`]+)`/)[1], dark: row[2].match(/`([^`]+)`/)[1] }
      for (const mode of ['light', 'dark']) {
        const correction = superseded.find(item => item.name === key && item.mode === mode)
        if (correction) {
          assert.equal(oldAliases[mode], correction.previous)
          assert.equal(data.semantics[key][mode], correction.current)
          corrections++
          console.log(`SUPERSEDED: older register ${mode} ${key}: ${correction.previous} -> ${correction.current} (native export)`)
        } else assert.equal(data.semantics[key][mode], oldAliases[mode], `${mode} ${key}`)
      }
      semantics++
    } else if (row.length === 2 && Object.hasOwn(data.typography, key)) {
      assert.equal(String(data.typography[key]), unquote(row[1])); typography++
    } else if (row.length === 2 && /^(space|radius)\//.test(key)) {
      assert.equal(data[key.split('/')[0]][key], Number.parseInt(row[1], 10)); dimensions++
    } else if (row.length === 6 && row[1] === 'DM Sans') {
      const [size, height] = row[3].split('/').map(Number)
      assert.equal(data.textStyles[key].size, size); assert.equal(data.textStyles[key].lineHeight, height)
      assert.equal(data.textStyles[key].weight, unquote(row[2])); assert.equal(data.textStyles[key].tracking, Number.parseInt(row[4], 10)); styles++
    } else if (row.length === 9 && key.startsWith('shadow/')) {
      if (row[1] === 'Additional layer') { assert.equal(data.shadows[key].uninspectedHiddenLayer, true); continue }
      const layer = data.shadows[key].layers[Number(row[1]) - 1]
      assert.deepEqual(layer, { x: +row[2], y: +row[3], blur: +row[4], spread: +row[5], color: '#18181B', opacity: Number.parseInt(row[6], 10), behindTransparency: row[7].endsWith('Yes') }); layers++
    } else if (row.length === 4 && /^`#[\da-f]{6}`$/i.test(row[1])) {
      const gradient = data.gradients[gradients]
      assert.equal(gradient.name, row[0].match(/`([^`]+)`/)[1]); assert.deepEqual(gradient.stops, row.slice(1, 3).map(unquote)); gradients++
    }
  }
  assert.deepEqual([primitives, semantics, typography, dimensions, styles, layers, gradients], [121, 87, 23, 21, 12, 10, 5])
  assert.equal(corrections, 2)
  console.log('PASS: older source register comparison across all supported categories, with exactly two explicit native alias corrections')
} else console.log('SKIP: private source register unavailable; catalog/CSS checks still run')

async function sourceFiles(root) {
  const files = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = `${root}/${entry.name}`
    if (path === 'src/oxygen-reference-tokens') continue
    if (entry.isDirectory()) files.push(...await sourceFiles(path))
    else if (/\.(?:tsx?|css)$/.test(path)) files.push(path)
  }
  return files
}
for (const file of await sourceFiles('src')) assert.doesNotMatch(await readFile(file, 'utf8'), /oxygen-reference-tokens|--ox-|data-oxygen-mode/, `Unexpected existing consumer: ${file}`)
const previewCss = (await readFile('stories/foundations/oxygen-tokens.css', 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
for (const [, selector] of previewCss.matchAll(/(?:^|[{}])\s*([^{}]+)\{/g)) {
  if (selector.trim().startsWith('@media')) continue
  assert.ok(selector.split(/,(?![^()]*\))/).every(part => part.trim().startsWith('.tf01-catalog')), selector)
}
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'src/prototypes', 'src/prototype-system', 'stories/cs-01', 'stories/cs-02', 'stories/cs-03', 'stories/docs-reference.css'], { stdio: 'pipe' })
console.log('PASS: coverage, CSS alias graph, modes, raw values, compositions, shadow layers, unknown guards, opt-in scope and unchanged protected files')
