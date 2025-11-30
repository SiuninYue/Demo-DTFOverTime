# DTFOverTime UI 设计审查 - 任务清单

本文档包含所有设计审查发现的可执行任务，按优先级排序。

---

## P0: 阻塞性问题（必须立即修复）

### Task 1: 修复底部导航在桌面端显示
**文件**: `src/components/common/BottomNav.tsx`, `src/App.css`
**问题**: 底部导航在所有视口都显示，包括桌面端 (>=960px)
**步骤**:
1. 检查 `src/App.css` 中的媒体查询 `@media (min-width: 960px) { .bottom-nav { display: none; } }`
2. 检查 BottomNav 组件是否有条件渲染逻辑覆盖了 CSS
3. 如果使用 Tailwind，确保添加 `lg:hidden` class
4. 测试三个视口确认修复

**验收标准**:
- ✅ Desktop (>=960px): 底部导航隐藏
- ✅ Tablet (<960px): 底部导航显示
- ✅ Mobile (<768px): 底部导航显示

---

### Task 2: 统一登录页面设计风格
**文件**: `src/pages/Login.tsx`, `src/styles/auth.css`
**问题**: 登录页面使用紫色渐变，与主应用浅灰色系不一致
**步骤**:
1. 移除 `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
2. 改为 `background: #f8fafc` (Slate 50)
3. 登录卡片使用品牌蓝边框或阴影
4. 更新按钮颜色为品牌蓝 `#3b82f6`

**验收标准**:
- ✅ 背景色与主应用一致
- ✅ 按钮使用品牌蓝色
- ✅ 整体风格和谐

---

## P1: 高优先级（本周修复）

### Task 3: 创建通用 Button 组件
**新文件**: `src/components/ui/Button.tsx`
**目标**: 统一所有按钮样式
**步骤**:
1. 创建 Button 组件，支持 props:
   - `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
   - `size`: 'sm' | 'md' | 'lg'
   - `disabled`, `onClick`, `children`
2. 使用 Tailwind 定义样式
3. 替换以下页面的按钮:
   - Home: "Import roster", "Record today", "View details"
   - Salary: "Export CSV", "Export PDF"
   - Calendar: "View Roster", "Previous", "Next"
   - More: 所有卡片链接
   - MC Records: "Refresh", "Add MC record"
   - Timecard: "Save & Return Home", "Delete Record"
   - Settings: 所有 "Save" 按钮
   - Schedule Import: "Save Schedule"

**验收标准**:
- ✅ 所有按钮使用统一组件
- ✅ 4 种 variant 视觉清晰
- ✅ 3 种 size 合理

**代码示例**:
```tsx
// src/components/ui/Button.tsx
export const Button = ({ variant = 'primary', size = 'md', ... }) => {
  const baseClasses = 'font-semibold rounded-lg transition-all'
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent text-brand-600 hover:bg-brand-50',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </button>
  )
}
```

---

### Task 4: 修复可访问性问题 - ARIA 标签
**文件**: 多个
**问题**: 59 处 WCAG 违反，主要是缺少 aria-label
**步骤**:
1. **Calendar 页面**:
   - 为所有日期菜单按钮 "..." 添加 `aria-label="Open actions for {date}"`
2. **Login 页面**:
   - 为邮箱和密码输入框添加 `<label>` 标签
3. **Home 页面**:
   - 为进度条添加 `aria-label="2 out of 20 days logged"`
4. **Salary 页面**:
   - 为导出按钮添加 `aria-label="Export as CSV"`
5. **底部导航**:
   - 为每个链接添加 `aria-label="Navigate to {page}"`

**验收标准**:
- ✅ 所有交互元素有明确的 aria-label
- ✅ 表单输入有 label 标签
- ✅ axe DevTools 扫描无严重问题

---

### Task 5: 修复 Settings 页面多个 Save 按钮
**文件**: `src/pages/Settings.tsx`
**问题**: 页面有 5 个 Save 按钮，用户困惑
**步骤**:
1. 移除各区域的独立 Save 按钮
2. 在页面底部添加单一 "Save All Changes" 按钮
3. 实现表单状态管理，跟踪是否有未保存更改
4. 添加"Unsaved changes"警告

**验收标准**:
- ✅ 只有一个 Save 按钮
- ✅ 按钮位置固定在底部
- ✅ 未保存时显示警告

---

### Task 6: 修复移动端底部导航遮挡内容
**文件**: `src/App.css`, 各页面组件
**问题**: Settings 和 Schedule Import 页面内容被导航遮挡
**步骤**:
1. 为所有页面内容添加 `padding-bottom: 5rem`
2. 或使用 CSS `env(safe-area-inset-bottom)`
3. 确保所有页面底部内容可见

**验收标准**:
- ✅ 移动端所有页面内容可完整查看
- ✅ 底部导航不遮挡任何交互元素

---

### Task 7: 创建 EmptyState 组件并替换空状态
**新文件**: `src/components/ui/EmptyState.tsx`
**问题**: 空状态设计简陋，缺少视觉引导
**步骤**:
1. 创建 EmptyState 组件:
   ```tsx
   <EmptyState
     icon="📋" // 或 SVG 图标
     title="No entries found"
     description="Get started by..."
     action={<Button>Add Entry</Button>}
   />
   ```
2. 替换以下页面的空状态:
   - Home: "No upcoming shifts"
   - Calendar: "No schedule has been imported"
   - MC Records: "No MC entries this month"
   - Salary: Daily breakdown 无数据

**验收标准**:
- ✅ 所有空状态使用统一组件
- ✅ 包含图标 + 标题 + 描述 + 操作按钮
- ✅ 视觉友好

---

### Task 8: 修复 More 页面重复标题
**文件**: `src/pages/More.tsx`
**问题**: "More" 标题出现两次
**步骤**:
1. 移除 banner 中的 `<heading>More</heading>`
2. 只保留页面主内容中的标题

**验收标准**:
- ✅ 只有一个 "More" 标题
- ✅ 页面结构清晰

---

## P2: 中优先级（下周修复）

### Task 9: 创建通用 Card 组件
**新文件**: `src/components/ui/Card.tsx`
**目标**: 统一卡片样式
**步骤**:
1. 创建 Card 组件，支持:
   - `variant`: 'default' | 'highlighted' | 'gradient'
   - `padding`: 'sm' | 'md' | 'lg'
2. 替换所有卡片:
   - `.salary-summary-card` → `<Card variant="gradient">`
   - `.home-card` → `<Card variant="default">`
   - `.more-card` → `<Card variant="default">`

**验收标准**:
- ✅ 所有卡片使用统一组件
- ✅ 样式一致

---

### Task 10: 创建 Badge 组件
**新文件**: `src/components/ui/Badge.tsx`
**目标**: 统一状态徽章
**步骤**:
1. 创建 Badge 组件:
   ```tsx
   <Badge variant="success|warning|error|info">Text</Badge>
   ```
2. 替换:
   - "Up to date" → `<Badge variant="success">Up to date</Badge>`
   - "Syncing..." → `<Badge variant="info">Syncing</Badge>`

**验收标准**:
- ✅ 所有徽章使用统一组件
- ✅ 颜色符合语义

---

### Task 11: 创建 Tooltip 组件
**新文件**: `src/components/ui/Tooltip.tsx`
**目标**: 为复杂文本提供解释
**步骤**:
1. 创建 Tooltip 组件（使用 Radix UI 或 Headless UI）
2. 为以下内容添加 tooltip:
   - "MC 0d + unpaid 0d -> 100%"
   - "Work 4.5h · Rest 0h · PH 0h"
   - 各种缩写和公式

**验收标准**:
- ✅ 悬停显示详细解释
- ✅ 移动端点击显示

---

### Task 12: 优化表格横向滚动体验
**文件**: `src/pages/Salary.tsx`, `src/pages/ScheduleImport.tsx`
**问题**: 表格滚动缺少视觉提示
**步骤**:
1. 添加左右渐变遮罩
2. 添加滚动指示器
3. 优化滚动条样式

**验收标准**:
- ✅ 用户清楚知道可以横向滚动
- ✅ 滚动体验流畅

---

### Task 13: 优化移动端表格布局
**文件**: `src/pages/ScheduleImport.tsx`
**问题**: 30 天表格在 375px 完全不可用
**步骤**:
1. 移动端改为列表视图
2. 或使用手风琴布局
3. 或实现虚拟滚动

**验收标准**:
- ✅ 移动端可轻松编辑所有字段
- ✅ 不需要横向滚动

---

### Task 14: 标准化加载状态
**文件**: 多个
**问题**: "Syncing...", "Calculating...", "Loading..." 不统一
**步骤**:
1. 创建 Spinner 组件
2. 统一文案为 "Loading..." 或 "Syncing..."
3. 添加加载动画

**验收标准**:
- ✅ 所有加载状态视觉一致
- ✅ 文案统一

---

### Task 15: 统一 Design Token 使用
**文件**: `tailwind.config.js`, 各 CSS 文件
**问题**: 混用直接颜色值和 design tokens
**步骤**:
1. 将所有颜色值移至 `tailwind.config.js`
2. 替换硬编码颜色:
   - `#5865f2` → `colors.brand[600]`
   - `#0f172a` → `colors.ui.text.main`
3. 删除重复的 CSS variables

**验收标准**:
- ✅ 所有颜色使用 design tokens
- ✅ 易于维护和主题切换

---

### Task 16: 建立 Typography 体系
**新文件**: `src/styles/typography.css`
**问题**: 字号和字重不规范
**步骤**:
1. 定义 Typography classes:
   - `.text-h1`, `.text-h2`, `.text-h3`, `.text-body`, `.text-caption`
2. 或使用 Tailwind:
   - `text-4xl font-bold` (H1)
   - `text-3xl font-semibold` (H2)
   - `text-base` (Body)

**验收标准**:
- ✅ 所有文本使用标准化类名
- ✅ 字号和字重一致

---

### Task 17: 统一链接样式
**文件**: 各页面
**问题**: 链接颜色不一致
**步骤**:
1. 定义链接样式: `text-brand-600 hover:underline`
2. 为外部链接添加图标
3. 确保颜色对比度 >= 4.5:1

**验收标准**:
- ✅ 所有链接颜色一致
- ✅ 外部链接有图标提示

---

### Task 18: 修复 MOM Part IV 徽章显示
**文件**: `src/pages/Settings.tsx`
**问题**: 移动端徽章被导航遮挡
**步骤**:
1. 调整徽章位置
2. 或减小徽章高度
3. 确保 `padding-bottom` 足够

**验收标准**:
- ✅ 移动端徽章完整可见

---

## P3: 细节优化（后续处理）

### Task 19: 优化按钮圆角
**文件**: 所有按钮
**问题**: 圆角不统一（0.5rem vs 999px）
**步骤**:
1. 统一为 `rounded-lg` (0.5rem)
2. 移除 `rounded-full` (999px) 胶囊样式

**验收标准**:
- ✅ 所有按钮圆角一致

---

### Task 20: 优化文本措辞
**文件**: 多个
**问题**: 部分文本不够友好
**步骤**:
1. "8 days until payday" → "Payday in 8 days"
2. "No entry" → "No shift scheduled"
3. "Add roster or open timecard" → 更简洁的提示

**验收标准**:
- ✅ 所有文本措辞友好清晰

---

### Task 21: 添加微动画
**文件**: Button, Card 组件
**目标**: 提升交互体验
**步骤**:
1. 按钮 hover: `transform: scale(1.02)`
2. 卡片 hover: `transform: translateY(-4px)` + 阴影变化
3. More 页面箭头: hover 时向右移动

**验收标准**:
- ✅ 动画流畅（150-300ms）
- ✅ 不影响性能

---

### Task 22: 替换 Emoji 图标为 SVG
**文件**: Calendar, Settings 等
**问题**: "📸", "🏠" 等 emoji 不够专业
**步骤**:
1. 选择图标库（Heroicons, Lucide, Feather）
2. 替换所有 emoji
3. 确保图标大小一致

**验收标准**:
- ✅ 所有图标使用 SVG
- ✅ 视觉统一

---

### Task 23: 增加 Tailwind 使用率
**文件**: `src/App.css`, 各组件
**目标**: 从 10% 提升至 70%+
**步骤**:
1. 将 CSS classes 改为 Tailwind utilities
2. 删除重复的自定义 CSS
3. 减少 `App.css` 至 <500 行

**验收标准**:
- ✅ Tailwind 使用率 >= 70%
- ✅ `App.css` < 500 行
- ✅ 代码更易维护

---

## 进度跟踪

### 总览

| 优先级 | 任务数 | 已完成 | 进行中 | 待处理 |
|--------|-------|--------|--------|--------|
| P0 | 2 | 0 | 0 | 2 |
| P1 | 6 | 0 | 0 | 6 |
| P2 | 10 | 0 | 0 | 10 |
| P3 | 5 | 0 | 0 | 5 |
| **总计** | **23** | **0** | **0** | **23** |

### 预计工作量

- **P0**: 4-6 小时
- **P1**: 12-16 小时
- **P2**: 16-20 小时
- **P3**: 8-10 小时
- **总计**: 40-52 小时 (约 1-2 周，1 名开发者)

---

**更新日期**: 2025-11-30
**下次审查**: 所有 P0 和 P1 任务完成后
