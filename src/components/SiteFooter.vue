<template>
  <footer class="foot">
    <div class="wrap foot-inner">
      <div class="foot-brand">
        <strong>ClawLego 商店</strong>
        <p>智能资产的开放注册表 —— ClawTpl 出厂模板、ClawMod 资产包，与互联网开源资产的引用。</p>
      </div>
      <div class="foot-cols">
        <div class="foot-col">
          <span class="foot-h">产品</span>
          <a href="https://clawlego.com" target="_blank" rel="noreferrer">ClawLego 官网</a>
          <router-link to="/">浏览商店</router-link>
        </div>
        <div class="foot-col">
          <span class="foot-h">开发者</span>
          <a href="https://github.com/ai-clawbase/clawlego-store" target="_blank" rel="noreferrer">GitHub 仓库</a>
          <a href="/store/index.json">目录 API</a>
        </div>
      </div>
    </div>
    <div class="wrap foot-base">
      <span>© {{ year }} ClawLego · 一切皆文件</span>
      <span class="mono">store.clawlego.com</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<style scoped>
.foot {
  margin-top: 96px;
  border-top: 1px solid var(--line);
  background: var(--bg-2);
}
.foot-inner {
  display: flex;
  gap: 48px;
  padding-top: 56px;
  padding-bottom: 40px;
  flex-wrap: wrap;
}
.foot-brand { max-width: 360px; }
.foot-brand strong { font-size: 16px; }
.foot-brand p {
  margin-top: 10px;
  color: var(--ink-3);
  font-size: 14px;
}
.foot-cols {
  display: flex;
  gap: 56px;
  margin-left: auto;
}
.foot-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.foot-h {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-4);
  margin-bottom: 4px;
}
.foot-col a {
  font-size: 14px;
  color: var(--ink-2);
}
.foot-col a:hover { color: var(--primary); }
.foot-base {
  display: flex;
  justify-content: space-between;
  padding-top: 22px;
  padding-bottom: 32px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--ink-4);
}
</style>
