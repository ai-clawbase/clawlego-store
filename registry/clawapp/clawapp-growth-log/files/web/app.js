function $(sel) { return document.querySelector(sel) }

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

/** 当前选中的孩子。多孩家庭每屏都要用，所以放这里。 */
async function pickKid() {
  let kids = []
  try { kids = await clawapp.entity.query('kid') } catch (e) { kids = [] }
  if (!kids.length) return null
  const saved = localStorage.getItem('kid')
  return kids.find(k => k.id === saved) || kids[0]
}
