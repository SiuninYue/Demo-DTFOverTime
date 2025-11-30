# 可执行任务清单（23 项）

每项包含文件路径、实施步骤、验收标准。建议优先完成 1–8 对应“本周必修”。

1. 底部导航桌面端隐藏开关  
   - 路径：`src/components/common/BottomNav.tsx`, `src/App.css`, `src/pages/Root.tsx`  
   - 步骤：为 BottomNav 增加 `hideOnDesktop`（默认 true）；在 Root 传入；CSS 保留 960px 断点并增加 `prefers-reduced-motion` 优化。  
   - 验收：≥1024px 视口下 BottomNav 不渲染；≤960px 正常显示且过渡无动画抖动。

2. 登录页配色与主按钮统一  
   - 路径：`src/styles/auth.css`  
   - 步骤：调整品牌色对比（主色≥4.5:1）、统一圆角/阴影到全局按钮 token；为 `.auth-button` 添加 `:focus-visible` 样式。  
   - 验收：WCAG 对比通过，焦点可见；视觉与全局按钮一致。

3. 创建 Button 组件（Primary/Secondary/Ghost/Danger）  
   - 路径：`src/components/common/Button.tsx`, `src/styles/components/button.css`, `src/styles/tokens.css`  
   - 步骤：实现 `variant`, `size`, `isLoading`, `icon`, `fullWidth` props；转发 `aria-busy`; 使用 CSS 变量定义色板。  
   - 验收：Story/示例中四种 variant 可用，键盘焦点清晰，ARIA 属性可被读屏器宣读。

4. 迁移关键按钮到新组件（Home/Settings/Timecard）  
   - 路径：`src/pages/Home.tsx`, `src/pages/Settings.tsx`, `src/pages/Timecard.tsx`, `src/pages/Salary.tsx`  
   - 步骤：用 Button 组件替换原生 button；为危险操作传入 `variant="danger"`；移除内联 className。  
   - 验收：页面无样式回退；危险/主要态在视觉和读屏上均可区分。

5. ARIA 错误与状态修复  
   - 路径：`src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/components/common/Loading.tsx`, `src/components/common/Toast.tsx`  
   - 步骤：错误容器加 `role="alert"`，字段错误时标记 `aria-invalid` + `aria-describedby`；Loading/Toast 使用 `role="status"` + `aria-live="polite"`。  
   - 验收：读屏器在提交后会即时宣读错误/加载；无控制台 ARIA 警告。

6. 语言切换与状态芯片无障碍  
   - 路径：`src/pages/Settings.tsx`, `src/components/salary/SalarySummaryCard.tsx`, `src/components/common/BottomNav.tsx`  
   - 步骤：语言按钮添加 `aria-pressed`；状态 pill 增加文本前缀（如 “Status: Syncing”）；BottomNav 图标文本化并补充 `aria-label`。  
   - 验收：无乱码；读屏器朗读“Status: Up to date”；语言按钮切换时状态切换可宣读。

7. 动态 document.title  
   - 路径：`src/pages/Root.tsx` 或 `src/config/routes.tsx`（自定义 Hook）  
   - 步骤：基于 `useLocation`/resolved section title 设置 `document.title`；Auth 页面分别设置 Login/Register 标题。  
   - 验收：切换路由时标签页标题反映当前页面名称。

8. Settings 保存按钮整合  
   - 路径：`src/pages/Settings.tsx`  
   - 步骤：统一三个表单的提交按钮为顶部/底部单一主按钮；次要动作（重算/登出）移到辅助区域；防抖保存状态。  
   - 验收：键盘 Tab 顺序按视觉分组；只有一个主要“Save”按钮；保存后焦点返回页首确认。

9. 表格可访问性（Salary/Manual Schedule）  
   - 路径：`src/components/salary/SalaryDetailTable.tsx`, `src/components/schedule/ManualScheduleForm.tsx`  
   - 步骤：为表头设置 `scope`，为滚动容器添加“可横向滚动”提示及渐变指示；为空单元提供 `aria-label`。  
   - 验收：读屏器正确宣读列/行；320px 下有滚动提示且无内容截断。

10. Calendar 导航与快捷菜单可访问性  
   - 路径：`src/pages/Calendar.tsx`, `src/components/calendar/MonthCalendar.tsx`, `src/components/calendar/DayCell.tsx`  
   - 步骤：替换“?”按钮文本为 Prev/Next；快捷菜单支持 Esc 关闭、初始焦点和 `aria-expanded`；添加键盘左右箭头切月。  
   - 验收：键盘可完整操作月份切换和菜单；读屏宣读当前月。

11. 模态焦点陷阱与 Esc 关闭  
   - 路径：`src/components/calendar/DayDetailModal.tsx`, `src/components/calendar/ScheduleImageViewer.tsx`, `src/components/mc/AddMCModal.tsx`  
   - 步骤：引入基础 Modal 组件或 Hook，管理初始焦点、循环焦点、Esc 关闭、关闭后返回触发点。  
   - 验收：Tab 无法跳出模态；Esc 关闭可用；关闭后焦点回到触发按钮。

12. 乱码与占位符清理  
   - 路径：`src/pages/Home.tsx`, `src/pages/Salary.tsx`, `src/pages/Calendar.tsx`, `src/pages/Timecard.tsx`, `src/pages/More.tsx`, `src/components/salary/SalarySummaryCard.tsx`  
   - 步骤：替换“��/?”为真实文本或可见图标；为缺失数据提供明确占位（如 “Not set”）。  
   - 验收：页面不再出现乱码；占位符均为可读英文或本地化文本。

13. Typography 体系  
   - 路径：`src/styles/tokens.css`, `src/index.css`, `src/App.css`  
   - 步骤：定义字号/行高/字重/颜色 token（例如 `--font-body`, `--text-muted`）；替换散落的硬编码值。  
   - 验收：主要文字对比 ≥4.5:1；相同语义的文字使用统一 token。

14. Card 组件提炼  
   - 路径：`src/components/common/Card.tsx`, `src/styles/components/card.css`  
   - 步骤：支持 `title`, `description`, `actions`, `as` prop；提供可选阴影/边框；增加 `aria-labelledby`。  
   - 验收：More/MC/Salary 等卡片可替换且视觉一致，读屏可识别标题。

15. Badge 组件  
   - 路径：`src/components/common/Badge.tsx`, `src/styles/components/badge.css`  
   - 步骤：变体（info/success/warning/danger/neutral），可选图标；使用文本前缀（如 “Status:”）；对比度达标。  
   - 验收：状态提示不依赖颜色；能用于 Salary pill、Calendar REST 标签。

16. EmptyState 组件  
   - 路径：`src/components/common/EmptyState.tsx`, `src/styles/components/empty-state.css`  
   - 步骤：包含标题、描述、可选操作按钮；支持 `icon` slot；设置 `role="status"`。  
   - 验收：Calendar/Schedule Import 空状态替换后，读屏能宣读描述与行动。

17. 时间输入与辅助文本分组  
   - 路径：`src/components/timecard/TimeInput.tsx`, `src/pages/Timecard.tsx`  
   - 步骤：为 textarea/inputs 添加 `aria-describedby` 指向 helper；将表单分组（fieldset+legend）区分主时间、补充选项。  
   - 验收：读屏朗读字段时包含帮助文本；320px 下保持单列。

18. Schedule Import 文件信息语义化  
   - 路径：`src/pages/ScheduleImport.tsx`, `src/components/upload/ImageUpload.tsx`  
   - 步骤：文件名/大小/桶信息改为 `<dl>`；上传/保存状态用 `role="status"`；断网时按钮加 `aria-disabled` 和 `aria-describedby`。  
   - 验收：读屏可读出文件摘要；断网时按钮不可点击且有原因说明。

19. Offline/Toast/Loading 统一化  
   - 路径：`src/components/common/Toast.tsx`, `src/components/common/Loading.tsx`, `src/App.css`  
   - 步骤：标准化 `role="status"`/`aria-live`; 为 Loading 添加文本进度；Toast 提供关闭按钮可聚焦。  
   - 验收：屏幕阅读器可宣读所有状态；Toast 可键盘关闭。

20. 文案与 i18n 清理  
   - 路径：`src/i18n/`, `src/pages/*.tsx`  
   - 步骤：将硬编码英文/乱码移入 i18n 资源；补全缺失键；为日期/货币使用同一 formatter。  
   - 验收：切换语言时无英文漏网；无字符串拼接错误。

21. 日历/时间卡快捷键提示  
   - 路径：`src/pages/Calendar.tsx`, `src/pages/Timecard.tsx`  
   - 步骤：在工具栏添加“Keyboard shortcuts”文本；支持左右切月、`Ctrl+S` 保存、`Esc` 关闭菜单。  
   - 验收：快捷键可用且有可视提示。

22. 表格滚动提示与 Sticky 列  
   - 路径：`src/components/salary/SalaryDetailTable.tsx`, `src/components/schedule/ManualScheduleForm.tsx`  
   - 步骤：添加 sticky 左列与渐变遮罩；在移动端显示“Scroll horizontally”提示。  
   - 验收：横向滚动可发现；表头保持可见。

23. 预览器下载与缩放的键盘支持  
   - 路径：`src/components/calendar/ScheduleImageViewer.tsx`  
   - 步骤：为下载/缩放绑定键盘快捷键（Enter/+/−），Esc 关闭；给 slider 添加 `aria-valuetext`。  
   - 验收：无需鼠标即可缩放/关闭/下载；读屏宣读当前缩放比例。

## 组件示例代码

```tsx
// src/components/common/Button.tsx
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth,
  icon,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx('btn', `btn--${variant}`, `btn--${size}`, fullWidth && 'btn--block', className)}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {icon && <span className="btn__icon" aria-hidden>{icon}</span>}
      <span className="btn__label">{children}</span>
    </button>
  )
}
```

```tsx
// src/components/common/Card.tsx
interface CardProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  as?: 'section' | 'article' | 'div'
}

export function Card({ title, description, actions, children, as: Component = 'section' }: CardProps) {
  const headingId = `${title.replace(/\s+/g, '-').toLowerCase()}-card`
  return (
    <Component className="card" aria-labelledby={headingId}>
      <header className="card__header">
        <div>
          <h3 id={headingId}>{title}</h3>
          {description && <p className="card__description">{description}</p>}
        </div>
        {actions}
      </header>
      {children && <div className="card__body">{children}</div>}
    </Component>
  )
}
```

```tsx
// src/components/common/EmptyState.tsx
interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      {icon && <div className="empty-state__icon" aria-hidden>{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
```

## 进度追踪表
| ID | 任务 | Owner | ETA | 状态 |
| -- | ---- | ----- | --- | ---- |
| 1 | 底部导航隐藏 |  |  | 未开始 |
| 2 | 登录配色统一 |  |  | 未开始 |
| 3 | Button 组件 |  |  | 未开始 |
| 4 | Button 替换 |  |  | 未开始 |
| 5 | ARIA 错误修复 |  |  | 未开始 |
| 6 | 语言/状态无障碍 |  |  | 未开始 |
| 7 | 动态标题 |  |  | 未开始 |
| 8 | Settings 保存整合 |  |  | 未开始 |
| 9 | 表格可访问性 |  |  | 未开始 |
| 10 | Calendar 导航 |  |  | 未开始 |
| 11 | 模态焦点陷阱 |  |  | 未开始 |
| 12 | 乱码清理 |  |  | 未开始 |
| 13 | Typography 体系 |  |  | 未开始 |
| 14 | Card 组件 |  |  | 未开始 |
| 15 | Badge 组件 |  |  | 未开始 |
| 16 | EmptyState 组件 |  |  | 未开始 |
| 17 | 时间输入分组 |  |  | 未开始 |
| 18 | 文件信息语义化 |  |  | 未开始 |
| 19 | 状态组件统一 |  |  | 未开始 |
| 20 | 文案/i18n 清理 |  |  | 未开始 |
| 21 | 快捷键提示 |  |  | 未开始 |
| 22 | 表格滚动提示 |  |  | 未开始 |
| 23 | 预览器键盘支持 |  |  | 未开始 |
