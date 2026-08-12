<template>
  <div class="page">
    <SiteHeader />

    <main>
      <!-- Hero — lead with installable software assets -->
      <section class="hero">
        <div class="wrap">
          <span class="kicker">CLAWLEGO STORE</span>
          <h1 class="hero-title">把成熟做法，<br />装成可运行的软件资产。</h1>
          <p class="hero-sub">
            智能文件夹、项目模板和轻应用，共同组成 ClawLego 的软件资产。
            它们分别让目录长出智能、把流程封装成模板、把业务能力交付成点开即用的程序。
          </p>
          <div class="hero-stats">
            <div class="stat-group lead">
              <button class="stat stat-btn primary" @click="browseSoftwareClass('smartfolder')">
                <strong>{{ counts.smartfolder }}</strong><span>智能文件夹</span>
              </button>
              <button class="stat stat-btn primary" @click="browseSoftwareClass('projtpl')">
                <strong>{{ counts.projtpl }}</strong><span>项目模板</span>
              </button>
              <button class="stat stat-btn primary" @click="browseSoftwareClass('clawapp')">
                <strong>{{ counts.clawapp }}</strong><span>轻应用</span>
              </button>
            </div>
            <div class="stat-group blocks">
              <button class="stat stat-btn" @click="browse('pkg')">
                <strong>{{ counts.pkg }}</strong><span>智能体包</span>
              </button>
              <button class="stat stat-btn" @click="browse('tpl')">
                <strong>{{ counts.tpl }}</strong><span>智能体模板</span>
              </button>
              <button class="stat stat-btn" @click="browseComponentClass('all')">
                <strong>{{ counts.component }}</strong><span>智能组件</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Software assets — peer to the behavior/component catalog below. -->
      <section id="software-assets" ref="softwareAssetsEl" class="wrap featured anchor-section">
        <div class="featured-head">
          <div>
            <span class="kicker">软件资产</span>
            <h2>智能文件夹 · 项目模板 · 轻应用</h2>
            <p>
              三类资产各自独立安装和升级：文件夹类型不等于文件夹实例，项目模板不等于行为原子，
              ClawApp 也不从 SmartFolder 派生。
            </p>
          </div>
          <button class="ghost-btn" @click="browseSoftwareCatalog">浏览全部 →</button>
        </div>

        <div class="software-tabs">
          <button
            v-for="s in softwareClassTabs"
            :key="s.key"
            class="software-tab"
            :class="{ on: activeSoftwareClass === s.key }"
            @click="activeSoftwareClass = s.key"
          >
            {{ s.label }}<i>{{ s.count }}</i>
          </button>
        </div>

        <ul class="feat-points">
          <li><Icon icon="material-symbols:folder-open-outline" width="18" /> 智能文件夹：安装类型，创建实例</li>
          <li><Icon icon="material-symbols:route-outline" width="18" /> 项目模板：封装目标与交付流程</li>
          <li><Icon icon="material-symbols:apps" width="18" /> 轻应用：Mobile / Web，点开即用</li>
        </ul>

        <p v-if="loading" class="state">正在加载软件资产…</p>
        <p v-else-if="error" class="state err">{{ error }}</p>
        <p v-else-if="!softwareItems.length" class="state">暂无该类软件资产。</p>
        <template v-else>
          <div class="grid">
            <ItemCard v-for="it in pagedSoftware" :key="`${it.kind}/${it.id}`" :item="it" />
          </div>
          <Pager v-model:page="softwarePage" :page-count="softwarePageCount" />
        </template>
      </section>

      <!-- Catalog — building blocks & everything else -->
      <section id="all-assets" ref="catalogEl" class="wrap catalog anchor-section">
        <h2 class="catalog-title">全部资产</h2>
        <div class="toolbar">
          <div class="tabs">
            <button
              v-for="t in kindTabs"
              :key="t.key"
              class="tab"
              :class="{ on: activeKind === t.key }"
              @click="selectKind(t.key)"
            >
              {{ t.label }}<i>{{ t.count }}</i>
            </button>
          </div>
          <div class="search">
            <Icon icon="material-symbols:search" width="18" />
            <input v-model="query" type="search" placeholder="搜索智能组件、模板、轻应用…" />
          </div>
        </div>

        <div v-if="activeKind === 'mod'" class="subtabs">
          <button
            v-for="s in componentClassTabs"
            :key="s.key"
            class="subtab"
            :class="{ on: activeComponentClass === s.key }"
            @click="activeComponentClass = s.key"
          >
            {{ s.label }}<i>{{ s.count }}</i>
          </button>
        </div>

        <div v-if="activeKind === 'software'" class="subtabs">
          <button
            v-for="s in softwareClassTabs"
            :key="s.key"
            class="subtab"
            :class="{ on: activeSoftwareClass === s.key }"
            @click="activeSoftwareClass = s.key"
          >
            {{ s.label }}<i>{{ s.count }}</i>
          </button>
        </div>

        <div v-if="categories.length > 1" class="cats">
          <button
            v-for="c in categories"
            :key="c.key"
            class="chip"
            :class="{ on: activeCat === c.key }"
            @click="activeCat = c.key"
          >
            {{ c.label }}
          </button>
        </div>

        <p v-if="loading" class="state">正在加载商店目录…</p>
        <p v-else-if="error" class="state err">{{ error }}</p>
        <p v-else-if="!filtered.length" class="state">没有匹配的资产。</p>

        <template v-else>
          <div class="grid">
            <ItemCard v-for="it in pagedCatalog" :key="`${it.kind}/${it.id}`" :item="it" />
          </div>
          <Pager v-model:page="catalogPage" :page-count="catalogPageCount" />
        </template>
      </section>

      <!-- Visual Hierarchy Diagram -->
      <section class="wrap guide">
        <div class="guide-inner">
          <div class="guide-text">
            <h2>自由拼搭，组装您的智能体</h2>
            <p>
              我们把复杂的智能体拆解为标准化的智能原子。从最基本的「智能原子」起步，
              一路拼到开箱即用的「智能体包」。
            </p>
          </div>
          <div class="diagram">
            <div class="node">
              <div class="node-box brick">
                ClawBit
                <div class="brick-details">
                  <span>提示词</span>
                  <span>技能</span>
                  <span>知识库</span>
                </div>
              </div>
              <span>智能原子</span>
            </div>
            <div class="arrow"></div>
            <div class="node">
              <div class="node-box mod">
                ClawMod
                <div class="brick-details">
                  <span>业务场景</span>
                  <span>工作流</span>
                  <span>数字员工</span>
                </div>
              </div>
              <span>智能组件</span>
            </div>
            <div class="arrow"></div>
            <div class="node">
              <div class="node-box tpl">
                ClawTpl
                <div class="brick-details">
                  <span>角色人格</span>
                  <span>专家模版</span>
                </div>
              </div>
              <span>智能体模板</span>
            </div>
            <div class="arrow"></div>
            <div class="node">
              <div class="node-box pkg">
                ClawPkg
                <div class="brick-details">
                  <span>完整实例</span>
                  <span>开箱即用</span>
                </div>
              </div>
              <span>智能体包</span>
            </div>
          </div>
        </div>
      </section>

    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import ItemCard from '../components/ItemCard.vue'
import Pager from '../components/Pager.vue'
import type { StoreIndex, StoreItem, ItemKind } from '../types'
import { CATEGORY_LABEL } from '../types'
import { usePagination } from '../usePagination'
import { fetchLatestResources, withLatestResources } from '../services/updateService'

const route = useRoute()

type CatalogKind = 'all' | 'pkg' | 'tpl' | 'mod' | 'software'
type ComponentClass = 'all' | 'mod' | 'brick'
type SoftwareClass = 'all' | 'smartfolder' | 'projtpl' | 'clawapp'

const index = ref<StoreIndex | null>(null)
const loading = ref(true)
const error = ref('')

const activeKind = ref<CatalogKind>('all')
const activeComponentClass = ref<ComponentClass>('all')
const activeSoftwareClass = ref<SoftwareClass>('all')
const activeCat = ref<'all' | string>('all')
const query = ref('')

const softwareAssetsEl = ref<HTMLElement | null>(null)
const catalogEl = ref<HTMLElement | null>(null)

const COMPONENT_KINDS: ItemKind[] = ['mod', 'brick']
const SOFTWARE_KINDS: ItemKind[] = ['smartfolder', 'projtpl', 'clawapp']

function isComponentKind(kind: ItemKind) {
  return COMPONENT_KINDS.includes(kind)
}

function isSoftwareKind(kind: ItemKind) {
  return SOFTWARE_KINDS.includes(kind)
}

function scrollToEl(resolve: () => HTMLElement | null) {
  nextTick(() => resolve()?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function scrollToSoftwareAssets() {
  scrollToEl(() => softwareAssetsEl.value)
}

function scrollToCatalog() {
  scrollToEl(() => catalogEl.value)
}

function selectKind(kind: CatalogKind) {
  activeKind.value = kind
  if (kind !== 'mod') activeComponentClass.value = 'all'
  if (kind !== 'software') activeSoftwareClass.value = 'all'
}

function browse(kind: Exclude<CatalogKind, 'all'>) {
  selectKind(kind)
  scrollToCatalog()
}

function browseComponentClass(kind: ComponentClass) {
  activeKind.value = 'mod'
  activeComponentClass.value = kind
  scrollToCatalog()
}

function browseSoftwareClass(kind: SoftwareClass) {
  activeSoftwareClass.value = kind
  scrollToSoftwareAssets()
}

function browseSoftwareCatalog() {
  activeKind.value = 'software'
  scrollToCatalog()
}

// Deep-link the tab from the URL. ClawShell links here as
// `/store?kind=smartfolder` (and legacy `?kind=smartspace` / `?category=smartspace`
// from earlier builds) when the user clicks "去商店查找更多智能文件夹模板".
const KNOWN_KINDS: ItemKind[] = ['brick', 'mod', 'tpl', 'pkg', 'smartfolder', 'projtpl', 'clawapp']
function syncFromRoute() {
  // Legacy alias: the store item kind was renamed smartspace → smartfolder.
  const rawKind = route.query.kind
  const k = rawKind === 'smartspace' ? 'smartfolder' : rawKind
  if (typeof k === 'string' && (KNOWN_KINDS as string[]).includes(k)) {
    if (k === 'pkg' || k === 'tpl') {
      selectKind(k)
      if (!route.hash) scrollToCatalog()
    } else if (isSoftwareKind(k as ItemKind)) {
      activeKind.value = 'software'
      activeSoftwareClass.value = k as SoftwareClass
      if (!route.hash) scrollToSoftwareAssets()
    } else {
      activeKind.value = 'mod'
      activeComponentClass.value = k as ComponentClass
      if (!route.hash) scrollToCatalog()
    }
  }
  // Legacy alias: ?category=smartspace → 智能文件夹 tab.
  if (route.query.category === 'smartspace') {
    activeKind.value = 'software'
    activeSoftwareClass.value = 'smartfolder'
    if (!route.hash) scrollToSoftwareAssets()
  } else if (route.query.category === 'biz') {
    activeKind.value = 'software'
    activeSoftwareClass.value = 'projtpl'
    if (!route.hash) scrollToSoftwareAssets()
  }

  if (route.hash === '#smartspaces' || route.hash === '#business-templates' || route.hash === '#software-assets') scrollToSoftwareAssets()
  else if (route.hash === '#all-assets') scrollToCatalog()
}
watch(() => route.fullPath, syncFromRoute, { immediate: true })

onMounted(async () => {
  syncFromRoute()
  try {
    const res = await fetch('/store/index.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const idx = (await res.json()) as StoreIndex
    // 运行时把更新服务里每个 clawmod 组件的「最新版」覆盖到目录条目上，
    // 这样发新版后无需重建商店即可关联到最新 R2 下载地址（失败则沿用静态版本）。
    const latest = await fetchLatestResources()
    idx.items = withLatestResources(idx.items, latest)
    index.value = idx
  } catch (e) {
    error.value = '无法加载商店目录：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
})

const items = computed<StoreItem[]>(() => index.value?.items ?? [])

const counts = computed(() => ({
  pkg: items.value.filter((i) => i.kind === 'pkg').length,
  tpl: items.value.filter((i) => i.kind === 'tpl').length,
  mod: items.value.filter((i) => i.kind === 'mod').length,
  brick: items.value.filter((i) => i.kind === 'brick').length,
  smartfolder: items.value.filter((i) => i.kind === 'smartfolder').length,
  projtpl: items.value.filter((i) => i.kind === 'projtpl').length,
  clawapp: items.value.filter((i) => i.kind === 'clawapp').length,
  component: items.value.filter((i) => isComponentKind(i.kind)).length,
  software: items.value.filter((i) => isSoftwareKind(i.kind)).length,
}))

const softwareItems = computed(() => items.value.filter((item) =>
  isSoftwareKind(item.kind)
  && (activeSoftwareClass.value === 'all' || item.kind === activeSoftwareClass.value),
))

// Catalog tabs surface the packaging levels. Smart folders, business templates
// and single-atom components are browsed as ClawMod subclasses.
const kindTabs = computed(() => [
  { key: 'all' as const, label: '全部', count: items.value.length },
  { key: 'pkg' as const, label: 'ClawPkg 智能体包', count: counts.value.pkg },
  { key: 'tpl' as const, label: 'ClawTpl 模板', count: counts.value.tpl },
  { key: 'software' as const, label: '软件资产', count: counts.value.software },
  { key: 'mod' as const, label: 'ClawMod 智能组件', count: counts.value.component },
])

const componentClassTabs = computed(() => [
  { key: 'all' as const, label: '全部组件', count: counts.value.component },
  { key: 'mod' as const, label: '标准组件', count: counts.value.mod },
  { key: 'brick' as const, label: 'ClawBit 单原子组件', count: counts.value.brick },
])

const softwareClassTabs = computed(() => [
  { key: 'all' as const, label: '全部软件资产', count: counts.value.software },
  { key: 'smartfolder' as const, label: '智能文件夹', count: counts.value.smartfolder },
  { key: 'projtpl' as const, label: '项目模板', count: counts.value.projtpl },
  { key: 'clawapp' as const, label: '轻应用', count: counts.value.clawapp },
])

const categories = computed(() => {
  const present = new Set(items.value.map((i) => i.category))
  const list: { key: string; label: string }[] = [{ key: 'all', label: '全部分类' }]
  for (const key of Object.keys(CATEGORY_LABEL)) {
    if (present.has(key)) list.push({ key, label: CATEGORY_LABEL[key] })
  }
  return list
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.value.filter((i) => {
    if (activeKind.value === 'pkg' && i.kind !== 'pkg') return false
    if (activeKind.value === 'tpl' && i.kind !== 'tpl') return false
    if (activeKind.value === 'mod') {
      if (!isComponentKind(i.kind)) return false
      if (activeComponentClass.value !== 'all' && i.kind !== activeComponentClass.value) return false
    }
    if (activeKind.value === 'software') {
      if (!isSoftwareKind(i.kind)) return false
      if (activeSoftwareClass.value !== 'all' && i.kind !== activeSoftwareClass.value) return false
    }
    if (activeCat.value !== 'all' && i.category !== activeCat.value) return false
    if (q) {
      const hay = [i.name, i.tagline, i.summary, ...i.tags].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

// Each grid pages rather than rendering its whole set at once.
const { paged: pagedSoftware, page: softwarePage, pageCount: softwarePageCount } =
  usePagination(softwareItems, 8)
const { paged: pagedCatalog, page: catalogPage, pageCount: catalogPageCount } =
  usePagination(filtered, 12)

// Any change to the catalog filters jumps back to its first page.
watch([activeKind, activeComponentClass, activeSoftwareClass, activeCat, query], () => {
  catalogPage.value = 1
})
watch(activeSoftwareClass, () => { softwarePage.value = 1 })
</script>

<style scoped>
.hero {
  padding: 76px 0 56px;
  background:
    radial-gradient(900px 360px at 78% -8%, rgba(79, 91, 255, 0.10), transparent 70%),
    var(--bg-3);
  border-bottom: 1px solid var(--line);
}
.hero-title {
  margin-top: 18px;
  font-size: 52px;
  line-height: 1.08;
  letter-spacing: -0.028em;
  font-weight: 800;
}
.hero-sub {
  margin-top: 20px;
  max-width: 640px;
  font-size: 17px;
  color: var(--ink-2);
  line-height: 1.6;
}
.hero-stats {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 28px 48px;
  margin-top: 34px;
  flex-wrap: wrap;
}
.stat-group {
  display: flex;
  gap: 36px;
  flex-wrap: wrap;
}
/* Keep the building-block trio hugging the right edge even when wrapped. */
.stat-group.blocks { margin-left: auto; }
.stat { display: flex; align-items: baseline; gap: 8px; }
.stat-btn {
  border: 0;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  transition: opacity .14s;
}
.stat-btn:hover { opacity: .62; }
.stat strong {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.stat-btn.primary strong { color: var(--primary); }
.stat span { font-size: 13.5px; color: var(--ink-3); font-weight: 600; }
.stat-btn.primary span { color: var(--primary-ink); }

.anchor-section { scroll-margin-top: 88px; }

/* Featured smart folders */
.featured { padding-top: 56px; }
.biz-featured { padding-top: 64px; }
.featured-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}
.kicker {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--primary);
}
.featured-head h2 {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.featured-head p {
  margin-top: 10px;
  max-width: 620px;
  font-size: 15px;
  color: var(--ink-3);
  line-height: 1.6;
}
.ghost-btn {
  flex-shrink: 0;
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  transition: all .14s;
}
.ghost-btn:hover { border-color: var(--primary); color: var(--primary); }
.feat-points {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
  margin-top: 22px;
  list-style: none;
  padding: 0;
}
.feat-points li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-2);
}
.feat-points li svg { color: var(--primary); }
.software-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}
.software-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  color: var(--ink-2);
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}
.software-tab.on {
  border-color: transparent;
  background: var(--primary-soft);
  color: var(--primary-ink);
}
.software-tab i {
  font-style: normal;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--bg-2);
  color: var(--ink-3);
}
.software-tab.on i { background: rgba(79, 91, 255, .12); color: var(--primary-ink); }

.catalog { padding-top: 64px; }
.catalog-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.tab {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 15px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  transition: all .14s;
}
.tab:hover { border-color: var(--ink-4); }
.tab.on {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.tab i {
  font-style: normal;
  font-size: 11.5px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--bg-2);
  color: var(--ink-3);
}
.tab.on i { background: rgba(255, 255, 255, 0.18); color: #fff; }
.subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.subtab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
  cursor: pointer;
  transition: all .14s;
}
.subtab:hover { border-color: var(--ink-4); color: var(--ink-2); }
.subtab.on {
  background: var(--primary-soft);
  border-color: transparent;
  color: var(--primary-ink);
}
.subtab i {
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--bg-2);
  color: var(--ink-3);
}
.subtab.on i { background: rgba(79, 91, 255, 0.12); color: var(--primary-ink); }
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink-4);
  min-width: 240px;
}
.search input {
  border: 0;
  outline: 0;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--ink);
  width: 100%;
}
.cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.chip {
  height: 30px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-3);
  cursor: pointer;
  transition: all .14s;
}
.chip:hover { border-color: var(--ink-4); }
.chip.on {
  background: var(--primary-soft);
  border-color: transparent;
  color: var(--primary-ink);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 24px;
}
.state {
  margin-top: 48px;
  text-align: center;
  color: var(--ink-3);
  font-size: 15px;
}
.state.err { color: #DC2626; }

.guide { margin-top: 80px; }
.guide-inner {
  padding: 48px;
  border-radius: var(--radius-lg);
  background: var(--bg-2);
  border: 1px solid var(--line);
  text-align: center;
}
.guide-text h2 { font-size: 24px; font-weight: 800; }
.guide-text p {
  margin-top: 12px;
  color: var(--ink-3);
  font-size: 16px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.diagram {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 20px;
  margin-top: 48px;
  flex-wrap: wrap;
}
.node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.node-box {
  width: 104px;
  min-height: 128px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 8px;
  font-weight: 800;
  color: #fff;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  position: relative;
  transition: transform .2s;
}
.node-box:hover { transform: translateY(-4px); }

.brick { background: #94A3B8; }
.mod { background: #6366F1; }
.tpl { background: #8B5CF6; }
.pkg { background: #4F5BFF; }

.brick-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  width: 100%;
}
.brick-details span {
  font-size: 10px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 4px;
  border-radius: 4px;
  color: #fff;
  white-space: nowrap;
  text-align: center;
  line-height: 1.2;
}
.arrow {
  width: 24px;
  height: 2px;
  background: var(--line);
  position: relative;
  margin-top: 56px;
}
.arrow::after {
  content: '';
  position: absolute;
  right: -2px;
  top: -4px;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 8px solid var(--line);
}

@media (max-width: 680px) {
  .hero { padding: 52px 0 40px; }
  .hero-title { font-size: 38px; }
  .hero-stats { gap: 22px 28px; justify-content: flex-start; }
  .stat-group { gap: 22px 28px; }
  .stat-group.blocks { margin-left: 0; }
  .featured-head { flex-direction: column; align-items: flex-start; }
  .search { flex: 1; min-width: 0; }
}
</style>
