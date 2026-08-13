function $(sel) { return document.querySelector(sel) }

/** 朗读一页。语速放慢——这是哄睡，不是播报。 */
function read(text) {
  if (!clawapp.speech.available) return Promise.resolve(false)
  return clawapp.speech.speak(text, { lang: 'zh-CN', rate: 0.8, pitch: 1.05 })
}

async function run(fn, params) {
  try {
    return { ok: true, data: await clawapp.call(fn, params || {}) }
  } catch (e) {
    return { ok: false, error: (e && e.message) || '出了点问题，再试一次' }
  }
}

function payload(result) {
  return (result && result.data && result.data.data) || {}
}
