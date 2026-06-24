// build-store.mjs — turns the human-edited `registry/` tree into the
// machine-readable store catalog that the ClawLego app consumes.
//
//   node scripts/build-store.mjs dist       → writes dist/store/ (+ refreshes the git manifest)
//   node scripts/build-store.mjs public     → writes public/store/ (for `pnpm dev`)
//   node scripts/build-store.mjs --manifest → only (re)write the committed git manifest
//   node scripts/build-store.mjs --check    → validate only; also fails if the git manifest is stale
//
// HTTP catalog (served at https://store.clawlego.com):
//   /store/index.json              full catalog index (the app fetches this first)
//   /store/<kind>/<id>/clawasset.json   per-item manifest
//   /store/<kind>/<id>/bundle.tgz  installable payload (hosted items only)
//   /store/<kind>/<id>/README.md   long-form description (optional)
//
// Git marketplace (the repo itself, recognized by clone URL — see EMBED.md / MARKETPLACE.md):
//   .clawlego/marketplace.json     committed, deterministic index of registry/ entries,
//                                  installed straight from the cloned working tree.

import {
  readdirSync, readFileSync, writeFileSync, mkdirSync,
  existsSync, statSync, cpSync, rmSync,
} from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = resolve(import.meta.dirname, '..')
const REGISTRY = join(ROOT, 'registry')
// The four aggregation tiers, from atoms to whole agents:
// `brick` (atomic prompt/skill) → `mod` (asset pack) → `tpl` (agent template)
// → `pkg` (full agent clone, incl. knowledge/data).
// Plus two purpose-typed catalogs browsed by name, not granularity:
// `smartspace` (智能文件夹 —— SmartSpace kind packs) and `projtpl`
// (项目模板 —— goal/workflow/research behavior templates).
const KINDS = ['pkg', 'tpl', 'mod', 'brick', 'smartfolder', 'projtpl']
// Atomic-asset kinds: the kind names the asset type, so install target and the
// `contents` count are derived from it.
const ATOMIC_KINDS = ['brick']
const CATEGORIES = ['design', 'life', 'engineering', 'service', 'general']
const FILENAME_RULES = [
  { prefix: 'clawtpl-',      asset: 'tpl',   ext: 'clawtpl' },
  { prefix: 'clawmod-',      asset: 'mod',   ext: 'clawmod' },
  { prefix: 'clawpkg-',      asset: 'pkg',   ext: 'clawpkg' },
  { prefix: 'prompt-',       asset: 'prompt', ext: 'clawprompt' },
  { prefix: 'skill-',        asset: 'skill',  ext: 'clawskill' },
  { prefix: 'smartfolder-',  asset: 'space',  ext: 'clawspace' },
  { prefix: 'projtpl-',      asset: 'proj',   ext: 'clawproj' },
]

/** 根据条目元数据推导其 bundle 的真实文件名（供前端下载时使用）。 */
function computeArtifactFilename(m) {
  if (m.artifact) return `${m.artifact.id}-${m.version}.${m.artifact.type}`
  for (const r of FILENAME_RULES) {
    if (m.id.startsWith(r.prefix)) {
      return `${r.asset}_${m.id.slice(r.prefix.length)}-${m.version}.${r.ext}`
    }
  }
  return 'bundle.tgz'
}

const SITE = 'https://store.clawlego.com'
const REPO_URL = 'https://github.com/ai-clawbase/clawlego-store.git'
const REPO_REF = 'main'
const MARKETPLACE = join(ROOT, '.clawlego', 'marketplace.json')

const arg = process.argv[2] || 'dist'
const checkOnly = arg === '--check'
const manifestOnly = arg === '--manifest'
// `dist`/`public` write the HTTP catalog; `dist`, `public` and `--manifest`
// all (re)write the committed git manifest; `--check` writes nothing.
const writeStore = !checkOnly && !manifestOnly
const OUT = writeStore ? join(ROOT, arg, 'store') : null

const errors = []
const items = []
const entries = [] // git-marketplace entries (installed from the working tree)

function listDirs(p) {
  if (!existsSync(p)) return []
  return readdirSync(p).filter((n) => !n.startsWith('.') && statSync(join(p, n)).isDirectory())
}

function fail(id, msg) {
  errors.push(`${id}: ${msg}`)
}

if (writeStore) {
  rmSync(OUT, { recursive: true, force: true })
  mkdirSync(OUT, { recursive: true })
}

for (const kind of KINDS) {
  for (const id of listDirs(join(REGISTRY, kind))) {
    const ref = `${kind}/${id}`
    const itemDir = join(REGISTRY, kind, id)
    const manifestPath = join(itemDir, 'clawasset.json')

    if (!existsSync(manifestPath)) { fail(ref, 'missing clawasset.json'); continue }

    let m
    try { m = JSON.parse(readFileSync(manifestPath, 'utf8')) }
    catch (e) { fail(ref, `clawasset.json is not valid JSON — ${e.message}`); continue }

    // --- validate the manifest contract ---
    for (const f of ['id', 'kind', 'source', 'name', 'tagline', 'version', 'category']) {
      if (!m[f]) fail(ref, `missing required field "${f}"`)
    }
    if (m.id !== id) fail(ref, `clawasset.json id "${m.id}" does not match folder name`)
    if (m.kind !== kind) fail(ref, `clawasset.json kind "${m.kind}" does not match folder "${kind}"`)
    if (m.category && !CATEGORIES.includes(m.category)) {
      fail(ref, `unknown category "${m.category}" (allowed: ${CATEGORIES.join(', ')})`)
    }
    // `source` is orthogonal to `kind`: any tier may be hosted or referenced.
    const hosted = m.source === 'hosted'
    if (!['hosted', 'reference'].includes(m.source)) {
      fail(ref, `source must be "hosted" or "reference"`)
    }

    const filesDir = join(itemDir, 'files')
    // A hosted item is either repo-hosted (ships a files/ tree we tar) or
    // R2-hosted (no files/ in the repo — the payload lives in object storage,
    // referenced by an absolute https install.url on the download CDN). The
    // latter keeps official resources out of the public git repo: the registry
    // holds only metadata while the bundle/.clawmod sits on R2.
    const r2Url = (m.install && typeof m.install.url === 'string' && /^https:\/\//.test(m.install.url)) ? m.install.url : ''
    const repoHosted = hosted && existsSync(filesDir)
    const r2Hosted = hosted && !repoHosted && !!r2Url
    if (hosted && !repoHosted && !r2Hosted) {
      fail(ref, 'hosted item needs a files/ directory or an absolute https install.url (R2-hosted)')
    }
    if (!hosted) {
      const url = m.install && m.install.url
      if (!url) fail(ref, 'reference item must declare install.url')
    }

    // --- git-marketplace entry (collected in every mode) ---
    // The repo is itself a marketplace: a clone is installed straight from the
    // working tree, so entries point at registry/ paths, not the HTTP catalog.
    // `install.target` mirrors the HTTP contract (atomic kinds derive a default),
    // with `{id}` resolved so each entry is self-contained.
    const ins = m.install || {}
    const target =
      (ins.target || (ATOMIC_KINDS.includes(kind) ? `business/assets/${kind}s/{id}` : null))
    const relDir = `registry/${kind}/${id}`
    const resolvedTarget = target ? target.replace('{id}', id) : null
    let installEntry
    if (r2Hosted) {
      // R2-hosted: nothing to install from the cloned tree — point the
      // marketplace entry at the same object-storage artifact the HTTP catalog uses.
      installEntry = { type: ins.type || 'tarball', url: r2Url, target: resolvedTarget }
    } else if (hosted) {
      installEntry = { type: 'files', files: `${relDir}/files`, target: resolvedTarget }
    } else {
      installEntry = {
        type: 'git',
        url: ins.url || null,
        ref: ins.ref || null,
        subdir: ins.subdir || null,
        target: resolvedTarget,
      }
    }
    const entry = {
      id, kind,
      source: m.source,
      name: m.name,
      tagline: m.tagline,
      version: m.version,
      category: m.category,
      path: relDir,
      manifest: `${relDir}/clawasset.json`,
      install: installEntry,
    }
    entries.push(entry)

    if (!writeStore) continue
    if (errors.length) continue

    // --- emit ---
    const itemOut = join(OUT, kind, id)
    mkdirSync(itemOut, { recursive: true })

    m.detailUrl = `/store/${kind}/${id}/clawasset.json`

    if (r2Hosted) {
      // The payload already lives on R2; emit its absolute URL straight into the
      // catalog (the app's toAbsolute() passes absolute URLs through unchanged,
      // and the host accepts any *.clawlego.com download host). type is preserved
      // so the host knows whether to unpack a tarball or install a .clawmod.
      m.install = { ...(m.install || {}), type: ins.type || 'tarball', artifact: basename(r2Url) }
      m.downloadUrl = r2Url
    } else if (hosted) {
      const tgz = join(itemOut, 'bundle.tgz')
      // COPYFILE_DISABLE keeps macOS from injecting AppleDouble (._*) entries.
      execFileSync('tar', ['-czf', tgz, '-C', filesDir, '.'], {
        env: { ...process.env, COPYFILE_DISABLE: '1' },
      })
      m.install = { ...(m.install || {}), type: 'tarball', artifact: computeArtifactFilename(m) }
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

    writeFileSync(join(itemOut, 'clawasset.json'), JSON.stringify(m, null, 2) + '\n')

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

// --- git marketplace manifest (deterministic, committed) ---
// No volatile fields (e.g. timestamps) so the tracked file only changes when
// registry/ actually changes — like a lockfile.
entries.sort((a, b) => `${a.kind}/${a.id}`.localeCompare(`${b.kind}/${b.id}`))
const marketplace = {
  schema: 'clawlego-marketplace/v1',
  id: 'clawlego-store',
  name: 'ClawLego 官方商店',
  owner: { name: 'ai-clawbase', url: 'https://github.com/ai-clawbase' },
  site: SITE,
  source: { type: 'git', url: REPO_URL, ref: REPO_REF },
  count: entries.length,
  entries,
}
const marketplaceStr = JSON.stringify(marketplace, null, 2) + '\n'

if (checkOnly) {
  const current = existsSync(MARKETPLACE) ? readFileSync(MARKETPLACE, 'utf8') : ''
  if (current !== marketplaceStr) {
    console.error('\n✗ .clawlego/marketplace.json is stale — run `pnpm store:manifest` and commit.')
    process.exit(1)
  }
  console.log(`✓ registry/ is valid — ${entries.length} entr(ies), git manifest up to date`)
  process.exit(0)
}

mkdirSync(dirname(MARKETPLACE), { recursive: true })
writeFileSync(MARKETPLACE, marketplaceStr)

if (manifestOnly) {
  console.log(`✓ git manifest written — ${entries.length} entr(ies) → .clawlego/marketplace.json`)
  process.exit(0)
}

items.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))

const index = {
  schema: 'clawlego-store/v1',
  generatedAt: new Date().toISOString(),
  site: SITE,
  count: items.length,
  kinds: {
    pkg: 'ClawPkg 智能体包',
    tpl: 'ClawTpl 角色模版',
    mod: 'ClawMod 功能组件',
    brick: 'ClawBit 原子积木',
    smartspace: '智能文件夹',
    projtpl: '项目模板',
  },
  items,
}
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2) + '\n')

console.log(`✓ store catalog built — ${items.length} item(s) → ${arg}/store/`)
