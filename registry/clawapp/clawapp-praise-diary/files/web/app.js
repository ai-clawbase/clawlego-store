(function () {
  'use strict'

  const $ = id => document.getElementById(id)
  const page = document.body.dataset.page || 'glow'
  const asset = name => `assets/${name}`
  const state = {
    entries: [],
    members: [],
    urls: new Map(),
    editorOpen: false,
    saving: false,
    attachments: [],
    recording: false,
    recordStarted: 0,
    recordTimer: 0,
    toastTimer: 0,
  }

  function icon(name, className = '') {
    const body = (window.PraiseIcons || {})[name] || window.PraiseIcons.star
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

  function dateISO(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }

  function formatDate(value, full = false) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value || ''
    return new Intl.DateTimeFormat('zh-CN', full
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { month: 'numeric', day: 'numeric' }).format(d)
  }

  function formatClock(value) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(d)
  }

  function formatDuration(seconds) {
    const n = Math.max(0, Math.round(Number(seconds) || 0))
    return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
  }

  function currentWeek() {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - 3)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      return date
    })
  }

  function mediaOf(entry, kind) {
    const list = Array.isArray(entry.media) ? entry.media : []
    return list.filter(item => item && item.kind === kind)
  }

  function demoEntry() {
    return {
      id: 'demo_backpack',
      title: '你自己整理好了小书包',
      body: '睡前你照着明天的课程表，一样一样把绘本和水杯放好。认真检查完还告诉妈妈：“我已经准备好啦！”',
      child: '小宝',
      author: '妈妈',
      happened_at: new Date().toISOString(),
      media: [
        { id: 'demo_photo', kind: 'image', demo: 'backpack-memory.webp', name: '整理好的小书包' },
        { id: 'demo_audio', kind: 'audio', demo: true, duration: 18, name: '妈妈的夸夸语音' },
        { id: 'demo_video', kind: 'video', demo: 'backpack-video.webp', duration: 32, name: '自己收拾书包' },
      ],
      tags: ['独立', '生活能力'],
      stars: 1,
      demo: true,
    }
  }

  function demoMembers() {
    return [
      { id: 'demo_child', name: '小宝', role: 'child', relation: '孩子', color: '#667cd3', stars: 7, demo: true },
      { id: 'demo_mum', name: '妈妈', role: 'parent', relation: '记录者', color: '#e88478', stars: 3, demo: true },
      { id: 'demo_dad', name: '爸爸', role: 'parent', relation: '记录者', color: '#67a27d', stars: 2, demo: true },
    ]
  }

  async function load() {
    $('app').innerHTML = '<div class="loading">正在打开家的星光…</div>'
    await clawapp.ready()
    try {
      state.entries = await clawapp.entity.query('praise_entry') || []
      state.members = await clawapp.entity.query('family_member') || []
    } catch (error) {
      toast(error.message || String(error))
    }
    state.entries.sort((a, b) => String(b.happened_at || '').localeCompare(String(a.happened_at || '')))
    render()
    void hydrateMedia()
  }

  function render() {
    if (page === 'memories') renderMemories()
    else if (page === 'family') renderFamily()
    else renderGlow()
  }

  function renderGlow() {
    const visible = state.entries.length ? state.entries : [demoEntry()]
    const month = new Date().getMonth()
    const actualCount = state.entries.filter(entry => new Date(entry.happened_at).getMonth() === month).length
    const starCount = actualCount || 12
    const week = currentWeek()
    const story = visible[0]
    $('app').innerHTML = `
      <section class="hero">
        <div class="hero-copy">
          <h1 class="wordmark">夸夸日记<span class="wordmark-star">${icon('star')}</span></h1>
          <button class="family-switch" id="familySwitch"><img src="${asset('family-avatar.webp')}" alt=""><span>小宝的家</span>${icon('group')}</button>
          <span class="privacy-note">只在你的 ClawLego 实例中保存</span>
        </div>
      </section>
      <section class="surface">
        <div class="month-head"><button class="circle-button" aria-label="上个月">${icon('left')}</button><h2 class="month-title">${new Date().getFullYear()}年${new Date().getMonth() + 1}月</h2><button class="circle-button" aria-label="下个月">${icon('right')}</button></div>
        <div class="week-strip" aria-label="本周星光">${week.map(date => {
          const active = dateISO(date) === dateISO()
          const has = active || state.entries.some(entry => String(entry.happened_at || '').slice(0, 10) === dateISO(date))
          return `<button class="day${active ? ' active' : ''}" data-date="${dateISO(date)}"><small>${['日','一','二','三','四','五','六'][date.getDay()]}</small><strong>${date.getDate()}</strong>${has ? icon('star', 'day-star') : '<span class="day-star"></span>'}</button>`
        }).join('')}</div>
        <div class="monthly-banner">${icon('star')}<span>这个月，我们收集了 <b>${starCount}</b> 颗夸夸星</span></div>
        <div class="story-list">
          <div>${renderStoryCard(story)}</div>
          ${renderCaptureDock()}
        </div>
      </section>
      ${state.editorOpen ? renderEditor() : ''}`
    bindGlow()
  }

  function renderStoryCard(entry) {
    const images = mediaOf(entry, 'image')
    const audios = mediaOf(entry, 'audio')
    const videos = mediaOf(entry, 'video')
    const image = images[0]
    const audio = audios[0]
    const video = videos[0]
    const imageSrc = image?.demo ? asset(image.demo) : state.urls.get(image?.id) || ''
    const videoSrc = video?.demo ? asset(video.demo) : state.urls.get(video?.id) || ''
    return `<article class="story-card" data-entry="${escapeHTML(entry.id)}">
      <div class="story-top"><span class="star-badge">${icon('star')}</span><h2 class="story-title">${escapeHTML(entry.title)}</h2><button class="more-button" aria-label="更多">${icon('more')}</button></div>
      <div class="story-meta"><b>${escapeHTML(entry.child || '孩子')}</b><span>${escapeHTML(entry.author || '家人')}记录</span><span>${formatDate(entry.happened_at, true)} · ${formatClock(entry.happened_at)}</span></div>
      ${entry.body ? `<p class="story-body">${escapeHTML(entry.body)}</p>` : ''}
      ${(image || audio || video) ? `<div class="media-grid">
        ${image ? `<img class="media-photo" data-media-id="${escapeHTML(image.id)}" src="${imageSrc}" alt="${escapeHTML(image.name || '日记图片')}">` : ''}
        ${audio ? renderVoice(audio) : ''}
        ${video ? `<div class="video-thumb" data-video-id="${escapeHTML(video.id)}">${video.demo || !videoSrc ? `<img data-media-id="${escapeHTML(video.id)}" src="${videoSrc}" alt="${escapeHTML(video.name || '日记视频封面')}">` : `<video data-media-id="${escapeHTML(video.id)}" src="${videoSrc}" preload="metadata" playsinline></video>`}<button class="video-play" aria-label="播放视频">${icon('play')}</button><span class="video-time">${formatDuration(video.duration)}</span></div>` : ''}
      </div>` : ''}
      <div class="story-actions"><button class="reaction">真棒</button><button class="reaction">好暖心</button></div>
    </article>`
  }

  function renderVoice(audio) {
    const bars = [9,17,24,13,28,19,11,23,29,15,20,10,25,17,28,12,22,16,9]
    return `<div class="voice-player" data-audio-id="${escapeHTML(audio.id)}"><button class="play-button" aria-label="播放语音">${icon('play')}</button><div class="wave">${bars.map(h => `<i style="--h:${h}px"></i>`).join('')}</div><span class="duration">${formatDuration(audio.duration)}</span></div>`
  }

  function renderCaptureDock() {
    return `<aside class="capture-dock"><p class="capture-prompt">今天，想把哪颗星收进来？</p><button class="capture-main" id="captureMain">${icon('star')}<span>收下一颗星</span></button><div class="quick-actions"><button class="quick" data-type="text">${icon('edit')}<span>写文字</span></button><button class="quick" data-type="audio">${icon('microphone')}<span>录声音</span></button><button class="quick" data-type="image">${icon('image')}<span>选图片</span></button><button class="quick" data-type="video">${icon('video')}<span>拍视频</span></button></div></aside>`
  }

  function renderEditor() {
    return `<div class="scrim" id="editorScrim"><form class="editor" id="entryForm"><div class="editor-head"><h2>收下一颗夸夸星</h2><button type="button" class="editor-close" id="editorClose" aria-label="关闭">${icon('close')}</button></div>
      <div class="field"><label for="entryTitle">想夸夸什么</label><input id="entryTitle" maxlength="100" required placeholder="例如：你今天勇敢地表达了自己的想法"></div>
      <div class="field"><label for="entryBody">把这个美好时刻写下来</label><textarea id="entryBody" maxlength="1500" placeholder="发生了什么？你看见了孩子怎样的努力？"></textarea></div>
      <div class="field-row"><div class="field"><label for="entryChild">夸夸谁</label><input id="entryChild" maxlength="30" value="小宝" required></div><div class="field"><label for="entryAuthor">谁记录</label><select id="entryAuthor"><option>妈妈</option><option>爸爸</option><option>孩子</option><option>其他家人</option></select></div></div>
      <div class="field"><label for="entryDate">发生时间</label><input id="entryDate" type="datetime-local" required></div>
      <div class="editor-tools"><button type="button" class="editor-tool" data-add="audio">${icon('microphone')}录声音</button><button type="button" class="editor-tool" data-add="image">${icon('image')}选图片</button><button type="button" class="editor-tool" data-add="video">${icon('video')}拍视频</button></div>
      <div id="recordSlot"></div><div class="attachment-list" id="attachmentList"></div>
      <button class="save-button" id="saveEntry" ${state.saving ? 'disabled' : ''}>${state.saving ? '正在收进星星罐…' : '保存这颗星'}</button><p class="form-error" id="formError"></p>
    </form></div>`
  }

  function bindGlow() {
    $('familySwitch')?.addEventListener('click', () => clawapp.nav.switchTab('family'))
    document.querySelectorAll('.reaction').forEach(button => button.addEventListener('click', () => { button.textContent = button.textContent.includes('已') ? button.textContent.replace('已', '') : `已${button.textContent}` }))
    document.querySelectorAll('.voice-player').forEach(bindVoicePlayer)
    document.querySelectorAll('.video-thumb').forEach(bindVideoPlayer)
    $('captureMain')?.addEventListener('click', () => openEditor('text'))
    document.querySelectorAll('.quick').forEach(button => button.addEventListener('click', () => openEditor(button.dataset.type)))
    if (state.editorOpen) bindEditor()
  }

  function bindVoicePlayer(player) {
    player.querySelector('button')?.addEventListener('click', async () => {
      const id = player.dataset.audioId
      if (id === 'demo_audio') { toast('这是一条示例语音，记录后即可真实播放'); return }
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
      if (id === 'demo_video') { toast('这是一段示例封面，录制后可在这里播放'); return }
      const video = box.querySelector('video')
      if (!video) return
      if (video.paused) { await video.play(); box.querySelector('button').innerHTML = icon('pause') }
      else { video.pause(); box.querySelector('button').innerHTML = icon('play') }
      video.onended = () => { box.querySelector('button').innerHTML = icon('play') }
    })
  }

  function openEditor(kind) {
    state.editorOpen = true
    state.attachments = []
    renderGlow()
    const input = $('entryDate')
    if (input) input.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    if (kind === 'image') $('photoInput').click()
    if (kind === 'video') $('videoInput').click()
    if (kind === 'audio') showRecorder()
    if (kind === 'text') setTimeout(() => $('entryTitle')?.focus(), 0)
  }

  function bindEditor() {
    $('editorClose')?.addEventListener('click', closeEditor)
    $('editorScrim')?.addEventListener('click', event => { if (event.target === $('editorScrim')) closeEditor() })
    $('entryForm')?.addEventListener('submit', saveEntry)
    document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.add === 'image') $('photoInput').click()
      else if (button.dataset.add === 'video') $('videoInput').click()
      else showRecorder()
    }))
    $('photoInput').onchange = event => addFiles(event.target.files, 'image')
    $('videoInput').onchange = event => addFiles(event.target.files, 'video')
    $('audioInput').onchange = event => addFiles(event.target.files, 'audio')
    renderAttachments()
  }

  async function closeEditor() {
    if (state.recording) {
      clearInterval(state.recordTimer)
      await clawapp.media.recorder.cancel().catch(() => {})
      state.recording = false
    }
    for (const item of state.attachments) {
      if (item.saved?.id) await clawapp.media.remove(item.saved.id).catch(() => {})
    }
    state.attachments.forEach(item => { if (item.preview) URL.revokeObjectURL(item.preview) })
    state.attachments = []
    state.editorOpen = false
    renderGlow()
  }

  function addFiles(files, kind) {
    for (const file of Array.from(files || [])) {
      if (file.size > 32 * 1024 * 1024) { toast(`${file.name} 超过 32 MiB`); continue }
      state.attachments.push({ file, kind, name: file.name, preview: URL.createObjectURL(file), duration: 0 })
    }
    $('photoInput').value = ''
    $('videoInput').value = ''
    $('audioInput').value = ''
    renderAttachments()
  }

  function renderAttachments() {
    const slot = $('attachmentList')
    if (!slot) return
    slot.innerHTML = state.attachments.map((item, index) => `<div class="attachment">${icon(item.kind === 'audio' ? 'microphone' : item.kind === 'video' ? 'video' : 'image')}<span>${escapeHTML(item.name)}${item.duration ? ` · ${formatDuration(item.duration)}` : ''}</span><button type="button" data-remove="${index}" aria-label="移除">${icon('trash')}</button></div>`).join('')
    slot.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      const [removed] = state.attachments.splice(Number(button.dataset.remove), 1)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      if (removed?.saved?.id) void clawapp.media.remove(removed.saved.id).catch(() => {})
      renderAttachments()
    }))
  }

  function showRecorder() {
    const slot = $('recordSlot')
    if (!slot) return
    slot.innerHTML = `<div class="record-panel"><button type="button" class="record-button${state.recording ? ' on' : ''}" id="recordButton" aria-label="${state.recording ? '停止录音' : '开始录音'}">${icon(state.recording ? 'pause' : 'microphone')}</button><strong id="recordTime">${state.recording ? formatDuration((Date.now() - state.recordStarted) / 1000) : '点一下开始录音'}</strong><span>由 ClawLego 安全录制 · 最多建议 3 分钟</span><button type="button" class="audio-file-button" id="audioFileButton">也可以选择已有录音</button></div>`
    $('recordButton')?.addEventListener('click', () => state.recording ? stopRecording() : startRecording())
    $('audioFileButton')?.addEventListener('click', () => $('audioInput').click())
  }

  async function startRecording() {
    try {
      await clawapp.media.recorder.start()
      state.recordStarted = Date.now()
      state.recording = true
      state.recordTimer = setInterval(() => { const time = $('recordTime'); if (time) time.textContent = formatDuration((Date.now() - state.recordStarted) / 1000) }, 500)
      showRecorder()
    } catch (error) {
      toast(error.message || '无法使用麦克风')
    }
  }

  async function stopRecording() {
    if (!state.recording) return
    clearInterval(state.recordTimer)
    try {
      const saved = await clawapp.media.recorder.stop()
      state.attachments.push({ saved, kind: 'audio', name: saved.name || '夸夸语音', duration: saved.duration || Math.max(1, Math.round((Date.now() - state.recordStarted) / 1000)) })
    } finally {
      state.recording = false
      showRecorder()
      renderAttachments()
    }
  }

  async function saveEntry(event) {
    event.preventDefault()
    if (state.recording) await stopRecording()
    const title = $('entryTitle').value.trim()
    if (!title) { $('formError').textContent = '先写一句想夸夸的话'; $('entryTitle').focus(); return }
    state.saving = true
    $('saveEntry').disabled = true
    $('saveEntry').textContent = '正在收进星星罐…'
    const uploaded = []
    try {
      for (const item of state.attachments) {
        const saved = item.saved || await clawapp.media.save(item.file, { name: item.name })
        uploaded.push({ id: saved.id, kind: item.kind, name: saved.name, mime: saved.mime, size: saved.size, duration: item.duration || 0 })
      }
      const record = await clawapp.entity.insert('praise_entry', {
        title,
        body: $('entryBody').value.trim(),
        child: $('entryChild').value.trim() || '孩子',
        author: $('entryAuthor').value,
        happened_at: new Date($('entryDate').value).toISOString(),
        media: uploaded,
        tags: [],
        stars: 1,
      })
      const persisted = record && typeof record === 'object' ? record : {
        id: `local_${Date.now()}`,
        title,
        body: $('entryBody').value.trim(),
        child: $('entryChild').value.trim() || '孩子',
        author: $('entryAuthor').value,
        happened_at: new Date($('entryDate').value).toISOString(),
        media: uploaded,
        tags: [],
        stars: 1,
      }
      state.entries.unshift(persisted)
      for (const item of state.attachments) if (item.preview) URL.revokeObjectURL(item.preview)
      state.attachments = []
      state.editorOpen = false
      state.saving = false
      renderGlow()
      await hydrateMedia()
      toast('这颗夸夸星已经收好')
    } catch (error) {
      for (const item of uploaded) await clawapp.media.remove(item.id).catch(() => {})
      state.saving = false
      $('saveEntry').disabled = false
      $('saveEntry').textContent = '保存这颗星'
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
      try { state.urls.set(id, await clawapp.media.url(id)); changed = true } catch { /* stale media stays visually absent */ }
    }))
    if (changed) render()
  }

  function renderMemories() {
    const entries = state.entries.length ? state.entries : [demoEntry()]
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const cells = Array.from({ length: first.getDay() }, () => '<span></span>')
    for (let day = 1; day <= days; day++) {
      const has = entries.some(entry => { const d = new Date(entry.happened_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === day })
      cells.push(`<span class="cal-day${has ? ' has' : ''}">${day}</span>`)
    }
    $('app').innerHTML = `<header class="simple-head"><div class="simple-head-row"><div><h1>时光</h1><p>那些被认真看见的瞬间，会一直发光</p></div>${icon('calendar')}</div><div class="search-row"><label class="search-box">${icon('search')}<input id="memorySearch" placeholder="搜索夸夸、家人或标签"></label><button class="filter-button" aria-label="筛选">${icon('filter')}</button></div></header><section class="memory-content"><div class="memory-layout"><div class="calendar-card"><div class="month-head"><button class="circle-button">${icon('left')}</button><h2 class="month-title">${now.getFullYear()}年${now.getMonth()+1}月</h2><button class="circle-button">${icon('right')}</button></div><div class="calendar-grid">${['日','一','二','三','四','五','六'].map(x => `<b>${x}</b>`).join('')}${cells.join('')}</div></div><div><h2 class="memory-section-title">全部星光</h2><div class="memory-gallery" id="memoryGallery">${entries.map(renderMemoryTile).join('')}</div></div></div></section>`
    $('memorySearch')?.addEventListener('input', event => {
      const q = event.target.value.trim().toLowerCase()
      const filtered = entries.filter(entry => [entry.title, entry.body, entry.child, entry.author, ...(entry.tags || [])].join(' ').toLowerCase().includes(q))
      $('memoryGallery').innerHTML = filtered.length ? filtered.map(renderMemoryTile).join('') : '<p class="empty">没有找到这颗星，换个词试试</p>'
    })
  }

  function renderMemoryTile(entry) {
    const image = mediaOf(entry, 'image')[0]
    const video = mediaOf(entry, 'video')[0]
    const media = image || video
    const src = media?.demo ? asset(media.demo) : state.urls.get(media?.id) || asset('star-jar-hero.webp')
    return `<article class="memory-tile"><img src="${src}" alt=""><div class="memory-tile-copy"><h3>${escapeHTML(entry.title)}</h3><p>${formatDate(entry.happened_at, true)} · ${escapeHTML(entry.child)}</p></div></article>`
  }

  function renderFamily() {
    const members = state.members.length ? state.members : demoMembers()
    const entries = state.entries.length ? state.entries : [demoEntry()]
    $('app').innerHTML = `<section class="family-page"><div class="family-layout"><div class="family-cover"><img src="${asset('family-avatar.webp')}" alt="家庭合照插画"><h1>小宝的家</h1><p>${members.length} 位家人 · 一起收集 ${Math.max(entries.length, 12)} 颗星</p></div><div><div class="member-list">${members.map(member => { const count = entries.filter(entry => entry.child === member.name || entry.author === member.name).length || member.stars || 0; return `<article class="member-card"><span class="member-avatar" style="--member-color:${escapeHTML(member.color || '#7185d6')}">${escapeHTML((member.name || '家').slice(0,1))}</span><div><h3>${escapeHTML(member.name)}</h3><p>${escapeHTML(member.relation || (member.role === 'child' ? '孩子' : '家人'))}</p></div><span class="member-stars">${icon('star')} ${count}</span></article>` }).join('')}</div><p class="family-hint">夸奖越具体，孩子越容易看见自己的努力：描述发生了什么、看见了哪种品质，以及这件事带给你的感受。</p></div></div></section>`
  }

  window.addEventListener('pagehide', () => {
    for (const url of state.urls.values()) clawapp.media.revoke(url)
    state.urls.clear()
    if (state.recording) clawapp.media.recorder.cancel().catch(() => {})
  })

  document.addEventListener('DOMContentLoaded', load)
})()
