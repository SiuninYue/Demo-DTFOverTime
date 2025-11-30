# UI 改进任务清单

**供 AI 代码助手执行**
**项目:** DTFOverTime
**生成时间:** 2025-11-29

---

## 使用说明

每个任务包含：
- **任务编号:** P0-01, P1-01 等
- **任务名称:** 简短描述
- **目标:** 具体要实现的功能
- **影响文件:** 需要修改/新建的文件清单
- **具体改动:** 详细的代码修改说明
- **验收标准:** 如何判断任务完成

**执行顺序:** 严格按 P0 → P1 → P2 → P3 顺序执行

---

## P0 任务 - 核心体验 (必须完成)

### P0-01: 更新 Tailwind 配色系统

**目标:** 应用新的 Slate 配色系统

**影响文件:**
- `tailwind.config.js` (修改)

**具体改动:**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 品牌主色 (Blue)
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        // 功能色
        money: {
          positive: '#10b981',
          negative: '#ef4444',
          warning: '#f59e0b',
        },
        // UI 灰阶 (Slate)
        ui: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          text: {
            main: '#0f172a',
            body: '#334155',
            muted: '#64748b',
          }
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'float': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
```

**验收标准:**
- [ ] tailwind.config.js 已更新
- [ ] `npm run dev` 无错误
- [ ] 新颜色变量可在组件中使用

---

### P0-02: 更新全局样式

**目标:** 去除深色背景，应用新配色

**影响文件:**
- `src/index.css` (修改)

**具体改动:**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #0f172a;
  background-color: #f8fafc;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f8fafc;  /* 清爽背景，移除深色渐变 */
}

#root {
  min-height: 100vh;
}

a {
  color: inherit;
}
```

**验收标准:**
- [ ] 背景色改为浅灰 (#f8fafc)
- [ ] 深色渐变已移除
- [ ] 页面显示正常

---

### P0-03: 简化 Root 布局

**目标:** 移除桌面顶部导航，简化 header

**影响文件:**
- `src/pages/Root.tsx` (修改)

**具体改动:**

**删除内容:**
- app-subtitle
- app-description
- app-nav (桌面导航)

**保留内容:**
- app-title (当前页面)
- BottomNav (移动导航)

```tsx
// src/pages/Root.tsx
import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import BottomNav from '@/components/common/BottomNav'
import '@/App.css'

const bottomNavItems = [
  { to: '/', label: 'Home', icon: '🏠', exact: true },
  { to: '/calendar', label: 'Calendar', icon: '🗓' },
  { to: '/salary', label: 'Salary', icon: '💰' },
  { to: '/more', label: 'More', icon: '⋮' },  // 改为 More
]

const resolveSectionTitle = (pathname: string) => {
  if (pathname.startsWith('/schedule')) return 'Schedule Import'
  if (pathname.startsWith('/calendar')) return 'Calendar'
  if (pathname.startsWith('/timecard')) return 'Timecard'
  if (pathname.startsWith('/salary')) return 'Salary'
  if (pathname.startsWith('/mc')) return 'MC Records'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/more')) return 'More'
  return 'Dashboard'
}

function RootLayout() {
  const navigation = useNavigation()
  const location = useLocation()
  const isNavigating = navigation.state !== 'idle'
  const sectionTitle = resolveSectionTitle(location.pathname)

  return (
    <div className="app-shell" data-navigation={isNavigating ? 'busy' : 'idle'}>
      <header className="app-header">
        <div className="flex items-center justify-between">
          <h1 className="app-title">{sectionTitle}</h1>
          {isNavigating && <span className="app-loading-indicator">Syncing…</span>}
        </div>
      </header>

      <main className="app-content" role="main">
        <Outlet />
      </main>

      <BottomNav items={bottomNavItems} />
    </div>
  )
}

export default RootLayout
```

**验收标准:**
- [ ] 桌面顶部导航已删除
- [ ] Header 只显示标题
- [ ] 底部导航包含 "More" 项
- [ ] 页面正常渲染

---

### P0-04: 创建 More 页面

**目标:** 集中次要功能入口

**影响文件:**
- `src/pages/More.tsx` (新建)
- `src/config/routes.tsx` (修改)

**具体改动:**

```tsx
// src/pages/More.tsx
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface MenuItemProps {
  icon: string
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

function MenuItem({ icon, label, onClick, variant = 'default' }: MenuItemProps) {
  return (
    <button
      className={`
        w-full flex items-center gap-4 p-4
        border-b border-ui-border
        hover:bg-ui-hover
        transition-colors
        ${variant === 'danger' ? 'text-money-negative' : 'text-ui-text-body'}
      `}
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-ui-text-muted">›</span>
    </button>
  )
}

function MorePage() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <section className="more-page">
      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <MenuItem
          icon="⏱️"
          label="Timecard"
          onClick={() => navigate('/timecard/today')}
        />
        <MenuItem
          icon="🏥"
          label="MC Records"
          onClick={() => navigate('/mc')}
        />
        <MenuItem
          icon="📅"
          label="Schedule Import"
          onClick={() => navigate('/schedule/import')}
        />
        <MenuItem
          icon="⚙️"
          label="Settings"
          onClick={() => navigate('/settings')}
        />
        <MenuItem
          icon="🚪"
          label="Logout"
          onClick={handleLogout}
          variant="danger"
        />
      </div>

      <p className="text-center text-ui-text-muted text-sm mt-6">
        DTF Salary Tracker v1.0.0
      </p>
    </section>
  )
}

export default MorePage
```

```tsx
// src/config/routes.tsx
// 添加 More 路由
import MorePage from '@/pages/More'

export const routes = [
  // ... 现有路由
  {
    path: '/more',
    element: <MorePage />,
  },
]
```

**验收标准:**
- [ ] More 页面可访问
- [ ] 所有菜单项可点击
- [ ] 跳转正常工作
- [ ] Logout 功能正常

---

### P0-05: 删除 Home 页面 Refresh 按钮

**目标:** 移除手动刷新按钮

**影响文件:**
- `src/pages/Home.tsx` (修改)

**具体改动:**

**删除:**
```tsx
// L72-74
<button type="button" className="ghost" onClick={() => refresh()} disabled={isLoading}>
  Refresh
</button>
```

**保留:**
- Quick actions 的其他按钮

**验收标准:**
- [ ] Refresh 按钮已删除
- [ ] 其他按钮正常显示
- [ ] 页面进入时自动加载数据

---

### P0-06: 删除 Salary 页面 Refresh 按钮

**目标:** 移除手动刷新按钮

**影响文件:**
- `src/pages/Salary.tsx` (修改)

**具体改动:**

**删除:**
```tsx
// L36-38
<button type="button" className="ghost" onClick={() => refresh()} disabled={isRefreshing || isLoading}>
  Refresh
</button>
```

**调整布局:**
```tsx
// 修改后的 header actions
<div className="salary-page__actions">
  <button type="button" className="ghost" onClick={exportCsv} disabled={!summary}>
    Export CSV
  </button>
  <button type="button" className="secondary" onClick={exportPdf} disabled={!summary}>
    Export PDF
  </button>
</div>
```

**验收标准:**
- [ ] Refresh 按钮已删除
- [ ] Export 按钮保留且正常工作
- [ ] 页面进入时自动加载数据

---

### P0-07: 删除 Calendar 页面 Refresh 按钮

**目标:** 移除手动刷新按钮

**影响文件:**
- `src/pages/Calendar.tsx` (修改)

**具体改动:**

**删除:**
```tsx
// L233-234
<button type="button" onClick={refresh} disabled={isLoading}>
  {isLoading ? 'Refreshing…' : 'Refresh'}
</button>
```

**调整工具栏:**
```tsx
// 修改后的工具栏
<div className="calendar-toolbar__actions">
  <button type="button" className="secondary" onClick={() => setViewerOpen(true)}>
    📸 View Roster
  </button>
  <button type="button" className="ghost" onClick={() => handleMonthChange('prev')}>
    ◀ Previous
  </button>
  <button type="button" className="ghost" onClick={() => handleMonthChange('next')}>
    Next ▶
  </button>
</div>
```

**验收标准:**
- [ ] Refresh 按钮已删除
- [ ] 其他按钮保留
- [ ] 页面进入时自动加载数据

---

### P0-08: 删除 Calendar 页面底部 Footer

**目标:** 删除重复的按钮

**影响文件:**
- `src/pages/Calendar.tsx` (修改)

**具体改动:**

**删除:**
```tsx
// L260-267
<div className="calendar-footer">
  <button type="button" className="secondary" onClick={() => setViewerOpen(true)}>
    View Original Image
  </button>
  <button type="button" className="ghost" onClick={handleImportRedirect}>
    Import Another Month
  </button>
</div>
```

**验收标准:**
- [ ] Footer 已删除
- [ ] View Roster 功能保留在顶部
- [ ] Import 功能可从 More 页面访问

---

### P0-09: 重构 App 布局样式

**目标:** 现代化布局，去除大白卡

**影响文件:**
- `src/App.css` (修改)

**具体改动:**

```css
/* src/App.css */
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  padding-bottom: 5rem;
  gap: 1rem;
  background: #f8fafc;
}

/* App Header - 简化 */
.app-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.app-title {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: #0f172a;
}

.app-loading-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 600;
}

/* App Content - 去除大白卡 */
.app-content {
  flex: 1;
  background: transparent;  /* 改为透明 */
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.app-shell[data-navigation='busy'] .app-content {
  opacity: 0.85;
}

/* Bottom Nav - 保持现有样式 */
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  width: min(32rem, calc(100% - 2rem));
  background: #0f172a;
  border-radius: 999px;
  padding: 0.35rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
  box-shadow: 0 25px 70px rgba(15, 23, 42, 0.35);
}

.bottom-nav__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.35rem;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
}

.bottom-nav__link--active {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.bottom-nav__label {
  font-size: 0.75rem;
}

@media (min-width: 960px) {
  .bottom-nav {
    display: none;
  }
}

/* 删除以下样式 */
/* .app-subtitle { 删除 } */
/* .app-description { 删除 } */
/* .app-nav { 删除 } */
/* .app-nav-link { 删除 } */
```

**验收标准:**
- [ ] 白色大卡片已移除
- [ ] Content 背景透明
- [ ] 桌面导航样式已删除
- [ ] 页面正常渲染

---

## P1 任务 - 视觉提升

### P1-01: 创建通用 Button 组件

**目标:** 统一按钮样式和行为

**影响文件:**
- `src/components/ui/Button.tsx` (新建)
- `src/components/ui/index.ts` (新建)

**具体改动:**

见 `COMPONENTS.md` 中的 Button 组件完整代码

**验收标准:**
- [ ] Button 组件可导入使用
- [ ] 支持 4 种 variant
- [ ] 支持 3 种 size
- [ ] Loading 状态正常显示

---

### P1-02: 创建通用 Card 组件

**目标:** 统一卡片样式

**影响文件:**
- `src/components/ui/Card.tsx` (新建)

**具体改动:**

见 `COMPONENTS.md` 中的 Card 组件完整代码

**验收标准:**
- [ ] Card 组件可导入使用
- [ ] 支持 Header/Body/Footer
- [ ] 支持 3 种 variant
- [ ] Hoverable 效果正常

---

### P1-03: 创建 EmptyState 组件

**目标:** 改进空状态体验

**影响文件:**
- `src/components/common/EmptyState.tsx` (新建)

**具体改动:**

见 `COMPONENTS.md` 中的 EmptyState 组件完整代码

**验收标准:**
- [ ] EmptyState 组件可导入使用
- [ ] Icon 正常显示
- [ ] Action 按钮可点击
- [ ] 样式美观

---

### P1-04: Calendar 使用 EmptyState

**目标:** 替换简陋的空状态

**影响文件:**
- `src/pages/Calendar.tsx` (修改)

**具体改动:**

**删除:**
```tsx
{!isLoading && !hasData && (
  <div className="empty-state">
    <p>No schedule has been imported for this month.</p>
    <button type="button" className="secondary" onClick={handleImportRedirect}>
      Import Schedule
    </button>
  </div>
)}
```

**替换为:**
```tsx
import { EmptyState } from '@/components/common/EmptyState'

{!isLoading && !hasData && (
  <EmptyState
    icon="📅"
    title="还没有排班表"
    description="导入本月的排班表，开始追踪你的工时和薪资"
    action={{
      label: "导入排班表",
      onClick: handleImportRedirect
    }}
  />
)}
```

**验收标准:**
- [ ] 空状态使用新组件
- [ ] 显示图标、标题、描述
- [ ] 按钮正常工作

---

### P1-05: 简化 Home 页面信息密度

**目标:** 降低认知负担

**影响文件:**
- `src/pages/Home.tsx` (修改)

**具体改动:**

**修改 Quick Actions:**
```tsx
// 减少操作数量
const quickActions = [
  { label: 'Record today', action: () => navigate(`/timecard/${getTodayKey()}`), className: 'button' },
  { label: 'View salary', action: () => navigate(salaryRoute), className: 'secondary' },
]
// 删除 "Import roster" 和 "Refresh"
```

**修改 Upcoming Schedule:**
```tsx
// 从 5 天减至 3 天
.slice(0, 3)  // 原本是 .slice(0, 5)
```

**验收标准:**
- [ ] Quick Actions 只有 2 个按钮
- [ ] Upcoming 只显示 3 天
- [ ] Refresh 按钮已删除
- [ ] 页面更简洁

---

## P2 任务 - 交互增强

### P2-01: 创建 BottomSheet 组件

**目标:** 替代 Modal，更符合移动端习惯

**影响文件:**
- `src/components/common/BottomSheet.tsx` (新建)
- `src/styles/animations.css` (新建)

**具体改动:**

见 `COMPONENTS.md` 中的 BottomSheet 组件完整代码

**animations.css:**
```css
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-down {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
```

**验收标准:**
- [ ] BottomSheet 组件可导入使用
- [ ] 从底部滑入/滑出
- [ ] 背景蒙层正常显示
- [ ] 点击背景关闭

---

### P2-02: DayDetailModal 改用 BottomSheet

**目标:** 使用新的 BottomSheet

**影响文件:**
- `src/components/calendar/DayDetailModal.tsx` (修改)

**具体改动:**

```tsx
// src/components/calendar/DayDetailModal.tsx
import { BottomSheet } from '@/components/common/BottomSheet'

// 替换 Modal 为 BottomSheet
export default function DayDetailModal({
  date,
  schedule,
  isOpen,
  onClose,
  onViewImage,
  onEditSchedule,
  onRecordTimecard,
  onCopyDetails,
}: DayDetailModalProps) {
  if (!schedule) return null

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={formatDate(date, { format: 'long' })}
      height="auto"
    >
      {/* 保持原有内容 */}
      <div className="space-y-4">
        <div>
          <p className="text-ui-text-muted text-sm">班次类型</p>
          <p className="font-semibold">{schedule.type}</p>
        </div>

        {schedule.plannedStartTime && (
          <div>
            <p className="text-ui-text-muted text-sm">计划工时</p>
            <p className="font-semibold">
              {schedule.plannedStartTime} - {schedule.plannedEndTime}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button className="button flex-1" onClick={() => onRecordTimecard(date)}>
            记录打卡
          </button>
          <button className="secondary flex-1" onClick={() => onCopyDetails(date)}>
            复制详情
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
```

**验收标准:**
- [ ] 点击日期弹出 BottomSheet
- [ ] 显示日期和班次信息
- [ ] 按钮正常工作
- [ ] 关闭动画流畅

---

### P2-03: 创建 useSwipe Hook

**目标:** 支持手势滑动切换月份

**影响文件:**
- `src/hooks/useSwipe.ts` (新建)

**具体改动:**

```ts
// src/hooks/useSwipe.ts
import { useRef, useEffect } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: UseSwipeOptions) {
  const touchStart = useRef<number | null>(null)
  const touchEnd = useRef<number | null>(null)

  const handleTouchStart = (e: TouchEvent) => {
    touchEnd.current = null
    touchStart.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return

    const distance = touchStart.current - touchEnd.current
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }

    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
  }

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  }

  return { handlers }
}
```

**验收标准:**
- [ ] Hook 可导入使用
- [ ] 左滑触发 onSwipeLeft
- [ ] 右滑触发 onSwipeRight
- [ ] 阈值可配置

---

### P2-04: Calendar 添加手势滑动

**目标:** 支持手势切换月份

**影响文件:**
- `src/pages/Calendar.tsx` (修改)

**具体改动:**

```tsx
// src/pages/Calendar.tsx
import { useSwipe } from '@/hooks/useSwipe'

function CalendarPage() {
  // ... 现有代码

  const { handlers } = useSwipe({
    onSwipeLeft: () => handleMonthChange('next'),
    onSwipeRight: () => handleMonthChange('prev'),
  })

  return (
    <section className="calendar-page" {...handlers}>
      {/* 内容 */}
    </section>
  )
}
```

**验收标准:**
- [ ] 左滑切换到下月
- [ ] 右滑切换到上月
- [ ] 不影响其他交互
- [ ] 移动端正常工作

---

### P2-05: 添加微交互动画

**目标:** 提升交互质感

**影响文件:**
- `src/styles/animations.css` (修改)
- `src/index.css` (修改)

**具体改动:**

```css
/* src/styles/animations.css */

/* 按钮点击反馈 */
@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

button:active {
  animation: buttonPress 0.2s ease;
}

/* 卡片悬停 */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

/* 页面切换淡入 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation: fadeIn 0.3s ease;
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/animations.css';  /* 导入动画 */
```

**验收标准:**
- [ ] 按钮有点击反馈
- [ ] 卡片悬停有抬升效果
- [ ] 页面切换有淡入动画

---

## P3 任务 - 体验优化（可选）

### P3-01: 创建 FAB 组件

**目标:** 快速访问常用操作

**影响文件:**
- `src/components/common/FloatingActionButton.tsx` (新建)

**具体改动:**

见 `COMPONENTS.md` 中的 FAB 组件完整代码

**验收标准:**
- [ ] FAB 组件可导入使用
- [ ] 浮动在底部导航上方
- [ ] 点击有反馈
- [ ] 位置可配置

---

### P3-02: 创建 Skeleton 组件

**目标:** 改进加载体验

**影响文件:**
- `src/components/common/Skeleton.tsx` (新建)
- `src/components/skeleton/SalarySummarySkeleton.tsx` (新建)

**具体改动:**

见 `COMPONENTS.md` 中的 Skeleton 组件完整代码

**验收标准:**
- [ ] Skeleton 组件可导入使用
- [ ] 支持多种类型
- [ ] 有脉冲动画
- [ ] 专用骨架屏组件正常

---

## 任务执行清单

### P0 - 核心体验 (必须)
- [ ] P0-01: 更新 Tailwind 配色系统
- [ ] P0-02: 更新全局样式
- [ ] P0-03: 简化 Root 布局
- [ ] P0-04: 创建 More 页面
- [ ] P0-05: 删除 Home Refresh 按钮
- [ ] P0-06: 删除 Salary Refresh 按钮
- [ ] P0-07: 删除 Calendar Refresh 按钮
- [ ] P0-08: 删除 Calendar Footer
- [ ] P0-09: 重构 App 布局样式

### P1 - 视觉提升 (重要)
- [ ] P1-01: 创建通用 Button 组件
- [ ] P1-02: 创建通用 Card 组件
- [ ] P1-03: 创建 EmptyState 组件
- [ ] P1-04: Calendar 使用 EmptyState
- [ ] P1-05: 简化 Home 页面信息密度

### P2 - 交互增强 (推荐)
- [ ] P2-01: 创建 BottomSheet 组件
- [ ] P2-02: DayDetailModal 改用 BottomSheet
- [ ] P2-03: 创建 useSwipe Hook
- [ ] P2-04: Calendar 添加手势滑动
- [ ] P2-05: 添加微交互动画

### P3 - 体验优化 (可选)
- [ ] P3-01: 创建 FAB 组件
- [ ] P3-02: 创建 Skeleton 组件

---

## 验收总览

完成所有任务后，应达到以下效果：

### 视觉效果
- [ ] 清爽的浅色背景
- [ ] 统一的 Slate 配色
- [ ] 无大白卡，使用小卡片布局
- [ ] 一致的按钮和卡片样式

### 导航体验
- [ ] 移动式底部导航（4 项）
- [ ] More 页面集中次要功能
- [ ] 无桌面顶部导航

### 交互体验
- [ ] 无 Refresh 按钮（自动刷新）
- [ ] BottomSheet 替代 Modal
- [ ] 手势滑动切换月份
- [ ] 按钮点击动画
- [ ] 卡片悬停效果

### 代码质量
- [ ] 使用 Tailwind 配色变量
- [ ] 组件复用性高
- [ ] 代码结构清晰
- [ ] 无 TypeScript 错误

---

**执行建议:**
1. 严格按 P0 → P1 → P2 → P3 顺序执行
2. 每完成一个任务，运行 `npm run dev` 验证
3. 每完成一个优先级，提交 git commit
4. 遇到问题及时标记，继续下一任务
