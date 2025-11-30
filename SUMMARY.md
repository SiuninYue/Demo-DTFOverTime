# 执行摘要（DTF Over Time）

## 关键指标仪表板
- 页面覆盖：9/9（Login, Home, Salary, Calendar, More, MC Records, Timecard, Settings, Schedule Import）
- WCAG 2.1 AA 违规：59 项（高 18 / 中 26 / 低 15）
- 响应式问题：桌面 3 / 平板 6 / 移动 9（以 768px、320px 断点推演）
- 关键流程健康度：上传/导出/保存均无错误边界的 aria-live；模态缺少焦点管理（全局风险）
- 组件缺口：Button/Card/Badge/EmptyState/Tabs 尚未标准化；Typography 体系缺席

## 优先修复路线图（估算 40–52 小时）
- 本周（8–12h，快速减伤）
  - 隐藏桌面端底部导航；统一 Login 配色与主 Button（含焦点样式）。
  - ARIA 修复：错误 `role="alert"`、语言切换 `aria-pressed`、进度/状态 `aria-live/aria-valuenow`。
  - Settings 保存按钮单一化，次要动作下移。
- 下周（12–16h，基础设施）
  - 新建 Button/Card/Badge/EmptyState 组件，落地 Typography scale，替换页面散落样式。
  - 表格与网格响应式：横向滚动提示、Sticky 列、320px 优化（Salary/Timecard/Schedule Import）。
  - 模态与查看器的焦点陷阱、Esc 关闭、初始聚焦。
- 本月余下（20–24h，提升体验）
  - 国际化与乱码清理，动态 document.title，统一状态/Toast 体系。
  - 上传/导入/导出的 `aria-live`、进度条可视文本；离线模式的 `aria-disabled` 辅助描述。
  - 性能与稳定性：静态资源压缩、路由级代码分割（Calendar/Salary/Timecard）。

## 技术建议
- 设计系统化：在 `src/components/common/` 建 Button/Card/Badge/EmptyState，集中样式于 `src/styles/components/`，配合 CSS vars（色板/间距/圆角/阴影）。
- 可访问性框架：引入 SR-only 文案片段、`useAriaLive` Hook、`Modal` 基础组件（focus trap + Esc + return focus），统一在 Toast/Loading/Offline 中复用。
- 响应式策略：定义 3 档断点 token（320/768/1280），表格使用容器提醒（左右渐变或“可横向滚动”提示），时间输入/表单在 1 列回退。
- 质量保障：为新组件添加 Storybook/Vitest 视觉或单元测试；在 `npm run preview` 前后跑一个 `npm run lint` + `npm run build` 阻断。
