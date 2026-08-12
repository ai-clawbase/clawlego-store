/* 三个页面共用的一点点工具。经典脚本，先于页面自己的 module 执行。 */
window.$ = id => document.getElementById(id)

window.toast = (function () {
  let el = null
  let timer
  return function toast(msg) {
    if (!el) {
      el = document.createElement('div')
      el.className = 'toast'
      document.body.append(el)
    }
    el.textContent = msg
    el.classList.add('show')
    clearTimeout(timer)
    timer = setTimeout(() => el.classList.remove('show'), 2200)
  }
})()

/** 只有主理人能看的页面：外人顺着链接摸到这儿时，给句人话而不是一屏空白。
 *  真正拦住数据的是服务端 —— 对外那一面根本没有读记录这个方法。 */
window.ownerOnly = function ownerOnly(what) {
  if (clawapp.env.mode === 'owner') return true
  document.body.innerHTML = ''
  const p = document.createElement('p')
  p.className = 'empty'
  p.textContent = `${what}只有主理人能看。`
  document.body.append(p)
  return false
}
