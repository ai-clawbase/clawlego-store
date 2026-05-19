<template>
  <div class="page">
    <SiteHeader />

    <main>
      <!-- Hero -->
      <section class="hero">
        <div class="wrap">
          <span class="kicker">CLAWLEGO STORE</span>
          <h1 class="hero-title">像积木一样，<br />拼搭你的专属智能体。</h1>
          <p class="hero-sub">
            从单件的「原子积木」，到「功能组件」与「角色模版」，再到一键克隆的「智能体包」。
            在 ClawLego 商店里点一下，丰富的 AI 资产即刻落户你的本地实例。
          </p>
          <div class="hero-stats">
            <div class="stat">
              <strong>{{ counts.pkg }}</strong><span>智能体包</span>
            </div>
            <div class="stat">
              <strong>{{ counts.tpl }}</strong><span>模版</span>
            </div>
            <div class="stat">
              <strong>{{ counts.mod }}</strong><span>组件</span>
            </div>
            <div class="stat">
              <strong>{{ counts.brick }}</strong><span>积木</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Catalog -->
      <section class="wrap catalog">
        <div class="toolbar">
          <div class="tabs">
            <button
              v-for="t in kindTabs"
              :key="t.key"
              class="tab"
              :class="{ on: activeKind === t.key }"
              @click="activeKind = t.key"
            >
              {{ t.label }}<i>{{ t.count }}</i>
            </button>
          </div>
          <div class="search">
            <Icon icon="material-symbols:search" width="18" />
            <input v-model="query" type="search" placeholder="搜索积木、模版…" />
          </div>
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
              我们把复杂的智能体拆解为标准化的积木。你可以单取一块提示词积木，也可以直接搬走一整座开箱即用的智能体大厦。
            </p>
          </div>
          <div class="diagram">
            <div class="node">
              <div class="node-box brick">Brick</div>
              <span>原子积木</span>
            </div>
            <div class="arrow"></div>
            <div class="node">
              <div class="node-box mod">Mod</div>
              <span>功能组件</span>
            </div>
            <div class="arrow"></div>
            <div class="node">
              <div class="node-box tpl">Tpl</div>
              <span>角色模版</span>
            </div>
            <div class="arrow"></div>
            <div class="node">
              <div class="node-box pkg">Pkg</div>
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
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import ItemCard from '../components/ItemCard.vue'
import type { StoreIndex, StoreItem, ItemKind } from '../types'
import { CATEGORY_LABEL } from '../types'

const index = ref<StoreIndex | null>(null)
const loading = ref(true)
const error = ref('')

const activeKind = ref<'all' | ItemKind>('all')
const activeCat = ref<'all' | string>('all')
const query = ref('')

onMounted(async () => {
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
}))

const kindTabs = computed(() => [
  { key: 'all' as const, label: '全部', count: items.value.length },
  { key: 'pkg' as const, label: 'ClawPkg', count: counts.value.pkg },
  { key: 'tpl' as const, label: 'ClawTpl', count: counts.value.tpl },
  { key: 'mod' as const, label: 'ClawMod', count: counts.value.mod },
  { key: 'brick' as const, label: 'ClawBrick', count: counts.value.brick },
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
    if (activeKind.value !== 'all' && i.kind !== activeKind.value) return false
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
  max-width: 620px;
  font-size: 17px;
  color: var(--ink-2);
  line-height: 1.6;
}
.hero-stats {
  display: flex;
  gap: 40px;
  margin-top: 34px;
}
.stat { display: flex; align-items: baseline; gap: 8px; }
.stat strong {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.stat span { font-size: 13.5px; color: var(--ink-3); font-weight: 600; }

.catalog { padding-top: 40px; }
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.tabs { display: flex; gap: 6px; }
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
  align-items: center;
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
  width: 100px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.node span { font-size: 13px; font-weight: 600; color: var(--ink-3); }
.brick { background: #94A3B8; }
.mod { background: #6366F1; }
.tpl { background: #8B5CF6; }
.pkg { background: #4F5BFF; }
.arrow {
  width: 24px;
  height: 2px;
  background: var(--line);
  position: relative;
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
  .hero-stats { gap: 26px; }
  .search { flex: 1; min-width: 0; }
}
</style>
