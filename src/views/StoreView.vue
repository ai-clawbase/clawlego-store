<template>
  <div class="page">
    <SiteHeader />

    <main>
      <!-- Hero — lead with smart folders -->
      <section class="hero">
        <div class="wrap">
          <span class="kicker">CLAWLEGO STORE</span>
          <h1 class="hero-title">给文件夹，<br />装上一个聪明的大脑。</h1>
          <p class="hero-sub">
            「智能文件夹」把你电脑里的普通目录变成会读、会整理、会问答的智能空间——
            日记、账本、相册、代码库、笔记……落盘永远是你自己的真实文件。
            在 ClawLego 商店点一下，即刻落户你的本地实例。
          </p>
          <div class="hero-stats">
            <button class="stat stat-btn primary" @click="scrollToFolders">
              <strong>{{ counts.smartspace }}</strong><span>智能文件夹</span>
            </button>
            <button class="stat stat-btn" @click="browse('pkg')">
              <strong>{{ counts.pkg }}</strong><span>智能体包</span>
            </button>
            <button class="stat stat-btn" @click="browse('tpl')">
              <strong>{{ counts.tpl }}</strong><span>智能体模板</span>
            </button>
            <button class="stat stat-btn" @click="browseComponentClass('all')">
              <strong>{{ counts.component }}</strong><span>智能组件</span>
            </button>
            <button class="stat stat-btn" @click="scrollToBusinessTemplates">
              <strong>{{ counts.projtpl }}</strong><span>项目模板</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Featured — 智能文件夹 (primary homepage position) -->
      <section id="smartspaces" ref="foldersEl" class="wrap featured anchor-section">
        <div class="featured-head">
          <div>
            <span class="kicker">核心能力</span>
            <h2>智能文件夹 · 让目录长出智能</h2>
            <p>
              挑一个文件夹，套上一个「智能文件夹」模板，它就长出对应的能力：
              自动识别、检索、问答、整理、提醒。下面是 ClawLego 内置的智能文件夹，开箱即用。
            </p>
          </div>
          <button class="ghost-btn" @click="browseComponentClass('smartspace')">浏览全部 →</button>
        </div>

        <ul class="feat-points">
          <li><Icon icon="material-symbols:folder-open-outline" width="18" /> 落盘即真实文件，永远属于你</li>
          <li><Icon icon="material-symbols:search" width="18" /> 会读、会检索、会按内容问答</li>
          <li><Icon icon="material-symbols:bolt" width="18" /> 自带开箱即用的斜杠命令</li>
        </ul>

        <p v-if="loading" class="state">正在加载智能文件夹…</p>
        <p v-else-if="error" class="state err">{{ error }}</p>
        <div v-else class="grid">
          <ItemCard v-for="it in featuredFolders" :key="`${it.kind}/${it.id}`" :item="it" />
        </div>
      </section>

      <!-- Featured — 项目模板 -->
      <section id="business-templates" ref="businessTemplatesEl" class="wrap featured biz-featured anchor-section">
        <div class="featured-head">
          <div>
            <span class="kicker">流程封装</span>
            <h2>项目模板 · 把成熟做法装成组件</h2>
            <p>
              项目模板把目标、流程、交付物和检查点封装成可复用的智能组件。
              从调研、复盘到专项交付，按模板启动即可进入一套清晰的工作方式。
            </p>
          </div>
          <button class="ghost-btn" @click="browseComponentClass('projtpl')">浏览全部 →</button>
        </div>

        <ul class="feat-points">
          <li><Icon icon="material-symbols:route-outline" width="18" /> 目标、步骤、产出物一体封装</li>
          <li><Icon icon="material-symbols:fact-check-outline" width="18" /> 内置检查点，减少漏项</li>
          <li><Icon icon="material-symbols:account-tree-outline" width="18" /> 可和组件、模板继续组合</li>
        </ul>

        <p v-if="loading" class="state">正在加载项目模板…</p>
        <p v-else-if="error" class="state err">{{ error }}</p>
        <p v-else-if="!businessTemplates.length" class="state">暂无项目模板。</p>
        <div v-else class="grid">
          <ItemCard v-for="it in businessTemplates" :key="`${it.kind}/${it.id}`" :item="it" />
        </div>
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
            <input v-model="query" type="search" placeholder="搜索智能组件、模板…" />
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

        <div v-else class="grid">
          <ItemCard v-for="it in filtered" :key="`${it.kind}/${it.id}`" :item="it" />
        </div>
      </section>

      <!-- Visual Hierarchy Diagram -->
      <section class="wrap guide">
        <div class="guide-inner">
          <div class="guide-text">
            <h2>积木式拼搭，组装你的智能系统</h2>
            <p>
              我们把复杂的智能体拆解为标准化的积木。从最基本的「智能原子」起步，
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
import type { StoreIndex, StoreItem, ItemKind } from '../types'
import { CATEGORY_LABEL } from '../types'

const route = useRoute()

type CatalogKind = 'all' | 'pkg' | 'tpl' | 'mod'
type ComponentClass = 'all' | 'mod' | 'smartspace' | 'projtpl' | 'brick'

const index = ref<StoreIndex | null>(null)
const loading = ref(true)
const error = ref('')

const activeKind = ref<CatalogKind>('all')
const activeComponentClass = ref<ComponentClass>('all')
const activeCat = ref<'all' | string>('all')
const query = ref('')

const foldersEl = ref<HTMLElement | null>(null)
const businessTemplatesEl = ref<HTMLElement | null>(null)
const catalogEl = ref<HTMLElement | null>(null)

const COMPONENT_KINDS: ItemKind[] = ['mod', 'smartspace', 'projtpl', 'brick']

function isComponentKind(kind: ItemKind) {
  return COMPONENT_KINDS.includes(kind)
}

function scrollToEl(resolve: () => HTMLElement | null) {
  nextTick(() => resolve()?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function scrollToFolders() {
  scrollToEl(() => foldersEl.value)
}

function scrollToBusinessTemplates() {
  scrollToEl(() => businessTemplatesEl.value)
}

function scrollToCatalog() {
  scrollToEl(() => catalogEl.value)
}

function selectKind(kind: CatalogKind) {
  activeKind.value = kind
  if (kind !== 'mod') activeComponentClass.value = 'all'
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

// Deep-link the tab from the URL. ClawShell links here as
// `/store?kind=smartspace` (and legacy `?category=smartspace` from earlier
// builds) when the user clicks "去商店查找更多智能文件夹模板".
const KNOWN_KINDS: ItemKind[] = ['brick', 'mod', 'tpl', 'pkg', 'smartspace', 'projtpl']
function syncFromRoute() {
  const k = route.query.kind
  if (typeof k === 'string' && (KNOWN_KINDS as string[]).includes(k)) {
    if (k === 'pkg' || k === 'tpl') {
      selectKind(k)
      if (!route.hash) scrollToCatalog()
    } else {
      activeKind.value = 'mod'
      activeComponentClass.value = k as ComponentClass
      if (!route.hash) {
        if (k === 'smartspace') scrollToFolders()
        else if (k === 'projtpl') scrollToBusinessTemplates()
        else scrollToCatalog()
      }
    }
  }
  // Legacy alias: ?category=smartspace → 智能文件夹 tab.
  if (route.query.category === 'smartspace') {
    activeKind.value = 'mod'
    activeComponentClass.value = 'smartspace'
    if (!route.hash) scrollToFolders()
  } else if (route.query.category === 'biz') {
    activeKind.value = 'mod'
    activeComponentClass.value = 'projtpl'
    if (!route.hash) scrollToBusinessTemplates()
  }

  if (route.hash === '#smartspaces') scrollToFolders()
  else if (route.hash === '#business-templates') scrollToBusinessTemplates()
  else if (route.hash === '#all-assets') scrollToCatalog()
}
watch(() => route.fullPath, syncFromRoute, { immediate: true })

onMounted(async () => {
  syncFromRoute()
  try {
    const res = await fetch('/store/index.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    index.value = await res.json()
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
  smartspace: items.value.filter((i) => i.kind === 'smartspace').length,
  projtpl: items.value.filter((i) => i.kind === 'projtpl').length,
  component: items.value.filter((i) => isComponentKind(i.kind)).length,
}))

const featuredFolders = computed(() => items.value.filter((i) => i.kind === 'smartspace'))
const businessTemplates = computed(() => items.value.filter((i) => i.kind === 'projtpl'))

// Catalog tabs surface the packaging levels. Smart folders, business templates
// and single-atom components are browsed as ClawMod subclasses.
const kindTabs = computed(() => [
  { key: 'all' as const, label: '全部', count: items.value.length },
  { key: 'pkg' as const, label: 'ClawPkg 智能体包', count: counts.value.pkg },
  { key: 'tpl' as const, label: 'ClawTpl 模板', count: counts.value.tpl },
  { key: 'mod' as const, label: 'ClawMod 智能组件', count: counts.value.component },
])

const componentClassTabs = computed(() => [
  { key: 'all' as const, label: '全部组件', count: counts.value.component },
  { key: 'mod' as const, label: '标准组件', count: counts.value.mod },
  { key: 'smartspace' as const, label: '智能文件夹', count: counts.value.smartspace },
  { key: 'projtpl' as const, label: '项目模板', count: counts.value.projtpl },
  { key: 'brick' as const, label: 'ClawBit 单原子组件', count: counts.value.brick },
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
    if (activeCat.value !== 'all' && i.category !== activeCat.value) return false
    if (q) {
      const hay = [i.name, i.tagline, i.summary, ...i.tags].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})
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
  gap: 36px;
  margin-top: 34px;
  flex-wrap: wrap;
}
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
  .hero-stats { gap: 22px; }
  .featured-head { flex-direction: column; align-items: flex-start; }
  .search { flex: 1; min-width: 0; }
}
</style>
