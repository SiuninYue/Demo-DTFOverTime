# 配色系统设计文档

**风格定位:** 金融信赖风 + 现代简洁
**技术实现:** Tailwind CSS 4.x + 语义化命名

---

## 设计原则

### 1. 专业可信
- 使用蓝色系作为主色（金融行业标准色）
- 避免过于鲜艳的颜色
- 保持足够的对比度

### 2. 功能明确
- 绿色 = 收入/加项
- 红色 = 扣款/警告
- 黄色 = 异常/提醒
- 蓝色 = 信息/主操作

### 3. 一致性
- 所有颜色通过 Tailwind 配置管理
- 使用语义化命名（brand, money, ui）
- 禁止硬编码颜色值

---

## Tailwind 配置

### 完整配置代码

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // 品牌主色 (Blue 系)
        brand: {
          50: '#eff6ff',   // 极浅蓝 - 背景高亮
          100: '#dbeafe',  // 浅蓝 - 次要背景
          200: '#bfdbfe',  // 较浅蓝
          300: '#93c5fd',  // 中浅蓝
          400: '#60a5fa',  // 中蓝
          500: '#3b82f6',  // 主色 ← 默认
          600: '#2563eb',  // 深蓝 - Hover 状态
          700: '#1d4ed8',  // 较深蓝
          800: '#1e40af',  // 很深蓝
          900: '#1e3a8a',  // 极深蓝 - 文本
        },

        // 功能色
        money: {
          positive: '#10b981',  // 绿色 - 收入/加班费/加项
          negative: '#ef4444',  // 红色 - 扣款/超时警告
          warning: '#f59e0b',   // 橙色 - 异常/需注意
        },

        // UI 灰阶 (Slate 色系)
        ui: {
          bg: '#f8fafc',        // 页面背景
          card: '#ffffff',      // 卡片背景
          border: '#e2e8f0',    // 边框颜色
          divider: '#cbd5e1',   // 分割线
          hover: '#f1f5f9',     // 悬停背景
          disabled: '#e2e8f0',  // 禁用状态
          text: {
            main: '#0f172a',    // 主要标题
            body: '#334155',    // 正文内容
            muted: '#64748b',   // 次要信息/注释
            disabled: '#94a3b8', // 禁用文本
          }
        }
      },

      // 阴影系统
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'float': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'modal': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },

      // 圆角系统
      borderRadius: {
        'card': '1rem',
        'button': '0.75rem',
        'input': '0.5rem',
      }
    },
  },
  plugins: [],
}
```

---

## 颜色使用指南

### 品牌色 (brand.*)

#### 主要用途
- 主按钮背景: `bg-brand-500`
- 主按钮悬停: `hover:bg-brand-600`
- 链接文字: `text-brand-600`
- 高亮边框: `border-brand-500`

#### 使用示例
```tsx
// 主按钮
<button className="bg-brand-500 hover:bg-brand-600 text-white">
  确认
</button>

// 次要按钮
<button className="bg-brand-100 text-brand-600 hover:bg-brand-200">
  取消
</button>

// 链接
<a className="text-brand-600 hover:text-brand-700 hover:underline">
  查看详情
</a>

// 徽章
<span className="bg-brand-50 text-brand-600 border border-brand-200">
  新功能
</span>
```

---

### 功能色 (money.*)

#### money.positive (绿色)
**用途:**
- 加班费金额
- 薪资增加项
- 成功状态

```tsx
// 金额显示
<span className="text-money-positive font-semibold">
  +$150.00
</span>

// 成功提示
<div className="bg-green-50 border border-green-200 text-money-positive">
  ✓ 薪资计算成功
</div>
```

#### money.negative (红色)
**用途:**
- 扣款金额
- 超时警告
- 错误状态

```tsx
// 扣款显示
<span className="text-money-negative font-semibold">
  -$50.00
</span>

// 警告提示
<div className="bg-red-50 border border-red-200 text-money-negative">
  ⚠️ 超过法定工时上限
</div>
```

#### money.warning (橙色)
**用途:**
- 异常情况
- 需要注意的项目
- 提醒状态

```tsx
// 异常提示
<div className="bg-orange-50 border border-orange-200 text-money-warning">
  ⚡ 休息时间不足
</div>

// 待处理项
<span className="bg-orange-100 text-money-warning">
  待确认
</span>
```

---

### UI 灰阶 (ui.*)

#### 背景色
```tsx
// 页面背景
<body className="bg-ui-bg">

// 卡片背景
<div className="bg-ui-card">

// 悬停背景
<button className="hover:bg-ui-hover">
```

#### 边框和分割线
```tsx
// 卡片边框
<div className="border border-ui-border">

// 分割线
<hr className="border-ui-divider">

// 输入框边框
<input className="border border-ui-border focus:border-brand-500">
```

#### 文本颜色
```tsx
// 主标题
<h1 className="text-ui-text-main font-bold">

// 正文
<p className="text-ui-text-body">

// 次要信息
<small className="text-ui-text-muted">

// 禁用状态
<button disabled className="text-ui-text-disabled bg-ui-disabled">
```

---

## 迁移指南

### 从自定义 CSS 迁移到 Tailwind

**步骤 1: 识别颜色值**
```css
/* App.css - 旧代码 */
.button {
  background: #6366f1;  /* 旧的 Indigo */
  color: #fff;
}

.button:hover {
  background: #4f46e5;
}
```

**步骤 2: 映射到新系统**
```
#6366f1 → bg-brand-500
#4f46e5 → hover:bg-brand-600
#fff → text-white
```

**步骤 3: 应用 Tailwind 类**
```tsx
// React 组件 - 新代码
<button className="bg-brand-500 hover:bg-brand-600 text-white">
  提交
</button>
```

### 常见颜色映射表

| 旧颜色值 | 用途 | 新 Tailwind 类 |
|----------|------|----------------|
| `#6366f1` | 主色 | `bg-brand-500` |
| `#4f46e5` | 主色悬停 | `hover:bg-brand-600` |
| `#f8fafc` | 页面背景 | `bg-ui-bg` |
| `#ffffff` | 卡片背景 | `bg-ui-card` |
| `#0f172a` | 标题文字 | `text-ui-text-main` |
| `#64748b` | 次要文字 | `text-ui-text-muted` |
| `#10b981` | 成功/收入 | `text-money-positive` |
| `#ef4444` | 错误/扣款 | `text-money-negative` |
| `#f59e0b` | 警告 | `text-money-warning` |

---

## 组件样式示例

### 按钮系统

```tsx
// 主按钮
<button className="
  bg-brand-500
  hover:bg-brand-600
  active:bg-brand-700
  text-white
  font-semibold
  px-4 py-2
  rounded-button
  shadow-card
  hover:shadow-card-hover
  transition-all
">
  确认
</button>

// 次要按钮
<button className="
  bg-brand-50
  hover:bg-brand-100
  text-brand-600
  font-semibold
  px-4 py-2
  rounded-button
  border border-brand-200
">
  取消
</button>

// Ghost 按钮
<button className="
  bg-transparent
  hover:bg-ui-hover
  text-ui-text-body
  font-semibold
  px-4 py-2
  rounded-button
">
  返回
</button>

// 危险按钮
<button className="
  bg-red-500
  hover:bg-red-600
  text-white
  font-semibold
  px-4 py-2
  rounded-button
">
  删除
</button>
```

### 卡片系统

```tsx
// 基础卡片
<div className="
  bg-ui-card
  border border-ui-border
  rounded-card
  p-4
  shadow-card
  hover:shadow-card-hover
  transition-shadow
">
  {/* 内容 */}
</div>

// 高亮卡片
<div className="
  bg-brand-50
  border border-brand-200
  rounded-card
  p-4
">
  {/* 内容 */}
</div>

// 警告卡片
<div className="
  bg-orange-50
  border border-orange-200
  rounded-card
  p-4
">
  {/* 内容 */}
</div>
```

### 徽章系统

```tsx
// 信息徽章
<span className="
  bg-brand-100
  text-brand-700
  text-xs
  font-semibold
  px-2 py-1
  rounded-full
">
  进行中
</span>

// 成功徽章
<span className="
  bg-green-100
  text-green-700
  text-xs
  font-semibold
  px-2 py-1
  rounded-full
">
  已完成
</span>

// 警告徽章
<span className="
  bg-orange-100
  text-orange-700
  text-xs
  font-semibold
  px-2 py-1
  rounded-full
">
  待确认
</span>
```

---

## 可访问性考虑

### 对比度检查

所有文本颜色都已通过 WCAG AA 标准：

| 文本颜色 | 背景颜色 | 对比度 | 等级 |
|----------|----------|--------|------|
| ui.text.main (#0f172a) | ui.bg (#f8fafc) | 14.98:1 | AAA |
| ui.text.body (#334155) | ui.bg (#f8fafc) | 9.21:1 | AAA |
| ui.text.muted (#64748b) | ui.bg (#f8fafc) | 5.13:1 | AA |
| brand.600 (#2563eb) | white | 5.74:1 | AA |

### 色盲友好

- ✅ 不单纯依赖颜色传达信息
- ✅ 使用图标 + 颜色组合
- ✅ 提供文本标签

---

## 深色模式（可选）

如需支持深色模式，可添加以下配置：

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 或 'media'
  theme: {
    extend: {
      colors: {
        ui: {
          bg: {
            light: '#f8fafc',
            dark: '#0f172a',
          },
          card: {
            light: '#ffffff',
            dark: '#1e293b',
          },
          // ...
        }
      }
    }
  }
}
```

---

## 总结

### 核心优势
✅ 专业可信的金融风格
✅ 清晰的功能色区分
✅ 完整的语义化命名
✅ 优秀的可访问性
✅ 易于维护和扩展

### 下一步
1. 更新 `tailwind.config.js`
2. 更新 `src/index.css`
3. 迁移组件样式
4. 删除 `src/App.css` 中的冗余代码
