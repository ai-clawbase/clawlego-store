# Design QA

final result: passed

## Store catalog scope

- Target: merge the former top-level “智能资产” catalog into “智能组件”.
- Target: expose 智能文件夹、项目模板、轻应用 as secondary component classes alongside ClawMod and ClawBit.
- Target: show an asset version on every card in both standalone and desktop-embedded store modes, without replacing install/installed/upgrade state.
- Full production build capture: `/private/tmp/store-final-qa-full.png`.
- Embedded install-state capture: `/private/tmp/store-final-qa-embedded.png`.
- Automated report: `/private/tmp/store-final-qa.json`.
- Verified four top-level tabs, five smart-component secondary tabs, 49 versioned cards, and independent 安装 / 已安装 / 升级 state with no console or layout errors.

## Praise Diary app-owned picker scope

### Visual truth and normalization

- Source visual truth: `/var/folders/lb/cnhf1jr55cn0syffr121hp4c0000gn/T/codex-clipboard-YSiKXj.png` (984 × 1978 px, original mobile design) and `/var/folders/lb/cnhf1jr55cn0syffr121hp4c0000gn/T/codex-clipboard-eO03oN.png` (1334 × 1190 px, native-control defect state).
- Browser-rendered implementation: `/private/tmp/praise-diary-qa/date-picker.png` (430 × 864 px), `/private/tmp/praise-diary-qa/author-picker.png` (430 × 864 px), and `/private/tmp/praise-diary-qa/birthday-picker.png` (430 × 864 px).
- Full-view side-by-side comparison: `/private/tmp/praise-diary-qa/reference-vs-date-picker.png` (860 × 864 px).
- CSS viewport: 430 × 864; device scale factor: 1; locale: zh-CN; timezone: Australia/Sydney; light theme.
- Density normalization: the 984 × 1978 source was downsampled with Lanczos to 430 × 864 before horizontal composition. The source and implementation aspect ratios differ by less than 0.1%.
- Compared state: the source establishes the blue/lavender/yellow, rounded mobile visual system; the defect screenshot establishes the editor and native popup problem; implementation evidence shows the replacement date/time, record-author, role, and birthday sheets over the same app/editor surfaces.

### Full-view and focused evidence

- Full view: source and custom date/time picker share the same blue-lavender palette, soft white surfaces, round controls, compact Chinese typography, yellow primary action, and existing imagery. No viewport clipping or device-frame drift is visible.
- Focused date/time region: the browser calendar is replaced by a six-week, 42-cell app-owned calendar plus app-owned hour/minute steppers and a yellow confirm action.
- Focused option region: record-author and member-role choices use the existing avatar assets, selected border/check state, and the same bottom-sheet treatment.
- Focused birthday region: birthday uses the same calendar and provides an explicit “暂不填写生日” action without opening a system picker.

### Required fidelity surfaces

- Fonts and typography: existing system Chinese font stack, weight hierarchy, compact labels, numeric alignment, wrapping, and truncation remain consistent; no clipped text was found.
- Spacing and layout rhythm: 430 px frame, 18 px sheet gutters, rounded cards, calendar grid, action spacing, and bottom-sheet radii align with the existing editor; persistent actions remain visible at the target viewport.
- Colors and visual tokens: existing `#5c6ed8`/lavender surfaces and yellow CTA gradient are reused; selection, muted, and outside-month states retain adequate contrast.
- Image quality and asset fidelity: all visible avatars and decorative app imagery are existing packaged raster assets; icons remain the packaged Carbon icon subset. No placeholder or generated substitute was introduced.
- Copy and content: labels are app-specific, concise, and consistent with “夸夸日记”; native/browser terminology is not exposed.

### Interaction and runtime checks

- Automated flow report: `/private/tmp/praise-diary-qa/qa-report.json`.
- Tested opening/closing all custom pickers, month/day selection, time stepping, date/author/child return-to-editor, member role/birthday return-to-form, member save/edit, diary record/save/edit/share/delete, tabs, search, filters, invite, and family rename.
- Asserted zero rendered `input[type=date]`, `input[type=datetime-local]`, or `select` elements.
- Browser page errors and console errors: none.

### Comparison history

- Iteration 1 — P1: editor and member flows invoked browser-native date/select UI, visually breaking the app and creating duplicate-looking controls. Fix: replaced them with app-owned calendar/time and avatar option sheets while preserving draft values through nested flows.
- Iteration 2 — P2: the selected date carried a cramped miniature “今” badge. Fix: removed the badge and retained a clean selected circle plus a separate subtle today state.
- Post-fix evidence: `/private/tmp/praise-diary-qa/reference-vs-date-picker.png`, `/private/tmp/praise-diary-qa/author-picker.png`, and `/private/tmp/praise-diary-qa/birthday-picker.png`.
- Remaining actionable P0/P1/P2 findings: none.
