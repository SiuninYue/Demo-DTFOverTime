# AI 代码助手执行 Prompt

**直接复制此内容给 openai-codex 或其他 AI 代码助手**

---

## 任务概述

你是一个专业的前端开发工程师，需要为 DTFOverTime 项目执行 UI 改进任务。

**项目信息:**
- 框架: React 19.1.1 + TypeScript
- 样式: Tailwind CSS 4.x
- 路由: React Router 7.x
- 状态管理: Zustand
- 后端: Supabase

**工作目录:**
```
/home/yueka/projects/AI-CODE-PROJECTS/DTFOverTime
```

---

## 执行规则

1. **严格顺序:** 必须按 P0 → P1 → P2 → P3 顺序执行
2. **逐个任务:** 一次只执行一个任务，完成后等待验证
3. **保持业务逻辑:** 只修改 UI 和样式，不改变业务逻辑
4. **使用 TypeScript:** 所有新代码使用 TypeScript
5. **使用 Tailwind:** 优先使用 Tailwind 类名，不要硬编码颜色
6. **验收标准:** 每完成一个任务，检查验收标准

---

## P0 任务列表 (必须完成)

### P0-01: 更新 Tailwind 配色系统

**文件:** `tailwind.config.js`

**操作:** 替换整个 `theme.extend.colors` 配置为：

```js
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
```

**验收:**
- [ ] `npm run dev` 无错误
- [ ] 新颜色变量可用

---

### P0-02: 更新全局样式

**文件:** `src/index.css`

**操作:**
1. 找到 `body` 样式
2. 修改 `background` 为 `#f8fafc`
3. 删除任何渐变背景

**修改后的 body:**
```css
body {
  margin: 0;
  min-height: 100vh;
  background: #f8fafc;
}
```

**验收:**
- [ ] 页面背景变为浅灰色
- [ ] 无深色渐变

---

### P0-03: 简化 Root 布局

**文件:** `src/pages/Root.tsx`

**操作:**
1. 删除 `desktopNavItems` 数组（整个变量）
2. 删除 `<nav className="app-nav">` 整个 nav 元素
3. 修改 `bottomNavItems`，将 Settings 改为 More：
   ```tsx
   const bottomNavItems = [
     { to: '/', label: 'Home', icon: '🏠', exact: true },
     { to: '/calendar', label: 'Calendar', icon: '🗓' },
     { to: '/salary', label: 'Salary', icon: '💰' },
     { to: '/more', label: 'More', icon: '⋮' },  // 改这里
   ]
   ```
4. 简化 header，只保留标题：
   ```tsx
   <header className="app-header">
     <div className="flex items-center justify-between">
       <h1 className="app-title">{sectionTitle}</h1>
       {isNavigating && <span className="app-loading-indicator">Syncing…</span>}
     </div>
   </header>
   ```
5. 删除 `app-subtitle` 和 `app-description`

**验收:**
- [ ] 桌面无顶部导航
- [ ] 底部导航有 More 项
- [ ] Header 只显示标题

---

### P0-04: 创建 More 页面

**文件:** `src/pages/More.tsx` (新建)

**完整代码:**
```tsx
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

**文件:** `src/config/routes.tsx` (修改)

**操作:** 在 routes 数组中添加：
```tsx
{
  path: '/more',
  element: <MorePage />,
},
```

**验收:**
- [ ] 访问 `/more` 页面正常
- [ ] 所有菜单项可点击
- [ ] Logout 功能正常

---

### P0-05: 删除 Home 页面 Refresh 按钮

**文件:** `src/pages/Home.tsx`

**操作:**
1. 找到 Quick actions 卡片的 header
2. 删除 Refresh 按钮（大约在 L72-74）
3. 保留标题和其他按钮

**删除这段代码:**
```tsx
<button type="button" className="ghost" onClick={() => refresh()} disabled={isLoading}>
  Refresh
</button>
```

**验收:**
- [ ] Refresh 按钮已删除
- [ ] 其他按钮正常
- [ ] 页面正常加载

---

### P0-06: 删除 Salary 页面 Refresh 按钮

**文件:** `src/pages/Salary.tsx`

**操作:**
1. 找到 `salary-page__actions`
2. 删除 Refresh 按钮（大约在 L36-38）
3. 保留 Export CSV 和 Export PDF

**删除这段代码:**
```tsx
<button type="button" className="ghost" onClick={() => refresh()} disabled={isRefreshing || isLoading}>
  Refresh
</button>
```

**验收:**
- [ ] Refresh 按钮已删除
- [ ] Export 按钮保留
- [ ] 页面正常加载

---

### P0-07: 删除 Calendar 页面 Refresh 按钮

**文件:** `src/pages/Calendar.tsx`

**操作:**
1. 找到 `calendar-toolbar__actions`
2. 删除 Refresh 按钮（大约在 L233-234）
3. 保留 View Roster 和月份切换按钮

**删除这段代码:**
```tsx
<button type="button" onClick={refresh} disabled={isLoading}>
  {isLoading ? 'Refreshing…' : 'Refresh'}
</button>
```

**验收:**
- [ ] Refresh 按钮已删除
- [ ] 其他按钮保留
- [ ] 页面正常加载

---

### P0-08: 删除 Calendar 页面底部 Footer

**文件:** `src/pages/Calendar.tsx`

**操作:**
1. 找到 `calendar-footer` div（大约在 L260-267）
2. 删除整个 footer div 及其内容

**删除这段代码:**
```tsx
<div className="calendar-footer">
  <button type="button" className="secondary" onClick={() => setViewerOpen(true)}>
    View Original Image
  </button>
  <button type="button" className="ghost" onClick={handleImportRedirect}>
    Import Another Month
  </button>
</div>
```

**验收:**
- [ ] Footer 已删除
- [ ] View Roster 功能保留在顶部
- [ ] 页面正常显示

---

### P0-09: 重构 App 布局样式

**文件:** `src/App.css`

**操作:**
1. 找到 `.app-content` 样式
2. 修改如下：

**修改前:**
```css
.app-content {
  flex: 1;
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 15px 30px rgba(15, 23, 42, 0.05);
}
```

**修改后:**
```css
.app-content {
  flex: 1;
  background: transparent;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}
```

3. 删除以下样式（如果存在）：
- `.app-subtitle`
- `.app-description`
- `.app-nav`
- `.app-nav-link`
- `.app-nav-link--active`

**验收:**
- [ ] 内容区域背景透明
- [ ] 无白色大卡片
- [ ] 页面正常显示

---

## 执行流程

### 1. 开始前准备
```bash
cd /home/yueka/projects/AI-CODE-PROJECTS/DTFOverTime
npm install
npm run dev
```

### 2. 执行任务
- 从 P0-01 开始
- 逐个完成
- 每完成一个任务，运行 `npm run dev` 验证
- 检查验收标准

### 3. 遇到问题
- 查看浏览器控制台错误
- 检查 TypeScript 错误
- 参考原有代码风格
- 保持业务逻辑不变

### 4. 完成 P0 后
- 运行 `npm run build` 确保构建成功
- 运行 `npm run lint` 检查代码规范
- 报告完成情况

---

## 注意事项

1. **不要删除业务逻辑代码**
2. **不要修改 hooks 和 services**
3. **只修改 UI 和样式相关代码**
4. **使用 Tailwind 类名，不要硬编码颜色值**
5. **保持现有的 import 路径（使用 @/ 别名）**
6. **TypeScript 类型定义不要删除**

---

## 完成标准

P0 全部完成后，应该满足：

### 视觉
- [x] 页面背景浅灰色 (#f8fafc)
- [x] 无白色大卡片
- [x] 底部导航 4 项
- [x] 无桌面顶部导航

### 功能
- [x] More 页面可访问
- [x] 无 Refresh 按钮
- [x] 所有页面正常工作

### 代码
- [x] `npm run dev` 无错误
- [x] `npm run build` 成功
- [x] 无 TypeScript 错误

---

## 开始执行

请从 **P0-01** 开始执行，完成后报告验收结果。

准备好了吗？开始吧！
