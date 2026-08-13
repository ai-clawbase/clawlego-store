// 共用件。每一屏是独立文档，所以这里放的是三屏都要的那点东西。

/** 取元素。 */
function $(sel) { return document.querySelector(sel) }

/** 朗读一个字/词/句。朗读归宿主（clawapp.speech），所以换页会自动停。 */
function say(text, rate) {
  if (!clawapp.speech.available) return
  clawapp.speech.speak(text, { lang: 'zh-CN', rate: rate == null ? 0.85 : rate })
}

/** 把 call() 的失败变成一句人话，而不是把 Error 摔在孩子脸上。 */
async function run(fn, params) {
  try {
    return { ok: true, data: await clawapp.call(fn, params || {}) }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '出了点问题，再试一次' }
  }
}

/** ctx.ok(text, data) 的 data 半边。 */
function payload(result) {
  return (result && result.data && result.data.data) || {}
}
