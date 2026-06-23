<template>
  <router-link :to="`/item/${item.kind}/${item.id}`" class="card">
    <div class="card-top">
      <span class="icon" :style="{ background: tint, color: item.accent }">
        <Icon :icon="item.icon || 'material-symbols:deployed-code-outline'" width="24" />
      </span>
      <span class="badges">
        <span class="kind" :class="`kind-${item.kind}`">{{ kindShort }}</span>
        <span v-if="item.source === 'reference'" class="src">
          <Icon icon="material-symbols:link" width="12" /> 外部源
        </span>
      </span>
    </div>

    <h3 class="name">{{ item.name }}</h3>
    <p class="tagline">{{ item.tagline }}</p>

    <div v-if="contentBits.length" class="contents">
      <span v-for="b in contentBits" :key="b" class="content-bit">{{ b }}</span>
    </div>

    <div class="card-foot">
      <span class="cat">{{ categoryLabel }}</span>
      <button
        v-if="embedded"
        class="install-mini"
        :class="`is-${installAction}`"
        :disabled="installAction === 'installing' || installAction === 'installed'"
        :title="installTitle"
        @click.stop.prevent="onInstall"
      >
        <Icon :icon="miniIcon" width="14" :class="{ spin: installAction === 'installing' }" />
        {{ miniLabel }}
      </button>
      <span v-else class="ver mono">v{{ item.version }}</span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { StoreItem } from '../types'
import { KIND_SHORT, CATEGORY_LABEL, ASSET_LABEL } from '../types'
import { canInstall, installState, requestInstall } from '../install'

const props = defineProps<{ item: StoreItem }>()

const kindShort = computed(() => KIND_SHORT[props.item.kind])
const categoryLabel = computed(() => CATEGORY_LABEL[props.item.category] || props.item.category)
const tint = computed(() => props.item.accent + '1F')

const contentBits = computed(() => {
  const c = props.item.contents
  if (!c) return []
  return Object.entries(c)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${ASSET_LABEL[k] || k} ${n}`)
})

// One-click install — only surfaced when embedded in the desktop App.
const embedded = canInstall()
const view = computed(() => installState(props.item))
const installAction = computed(() => view.value.action)

const miniIcon = computed(() => {
  switch (installAction.value) {
    case 'installing':
      return 'material-symbols:progress-activity'
    case 'installed':
      return 'material-symbols:check-circle'
    case 'upgradable':
      return 'material-symbols:arrow-circle-up'
    case 'error':
      return 'material-symbols:refresh'
    default:
      return 'material-symbols:download'
  }
})

const miniLabel = computed(() => {
  switch (installAction.value) {
    case 'installing':
      return '安装中'
    case 'installed':
      return '已安装'
    case 'upgradable':
      return '升级'
    case 'error':
      return '重试'
    default:
      return '安装'
  }
})

// Hover hint surfaces the installed → store version delta on an upgrade.
const installTitle = computed(() => {
  if (installAction.value === 'upgradable') {
    return `已安装 v${view.value.installedVersion} · 可升级到 v${props.item.version}`
  }
  if (installAction.value === 'installed') {
    return `已安装 v${view.value.installedVersion || props.item.version}`
  }
  return ''
})

function onInstall() {
  requestInstall(props.item)
}
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px;
  transition: transform .14s ease, box-shadow .16s, border-color .16s;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-pop);
  border-color: transparent;
}
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}
.icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 13px;
}
.kind {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.kind-tpl { background: var(--primary-soft); color: var(--primary-ink); }
.kind-mod { background: var(--mint-soft); color: #0B7355; }
.kind-brick { background: #FCE7F3; color: #BE185D; }
.kind-prompt { background: #FCE7F3; color: #BE185D; }
.kind-skill { background: #EDE9FE; color: #6D28D9; }
.kind-smartspace { background: #E0EAFF; color: #3538CD; }
.kind-projtpl { background: #FEF0C7; color: #B54708; }
.badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.src {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-4);
}
.name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.tagline {
  margin-top: 6px;
  font-size: 13.5px;
  color: var(--ink-3);
  line-height: 1.5;
  flex: 1;
}
.contents {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 16px;
}
.content-bit {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-2);
  background: var(--bg-2);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 3px 7px;
}
.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line-2);
}
.cat {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-3);
}
.ver {
  font-size: 12px;
  color: var(--ink-4);
}

.install-mini {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid var(--primary);
  background: var(--primary);
  color: #fff;
  font-family: var(--font-sans);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: filter .14s, background .14s, border-color .14s;
}
.install-mini:hover:not(:disabled) { filter: brightness(1.08); }
.install-mini:disabled { cursor: default; }
.install-mini.is-installed {
  background: var(--mint, #10b981);
  border-color: var(--mint, #10b981);
}
.install-mini.is-upgradable {
  background: #F59E0B;
  border-color: #F59E0B;
}
.install-mini.is-error {
  background: #fff;
  border-color: #dc2626;
  color: #dc2626;
}
.install-mini .spin { animation: card-install-spin .8s linear infinite; }
@keyframes card-install-spin { to { transform: rotate(360deg); } }
</style>
