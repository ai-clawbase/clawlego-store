<template>
  <nav v-if="pageCount > 1" class="pager" aria-label="分页">
    <button class="pg nav" :disabled="page <= 1" aria-label="上一页" @click="go(page - 1)">
      <Icon icon="material-symbols:chevron-left-rounded" width="18" />
    </button>
    <button
      v-for="(p, i) in pages"
      :key="i"
      class="pg"
      :class="{ on: p === page, gap: p === '…' }"
      :disabled="p === '…'"
      @click="typeof p === 'number' && go(p)"
    >
      {{ p }}
    </button>
    <button class="pg nav" :disabled="page >= pageCount" aria-label="下一页" @click="go(page + 1)">
      <Icon icon="material-symbols:chevron-right-rounded" width="18" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps<{ page: number; pageCount: number }>()
const emit = defineEmits<{ (e: 'update:page', value: number): void }>()

function go(p: number) {
  const next = Math.min(Math.max(1, p), props.pageCount)
  if (next !== props.page) emit('update:page', next)
}

// Windowed list: first … (cur-1) cur (cur+1) … last — first/last always shown.
const pages = computed<(number | '…')[]>(() => {
  const n = props.pageCount
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const cur = props.page
  const out: (number | '…')[] = [1]
  const lo = Math.max(2, cur - 1)
  const hi = Math.min(n - 1, cur + 1)
  if (lo > 2) out.push('…')
  for (let i = lo; i <= hi; i++) out.push(i)
  if (hi < n - 1) out.push('…')
  out.push(n)
  return out
})
</script>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
}
.pg {
  display: grid;
  place-items: center;
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--bg);
  font-family: var(--font-sans);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  transition: all .14s;
}
.pg:hover:not(:disabled):not(.on) { border-color: var(--ink-4); }
.pg.on {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
  cursor: default;
}
.pg.gap {
  border-color: transparent;
  background: transparent;
  cursor: default;
  color: var(--ink-4);
}
.pg.nav { color: var(--ink-3); }
.pg:disabled { opacity: .4; cursor: not-allowed; }
</style>
