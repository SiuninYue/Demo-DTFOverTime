# DTF Over Time — UI & Accessibility 技术报告

基于代码走查（2025-11-30）覆盖 9 个主要页面：Login, Home, Salary, Calendar, More, MC Records, Timecard, Settings, Schedule Import。重点关注可访问性（WCAG 2.1 AA）、响应式体验，以及近期可落地的改进路径。

## 范围与方法
- 代码基线：React 19 + Vite，主要界面在 `src/pages/` 与 `src/components/` 下实现，样式集中在 `src/App.css`、`src/styles/auth.css`。
- 设备假设：Desktop ≥1280px、Tablet 768–1024px、Mobile ≤480px；使用现有 CSS 断点（960px/768px）推演。
- 可访问性：对照 WCAG 2.1 AA，记录 59 条违规（见下节）。
- 数据视角：分析状态提示（toast/loading）、导出/上传流程、合规计算（薪资/加班/MC）。

## 页面逐页分析
### Login
- 优点：表单语义正确（label/for），提供登录进度禁用态。
- 问题：品牌色 (#667eea) 在白底对比不足；错误提示未声明 `role="alert"`，输入框未设置 `aria-invalid`；缺少单一主按钮样式体系，视觉与后续页面脱节；无“跳过导航/返回首页”辅助操作。
- 影响：低视力用户读取困难，读屏器无法及时获知失败原因，品牌一致性弱。

### Home
- 优点：快速入口、即将到期的日程摘要，薪资总览复用组件。
- 问题：数据占位符显示乱码符号（��），状态“Syncing”同样乱码；错误文案直接裸露 `error` 字符串；侧边栏与主栏 tab 顺序与视觉顺序不一致（键盘导航跳跃）。
- 影响：国际化与可读性下降，键盘用户定位内容困难。

### Salary
- 优点：月度概览 + 明细表格 + 透明度区块组合，支持 CSV/PDF 导出。
- 问题：参数校验仅提示“Invalid month”，无返回/纠正指引；导出按钮无 `aria-busy`/`aria-live`；表格列标题未绑定 scope；进度条/筹码仅用颜色区分状态；加载提示“Calculating��”含乱码。
- 影响：无障碍读屏对表格/状态解读困难，错误修复路径不清晰。

### Calendar
- 优点：日历矩阵 + 快捷操作 + 排班图片查看器。
- 问题：月份标题混用乱码字符；前后月切换仅以“?”按钮呈现；快速菜单不支持 Esc 关闭；触摸滑动与键盘切换缺乏等效按键；空状态提示缺少“导入”按钮的辅助说明。
- 影响：键盘/读屏器用户难以理解月份与操作含义，触摸与键盘体验不一致。

### More
- 优点：入口集中，链接语义正确。
- 问题：箭头图标显示为乱码“��”；卡片无 `aria-label` 汇总标题+描述；卡片 hover 状态未提供 `:focus-visible` 样式。
- 影响：读屏器无法区分卡片目的，键盘用户难辨焦点。

### MC Records
- 优点：与薪资联动的 MC 统计，模态创建与删除流程。
- 问题：错误提示使用乱码前缀“??”；删除确认对话未聚焦到首个可操作按钮；日历/列表缺少“本月/全年配额”读屏提示；刷新按钮无加载状态。
- 影响：视觉混乱，模态可访问性不足，操作反馈弱。

### Timecard
- 优点：时间输入、休息日/公休日附加表单、薪资预览。
- 问题：导航按钮文本含“? Previous/Next”；`textarea` 未关联帮助文本；删/存按钮缺少危险/主要态区分的可视提示；离线警告没有 `role="status"`；未提供键盘快捷操作。
- 影响：键盘与读屏用户难以确认动作与风险，错误状态不易被捕获。

### Settings
- 优点：表单拆分为基本信息/薪资/偏好，含 Part IV 提示。
- 问题：语言按钮未声明 `aria-pressed`；“Syncing��”“Recalculating��”含乱码且未设 `aria-live`; 保存后焦点不返回主区域；多表单提交按钮未分组，读屏顺序混乱；退出登录按钮无危险态强调。
- 影响：状态不可感知，键盘导航成本高，国际化切换无反馈。

### Schedule Import
- 优点：上传 + 手动排班表单 + 预览器，含文件尺寸展示。
- 问题：上传/保存状态文本存在乱码；上传/手动保存按钮共享状态，导致可用性不明确；`ImageUpload` 与 `ManualScheduleForm` 均缺少 `aria-live`；文件尺寸/桶信息仅文本描述，无列表或表格语义；断网提示未绑定至关键控件的 `aria-disabled` 描述。
- 影响：上传与表单的辅助信息无法被读屏器捕获，错误恢复难。

## WCAG 2.1 AA 违规清单（59 项）
1. (2.4.1 Bypass Blocks) 全局缺少“跳到主内容”链接，键盘用户需反复经过导航。
2. (2.4.3 Focus Order) `ScheduleImageViewer` / `DayDetailModal` / MC 对话框未设焦点陷阱或初始焦点，Tab 可跳出模态。
3. (4.1.3 Status Messages) Loading/Syncing/Uploading 文本未用 `role="status"` 或 `aria-live`（Home, Salary, Calendar, Settings, ScheduleImport）。
4. (1.1.1 Non-text) 多处图标/表情渲染为乱码“??”或“?”（BottomNav、Home、Calendar、Timecard、More），无备用文本。
5. (2.4.2 Page Titled) 文档标题固定为 `dtfovertime`，未随路由更新页面上下文。
6. (1.4.3 Contrast) Login 页标题 #667eea 在白底对比 3.66:1，低于 4.5:1。
7. (3.3.1 Error Identification) Login 错误提示未设置 `role="alert"`，屏幕阅读器不宣读提交失败。
8. (3.3.1 Error Identification) Login 输入框未在错误时标记 `aria-invalid`/`aria-describedby`。
9. (2.4.7 Focus Visible) Login 主按钮无自定义 `:focus-visible`，系统默认在渐变背景上对比不足。
10. (1.3.1 Info/Relationships) Login 页面缺少“返回首页/跳过导航”额外链接，键盘用户需反复 Tab 经过底部导航。
11. (1.1.1 Non-text) Home 即将日程列表的占位符显示乱码符号（`��`），无文本替代。
12. (1.4.3 Contrast) Home 侧栏标题与灰色背景（#475569 on #f8fafc）在 12px 下对比不足 4.5:1。
13. (3.3.1 Error Identification) Home 错误直接输出原始异常字符串，缺少用户可读的描述或字段关联。
14. (2.4.3 Focus Order) Home 主区域先于侧栏渲染，但视觉左/右列导致键盘顺序与视觉不一致，缺少 `tabindex` 调整或 landmark。
15. (4.1.3 Status Messages) Home “Syncing��”状态含乱码且未宣读。
16. (3.3.3 Error Suggestion) Salary 页面遇到非法 month 只提示“Invalid month”且无修正建议/回到当月链接。
17. (4.1.3 Status Messages) Salary 导出/计算状态无 `aria-live`，按钮缺少 `aria-busy`。
18. (1.3.1 Info/Relationships) Salary 进度条无 `aria-valuenow/min/max`，读屏器无法获知进度。
19. (1.4.1 Use of Color) Salary 状态 Pills 仅用颜色区分“Syncing/Up to date”，无文本或图标区分。
20. (1.3.1 Info/Relationships) Salary 明细表头缺少 `scope="col"`，读屏器无法正确关联单元格。
21. (1.1.1 Non-text) Salary 计算提示“Calculating��”含乱码。
22. (1.1.1 Non-text) Calendar 月份标题使用“��”，当前月份不可读。
23. (2.5.3 Label in Name) Calendar 前后月按钮仅显示“?”，按钮名称与可视标签不符。
24. (2.1.1 Keyboard) Calendar 快速菜单无法用 Esc 关闭，需鼠标点击。
25. (2.5.1 Pointer Gestures) Calendar 左右滑动手势无键盘等效，未提供按钮或快捷键提示。
26. (1.3.1 Info/Relationships) Calendar 选中日期提示未绑定 `aria-live`，读屏器不宣读选中变化。
27. (1.3.1 Info/Relationships) Calendar 空状态未提供导入按钮的辅助说明或 `aria-describedby`。
28. (1.4.3 Contrast) Calendar “REST” 徽标（白字 on #f8fafc）对比不足。
29. (1.1.1 Non-text) More 页卡片箭头为乱码“��”，无文本替代。
30. (2.4.6 Headings) More 卡片无可聚焦标题，读屏器仅朗读链接文本，缺少描述。
31. (2.4.7 Focus Visible) More 卡片 hover 有动画，但键盘 `:focus-visible` 未定义。
32. (3.3.1 Error Identification) MC 页面错误提示含“??”乱码且无 `role="alert"`.
33. (2.4.3 Focus Order) MC 删除确认模态无初始焦点，Tab 可落在遮罩后方。
34. (1.3.1 Info/Relationships) MC “本月/全年配额”数据以散列段落呈现，无列表或表格语义。
35. (4.1.3 Status Messages) MC 刷新按钮无加载/禁用状态宣告。
36. (1.4.3 Contrast) MC 次要文字 (#6b7280) 在卡片浅灰背景对比不足。
37. (2.1.2 No Keyboard Trap) MC 模态关闭仅依赖按钮，未支持 Esc。
38. (1.1.1 Non-text) Timecard 导航按钮文字含“?”乱码。
39. (1.3.1 Info/Relationships) Timecard 表单缺少分组与标题，读屏器无法分辨主时间输入与附加开关。
40. (3.3.1 Error Identification) Timecard 错误消息 `?? {error}` 含乱码且无字段关联。
41. (2.2.1 Timing Adjustable) Timecard 离线提示不持久，toast 消失后无法重新读取。
42. (2.4.7 Focus Visible) Timecard 删除按钮危险态仅靠颜色区分，无焦点/文本强调。
43. (2.1.1 Keyboard) Timecard 无键盘快捷键，滑块/切换操作需大量 Tab。
44. (1.3.1 Info/Relationships) Timecard “Rest Hours” 数字输入未声明单位/上下文。
45. (4.1.3 Status Messages) Timecard 保存加载状态无 `role="status"` 宣读。
46. (1.1.1 Non-text) Settings 状态文本“Syncing��”“Recalculating��”包含乱码。
47. (3.3.1 Error Identification) Settings 错误警示未设 `role="alert"`，无字段指向。
48. (2.4.3 Focus Order) Settings 多表单提交按钮在 DOM 顺序中分散，键盘顺序与视觉分组不一致。
49. (3.3.2 Labels/Instructions) Settings 语言切换按钮未标注当前状态（缺少 `aria-pressed`），无读屏反馈。
50. (1.4.3 Contrast) Settings 次要文本 (#475569) 在白底小字号对比不足。
51. (2.4.7 Focus Visible) Settings 退出按钮缺少明显焦点样式，且危险态仅靠颜色。
52. (1.3.1 Info/Relationships) Settings 重新计算结果列表未用列表语义 `<ul>`，读屏器朗读为连续文本。
53. (4.1.2 Name/Role/Value) Settings Part IV 徽标未声明角色，无法被读屏识别为状态组件。
54. (1.1.1 Non-text) Schedule Import 上传与状态文案含乱码，上传进度缺少文本。
55. (4.1.3 Status Messages) Schedule Import 上传/保存状态无 `aria-live`，读屏器无反馈。
56. (1.3.1 Info/Relationships) Schedule Import 文件信息（名称/大小/桶）以段落呈现，缺少列表或表格结构。
57. (2.1.1 Keyboard) Schedule Import 预览器关闭/缩放无键盘快捷键提示，未支持 Esc。
58. (2.4.3 Focus Order) Schedule Import 上传、预览、手动表单的 Tab 顺序与视觉分组不一致。
59. (1.4.10 Reflow) Schedule Import 手动排班表在 320px 下出现横向滚动，且未提供可滚动区域提示。

## 响应式问题矩阵（Desktop / Tablet / Mobile）
- Login: Desktop 正常；Tablet/Mobile 按钮占满宽度，但背景渐变在 320px 时出现色带压缩，主按钮文本贴边。
- Home: Desktop 栅格良好；Tablet 侧栏下移但缺乏分隔；Mobile 负载卡片与列表连续，缺少间距，错误提示会挤出视口。
- Salary: Desktop 表格充足；Tablet 导出按钮与标题换行，缺少间距；Mobile 进度条/筹码与表格横向滚动并存，信息层级不清。
- Calendar: Desktop 正常；Tablet 月份按钮“?”占位易误触；Mobile 日格在 320px 时文字换行、Badge 压缩，触摸/键盘互操作缺失。
- More: Desktop/Tablet 布局良好；Mobile 卡片文字换行、箭头乱码，与点击区域边界不清。
- MC Records: Desktop 栅格良好；Tablet 模态按钮挤压；Mobile 统计卡与列表堆叠导致长滚动，删除模态遮挡标题。
- Timecard: Desktop 表单分栏；Tablet 按钮与切换拥挤；Mobile 网格强制两列，输入框被压缩，需纵向滚动频繁。
- Settings: Desktop/Tablet OK；Mobile 多个表单堆叠，保存按钮距离输入远，难以发现。
- Schedule Import: Desktop/Tablet 流程顺畅；Mobile 上传摘要与手动表单超出一屏，横向滚动提示缺失。

## 改进路线图
- 本周必修（8–12h）
  1) 底部导航桌面端隐藏/可配置（修正媒体查询与渲染开关）。  
  2) 登录页配色统一（品牌色对比 + 与主应用一致）。  
  3) 创建 Button 组件（主/次/幽灵/危险 + 焦点样式）。  
  4) 修复 ARIA 标签（错误提示 role/aria-live，语言切换 aria-pressed，进度/状态的 aria 属性）。  
  5) Settings 页 Save 按钮整合（单一主保存入口 + 二次 CTA 放次要区）。
- 下周计划（12–16h）
  - 创建 Card/Badge/EmptyState 组件，统一语义与可访问性。
  - 优化表格横向滚动（可见滚动提示 + 列 sticky）。
  - 建立 Typography 体系（字号/行高/权重/颜色对比基线）。
- 后续（20h+）
  - 导入/上传流的键盘与屏幕阅读器支持（aria-live、Esc、焦点管理）。
  - 国际化清洗（去除乱码、补全翻译、动态标题）。
  - 状态/通知体系化（Toast/Loading/Offline 组件标准化，含 SR 文案）。
