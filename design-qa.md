# Design QA

final result: passed

## Scope

- Target: merge the former top-level “智能资产” catalog into “智能组件”.
- Target: expose 智能文件夹、项目模板、轻应用 as secondary component classes alongside ClawMod and ClawBit.
- Target: show an asset version on every card in both standalone and desktop-embedded store modes, without replacing install/installed/upgrade state.

## Evidence

- Full production build capture: `/private/tmp/store-final-qa-full.png`.
- Embedded install-state capture: `/private/tmp/store-final-qa-embedded.png`.
- Automated report: `/private/tmp/store-final-qa.json`.

## Checks

- Top-level catalog contains exactly four tabs: 全部 49 / ClawPkg 1 / ClawTpl 8 / 智能组件 40.
- No top-level “智能资产” entry remains.
- 智能组件 secondary tabs are ClawMod 8 / ClawBit 2 / 智能文件夹 21 / 项目模板 2 / 轻应用 7.
- All 49 paginated asset cards were rendered and each carried a non-empty version label.
- Embedded cards retain their version while independently showing 安装 / 已安装 / 升级.
- Store and embedded captures show no clipping, overlap, broken spacing, or browser console/page errors.
- Remaining P0/P1/P2 issues: none.
