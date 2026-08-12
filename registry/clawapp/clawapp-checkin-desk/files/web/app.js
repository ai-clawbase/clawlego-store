/* 三个页面共用的一点点工具。 */
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
    timer = setTimeout(() => el.classList.remove('show'), 2000)
  }
})()
