<template>
  <div class="page">
    <SiteHeader />

    <main>
      <!-- Hero -->
      <section class="hero">
        <div class="wrap">
          <span class="kicker">CLAWLEGO STORE</span>
          <h1 class="hero-title">智能资产，<br />一键装进你的实例。</h1>
          <p class="hero-sub">
            ClawTpl 出厂模板、ClawMod 资产包，以及互联网上的开源智能资产引用——
            在 ClawLego 商店里点一下，源文件就落到你自己实例的文件树里。
          </p>
          <div class="hero-stats">
            <div class="stat">
              <strong>{{ counts.tpl }}</strong><span>ClawTpl</span>
            </div>
            <div class="stat">
              <strong>{{ counts.mod }}</strong><span>ClawMod</span>
            </div>
            <div class="stat">
              <strong>{{ counts.ref }}</strong><span>开源引用</span>
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
            <input v-model="query" type="search" placeholder="搜索名称、标签…" />
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

      <!-- Developer note -->
      <section class="wrap devnote">
        <div class="devnote-inner">
          <div>
            <h2>给 ClawLego 软件 / 开发者</h2>
            <p>
              整个商店目录是一份公开、可跨域读取的 JSON。ClawLego 客户端在「商店」页
              直接拉取它来渲染列表与执行一键安装。
            </p>
          </div>
          <pre class="codeblock">GET https://store.clawlego.studio/store/index.json</pre>
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
  tpl: items.value.filter((i) => i.kind === 'tpl').length,
  mod: items.value.filter((i) => i.kind === 'mod').length,
  ref: items.value.filter((i) => i.kind === 'ref').length,
}))

const kindTabs = computed(() => [
  { key: 'all' as const, label: '全部', count: items.value.length },
  { key: 'tpl' as const, label: 'ClawTpl', count: counts.value.tpl },
  { key: 'mod' as const, label: 'ClawMod', count: counts.value.mod },
  { key: 'ref' as const, label: '开源引用', count: counts.value.ref },
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

.devnote { margin-top: 64px; }
.devnote-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
  padding: 32px;
  border-radius: var(--radius-lg);
  background: var(--bg-2);
  border: 1px solid var(--line);
}
.devnote-inner h2 { font-size: 20px; font-weight: 700; }
.devnote-inner p {
  margin-top: 8px;
  max-width: 460px;
  font-size: 14px;
  color: var(--ink-3);
}
.devnote .codeblock { flex-shrink: 0; }

@media (max-width: 680px) {
  .hero { padding: 52px 0 40px; }
  .hero-title { font-size: 38px; }
  .hero-stats { gap: 26px; }
  .search { flex: 1; min-width: 0; }
}
</style>
