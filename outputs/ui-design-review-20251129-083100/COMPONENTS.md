# 组件改进建议

**目标:** 建立一致的设计系统，提高组件复用性

---

## 当前问题

### 1. 缺少通用 UI 组件库
- 每个页面自己实现按钮、卡片等基础组件
- 样式不一致
- 代码重复

### 2. 组件职责不清
- 页面组件混合了业务逻辑和 UI 样式
- 难以测试和维护

### 3. 缺少交互组件
- 无统一的 Modal/Drawer
- 无 Toast 通知系统（虽有定义但未充分使用）
- 无 Loading/Skeleton 状态

---

## 推荐组件架构

```
src/components/
├── ui/                    # 通用 UI 组件（新建）
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── index.ts
├── common/                # 通用功能组件
│   ├── BottomNav.tsx      # 已有，需优化
│   ├── BottomSheet.tsx    # 新建
│   ├── EmptyState.tsx     # 新建
│   ├── ErrorBoundary.tsx  # 已有
│   ├── FloatingActionButton.tsx  # 新建
│   ├── Loading.tsx        # 已有
│   ├── PullToRefreshIndicator.tsx  # 新建
│   ├── Skeleton.tsx       # 新建
│   └── Toast.tsx          # 已有，需优化
├── skeleton/              # 骨架屏组件（新建）
│   ├── SalarySummarySkeleton.tsx
│   ├── CalendarSkeleton.tsx
│   └── index.ts
├── calendar/              # 已有，保持
├── mc/                    # 已有，保持
├── salary/                # 已有，保持
├── settings/              # 已有，保持
├── timecard/              # 已有，保持
└── upload/                # 已有，保持
```

---

## 新建组件规范

### 1. Button 组件

**文件:** `src/components/ui/Button.tsx`

**接口设计:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  children,
  onClick,
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-button transition-all'

  const variantClasses = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-card',
    secondary: 'bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200',
    ghost: 'bg-transparent hover:bg-ui-hover text-ui-text-body',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      type={type}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="inline-block animate-spin mr-2">⏳</span>}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  )
}
```

**使用示例:**
```tsx
<Button variant="primary" onClick={handleSubmit}>
  提交
</Button>

<Button variant="secondary" size="sm" icon={<Icon />}>
  取消
</Button>

<Button variant="danger" loading={isSaving}>
  删除
</Button>
```

---

### 2. Card 组件

**文件:** `src/components/ui/Card.tsx`

**接口设计:**
```tsx
interface CardProps {
  variant?: 'default' | 'highlight' | 'warning'
  padding?: 'sm' | 'md' | 'lg'
  shadow?: boolean
  hoverable?: boolean
  children: React.ReactNode
  className?: string
}

export function Card({
  variant = 'default',
  padding = 'md',
  shadow = true,
  hoverable = false,
  children,
  className = ''
}: CardProps) {
  const baseClasses = 'rounded-card border'

  const variantClasses = {
    default: 'bg-ui-card border-ui-border',
    highlight: 'bg-brand-50 border-brand-200',
    warning: 'bg-orange-50 border-orange-200'
  }

  const paddingClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  }

  return (
    <div className={`
      ${baseClasses}
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      ${shadow ? 'shadow-card' : ''}
      ${hoverable ? 'hover:shadow-card-hover transition-shadow cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

// 子组件
Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 pb-3 border-b border-ui-divider">{children}</div>
}

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

Card.Footer = function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 pt-3 border-t border-ui-divider">{children}</div>
}
```

**使用示例:**
```tsx
<Card variant="default" shadow hoverable>
  <Card.Header>
    <h3>标题</h3>
  </Card.Header>
  <Card.Body>
    <p>内容</p>
  </Card.Body>
  <Card.Footer>
    <Button>操作</Button>
  </Card.Footer>
</Card>
```

---

### 3. BottomSheet 组件

**文件:** `src/components/common/BottomSheet.tsx`

**接口设计:**
```tsx
interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  height?: 'auto' | 'half' | 'full'
  showHandle?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true
}: BottomSheetProps) {
  const heightClasses = {
    auto: 'max-h-[80vh]',
    half: 'h-[50vh]',
    full: 'h-[90vh]'
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className={`
        fixed bottom-0 left-0 right-0 z-50
        bg-white rounded-t-2xl
        ${heightClasses[height]}
        animate-slide-up
      `}>
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-ui-border rounded-full" />
          </div>
        )}

        {title && (
          <div className="px-4 py-3 border-b border-ui-divider">
            <h2 className="text-lg font-semibold text-ui-text-main">{title}</h2>
          </div>
        )}

        <div className="overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  )
}
```

---

### 4. EmptyState 组件

**文件:** `src/components/common/EmptyState.tsx`

**接口设计:**
```tsx
interface EmptyStateProps {
  icon?: string | React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="
      flex flex-col items-center justify-center
      py-12 px-6 text-center
    ">
      <div className="text-6xl mb-4">
        {typeof icon === 'string' ? icon : icon}
      </div>

      <h3 className="text-lg font-semibold text-ui-text-main mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-ui-text-muted mb-6 max-w-sm">
          {description}
        </p>
      )}

      {action && (
        <div className="flex gap-3">
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>

          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

### 5. Skeleton 组件

**文件:** `src/components/common/Skeleton.tsx`

**接口设计:**
```tsx
interface SkeletonProps {
  type?: 'text' | 'title' | 'circle' | 'rect' | 'progress-bar'
  count?: number
  className?: string
}

export function Skeleton({
  type = 'text',
  count = 1,
  className = ''
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-ui-border rounded'

  const typeClasses = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    circle: 'h-12 w-12 rounded-full',
    rect: 'h-32 w-full',
    'progress-bar': 'h-2 w-full rounded-full'
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`
            ${baseClasses}
            ${typeClasses[type]}
            ${className}
            ${i < count - 1 ? 'mb-2' : ''}
          `}
        />
      ))}
    </>
  )
}

// 复合骨架屏
export function SalarySummarySkeleton() {
  return (
    <Card>
      <Skeleton type="title" />
      <Skeleton type="text" count={3} className="mt-4" />
      <Skeleton type="progress-bar" className="mt-6" />
    </Card>
  )
}
```

---

### 6. FloatingActionButton (FAB)

**文件:** `src/components/common/FloatingActionButton.tsx`

**接口设计:**
```tsx
interface FABProps {
  icon: React.ReactNode
  label?: string
  onClick: () => void
  position?: 'right' | 'left' | 'center'
  size?: 'md' | 'lg'
}

export function FloatingActionButton({
  icon,
  label,
  onClick,
  position = 'right',
  size = 'md'
}: FABProps) {
  const positionClasses = {
    right: 'right-4',
    left: 'left-4',
    center: 'left-1/2 -translate-x-1/2'
  }

  const sizeClasses = {
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }

  return (
    <button
      className={`
        fixed bottom-20 z-30
        ${positionClasses[position]}
        ${sizeClasses[size]}
        bg-brand-500 hover:bg-brand-600
        text-white rounded-full
        shadow-float hover:shadow-modal
        transition-all
        flex items-center justify-center
      `}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  )
}
```

---

## 组件使用指南

### 1. 导入方式

**方式 A: 单独导入**
```tsx
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
```

**方式 B: 批量导入 (推荐)**
```tsx
// src/components/ui/index.ts
export * from './Button'
export * from './Card'
export * from './Badge'
// ...

// 使用时
import { Button, Card, Badge } from '@/components/ui'
```

### 2. 组合使用示例

```tsx
import { Card, Button, Badge, Skeleton } from '@/components/ui'
import { EmptyState } from '@/components/common'

function SalaryCard() {
  const { data, isLoading, isEmpty } = useSalary()

  if (isLoading) {
    return <SalarySummarySkeleton />
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon="💰"
        title="还没有薪资数据"
        description="录入打卡记录后，系统会自动计算薪资"
        action={{
          label: "去打卡",
          onClick: () => navigate('/timecard')
        }}
      />
    )
  }

  return (
    <Card variant="default" shadow>
      <Card.Header>
        <div className="flex justify-between items-center">
          <h3>本月薪资</h3>
          <Badge variant="success">已发放</Badge>
        </div>
      </Card.Header>

      <Card.Body>
        <p className="text-2xl font-bold">${data.total}</p>
      </Card.Body>

      <Card.Footer>
        <Button variant="secondary" fullWidth>
          查看详情
        </Button>
      </Card.Footer>
    </Card>
  )
}
```

---

## 迁移路径

### 阶段 1: 创建基础组件
1. 创建 `src/components/ui/` 目录
2. 实现 Button, Card, Badge
3. 创建 index.ts 统一导出

### 阶段 2: 迁移现有页面
1. Home 页面使用新 Card 组件
2. 所有页面使用新 Button 组件
3. 删除 App.css 中的旧样式

### 阶段 3: 添加交互组件
1. 实现 BottomSheet
2. 实现 EmptyState
3. 实现 Skeleton

### 阶段 4: 优化复用
1. 提取复用的布局模式
2. 创建页面模板
3. 统一组件 API

---

## 测试建议

### 单元测试
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('⏳')).toBeInTheDocument()
  })

  it('calls onClick handler', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    screen.getByText('Click').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

---

## 总结

### 新建组件清单
- ✅ Button
- ✅ Card
- ✅ Badge
- ✅ BottomSheet
- ✅ EmptyState
- ✅ Skeleton
- ✅ FAB

### 预期收益
- 减少代码重复 **60%**
- 提高开发效率 **40%**
- 统一视觉风格
- 更易测试维护
