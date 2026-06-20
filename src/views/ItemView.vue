<template>
  <div class="page">
    <SiteHeader />

    <main class="wrap">
      <router-link to="/" class="back">
        <Icon icon="material-symbols:arrow-back" width="16" /> 返回商店
      </router-link>

      <p v-if="loading" class="state">正在加载…</p>
      <p v-else-if="error" class="state err">{{ error }}</p>

      <template v-else-if="item">
        <header class="head">
          <span class="icon" :style="{ background: tint, color: item.accent }">
            <Icon :icon="item.icon || 'material-symbols:deployed-code-outline'" width="36" />
          </span>
          <div class="head-text">
            <div class="head-badges">
              <span class="kind" :class="`kind-${item.kind}`">{{ kindLabel }}</span>
              <span v-if="item.source === 'reference'" class="src-tag">
                <Icon icon="material-symbols:link" width="13" /> GitHub 外部源
              </span>
              <span class="ver mono">v{{ item.version }}</span>
            </div>
            <h1>{{ item.name }}</h1>
            <p class="tagline">{{ item.tagline }}</p>
          </div>
        </header>

        <div class="meta">
          <span v-if="item.author">
            <Icon icon="material-symbols:person-outline" width="15" />
            <a v-if="item.author.url" :href="item.author.url" target="_blank" rel="noreferrer">{{ item.author.name }}</a>
            <template v-else>{{ item.author.name }}</template>
          </span>
          <span><Icon icon="material-symbols:balance" width="15" />{{ item.license || '—' }}</span>
          <span><Icon icon="material-symbols:category-outline" width="15" />{{ categoryLabel }}</span>
          <span v-if="item.updated"><Icon icon="material-symbols:update" width="15" />{{ item.updated }}</span>
        </div>

        <div class="layout">
          <div class="col-main">
            <section v-if="item.summary" class="block">
              <h2>简介</h2>
              <p class="summary">{{ item.summary }}</p>
            </section>

            <section v-if="contentBits.length" class="block">
              <h2>包含的智能资产</h2>
              <div class="assets">
                <div v-for="b in contentBits" :key="b.key" class="asset">
                  <strong>{{ b.n }}</strong>
                  <span>{{ b.label }}</span>
                </div>
              </div>
            </section>

            <section v-if="item.tags.length" class="block">
              <h2>标签</h2>
              <div class="tags">
                <span v-for="t in item.tags" :key="t" class="tag">{{ t }}</span>
              </div>
            </section>
          </div>

          <aside class="col-side">
            <!-- Hosted -->
            <div v-if="item.source === 'hosted'" class="install">
              <h3><Icon icon="material-symbols:download" width="18" /> 一键安装</h3>
              <p class="install-lead">
                在 ClawLego 软件的「商店」页找到本条目，点「安装」即可。
                源文件会解压进你实例的文件树：
              </p>
              <pre class="codeblock">{{ targetPath }}</pre>
              <a v-if="item.downloadUrl" class="btn btn-primary install-btn" :href="item.downloadUrl" download>
                下载 bundle.tgz
                <span v-if="sizeText" class="size">{{ sizeText }}</span>
              </a>
              <p class="install-foot">手动下载用于查看内容；正常安装请在 ClawLego 内完成。</p>
            </div>

            <!-- Reference -->
            <div v-else class="install">
              <h3><Icon icon="material-symbols:link" width="18" /> 开源引用</h3>
              <p class="install-lead">
                本条目不在商店托管源文件。ClawLego 安装时从上游仓库拉取：
              </p>
              <pre v-if="cloneCmd" class="codeblock">{{ cloneCmd }}</pre>
              <a v-if="item.homepage" class="btn btn-primary install-btn" :href="item.homepage" target="_blank" rel="noreferrer">
                打开上游仓库
              </a>
              <p v-if="item.install?.target" class="install-foot">
                落地路径：<code>{{ targetPath }}</code>
              </p>
            </div>

            <a class="manifest-link mono" :href="item.detailUrl" target="_blank" rel="noreferrer">
              claw.json 清单 ↗
            </a>
          </aside>
        </div>
      </template>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import type { StoreItem } from '../types'
import { KIND_LABEL, CATEGORY_LABEL, ASSET_LABEL } from '../types'

const route = useRoute()
const item = ref<StoreItem | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  item.value = null
  const { kind, id } = route.params
  try {
    const res = await fetch(`/store/${kind}/${id}/claw.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    item.value = await res.json()
  } catch (e) {
    error.value = '无法加载该条目：' + (e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

watch(() => route.fullPath, load, { immediate: true })

const tint = computed(() => (item.value?.accent ?? '#4F5BFF') + '1F')
const kindLabel = computed(() => (item.value ? KIND_LABEL[item.value.kind] : ''))
const categoryLabel = computed(() =>
  item.value ? CATEGORY_LABEL[item.value.category] || item.value.category : '',
)

const contentBits = computed(() => {
  const c = item.value?.contents
  if (!c) return []
  return Object.entries(c)
    .filter(([, n]) => n > 0)
    .map(([key, n]) => ({ key, n, label: ASSET_LABEL[key] || key }))
})

const targetPath = computed(() => {
  const t = item.value?.install?.target
  if (!t || !item.value) return ''
  return t.replace('{id}', item.value.id)
})

const cloneCmd = computed(() => {
  const ins = item.value?.install
  if (!ins?.url) return ''
  const r = ins.ref ? `  # ref: ${ins.ref}` : ''
  return `git clone ${ins.url}${r}`
})

const sizeText = computed(() => {
  const b = item.value?.bundleBytes
  if (!b) return ''
  return b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`
})
</script>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 32px;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-3);
}
.back:hover { color: var(--primary); }

.state { margin-top: 60px; text-align: center; color: var(--ink-3); }
.state.err { color: #DC2626; }

.head {
  display: flex;
  gap: 22px;
  margin-top: 26px;
}
.icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border-radius: 20px;
  flex-shrink: 0;
}
.head-badges {
  display: flex;
  align-items: center;
  gap: 10px;
}
.kind {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}
.kind-tpl { background: var(--primary-soft); color: var(--primary-ink); }
.kind-mod { background: var(--mint-soft); color: #0B7355; }
.kind-prompt { background: #FCE7F3; color: #BE185D; }
.kind-skill { background: #EDE9FE; color: #6D28D9; }
.kind-smartfolder { background: #E0EAFF; color: #3538CD; }
.kind-biztpl { background: #FEF0C7; color: #B54708; }
.src-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
}
.ver { font-size: 12.5px; color: var(--ink-4); }
.head-text h1 {
  margin-top: 10px;
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.022em;
}
.tagline {
  margin-top: 8px;
  font-size: 16px;
  color: var(--ink-2);
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
  font-size: 13.5px;
  color: var(--ink-3);
}
.meta span { display: inline-flex; align-items: center; gap: 5px; }
.meta a:hover { color: var(--primary); }

.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
  margin-top: 32px;
}
.block { margin-bottom: 34px; }
.block h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 14px;
}
.summary {
  font-size: 15.5px;
  line-height: 1.72;
  color: var(--ink-2);
}
.assets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}
.asset {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--bg);
}
.asset strong {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.asset span { font-size: 12.5px; color: var(--ink-3); }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 4px 10px;
}

.col-side { align-self: start; position: sticky; top: 88px; }
.install {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg-3);
  padding: 22px;
}
.install h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 700;
}
.install-lead {
  margin-top: 10px;
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.6;
}
.install .codeblock {
  margin-top: 12px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}
.install-btn {
  width: 100%;
  margin-top: 14px;
}
.install-btn .size {
  font-weight: 500;
  opacity: 0.7;
  font-size: 12.5px;
}
.install-foot {
  margin-top: 12px;
  font-size: 12px;
  color: var(--ink-4);
  line-height: 1.55;
}
.install-foot code {
  font-size: 11.5px;
  background: var(--bg-2);
  padding: 1px 5px;
  border-radius: 5px;
}
.manifest-link {
  display: block;
  margin-top: 14px;
  text-align: center;
  font-size: 12.5px;
  color: var(--ink-4);
}
.manifest-link:hover { color: var(--primary); }

@media (max-width: 820px) {
  .layout { grid-template-columns: 1fr; gap: 8px; }
  .col-side { position: static; }
  .head-text h1 { font-size: 27px; }
}
</style>
