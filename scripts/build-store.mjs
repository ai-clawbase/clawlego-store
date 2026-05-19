// build-store.mjs — turns the human-edited `registry/` tree into the
// machine-readable store catalog that the ClawLego app consumes.
//
//   node scripts/build-store.mjs dist      → writes dist/store/
//   node scripts/build-store.mjs public    → writes public/store/ (for `pnpm dev`)
//   node scripts/build-store.mjs --check   → validate only, no output
//
// Output layout (served at https://store.clawlego.com):
//   /store/index.json              full catalog index (the app fetches this first)
//   /store/<kind>/<id>/claw.json   per-item manifest
//   /store/<kind>/<id>/bundle.tgz  installable payload (hosted items only)
//   /store/<kind>/<id>/README.md   long-form description (optional)

import {
  readdirSync, readFileSync, writeFileSync, mkdirSync,
  existsSync, statSync, cpSync, rmSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')
const REGISTRY = join(ROOT, 'registry')
// The three aggregation tiers, finest to coarsest: an atomic asset (a single
// prompt / skill) → `mod` (a pack of assets) → `tpl` (a whole agent). Whether
// the source files are hosted here or pulled from an upstream git repo is the
// orthogonal `source` axis — not a kind.
const KINDS = ['tpl', 'mod', 'prompt', 'skill']
// Atomic-asset kinds: the kind names the asset type, so install target and the
// `contents` count are derived from it.
const ATOMIC_KINDS = ['prompt', 'skill']
const CATEGORIES = ['design', 'life', 'engineering', 'service', 'general']
const SITE = 'https://store.clawlego.com'

const arg = process.argv[2] || 'dist'
const checkOnly = arg === '--check'
const OUT = checkOnly ? null : join(ROOT, arg, 'store')

const errors = []
const items = []

function listDirs(p) {
  if (!existsSync(p)) return []
  return readdirSync(p).filter((n) => !n.startsWith('.') && statSync(join(p, n)).isDirectory())
}

function fail(id, msg) {
  errors.push(`${id}: ${msg}`)
}

if (!checkOnly) {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
}

for (const kind of KINDS) {
  for (const id of listDirs(join(REGISTRY, kind))) {
    const ref = `${kind}/${id}`
    const itemDir = join(REGISTRY, kind, id)
    const manifestPath = join(itemDir, 'claw.json')

    if (!existsSync(manifestPath)) { fail(ref, 'missing claw.json'); continue }

    let m
    try { m = JSON.parse(readFileSync(manifestPath, 'utf8')) }
    catch (e) { fail(ref, `claw.json is not valid JSON — ${e.message}`); continue }

    // --- validate the manifest contract ---
    for (const f of ['id', 'kind', 'source', 'name', 'tagline', 'version', 'category']) {
      if (!m[f]) fail(ref, `missing required field "${f}"`)
    }
    if (m.id !== id) fail(ref, `claw.json id "${m.id}" does not match folder name`)
    if (m.kind !== kind) fail(ref, `claw.json kind "${m.kind}" does not match folder "${kind}"`)
    if (m.category && !CATEGORIES.includes(m.category)) {
      fail(ref, `unknown category "${m.category}" (allowed: ${CATEGORIES.join(', ')})`)
    }
    // `source` is orthogonal to `kind`: any tier may be hosted or referenced.
    const hosted = m.source === 'hosted'
    if (!['hosted', 'reference'].includes(m.source)) {
      fail(ref, `source must be "hosted" or "reference"`)
    }

    const filesDir = join(itemDir, 'files')
    if (hosted && !existsSync(filesDir)) fail(ref, 'hosted item is missing a files/ directory')
    if (!hosted) {
      const url = m.install && m.install.url
      if (!url) fail(ref, 'reference item must declare install.url')
    }

    if (checkOnly) continue
    if (errors.length) continue

    // --- emit ---
    const itemOut = join(OUT, kind, id)
    mkdirSync(itemOut, { recursive: true })

    m.detailUrl = `/store/${kind}/${id}/claw.json`

    if (hosted) {
      const tgz = join(itemOut, 'bundle.tgz')
      // COPYFILE_DISABLE keeps macOS from injecting AppleDouble (._*) entries.
      execFileSync('tar', ['-czf', tgz, '-C', filesDir, '.'], {
        env: { ...process.env, COPYFILE_DISABLE: '1' },
      })
      m.install = { ...(m.install || {}), type: 'tarball', artifact: 'bundle.tgz' }
      m.bundleBytes = statSync(tgz).size
      m.downloadUrl = `/store/${kind}/${id}/bundle.tgz`
    }

    // Atomic assets (prompt / skill) carry kind-derived defaults: a per-type
    // install target and a `contents` count of 1 — regardless of source.
    if (ATOMIC_KINDS.includes(kind)) {
      m.install = m.install || {}
      if (!m.install.target) m.install.target = `business/assets/${kind}s/{id}`
      if (!m.contents) m.contents = { [kind]: 1 }
    }

    const readmePath = join(itemDir, 'README.md')
    if (existsSync(readmePath)) cpSync(readmePath, join(itemOut, 'README.md'))

    writeFileSync(join(itemOut, 'claw.json'), JSON.stringify(m, null, 2) + '\n')

    items.push({
      id: m.id,
      kind: m.kind,
      source: m.source,
      name: m.name,
      tagline: m.tagline,
      summary: m.summary || '',
      version: m.version,
      category: m.category,
      tags: m.tags || [],
      icon: m.icon || '',
      accent: m.accent || '#4F5BFF',
      author: m.author || null,
      license: m.license || '',
      contents: m.contents || null,
      updated: m.updated || '',
      detailUrl: m.detailUrl,
      downloadUrl: m.downloadUrl || null,
      bundleBytes: m.bundleBytes || null,
      homepage: m.homepage || null,
      install: m.install || null,
    })
  }
}

if (errors.length) {
  console.error(`\n✗ Store registry has ${errors.length} error(s):`)
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}

if (checkOnly) {
  console.log('✓ registry/ is valid')
  process.exit(0)
}

items.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))

const index = {
  schema: 'clawlego-store/v1',
  generatedAt: new Date().toISOString(),
  site: SITE,
  count: items.length,
  kinds: {
    tpl: 'ClawTpl 出厂模板',
    mod: 'ClawMod 资产包',
    prompt: '提示词',
    skill: '技能',
  },
  items,
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n')

console.log(`✓ store catalog built — ${items.length} item(s) → ${arg}/store/`)
