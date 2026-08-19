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
