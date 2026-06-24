import { ref, computed, watch, type Ref } from 'vue'

/**
 * Slice a reactive list into fixed-size pages.
 *
 * The store grids (智能文件夹 / 项目模板 / 全部资产) can each hold dozens of
 * items, so they page instead of rendering the whole set at once. The page
 * index self-corrects when the underlying list shrinks (filters, search) so a
 * stale page never lands the user on an empty grid.
 */
export function usePagination<T>(source: Ref<readonly T[]>, pageSize: number) {
  const page = ref(1)
  const total = computed(() => source.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  const paged = computed(() => {
    const start = (page.value - 1) * pageSize
    return source.value.slice(start, start + pageSize)
  })
  watch(pageCount, (count) => {
    if (page.value > count) page.value = count
  })
  return { page, pageCount, total, paged }
}
