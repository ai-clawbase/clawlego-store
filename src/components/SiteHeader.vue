<template>
  <header class="nav">
    <div class="wrap nav-inner">
      <router-link to="/" class="brand">
        <span class="brand-mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 7h14M5 12h14M5 17h9" stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
          </svg>
        </span>
        <span class="brand-text">ClawLego <em>商店</em></span>
      </router-link>

      <nav class="nav-links">
        <a href="https://clawlego.studio" target="_blank" rel="noreferrer">官网</a>
        <a href="https://github.com/ai-clawbase/clawlego-store" target="_blank" rel="noreferrer">开源仓库</a>
      </nav>

      <a class="btn btn-primary" href="https://clawlego.studio" target="_blank" rel="noreferrer">
        下载 ClawLego
      </a>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 64px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 17px;
  letter-spacing: -0.01em;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--primary);
  box-shadow: 0 4px 12px rgba(79, 91, 255, 0.32);
}
.brand-text em {
  font-style: normal;
  color: var(--primary);
}
.nav-links {
  display: flex;
  gap: 22px;
  margin-left: auto;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-2);
}
.nav-links a:hover { color: var(--primary); }

@media (max-width: 680px) {
  .nav-links { display: none; }
}
</style>
