(function () {
  'use strict'

  const $ = id => document.getElementById(id)
  const page = document.documentElement.dataset.page || document.body?.dataset.page || 'glow'
  const asset = name => `assets/${name}`
  const today = new Date()
  const initialDate = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 1))
  const state = {
    entries: [],
    members: [],
    families: [],
    urls: new Map(),
    cursor: new Date(initialDate),
    selectedDate: dateISO(initialDate),
    memoryCursor: new Date(today.getFullYear(), today.getMonth(), 1),
    memoryFilter: 'all',
    editorOpen: false,
    editorMode: 'text',
    draft: null,
    saving: false,
    attachments: [],
    recording: false,
    recordStarted: 0,
    recordTimer: 0,
    toastTimer: 0,
    activeFamilyId: 'demo_home',
    hiddenDemoIds: new Set(),
    overlay: null,
    memberDraft: null,
    editingEntryId: '',
    removedMediaIds: [],
    tipIndex: 0,
    recorderSource: '',
    browserRecorder: null,
    browserStream: null,
    browserChunks: [],
  }

  const praiseTips = [
    '说出你看到的具体行动，比如“你刚才自己把玩具收好了”。',
    '把努力也说出来，比如“这次很难，但你没有放弃”。',
    '描述你的真实感受，比如“你愿意分享，让我觉得很温暖”。',
    '把选择权交给孩子，问问“你最为自己骄傲的是哪一刻？”',
    '夸奖合作与善意，让孩子知道温柔也值得被看见。',
  ]

  function icon(name, className = '') {
    const icons = window.PraiseIcons || {}
    const body = icons[name] || icons.star || ''
    return `<svg class="icon ${className}" viewBox="0 0 32 32" aria-hidden="true">${body}</svg>`
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]))
  }

  function toast(message) {
    document.querySelector('.toast')?.remove()
    const el = document.createElement('div')
    el.className = 'toast'
    el.textContent = message
    document.body.append(el)
    clearTimeout(state.toastTimer)
    state.toastTimer = setTimeout(() => el.remove(), 2100)
  }

  function openOverlay(type, data = {}) {
    if (type === 'member-form' && !data.preserveDraft) {
      state.memberDraft = memberDraftFor(data.id)
    }
    state.overlay = { type, ...data }
    render()
  }

  function closeOverlay() {
    if (state.overlay?.returnTo === 'member-form') {
      state.overlay = { type: 'member-form', id: state.memberDraft?.id || '', preserveDraft: true }
      render()
      return
    }
    if (state.overlay?.type === 'member-form') state.memberDraft = null
    state.overlay = null
    render()
  }

  function modalShell(title, content, className = '') {
    return `<div class="modal-scrim" id="modalScrim"><section class="app-modal ${className}" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}"><div class="sheet-handle" aria-hidden="true"></div><header class="modal-head"><h2>${escapeHTML(title)}</h2><button id="modalClose" type="button" aria-label="关闭">${icon('close')}</button></header>${content}</section></div>`
  }

  function memberDraftFor(id = '') {
    const member = state.members.find(item => item.id === id) || demoMembers().find(item => item.id === id) || {}
    const role = member.role || 'child'
    return {
      id: member.id || '',
      name: member.name || '',
      role,
      relation: member.relation || '',
      birthday: member.birthday || '',
      avatar: member.avatar || (role === 'child' ? 'child-avatar.webp' : 'mother-avatar.webp'),
    }
  }

  function captureMemberDraft() {
    if (!$('memberForm')) return
    state.memberDraft = {
      ...(state.memberDraft || {}),
      name: $('memberName')?.value || '',
      role: $('memberRole')?.value || 'family',
      relation: $('memberRelation')?.value || '',
      birthday: $('memberBirthday')?.value || '',
      avatar: document.querySelector('input[name="memberAvatar"]:checked')?.value || 'family-avatar.webp',
    }
  }

  function memberRoleLabel(role) {
    return ({ child: '孩子', parent: '家长', family: '其他家人' })[role] || '其他家人'
  }

  function authorOptions() {
    return [
      { value: '妈妈记录', label: '妈妈记录', hint: '把这一刻温柔地收藏下来', avatar: 'mother-avatar.webp' },
      { value: '爸爸记录', label: '爸爸记录', hint: '一起见证孩子的努力', avatar: 'father-avatar.webp' },
      { value: '孩子记录', label: '孩子记录', hint: '让孩子说出自己的闪光', avatar: 'child-avatar.webp' },
      { value: '其他家人记录', label: '其他家人记录', hint: '全家人都可以参与记录', avatar: 'family-avatar.webp' },
    ]
  }

  function childOptions() {
    const members = visibleMembers()
    const candidates = members.filter(member => member.role === 'child')
    return (candidates.length ? candidates : members).map(member => ({
      value: member.name,
      label: member.name,
      hint: member.relation || memberRoleLabel(member.role),
      avatar: member.avatar || 'child-avatar.webp',
    }))
  }

  function pickerDate(value, withTime = true) {
    const source = value || (withTime ? defaultDraft().date : dateISO())
    const date = new Date(withTime ? source : `${source}T12:00:00`)
    return Number.isNaN(date.getTime()) ? new Date() : date
  }

  function localDateTimeValue(date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 16)
  }

  function formatOwnedDate(value) {
    const date = pickerDate(value, false)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  function formatOwnedDateTime(value) {
    const date = pickerDate(value)
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  function pickerCalendarCells(month, selectedValue) {
    const selected = String(selectedValue || '').slice(0, 10)
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index - first.getDay() + 1)
      const iso = dateISO(date)
      const outside = date.getMonth() !== month.getMonth()
      const current = iso === dateISO(today)
      return `<button type="button" class="owned-cal-day${outside ? ' outside' : ''}${iso === selected ? ' selected' : ''}${current ? ' today' : ''}" data-picker-date="${iso}"><span>${date.getDate()}</span></button>`
    }).join('')
  }

  function renderDatePicker(overlay) {
    const withTime = overlay.type === 'entry-date-picker'
    const selectedDate = pickerDate(overlay.value, withTime)
    const month = pickerDate(`${overlay.month || dateISO(selectedDate).slice(0, 7)}-01`, false)
    const title = withTime ? '选择记录时间' : '选择生日'
    const time = withTime ? `<section class="owned-time-picker"><p>${icon('calendar')} 记录时间</p><div class="time-parts"><div class="time-part"><button type="button" data-time-part="hour" data-time-delta="-1" aria-label="小时减一">${icon('left')}</button><span><strong>${String(selectedDate.getHours()).padStart(2, '0')}</strong><small>时</small></span><button type="button" data-time-part="hour" data-time-delta="1" aria-label="小时加一">${icon('right')}</button></div><div class="time-part"><button type="button" data-time-part="minute" data-time-delta="-5" aria-label="分钟减五">${icon('left')}</button><span><strong>${String(selectedDate.getMinutes()).padStart(2, '0')}</strong><small>分</small></span><button type="button" data-time-part="minute" data-time-delta="5" aria-label="分钟加五">${icon('right')}</button></div></div></section>` : ''
    const clear = withTime ? '' : '<button type="button" class="picker-clear" id="clearPickerDate">暂不填写生日</button>'
    return modalShell(title, `<div class="owned-picker"><div class="owned-month-head"><button type="button" id="pickerPrevMonth" aria-label="上个月">${icon('left')}</button><h3>${monthLabel(month)}</h3><button type="button" id="pickerNextMonth" aria-label="下个月">${icon('right')}</button></div><div class="owned-calendar"><div class="owned-weekdays">${['日', '一', '二', '三', '四', '五', '六'].map(day => `<span>${day}</span>`).join('')}</div>${pickerCalendarCells(month, overlay.value)}</div>${time}<div class="picker-actions${clear ? '' : ' one'}">${clear}<button type="button" class="picker-confirm" id="confirmPickerDate">确认选择</button></div></div>`, 'picker-modal')
  }

  function renderOptionPicker(title, options, selected, attribute) {
    return modalShell(title, `<div class="owned-option-list">${options.map(option => `<button type="button" class="owned-option${option.value === selected ? ' selected' : ''}" ${attribute}="${escapeHTML(option.value)}"><img src="${asset(option.avatar)}" alt=""><span><b>${escapeHTML(option.label)}</b><small>${escapeHTML(option.hint || '')}</small></span>${option.value === selected ? icon('check') : icon('right')}</button>`).join('')}</div>`, 'option-modal')
  }

  function renderOverlay() {
    const overlay = state.overlay
    if (!overlay) return ''
    if (overlay.type === 'entry-date-picker' || overlay.type === 'member-birthday-picker') {
      return renderDatePicker(overlay)
    }
    if (overlay.type === 'entry-author-picker') {
      return renderOptionPicker('选择记录人', authorOptions(), state.draft?.author || '妈妈记录', 'data-select-author')
    }
    if (overlay.type === 'entry-child-picker') {
      return renderOptionPicker('这颗星送给谁', childOptions(), state.draft?.child || '小宝', 'data-select-child')
    }
    if (overlay.type === 'member-role-picker') {
      const options = [
        { value: 'child', label: '孩子', hint: '被记录成长与闪光时刻', avatar: 'child-avatar.webp' },
        { value: 'parent', label: '家长', hint: '陪伴并记录孩子成长', avatar: 'mother-avatar.webp' },
        { value: 'family', label: '其他家人', hint: '共同参与家庭记录', avatar: 'family-avatar.webp' },
      ]
      return renderOptionPicker('选择家庭身份', options, state.memberDraft?.role || 'family', 'data-select-member-role')
    }
    if (overlay.type === 'family-picker') {
      const families = state.families.length ? state.families : [currentFamily()]
      const canManage = state.families.some(family => family.id === state.activeFamilyId)
      return modalShell('选择一个家', `<div class="family-picker-list">${families.map(family => `<button type="button" class="family-choice${family.id === state.activeFamilyId ? ' selected' : ''}" data-select-family="${escapeHTML(family.id)}"><img src="${asset('family-avatar.webp')}" alt=""><span><b>${escapeHTML(family.name)}</b><small>${family.id === state.activeFamilyId ? '正在记录' : '切换到这个家'}</small></span>${family.id === state.activeFamilyId ? icon('check') : icon('right')}</button>`).join('')}</div>${canManage ? `<button type="button" class="manage-family-link" data-edit-family="${escapeHTML(state.activeFamilyId)}">${icon('edit')} 修改当前家庭名称</button>` : ''}<div class="modal-action-grid"><button type="button" data-overlay="family-form">${icon('add')} 新建家庭</button><button type="button" data-focus-join>${icon('group')} 输入口令</button></div><form class="join-form" id="joinFamilyForm"><input id="joinCode" maxlength="6" autocomplete="off" placeholder="输入 6 位家庭口令"><button>加入</button></form>`)
    }
    if (overlay.type === 'family-form') {
      const family = state.families.find(item => item.id === overlay.id)
      return modalShell(family ? '家庭设置' : '新建一个家', `<form class="stack-form" id="familyForm"><label><span>家庭名称</span><input id="familyName" maxlength="30" required value="${escapeHTML(family?.name || '')}" placeholder="例如：小宝的家"></label><p class="modal-hint">每个家庭有独立成员和日记；所有数据仍只保存在当前实例。</p><button class="primary-modal-button">${family ? '保存家庭名称' : '创建并切换'}</button></form>`)
    }
    if (overlay.type === 'member-form') {
      const member = state.memberDraft || memberDraftFor(overlay.id)
      const avatar = member.avatar || (member.role === 'child' ? 'child-avatar.webp' : 'mother-avatar.webp')
      return modalShell(member.id ? '编辑家庭成员' : '添加家庭成员', `<form class="stack-form member-form" id="memberForm"><label><span>名字</span><input id="memberName" maxlength="30" required value="${escapeHTML(member.name || '')}" placeholder="成员名字"></label><div class="form-grid"><button class="form-owned-trigger" type="button" id="memberRoleTrigger"><span>身份</span><b>${escapeHTML(memberRoleLabel(member.role))}</b>${icon('down')}</button><label><span>称呼</span><input id="memberRelation" maxlength="20" value="${escapeHTML(member.relation || '')}" placeholder="宝贝 / 记录者"></label></div><button class="form-owned-trigger wide" type="button" id="memberBirthdayTrigger"><span>生日（可选）</span><b>${member.birthday ? escapeHTML(formatOwnedDate(member.birthday)) : '暂未填写'}</b>${icon('calendar')}</button><input id="memberRole" type="hidden" value="${escapeHTML(member.role || 'family')}"><input id="memberBirthday" type="hidden" value="${escapeHTML(member.birthday || '')}"><fieldset class="avatar-picker"><legend>头像</legend>${['child-avatar.webp','mother-avatar.webp','father-avatar.webp','family-avatar.webp'].map(file => `<label><input type="radio" name="memberAvatar" value="${file}"${file === avatar ? ' checked' : ''}><img src="${asset(file)}" alt=""></label>`).join('')}</fieldset><button class="primary-modal-button">保存成员</button>${member.id ? '<button class="danger-modal-button" type="button" id="deleteMember">移除这个成员</button>' : ''}</form>`)
    }
    if (overlay.type === 'invite') {
      const family = currentFamily()
      return modalShell('邀请家人', `<div class="invite-sheet"><img src="${asset('invite-envelope.webp')}" alt="星星信封"><p>把家庭口令告诉家人，他们在夸夸日记里输入后即可切换到同一个家。</p><div class="invite-code"><strong>${escapeHTML(family.invite_code || '------')}</strong><button type="button" id="copyInvite">复制口令</button></div><div class="modal-action-grid"><button type="button" id="rotateInvite">换一个口令</button><button type="button" data-overlay="member-form">直接添加成员</button></div><small>口令与成员信息仅保存在当前 ClawLego 实例，不经过外部家庭服务。</small></div>`)
    }
    if (overlay.type === 'entry-actions') {
      const entry = findEntry(overlay.id)
      if (!entry) return ''
      return modalShell('这颗星', `<div class="entry-action-title"><img src="${asset('star-friend.png')}" alt=""><div><b>${escapeHTML(entry.title)}</b><small>${formatDate(entry.happened_at, true)} · ${escapeHTML(entry.author || '家人')}记录</small></div></div><div class="action-list"><button type="button" data-entry-command="view">${icon('search')} 查看完整日记</button><button type="button" data-entry-command="edit">${icon('edit')} 编辑内容</button><button type="button" data-entry-command="share">${icon('share')} 分享文字</button><button type="button" class="danger" data-entry-command="delete">${icon('trash')} 删除日记</button></div>`)
    }
    if (overlay.type === 'entry-delete') {
      const entry = findEntry(overlay.id)
      return modalShell('删除这颗星？', `<div class="confirm-copy"><img src="${asset('star-jar.webp')}" alt=""><p>“${escapeHTML(entry?.title || '这篇日记')}”会从时光中移除。真实上传的媒体也会一起清理。</p><div class="modal-action-grid"><button type="button" id="modalCancel">先保留</button><button type="button" class="danger-solid" id="confirmDeleteEntry">确认删除</button></div></div>`)
    }
    if (overlay.type === 'filter') {
      const tags = ['all', ...new Set(visibleEntries().flatMap(entry => entry.tags || []))]
      return modalShell('筛选星光', `<div class="chip-list">${tags.map(tag => `<button type="button" data-filter="${escapeHTML(tag)}" class="${state.memoryFilter === tag ? 'selected' : ''}">${tag === 'all' ? '全部星光' : escapeHTML(tag)}</button>`).join('')}</div>`)
    }
    if (overlay.type === 'tip') {
      return modalShell('今日夸夸灵感', `<div class="tip-sheet"><img src="${asset('family-tip.webp')}" alt="孩子举起星星"><blockquote>${escapeHTML(praiseTips[state.tipIndex % praiseTips.length])}</blockquote><div class="modal-action-grid"><button type="button" id="nextTip">换一条</button><button type="button" id="useTip">照着记一颗星</button></div></div>`)
    }
    if (overlay.type === 'entry-detail') {
      const entry = findEntry(overlay.id)
      if (!entry) return ''
      const media = Array.isArray(entry.media) ? entry.media : []
      return modalShell('完整日记', `<article class="entry-detail"><span class="detail-star"><img src="${asset('star-friend.png')}" alt=""></span><h2>${escapeHTML(entry.title)}</h2><p class="detail-meta">${escapeHTML(entry.child || '孩子')} · ${escapeHTML(entry.author || '家人')}记录 · ${formatDate(entry.happened_at, true)}</p><p>${escapeHTML(entry.body || '这个闪光时刻已经被好好收藏。')}</p>${media.length ? `<div class="detail-media">${media.map(item => renderDetailMedia(item)).join('')}</div>` : ''}<button type="button" class="primary-modal-button" data-entry-command="edit">编辑这篇日记</button></article>`, 'detail-modal')
    }
    if (overlay.type === 'media-preview') {
      const media = overlay.kind === 'video'
        ? `<video src="${escapeHTML(overlay.src)}" controls autoplay playsinline></video>`
        : `<img src="${escapeHTML(overlay.src)}" alt="${escapeHTML(overlay.title || '媒体预览')}">`
      const demo = overlay.kind === 'video-demo' ? `<button type="button" class="demo-video-play" id="demoVideoPlay">${icon('play')}<span>播放示例片段</span></button>` : ''
      return modalShell(overlay.title || '媒体预览', `<div class="media-preview ${overlay.kind === 'video-demo' ? 'demo' : ''}">${media}${demo}</div>`, 'media-modal')
    }
    return ''
  }

  function findEntry(id) {
    return [...state.entries, ...demoEntries()].find(entry => entry.id === id && !entry.deleted_at)
  }

  function renderDetailMedia(item) {
    const src = item.demo ? asset(item.demo) : state.urls.get(item.id) || ''
    if (item.kind === 'image' && src) return `<img src="${src}" alt="${escapeHTML(item.name || '日记图片')}">`
    if (item.kind === 'video' && src) return item.demo
      ? `<button type="button" class="detail-video" data-preview-demo="${src}"><img src="${src}" alt="${escapeHTML(item.name || '视频封面')}">${icon('play')}</button>`
      : `<video src="${src}" controls playsinline></video>`
    if (item.kind === 'audio') return renderVoice(item)
    return ''
  }

  function bindEntryActions() {
    document.querySelectorAll('[data-entry-action]').forEach(button => button.addEventListener('click', event => {
      event.stopPropagation()
      openOverlay('entry-actions', { id: button.dataset.entryAction })
    }))
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.append(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
    }
  }

  async function appStateGet(key, fallback = null) {
    try {
      if (!clawapp.state?.get) return fallback
      const value = await clawapp.state.get(key)
      return value == null ? fallback : value
    } catch {
      return fallback
    }
  }

  async function appStateSet(key, value) {
    try {
      if (clawapp.state?.set) await clawapp.state.set(key, value)
    } catch {
      // App state is a convenience only; entity data remains the source of truth.
    }
  }

  async function shareEntry(entry) {
    const text = `⭐ ${entry.title}\n${entry.body || ''}\n——${entry.author || '家人'}记录于${formatDate(entry.happened_at, true)}`
    try {
      if (navigator.share) await navigator.share({ title: `夸夸日记 · ${entry.title}`, text })
      else { await copyText(text); toast('日记文字已复制') }
    } catch (error) {
      if (error?.name !== 'AbortError') { await copyText(text); toast('日记文字已复制') }
    }
  }

  async function setActiveFamily(id) {
    state.activeFamilyId = id
    await appStateSet('active_family_id', id)
    state.overlay = null
    render()
  }

  async function ensureFamily(seedMembers = true) {
    const existing = state.families.find(family => family.id === state.activeFamilyId)
    if (existing) return existing
    const payload = { name: currentFamily().name || '小宝的家', invite_code: makeInviteCode(), created_at: new Date().toISOString() }
    const inserted = await clawapp.entity.insert('praise_family', payload)
    const family = inserted && typeof inserted === 'object' ? inserted : { id: `family_${Date.now()}`, ...payload }
    state.families.push(family)
    state.activeFamilyId = family.id
    await appStateSet('active_family_id', family.id)
    if (seedMembers && !state.members.length) {
      const seeded = await Promise.all(demoMembers().map(member => {
        const payloadMember = {
          family_id: family.id,
          name: member.name,
          role: member.role,
          relation: member.relation,
          avatar: member.avatar,
          color: member.role === 'child' ? '#FFE8B4' : member.name === '妈妈' ? '#EFEAFF' : '#E7F6F1',
          created_at: new Date().toISOString(),
        }
        return clawapp.entity.insert('family_member', payloadMember).then(record => record && typeof record === 'object' ? record : { id: `member_${Date.now()}_${member.name}`, ...payloadMember })
      }))
      state.members.push(...seeded)
    }
    return family
  }

  async function createFamilyFromForm() {
    const name = $('familyName')?.value.trim()
    if (!name) return
    const existing = state.families.find(family => family.id === state.overlay?.id)
    if (existing) {
      const payload = { name, updated_at: new Date().toISOString() }
      const updated = await clawapp.entity.update('praise_family', existing.id, payload)
      Object.assign(existing, updated && typeof updated === 'object' ? updated : payload)
      state.overlay = null
      render()
      toast('家庭名称已保存')
      return
    }
    const payload = { name, invite_code: makeInviteCode(), created_at: new Date().toISOString() }
    const inserted = await clawapp.entity.insert('praise_family', payload)
    const family = inserted && typeof inserted === 'object' ? inserted : { id: `family_${Date.now()}`, ...payload }
    state.families.push(family)
    await setActiveFamily(family.id)
    toast(`${name}已经建好`)
  }

  async function saveMemberFromForm() {
    const name = $('memberName')?.value.trim()
    if (!name) return
    const family = await ensureFamily(true)
    const overlayId = state.overlay?.id || ''
    let member = state.members.find(item => item.id === overlayId)
    if (!member && overlayId.startsWith('demo_')) {
      const demo = demoMembers().find(item => item.id === overlayId)
      member = state.members.find(item => item.name === demo?.name && item.role === demo?.role)
    }
    const payload = {
      family_id: family.id,
      name,
      role: $('memberRole')?.value || 'family',
      relation: $('memberRelation')?.value.trim() || '家人',
      birthday: $('memberBirthday')?.value || '',
      avatar: document.querySelector('input[name="memberAvatar"]:checked')?.value || 'family-avatar.webp',
      updated_at: new Date().toISOString(),
    }
    if (member?.id) {
      const updated = await clawapp.entity.update('family_member', member.id, payload)
      Object.assign(member, updated && typeof updated === 'object' ? updated : payload)
    } else {
      const inserted = await clawapp.entity.insert('family_member', { ...payload, created_at: new Date().toISOString() })
      state.members.push(inserted && typeof inserted === 'object' ? inserted : { id: `member_${Date.now()}`, ...payload })
    }
    state.memberDraft = null
    state.overlay = null
    render()
    toast('成员信息已保存')
  }

  async function removeMember(id) {
    let member = state.members.find(item => item.id === id)
    if (!member && id.startsWith('demo_')) {
      await ensureFamily(true)
      const demo = demoMembers().find(item => item.id === id)
      member = state.members.find(item => item.name === demo?.name && item.role === demo?.role)
    }
    if (!member?.id) return
    const deletedAt = new Date().toISOString()
    await clawapp.entity.update('family_member', member.id, { deleted_at: deletedAt, updated_at: deletedAt })
    member.deleted_at = deletedAt
    state.memberDraft = null
    state.overlay = null
    render()
    toast('成员已移除')
  }

  async function prepareInvite() {
    await ensureFamily(true)
    openOverlay('invite')
  }

  async function rotateInvite() {
    const family = await ensureFamily(false)
    const inviteCode = makeInviteCode()
    const updated = await clawapp.entity.update('praise_family', family.id, { invite_code: inviteCode, updated_at: new Date().toISOString() })
    Object.assign(family, updated && typeof updated === 'object' ? updated : { invite_code: inviteCode })
    openOverlay('invite')
  }

  async function deleteEntry(id) {
    const entry = findEntry(id)
    if (!entry) return
    if (entry.demo) {
      state.hiddenDemoIds.add(entry.id)
      await appStateSet('hidden_demo_ids', [...state.hiddenDemoIds])
    } else {
      const deletedAt = new Date().toISOString()
      await clawapp.entity.update('praise_entry', entry.id, { deleted_at: deletedAt, updated_at: deletedAt })
      entry.deleted_at = deletedAt
      await Promise.all((entry.media || []).map(item => item?.id ? clawapp.media.remove(item.id).catch(() => {}) : Promise.resolve()))
    }
    state.overlay = null
    render()
    toast('这颗星已经移除')
  }

  function bindOverlay() {
    const overlay = state.overlay
    if (!overlay) return
    $('modalClose')?.addEventListener('click', closeOverlay)
    $('modalCancel')?.addEventListener('click', closeOverlay)
    $('modalScrim')?.addEventListener('click', event => { if (event.target === $('modalScrim')) closeOverlay() })
    document.querySelectorAll('[data-overlay]').forEach(button => button.addEventListener('click', () => openOverlay(button.dataset.overlay)))
    document.querySelector('[data-edit-family]')?.addEventListener('click', buttonEvent => openOverlay('family-form', { id: buttonEvent.currentTarget.dataset.editFamily }))
    $('memberRoleTrigger')?.addEventListener('click', () => {
      captureMemberDraft()
      openOverlay('member-role-picker', { returnTo: 'member-form' })
    })
    $('memberBirthdayTrigger')?.addEventListener('click', () => {
      captureMemberDraft()
      const value = state.memberDraft?.birthday || dateISO()
      openOverlay('member-birthday-picker', { value, month: value.slice(0, 7), returnTo: 'member-form' })
    })
    document.querySelectorAll('[data-select-member-role]').forEach(button => button.addEventListener('click', () => {
      state.memberDraft = { ...(state.memberDraft || memberDraftFor()), role: button.dataset.selectMemberRole }
      state.overlay = { type: 'member-form', id: state.memberDraft.id || '', preserveDraft: true }
      render()
    }))
    document.querySelectorAll('[data-select-author]').forEach(button => button.addEventListener('click', () => {
      state.draft = { ...(state.draft || defaultDraft()), author: button.dataset.selectAuthor }
      state.overlay = null
      render()
    }))
    document.querySelectorAll('[data-select-child]').forEach(button => button.addEventListener('click', () => {
      state.draft = { ...(state.draft || defaultDraft()), child: button.dataset.selectChild }
      state.overlay = null
      render()
    }))
    const movePickerMonth = delta => {
      const selected = pickerDate(overlay.value, overlay.type === 'entry-date-picker')
      const month = pickerDate(`${overlay.month || dateISO(selected).slice(0, 7)}-01`, false)
      month.setMonth(month.getMonth() + delta)
      overlay.month = dateISO(month).slice(0, 7)
      render()
    }
    $('pickerPrevMonth')?.addEventListener('click', () => movePickerMonth(-1))
    $('pickerNextMonth')?.addEventListener('click', () => movePickerMonth(1))
    document.querySelectorAll('[data-picker-date]').forEach(button => button.addEventListener('click', () => {
      const withTime = overlay.type === 'entry-date-picker'
      const selected = pickerDate(overlay.value, withTime)
      const next = pickerDate(button.dataset.pickerDate, false)
      selected.setFullYear(next.getFullYear(), next.getMonth(), next.getDate())
      overlay.value = withTime ? localDateTimeValue(selected) : dateISO(selected)
      overlay.month = dateISO(next).slice(0, 7)
      render()
    }))
    document.querySelectorAll('[data-time-part]').forEach(button => button.addEventListener('click', () => {
      const selected = pickerDate(overlay.value)
      const delta = Number(button.dataset.timeDelta || 0)
      if (button.dataset.timePart === 'hour') selected.setHours(selected.getHours() + delta)
      else selected.setMinutes(selected.getMinutes() + delta)
      overlay.value = localDateTimeValue(selected)
      render()
    }))
    $('confirmPickerDate')?.addEventListener('click', () => {
      if (overlay.type === 'entry-date-picker') {
        state.draft = { ...(state.draft || defaultDraft()), date: overlay.value || defaultDraft().date }
        state.overlay = null
      } else {
        state.memberDraft = { ...(state.memberDraft || memberDraftFor()), birthday: overlay.value || '' }
        state.overlay = { type: 'member-form', id: state.memberDraft.id || '', preserveDraft: true }
      }
      render()
    })
    $('clearPickerDate')?.addEventListener('click', () => {
      state.memberDraft = { ...(state.memberDraft || memberDraftFor()), birthday: '' }
      state.overlay = { type: 'member-form', id: state.memberDraft.id || '', preserveDraft: true }
      render()
    })
    document.querySelectorAll('[data-select-family]').forEach(button => button.addEventListener('click', () => void setActiveFamily(button.dataset.selectFamily)))
    document.querySelector('[data-focus-join]')?.addEventListener('click', () => {
      document.querySelector('.join-form')?.classList.add('visible')
      $('joinCode')?.focus()
    })
    $('joinFamilyForm')?.addEventListener('submit', event => {
      event.preventDefault()
      const code = $('joinCode')?.value.trim().toUpperCase()
      const family = state.families.find(item => String(item.invite_code || '').toUpperCase() === code)
      if (family) void setActiveFamily(family.id)
      else toast('没有找到这个家庭口令')
    })
    $('familyForm')?.addEventListener('submit', event => { event.preventDefault(); void createFamilyFromForm().catch(error => toast(error.message || String(error))) })
    $('memberForm')?.addEventListener('submit', event => { event.preventDefault(); void saveMemberFromForm().catch(error => toast(error.message || String(error))) })
    $('deleteMember')?.addEventListener('click', () => void removeMember(overlay.id).catch(error => toast(error.message || String(error))))
    $('copyInvite')?.addEventListener('click', () => void copyText(currentFamily().invite_code || '').then(() => toast('家庭口令已复制')))
    $('rotateInvite')?.addEventListener('click', () => void rotateInvite().catch(error => toast(error.message || String(error))))
    document.querySelectorAll('[data-entry-command]').forEach(button => button.addEventListener('click', () => {
      const entry = findEntry(overlay.id)
      const command = button.dataset.entryCommand
      if (!entry) return
      if (command === 'view') openOverlay('entry-detail', { id: entry.id })
      else if (command === 'edit') openEntryEditor(entry)
      else if (command === 'share') void shareEntry(entry)
      else if (command === 'delete') openOverlay('entry-delete', { id: entry.id })
    }))
    $('confirmDeleteEntry')?.addEventListener('click', () => void deleteEntry(overlay.id).catch(error => toast(error.message || String(error))))
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      state.memoryFilter = button.dataset.filter
      state.overlay = null
      render()
    }))
    $('nextTip')?.addEventListener('click', () => { state.tipIndex = (state.tipIndex + 1) % praiseTips.length; openOverlay('tip') })
    $('useTip')?.addEventListener('click', () => {
      state.overlay = null
      if (page === 'glow') openEditor('text', { body: praiseTips[state.tipIndex] })
      else void useTipOnGlow()
    })
    $('demoVideoPlay')?.addEventListener('click', event => {
      const button = event.currentTarget
      const playing = button.classList.toggle('playing')
      button.querySelector('span').textContent = playing ? '正在播放示例片段…' : '播放示例片段'
      button.innerHTML = `${icon(playing ? 'pause' : 'play')}<span>${playing ? '正在播放示例片段…' : '播放示例片段'}</span>`
    })
    document.querySelectorAll('[data-preview-demo]').forEach(button => button.addEventListener('click', () => openOverlay('media-preview', { kind: 'video-demo', src: button.dataset.previewDemo, title: '日记视频' })))
    document.querySelectorAll('.voice-player').forEach(bindVoicePlayer)
  }

  async function useTipOnGlow() {
    await appStateSet('praise_seed', { body: praiseTips[state.tipIndex] })
    await clawapp.nav.switchTab('glow')
  }

  function dateISO(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }

  function parseDate(value) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? new Date() : date
  }

  function formatDate(value, full = false) {
    const date = parseDate(value)
    return new Intl.DateTimeFormat('zh-CN', full
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { month: 'numeric', day: 'numeric' }).format(date)
  }

  function formatDuration(seconds) {
    const n = Math.max(0, Math.round(Number(seconds) || 0))
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
  }

  function monthLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  function sameMonth(value, month) {
    const date = parseDate(value)
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth()
  }

  function weekAround(anchor) {
    const start = new Date(anchor)
    start.setDate(anchor.getDate() - 3)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }

  function mediaOf(entry, kind) {
    const list = Array.isArray(entry.media) ? entry.media : []
    return list.filter(item => item && item.kind === kind)
  }

  function demoEntries() {
    const base = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 1), 19, 30)
    const older = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 4), 17, 15)
    const oldest = new Date(today.getFullYear(), today.getMonth(), Math.max(1, today.getDate() - 8), 10, 20)
    return [
      {
        id: 'demo_backpack',
        title: '你自己整理好了小书包',
        body: '放学回家，你主动把书本和文具整理得整整齐齐，真棒！',
        child: '小宝',
        author: '妈妈',
        happened_at: base.toISOString(),
        media: [
          { id: 'demo_photo', kind: 'image', demo: 'backpack-memory.webp', name: '整理好的小书包' },
          { id: 'demo_audio', kind: 'audio', demo: true, duration: 18, name: '妈妈的夸夸语音' },
          { id: 'demo_video', kind: 'video', demo: 'backpack-video-thumb.webp', duration: 32, name: '自己收拾书包' },
        ],
        tags: ['生活自理'],
        timelineDemo: 'memory-backpack.webp',
        stars: 1,
        demo: true,
      },
      {
        id: 'demo_blocks',
        title: '搭得越来越高',
        body: '耐心搭了好久，积木塔比上次高了呢，你的专注力好棒！',
        child: '小宝',
        author: '爸爸',
        happened_at: older.toISOString(),
        media: [{ id: 'demo_blocks_photo', kind: 'image', demo: 'memory-blocks.webp', name: '认真搭积木' }],
        tags: ['专注力'],
        stars: 1,
        demo: true,
      },
      {
        id: 'demo_share',
        title: '主动分享零食',
        body: '你记得把喜欢的小点心分给伙伴，大家都感受到了你的温柔。',
        child: '小宝',
        author: '妈妈',
        happened_at: oldest.toISOString(),
        media: [{ id: 'demo_share_photo', kind: 'image', demo: 'family-tip.webp', name: '温暖分享' }],
        tags: ['友善'],
        stars: 1,
        demo: true,
      },
    ]
  }

  function demoMembers() {
    return [
      { id: 'demo_child', name: '小宝', role: 'child', relation: '宝贝', stars: 86, avatar: 'child-avatar.webp', demo: true },
      { id: 'demo_mum', name: '妈妈', role: 'parent', relation: '记录者', stars: 28, avatar: 'mother-avatar.webp', demo: true },
      { id: 'demo_dad', name: '爸爸', role: 'parent', relation: '参与者', stars: 12, avatar: 'father-avatar.webp', demo: true },
    ]
  }

  function visibleEntries() {
    const real = state.entries.filter(entry => !entry.deleted_at && recordBelongsToActiveFamily(entry))
    if (real.length || state.families.length) return real
    return demoEntries().filter(entry => !state.hiddenDemoIds.has(entry.id))
  }

  function currentFamily() {
    return state.families.find(family => family.id === state.activeFamilyId)
      || { id: 'demo_home', name: '小宝的家', invite_code: 'STAR86', demo: true }
  }

  function recordBelongsToActiveFamily(record) {
    if (record.family_id) return record.family_id === state.activeFamilyId
    const legacyFamily = state.families[0]?.id || 'demo_home'
    return state.activeFamilyId === legacyFamily || state.activeFamilyId === 'demo_home'
  }

  function visibleMembers() {
    const real = state.members.filter(member => !member.deleted_at && recordBelongsToActiveFamily(member))
    if (real.length || state.families.length) return real
    return demoMembers()
  }

  function makeInviteCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
  }

  async function load() {
    $('app').innerHTML = '<div class="loading">正在打开家的星光…</div>'
    try {
      await clawapp.ready()
    } catch (error) {
      toast(error.message || '暂时无法连接应用数据，先展示示例日记')
    }
    try {
      const [entries, members, families] = await Promise.all([
        clawapp.entity.query('praise_entry'),
        clawapp.entity.query('family_member'),
        clawapp.entity.query('praise_family'),
      ])
      state.entries = (entries || []).filter(entry => !entry.deleted_at)
      state.members = (members || []).filter(member => !member.deleted_at)
      state.families = (families || []).filter(family => !family.deleted_at)
      const savedFamily = await appStateGet('active_family_id')
      const hiddenDemoIds = await appStateGet('hidden_demo_ids', [])
      if (Array.isArray(hiddenDemoIds)) state.hiddenDemoIds = new Set(hiddenDemoIds)
      state.activeFamilyId = state.families.some(family => family.id === savedFamily)
        ? savedFamily
        : state.families[0]?.id || 'demo_home'
      if (page === 'glow') {
        const seed = await appStateGet('praise_seed')
        if (seed && typeof seed === 'object') {
          state.editorOpen = true
          state.editorMode = 'text'
          state.draft = { ...defaultDraft(), ...seed }
          await appStateSet('praise_seed', null)
        }
      }
    } catch (error) {
      toast(error.message || String(error))
    }
    state.entries.sort((a, b) => String(b.happened_at || '').localeCompare(String(a.happened_at || '')))
    render()
    void hydrateMedia()
  }

  function render() {
    document.body.classList.toggle('editor-open', page === 'glow' && state.editorOpen)
    document.body.classList.toggle('modal-open', Boolean(state.overlay))
    if (page === 'memories') renderMemories()
    else if (page === 'family') renderFamily()
    else renderGlow()
  }

  function renderGlow() {
    document.body.classList.toggle('editor-open', state.editorOpen)
    const entries = visibleEntries()
    const family = currentFamily()
    const monthEntries = entries.filter(entry => sameMonth(entry.happened_at, state.cursor))
    const starCount = !state.families.length && !state.entries.length
      ? 12
      : monthEntries.reduce((sum, entry) => sum + Math.max(1, Number(entry.stars) || 1), 0)
    const selectedStory = entries.find(entry => dateISO(parseDate(entry.happened_at)) === state.selectedDate) || entries[0]
    const week = weekAround(state.cursor)
    $('app').innerHTML = `
      <section class="hero glow-hero">
        <div class="hero-copy">
          <h1 class="wordmark">夸夸日记<span class="wordmark-star">${icon('star')}</span></h1>
          <button class="family-switch" id="familySwitch"><img src="${asset('family-avatar.webp')}" alt="${escapeHTML(family.name)}"><span>${escapeHTML(family.name)}</span>${icon('down')}</button>
        </div>
      </section>
      <section class="surface glow-surface">
        <div class="month-head"><button class="circle-button" id="prevMonth" aria-label="上个月">${icon('left')}</button><h2 class="month-title">${monthLabel(state.cursor)}</h2><button class="circle-button" id="nextMonth" aria-label="下个月">${icon('right')}</button></div>
        <div class="week-strip" aria-label="本周星光">${week.map(date => {
          const iso = dateISO(date)
          const active = iso === state.selectedDate
          const has = entries.some(entry => dateISO(parseDate(entry.happened_at)) === iso)
          return `<button class="day${active ? ' active' : ''}" data-date="${iso}"><small>${['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}</small><strong>${date.getDate()}</strong><span class="day-star${has ? ' has' : ''}">${icon('star')}</span></button>`
        }).join('')}</div>
        <div class="monthly-banner"><span class="jar-thumb" aria-hidden="true"></span><span>这个月，我们收集了 <b>${starCount}</b> 颗夸夸星</span>${icon('star')}</div>
        <div class="story-list">${selectedStory ? renderStoryCard(selectedStory) : renderHomeEmpty()}</div>
        ${renderCaptureDock()}
      </section>
      ${state.editorOpen ? renderEditor() : ''}
      ${renderOverlay()}`
    bindGlow()
  }

  function renderHomeEmpty() {
    return `<article class="home-empty"><img src="${asset('star-jar.webp')}" alt=""><h2>今天还没有收进星星</h2><p>写一句、说一段，或者放进一张照片，把值得被看见的时刻留下来。</p><button id="emptyCreate">收下第一颗星</button></article>`
  }

  function renderStoryCard(entry) {
    const image = mediaOf(entry, 'image')[0]
    const audio = mediaOf(entry, 'audio')[0]
    const video = mediaOf(entry, 'video')[0]
    const imageSrc = image?.demo ? asset(image.demo) : state.urls.get(image?.id) || ''
    const videoSrc = video?.demo ? asset(video.demo) : state.urls.get(video?.id) || ''
    return `<article class="story-card" data-entry="${escapeHTML(entry.id)}">
      <div class="story-top"><span class="star-badge"><img src="${asset('star-friend.png')}" alt=""></span><h2 class="story-title">${escapeHTML(entry.title)}</h2><button class="more-button" data-entry-action="${escapeHTML(entry.id)}" aria-label="管理这篇日记">${icon('more')}</button></div>
      <div class="story-meta"><img class="child-avatar" src="${asset('child-avatar.webp')}" alt=""><span><b>${escapeHTML(entry.child || '孩子')} · 5岁8个月</b><small>${escapeHTML(entry.author || '家人')}记录</small></span><time>${icon('calendar')}${formatDate(entry.happened_at, true)}</time></div>
      ${entry.body && !entry.demo ? `<p class="story-body">${escapeHTML(entry.body)}</p>` : ''}
      ${(image || audio || video) ? `<div class="media-grid">
        ${image ? `<img class="media-photo" data-media-id="${escapeHTML(image.id)}" src="${imageSrc}" alt="${escapeHTML(image.name || '日记图片')}">` : ''}
        ${(audio || video) ? `<div class="media-lower">${audio ? renderVoice(audio) : '<span></span>'}${video ? `<div class="video-thumb" data-video-id="${escapeHTML(video.id)}">${video.demo || !videoSrc ? `<img data-media-id="${escapeHTML(video.id)}" src="${videoSrc}" alt="${escapeHTML(video.name || '日记视频封面')}">` : `<video data-media-id="${escapeHTML(video.id)}" src="${videoSrc}" preload="metadata" playsinline></video>`}<button class="video-play" aria-label="播放视频">${icon('play')}</button><span class="video-time">${formatDuration(video.duration)}</span></div>` : ''}</div>` : ''}
      </div>` : ''}
    </article>`
  }

  function renderVoice(audio) {
    const bars = [8, 13, 20, 11, 25, 16, 9, 21, 27, 13, 18, 8, 22, 14, 25, 10, 19, 14, 8]
    return `<div class="voice-player" data-audio-id="${escapeHTML(audio.id)}"><button class="play-button" aria-label="播放语音">${icon('play')}</button><div class="wave">${bars.map(height => `<i style="--h:${height}px"></i>`).join('')}</div><span class="duration">${formatDuration(audio.duration)}</span></div>`
  }

  function renderCaptureDock() {
    return `<aside class="capture-dock"><div class="quick-actions"><button class="quick quick-text" data-type="text">${icon('edit')}<span>写文字</span></button><button class="quick quick-audio" data-type="audio">${icon('microphone')}<span>录声音</span></button><button class="quick quick-image" data-type="image">${icon('image')}<span>选图片</span></button><button class="quick quick-video" data-type="video">${icon('video')}<span>拍视频</span></button></div><button class="capture-main" id="captureMain"><img src="${asset('star-cta.png')}" alt=""><span>收下一颗星</span></button></aside>`
  }

  function renderEditor() {
    const recordingSeconds = state.recording ? (Date.now() - state.recordStarted) / 1000 : 0
    const draft = state.draft || defaultDraft()
    return `<div class="scrim" id="editorScrim"><form class="editor" id="entryForm">
      <div class="sheet-handle" aria-hidden="true"></div>
      <div class="editor-head"><h2><img src="${asset('star-friend.png')}" alt="">${state.editingEntryId ? '编辑这颗夸夸星' : '收下一颗夸夸星'}</h2><button type="button" class="editor-close" id="editorClose" aria-label="关闭">${icon('close')}</button></div>
      <button class="chooser" type="button" id="entryChildTrigger"><b>夸夸谁</b><img src="${asset('child-avatar.webp')}" alt=""><span>${escapeHTML(draft.child)}</span>${icon('down')}</button><input id="entryChild" type="hidden" value="${escapeHTML(draft.child)}">
      <label class="editor-field title-field"><span class="sr-only">想夸夸什么</span><input id="entryTitle" maxlength="100" required value="${escapeHTML(draft.title)}" placeholder="你今天勇敢地表达了自己的想法"><small id="titleCount">0/100</small></label>
      <label class="editor-field body-field"><span class="sr-only">把这个美好时刻写下来</span><textarea id="entryBody" maxlength="1500" placeholder="妈妈看见你主动说出了自己的感受，也认真听完了大家的想法，真的很棒。">${escapeHTML(draft.body)}</textarea><small id="bodyCount">0/1500</small></label>
      <div class="draft-tags"><b>给这颗星选个主题</b><div>${['生活自理', '勇敢表达', '温暖善意', '坚持努力'].map(tag => `<button type="button" data-draft-tag="${tag}" class="${draft.tags?.includes(tag) ? 'selected' : ''}">${tag}</button>`).join('')}</div></div>
      <div class="meta-fields"><button type="button" id="entryDateTrigger">${icon('calendar')}<span>${escapeHTML(formatOwnedDateTime(draft.date))}</span>${icon('right')}</button><button type="button" id="entryAuthorTrigger">${icon('user')}<span>${escapeHTML(draft.author)}</span>${icon('down')}</button><input id="entryDate" type="hidden" value="${escapeHTML(draft.date)}"><input id="entryAuthor" type="hidden" value="${escapeHTML(draft.author)}"></div>
      ${state.editorMode === 'audio' || state.recording ? renderRecorder(recordingSeconds) : `<div class="editor-tools"><button type="button" class="editor-tool text-tool" data-add="text">${icon('text')}<span>写文字</span></button><button type="button" class="editor-tool audio-tool" data-add="audio">${icon('microphone')}<span>录声音</span></button><button type="button" class="editor-tool image-tool" data-add="image">${icon('image')}<span>选图片</span></button><button type="button" class="editor-tool video-tool" data-add="video">${icon('video')}<span>拍视频</span></button></div><div id="recordSlot"></div>`}
      <div class="attachment-list" id="attachmentList"></div>
      <button class="save-button" id="saveEntry" ${state.saving || state.recording ? 'disabled' : ''}><span>${state.saving ? '正在收进星星罐…' : state.editingEntryId ? '保存修改' : '保存这颗星'}</span></button><p class="form-error" id="formError"></p>
    </form></div>`
  }

  function renderRecorder(seconds) {
    const bars = [8, 13, 20, 12, 28, 17, 9, 15, 22, 11, 18, 25, 14, 9, 21, 27, 13, 18, 10, 15, 24, 13, 8]
    return `<section class="record-panel"><h3>把夸奖说给孩子听</h3><button type="button" class="record-button${state.recording ? ' on' : ''}" id="recordButton" aria-label="${state.recording ? '停止录音' : '开始录音'}">${icon('microphone')}</button><strong id="recordTime">${state.recording ? formatDuration(seconds) : '00:00'}</strong><div class="record-wave">${bars.map((height, index) => `<i style="--h:${height}px;--delay:${index * -0.045}s"></i>`).join('')}</div><span>${state.recording ? '点击停止录音' : '点击开始录音'}</span><div class="record-actions"><button type="button" id="cancelRecord">取消</button><button type="button" id="finishRecord" ${state.recording ? '' : 'disabled'}>完成录音</button></div><button type="button" class="audio-file-button" id="audioFileButton">选择已有录音</button></section>`
  }

  function bindGlow() {
    $('familySwitch')?.addEventListener('click', () => openOverlay('family-picker'))
    $('prevMonth')?.addEventListener('click', () => moveGlowMonth(-1))
    $('nextMonth')?.addEventListener('click', () => moveGlowMonth(1))
    document.querySelectorAll('.day').forEach(button => button.addEventListener('click', () => {
      state.selectedDate = button.dataset.date
      state.cursor = parseDate(`${state.selectedDate}T12:00:00`)
      renderGlow()
    }))
    document.querySelectorAll('.voice-player').forEach(bindVoicePlayer)
    document.querySelectorAll('.video-thumb').forEach(bindVideoPlayer)
    document.querySelectorAll('.media-photo').forEach(image => image.addEventListener('click', () => openOverlay('media-preview', {
      kind: 'image',
      src: image.currentSrc || image.src,
      title: image.alt || '日记图片',
    })))
    $('captureMain')?.addEventListener('click', () => openEditor('text'))
    $('emptyCreate')?.addEventListener('click', () => openEditor('text'))
    document.querySelectorAll('.quick').forEach(button => button.addEventListener('click', () => openEditor(button.dataset.type)))
    bindEntryActions()
    bindOverlay()
    if (state.editorOpen) bindEditor()
  }

  function moveGlowMonth(delta) {
    const day = Math.min(state.cursor.getDate(), 28)
    state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + delta, day)
    state.selectedDate = dateISO(state.cursor)
    renderGlow()
  }

  function bindVoicePlayer(player) {
    player.querySelector('button')?.addEventListener('click', async () => {
      const id = player.dataset.audioId
      if (id === 'demo_audio') {
        const playing = player.classList.toggle('playing')
        player.querySelector('button').innerHTML = icon(playing ? 'pause' : 'play')
        clearTimeout(player._demoTimer)
        if (playing) player._demoTimer = setTimeout(() => {
          player.classList.remove('playing')
          player.querySelector('button').innerHTML = icon('play')
        }, 4200)
        return
      }
      const url = state.urls.get(id)
      if (!url) { toast('语音还在加载'); return }
      let audio = player._audio
      if (!audio) audio = player._audio = new Audio(url)
      if (audio.paused) { await audio.play(); player.querySelector('button').innerHTML = icon('pause') }
      else { audio.pause(); player.querySelector('button').innerHTML = icon('play') }
      audio.onended = () => { player.querySelector('button').innerHTML = icon('play') }
    })
  }

  function bindVideoPlayer(box) {
    box.querySelector('button')?.addEventListener('click', async () => {
      const id = box.dataset.videoId
      if (id === 'demo_video') {
        openOverlay('media-preview', { kind: 'video-demo', src: asset('backpack-video.webp'), title: '自己收拾书包' })
        return
      }
      const video = box.querySelector('video')
      const src = video?.currentSrc || video?.src || state.urls.get(id)
      if (src) openOverlay('media-preview', { kind: 'video', src, title: '日记视频' })
    })
  }

  function openEditor(kind = 'text', seed = {}) {
    state.editorOpen = true
    state.editorMode = kind === 'audio' ? 'audio' : 'text'
    state.editingEntryId = ''
    state.removedMediaIds = []
    state.attachments = []
    state.draft = { ...defaultDraft(), ...seed }
    renderGlow()
    if (kind === 'image') $('photoInput')?.click()
    if (kind === 'video') $('videoInput')?.click()
    if (kind === 'text') setTimeout(() => $('entryTitle')?.focus(), 0)
  }

  function openEntryEditor(entry) {
    state.overlay = null
    state.editorOpen = true
    state.editorMode = 'text'
    state.editingEntryId = entry.demo ? '' : entry.id
    state.removedMediaIds = []
    state.draft = {
      title: entry.title || '',
      body: entry.body || '',
      child: entry.child || '小宝',
      author: `${entry.author || '妈妈'}记录`,
      date: new Date(parseDate(entry.happened_at).getTime() - parseDate(entry.happened_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      tags: Array.isArray(entry.tags) ? entry.tags : [],
    }
    state.attachments = entry.demo ? [] : (entry.media || []).map(item => ({
      saved: item,
      kind: item.kind,
      name: item.name || '日记媒体',
      duration: item.duration || 0,
      preview: item.kind === 'image' ? state.urls.get(item.id) || '' : '',
      localPreview: false,
      owned: false,
    }))
    renderGlow()
  }

  function bindEditor() {
    $('editorClose')?.addEventListener('click', closeEditor)
    $('editorScrim')?.addEventListener('click', event => { if (event.target === $('editorScrim')) closeEditor() })
    $('entryForm')?.addEventListener('submit', saveEntry)
    $('entryChildTrigger')?.addEventListener('click', () => {
      captureDraft()
      openOverlay('entry-child-picker')
    })
    $('entryDateTrigger')?.addEventListener('click', () => {
      captureDraft()
      openOverlay('entry-date-picker', { value: state.draft.date, month: state.draft.date.slice(0, 7) })
    })
    $('entryAuthorTrigger')?.addEventListener('click', () => {
      captureDraft()
      openOverlay('entry-author-picker')
    })
    for (const id of ['entryTitle', 'entryBody', 'entryChild', 'entryDate', 'entryAuthor']) {
      $(id)?.addEventListener('input', () => { captureDraft(); updateCounts() })
      $(id)?.addEventListener('change', captureDraft)
    }
    document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.add === 'image') { captureDraft(); $('photoInput')?.click() }
      else if (button.dataset.add === 'video') { captureDraft(); $('videoInput')?.click() }
      else if (button.dataset.add === 'audio') {
        captureDraft()
        state.editorMode = 'audio'
        renderGlow()
      }
    }))
    document.querySelectorAll('[data-draft-tag]').forEach(button => button.addEventListener('click', () => {
      button.classList.toggle('selected')
      captureDraft()
    }))
    $('photoInput').onchange = event => addFiles(event.target.files, 'image')
    $('videoInput').onchange = event => addFiles(event.target.files, 'video')
    $('audioInput').onchange = event => addFiles(event.target.files, 'audio')
    bindRecorder()
    renderAttachments()
    updateCounts()
  }

  function defaultDraft() {
    const local = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    return { title: '', body: '', child: '小宝', author: '妈妈记录', date: local, tags: [] }
  }

  function captureDraft() {
    if (!$('entryForm')) return
    state.draft = {
      title: $('entryTitle')?.value || '',
      body: $('entryBody')?.value || '',
      child: $('entryChild')?.value || '小宝',
      author: $('entryAuthor')?.value || '妈妈记录',
      date: $('entryDate')?.value || defaultDraft().date,
      tags: [...document.querySelectorAll('[data-draft-tag].selected')].map(button => button.dataset.draftTag),
    }
  }

  function updateCounts() {
    if ($('titleCount')) $('titleCount').textContent = `${$('entryTitle')?.value.length || 0}/100`
    if ($('bodyCount')) $('bodyCount').textContent = `${$('entryBody')?.value.length || 0}/1500`
  }

  function bindRecorder() {
    $('recordButton')?.addEventListener('click', () => state.recording ? stopRecording() : startRecording())
    $('finishRecord')?.addEventListener('click', stopRecording)
    $('cancelRecord')?.addEventListener('click', cancelRecording)
    $('audioFileButton')?.addEventListener('click', () => $('audioInput')?.click())
  }

  async function closeEditor() {
    if (state.recording) await cancelRecording()
    for (const item of state.attachments) {
      if (item.owned && item.saved?.id) await clawapp.media.remove(item.saved.id).catch(() => {})
      if (item.localPreview && item.preview) URL.revokeObjectURL(item.preview)
    }
    state.attachments = []
    state.editorOpen = false
    state.editorMode = 'text'
    state.draft = null
    state.editingEntryId = ''
    state.removedMediaIds = []
    renderGlow()
  }

  function addFiles(files, kind) {
    captureDraft()
    for (const file of Array.from(files || [])) {
      if (file.size > 32 * 1024 * 1024) { toast(`${file.name} 超过 32 MiB`); continue }
      state.attachments.push({ file, kind, name: file.name, preview: URL.createObjectURL(file), localPreview: true, duration: 0 })
    }
    $('photoInput').value = ''
    $('videoInput').value = ''
    $('audioInput').value = ''
    state.editorMode = 'text'
    renderAttachments()
  }

  function renderAttachments() {
    const slot = $('attachmentList')
    if (!slot) return
    slot.innerHTML = state.attachments.map((item, index) => {
      if (item.kind === 'image' && item.preview) return `<figure class="attachment-preview"><img src="${item.preview}" alt="${escapeHTML(item.name)}"><button type="button" data-remove="${index}" aria-label="移除">${icon('close')}</button></figure>`
      return `<div class="attachment">${icon(item.kind === 'audio' ? 'microphone' : item.kind === 'video' ? 'video' : 'image')}<span>${escapeHTML(item.name)}${item.duration ? ` · ${formatDuration(item.duration)}` : ''}</span><button type="button" data-remove="${index}" aria-label="移除">${icon('trash')}</button></div>`
    }).join('')
    slot.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      const [removed] = state.attachments.splice(Number(button.dataset.remove), 1)
      if (removed?.localPreview && removed.preview) URL.revokeObjectURL(removed.preview)
      if (removed?.owned && removed.saved?.id) void clawapp.media.remove(removed.saved.id).catch(() => {})
      else if (removed?.saved?.id) state.removedMediaIds.push(removed.saved.id)
      renderAttachments()
    }))
  }

  async function startRecording() {
    try {
      captureDraft()
      state.recorderSource = ''
      let hostError = null
      if (clawapp.media?.recorder?.start) {
        try {
          await clawapp.media.recorder.start()
          state.recorderSource = 'host'
        } catch (error) {
          hostError = error
        }
      }
      if (!state.recorderSource) {
        try {
          await startBrowserRecording()
          state.recorderSource = 'browser'
        } catch (error) {
          throw hostError || error
        }
      }
      state.recordStarted = Date.now()
      state.recording = true
      state.recordTimer = setInterval(() => {
        const time = $('recordTime')
        if (time) time.textContent = formatDuration((Date.now() - state.recordStarted) / 1000)
      }, 250)
      renderGlow()
    } catch (error) {
      toast(error.message || '无法使用麦克风')
    }
  }

  async function stopRecording() {
    if (!state.recording) return
    clearInterval(state.recordTimer)
    let savedOK = false
    try {
      const duration = Math.max(1, Math.round((Date.now() - state.recordStarted) / 1000))
      if (state.recorderSource === 'browser') {
        const file = await stopBrowserRecording()
        state.attachments.push({ file, kind: 'audio', name: file.name, duration })
      } else {
        const saved = await clawapp.media.recorder.stop()
        state.attachments.push({ saved, owned: true, kind: 'audio', name: saved.name || '夸夸语音', duration: saved.duration || duration })
      }
      savedOK = true
      toast('录音已经收好')
    } catch (error) {
      toast(error.message || '录音保存失败')
    } finally {
      state.recording = false
      state.recorderSource = ''
      state.editorMode = savedOK ? 'text' : 'audio'
      renderGlow()
    }
  }

  async function cancelRecording() {
    clearInterval(state.recordTimer)
    if (state.recording && state.recorderSource === 'browser') cancelBrowserRecording()
    else if (state.recording) await clawapp.media.recorder.cancel().catch(() => {})
    state.recording = false
    state.recorderSource = ''
    state.editorMode = 'text'
    renderGlow()
  }

  async function startBrowserRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('当前浏览器不支持录音')
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported?.(type)) || ''
    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    state.browserChunks = []
    recorder.addEventListener('dataavailable', event => { if (event.data?.size) state.browserChunks.push(event.data) })
    recorder.start(250)
    state.browserRecorder = recorder
    state.browserStream = stream
  }

  async function stopBrowserRecording() {
    const recorder = state.browserRecorder
    if (!recorder) throw new Error('录音器没有启动')
    const blob = await new Promise((resolve, reject) => {
      recorder.addEventListener('error', event => reject(event.error || new Error('录音失败')), { once: true })
      recorder.addEventListener('stop', () => resolve(new Blob(state.browserChunks, { type: recorder.mimeType || 'audio/webm' })), { once: true })
      if (recorder.state === 'inactive') resolve(new Blob(state.browserChunks, { type: recorder.mimeType || 'audio/webm' }))
      else recorder.stop()
    })
    const mime = blob.type || 'audio/webm'
    const extension = mime.includes('mp4') ? 'm4a' : 'webm'
    const file = new File([blob], `夸夸语音-${Date.now()}.${extension}`, { type: mime })
    releaseBrowserStream()
    return file
  }

  function cancelBrowserRecording() {
    const recorder = state.browserRecorder
    if (recorder?.state && recorder.state !== 'inactive') {
      recorder.ondataavailable = null
      try { recorder.stop() } catch { /* recorder already stopped */ }
    }
    releaseBrowserStream()
  }

  function releaseBrowserStream() {
    for (const track of state.browserStream?.getTracks?.() || []) track.stop()
    state.browserRecorder = null
    state.browserStream = null
    state.browserChunks = []
  }

  async function saveEntry(event) {
    event.preventDefault()
    const title = $('entryTitle').value.trim()
    if (!title) { $('formError').textContent = '先写一句想夸夸的话'; $('entryTitle').focus(); return }
    state.saving = true
    $('saveEntry').disabled = true
    $('saveEntry').querySelector('span').textContent = '正在收进星星罐…'
    const uploaded = []
    const cleanupIds = []
    try {
      const family = await ensureFamily(true)
      for (const item of state.attachments) {
        const saved = item.saved || await clawapp.media.save(item.file, { name: item.name })
        if (!item.saved) cleanupIds.push(saved.id)
        uploaded.push({ id: saved.id, kind: item.kind, name: saved.name, mime: saved.mime, size: saved.size, duration: item.duration || 0 })
      }
      const author = $('entryAuthor').value.replace(/记录$/, '')
      const payload = {
        family_id: family.id,
        title,
        body: $('entryBody').value.trim(),
        child: $('entryChild').value.trim() || '孩子',
        author,
        happened_at: new Date($('entryDate').value).toISOString(),
        media: uploaded,
        tags: [...document.querySelectorAll('[data-draft-tag].selected')].map(button => button.dataset.draftTag),
        stars: 1,
        updated_at: new Date().toISOString(),
      }
      if (state.editingEntryId) {
        const record = await clawapp.entity.update('praise_entry', state.editingEntryId, payload)
        const existing = state.entries.find(entry => entry.id === state.editingEntryId)
        if (existing) Object.assign(existing, record && typeof record === 'object' ? record : payload)
      } else {
        const record = await clawapp.entity.insert('praise_entry', { ...payload, created_at: new Date().toISOString() })
        state.entries.unshift(record && typeof record === 'object' ? record : { id: `local_${Date.now()}`, ...payload })
      }
      await Promise.all(state.removedMediaIds.map(id => clawapp.media.remove(id).catch(() => {})))
      for (const item of state.attachments) if (item.localPreview && item.preview) URL.revokeObjectURL(item.preview)
      state.attachments = []
      state.editorOpen = false
      state.editorMode = 'text'
      state.draft = null
      state.editingEntryId = ''
      state.removedMediaIds = []
      state.saving = false
      renderGlow()
      await hydrateMedia()
      toast('这颗夸夸星已经收好')
    } catch (error) {
      for (const id of cleanupIds) await clawapp.media.remove(id).catch(() => {})
      state.saving = false
      renderGlow()
      $('formError').textContent = error.message || String(error)
    }
  }

  async function hydrateMedia() {
    const ids = []
    for (const entry of state.entries) {
      for (const media of Array.isArray(entry.media) ? entry.media : []) {
        if (media?.id && !media.demo && !state.urls.has(media.id)) ids.push(media.id)
      }
    }
    let changed = false
    await Promise.all(ids.map(async id => {
      try { state.urls.set(id, await clawapp.media.url(id)); changed = true } catch { /* stale media remains hidden */ }
    }))
    if (changed) render()
  }

  function calendarCells(month, entries) {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const prevDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate()
    const cells = []
    for (let index = first.getDay() - 1; index >= 0; index--) cells.push(`<button class="cal-day outside" disabled>${prevDays - index}</button>`)
    for (let day = 1; day <= days; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day)
      const iso = dateISO(date)
      const demoStarDays = [2, 8, 9, 11, 13, 15, 16, 18, 22, 24, 27]
      const has = state.entries.length
        ? entries.some(entry => dateISO(parseDate(entry.happened_at)) === iso)
        : month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth() && demoStarDays.includes(day)
      const selected = iso === state.selectedDate
      cells.push(`<button class="cal-day${has ? ' has' : ''}${selected ? ' selected' : ''}" data-date="${iso}">${day}${has ? icon('star') : ''}</button>`)
    }
    while (cells.length < 42) cells.push(`<button class="cal-day outside" disabled>${cells.length - first.getDay() - days + 1}</button>`)
    return cells.join('')
  }

  function renderMemories() {
    const entries = visibleEntries()
    const filtered = state.memoryFilter === 'all'
      ? entries
      : entries.filter(entry => (entry.tags || []).includes(state.memoryFilter))
    $('app').innerHTML = `<section class="memories-page"><header class="page-hero memories-hero"><div><h1>时光<span>${icon('star')}</span></h1><p>那些被认真看见的瞬间，会一直发光</p></div></header><section class="memory-surface"><div class="calendar-card"><div class="calendar-head"><button id="memoryPrev" aria-label="上个月">${icon('left')}</button><h2>${monthLabel(state.memoryCursor)} ${icon('down')}</h2><button id="memoryNext" aria-label="下个月">${icon('right')}</button></div><div class="calendar-grid"><div class="weekday-row">${['日', '一', '二', '三', '四', '五', '六'].map(day => `<b>${day}</b>`).join('')}</div>${calendarCells(state.memoryCursor, entries)}</div></div><div class="memory-controls"><button class="filter-chip" id="filterChip">${icon('star')}<span>${state.memoryFilter === 'all' ? '全部星光' : escapeHTML(state.memoryFilter)}</span>${icon('down')}</button><label class="memory-search">${icon('search')}<input id="memorySearch" aria-label="搜索星光" placeholder="搜索"></label></div><div class="timeline" id="memoryTimeline">${renderTimeline(filtered)}</div></section></section>${renderOverlay()}`
    bindMemories(entries)
    bindTimelineInteractions()
    bindOverlay()
  }

  function renderTimeline(entries) {
    if (!entries.length) return '<p class="empty">没有找到这颗星，换个词试试</p>'
    return entries.map(renderTimelineItem).join('')
  }

  function renderTimelineItem(entry) {
    const media = mediaOf(entry, 'image')[0] || mediaOf(entry, 'video')[0]
    const src = entry.timelineDemo
      ? asset(entry.timelineDemo)
      : media?.demo ? asset(media.demo) : state.urls.get(media?.id) || asset('star-jar-hero.webp')
    const tag = entry.tags?.[0] || '闪光时刻'
    return `<section class="timeline-item"><div class="timeline-date"><i></i><b>${formatDate(entry.happened_at)}　星期${['日', '一', '二', '三', '四', '五', '六'][parseDate(entry.happened_at).getDay()]}</b>${icon('star')}</div><article class="memory-card" data-entry-card="${escapeHTML(entry.id)}"><img src="${src}" alt=""><div><button class="more-button" data-entry-action="${escapeHTML(entry.id)}" aria-label="管理这篇日记">${icon('more')}</button><h3>${escapeHTML(entry.title)}</h3><p>${escapeHTML(entry.body || '把这个值得被看见的瞬间，认真地收藏起来。')}</p><span class="tag-chip">${icon('happy')} ${escapeHTML(tag)}</span></div></article></section>`
  }

  function bindMemories(entries) {
    $('memoryPrev')?.addEventListener('click', () => { state.memoryCursor = new Date(state.memoryCursor.getFullYear(), state.memoryCursor.getMonth() - 1, 1); renderMemories() })
    $('memoryNext')?.addEventListener('click', () => { state.memoryCursor = new Date(state.memoryCursor.getFullYear(), state.memoryCursor.getMonth() + 1, 1); renderMemories() })
    document.querySelectorAll('.cal-day[data-date]').forEach(button => button.addEventListener('click', () => {
      state.selectedDate = button.dataset.date
      const matching = entries.filter(entry => dateISO(parseDate(entry.happened_at)) === state.selectedDate)
      $('memoryTimeline').innerHTML = renderTimeline(matching)
      bindTimelineInteractions()
      document.querySelectorAll('.cal-day').forEach(day => day.classList.toggle('selected', day.dataset.date === state.selectedDate))
    }))
    $('filterChip')?.addEventListener('click', () => openOverlay('filter'))
    $('memorySearch')?.addEventListener('input', event => {
      const query = event.target.value.trim().toLowerCase()
      const found = entries.filter(entry => [entry.title, entry.body, entry.child, entry.author, ...(entry.tags || [])].join(' ').toLowerCase().includes(query))
      $('memoryTimeline').innerHTML = renderTimeline(found)
      bindTimelineInteractions()
    })
  }

  function bindTimelineInteractions() {
    bindEntryActions()
    document.querySelectorAll('[data-entry-card]').forEach(card => card.addEventListener('click', () => openOverlay('entry-detail', { id: card.dataset.entryCard })))
  }

  function renderFamily() {
    const family = currentFamily()
    const members = visibleMembers()
    const entries = visibleEntries()
    const isDemo = !state.families.length && !state.entries.length && !state.members.length
    const total = isDemo ? 126 : entries.reduce((sum, entry) => sum + Math.max(1, Number(entry.stars) || 1), 0)
    const childMoments = isDemo ? 86 : entries.filter(entry => members.some(member => member.role === 'child' && member.name === entry.child)).length
    $('app').innerHTML = `<section class="family-page"><header class="page-hero family-hero"><div><h1>家人<span>${icon('star')}</span></h1><button class="family-title-switch" id="familyTitleSwitch"><span>${escapeHTML(family.name)}</span>${icon('down')}</button><p>一起收集每一颗成长的星</p></div></header><section class="family-surface"><article class="family-summary"><img src="${asset('star-friend.png')}" alt=""><div><span>全家已收集星光</span><strong>${total}<small>颗</small></strong></div><i></i><p>一起为家人<br>记录 <b>${childMoments}</b> 个闪光瞬间</p>${icon('star')}</article><div class="member-list">${members.map(member => renderMember(member, entries)).join('')}${members.length ? '' : `<button class="empty-member" id="emptyAddMember">${icon('add')}<span>添加第一位家庭成员</span></button>`}</div><article class="family-tip"><div><h3>${icon('idea')} 夸夸小贴士</h3><p>每一次真诚的夸奖，都是孩子<br>心里闪亮的星星。</p><button id="tipButton">${icon('happy')} 今日灵感</button></div><img src="${asset('family-tip.webp')}" alt="小宝举起一颗夸夸星"></article><button class="invite-family" id="inviteFamily">${icon('add')}<span>邀请家人</span><img src="${asset('invite-envelope.webp')}" alt="邀请家人的星星信封"></button></section></section>${renderOverlay()}`
    $('familyTitleSwitch')?.addEventListener('click', () => openOverlay('family-picker'))
    $('tipButton')?.addEventListener('click', () => openOverlay('tip'))
    $('inviteFamily')?.addEventListener('click', () => void prepareInvite().catch(error => toast(error.message || String(error))))
    $('emptyAddMember')?.addEventListener('click', () => openOverlay('member-form'))
    document.querySelectorAll('.member-card').forEach(card => card.addEventListener('click', () => openOverlay('member-form', { id: card.dataset.memberId })))
    bindOverlay()
  }

  function renderMember(member, entries) {
    const count = state.entries.length
      ? entries.filter(entry => entry.child === member.name || entry.author === member.name).length
      : member.stars || 0
    const avatar = member.avatar_media_id && state.urls.get(member.avatar_media_id)
      ? state.urls.get(member.avatar_media_id)
      : asset(member.avatar || (member.role === 'child' ? 'child-avatar.webp' : 'family-avatar.webp'))
    return `<button class="member-card" data-member-id="${escapeHTML(member.id)}"><img src="${avatar}" alt=""><div><h3>${escapeHTML(member.name)}</h3><span>${escapeHTML(member.relation || (member.role === 'child' ? '宝贝' : '家人'))}</span><p>收集星光 <b>${count}</b> 颗</p></div><span class="member-star">${icon('star')}</span>${icon('right')}</button>`
  }

  window.addEventListener('pagehide', () => {
    for (const url of state.urls.values()) clawapp.media.revoke(url)
    state.urls.clear()
    if (state.recording && state.recorderSource === 'browser') cancelBrowserRecording()
    else if (state.recording) clawapp.media.recorder.cancel().catch(() => {})
  })

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true })
  else void load()
})()
