# 登录系统和中文国际化 - 部署说明

## 🎉 已完成的功能

### 1. **Supabase 认证系统**
- ✅ 登录/注册页面 (`/login`, `/register`)
- ✅ AuthStore 状态管理 (Zustand + 持久化)
- ✅ 路由保护 (ProtectedRoute 组件)
- ✅ 自动初始化和会话管理

### 2. **中文国际化 (i18n)**
- ✅ react-i18next 集成
- ✅ 中英文翻译文件 (`src/i18n/locales/*.json`)
- ✅ 自动语言检测 (localStorage + navigator)
- ✅ Settings 页面语言切换器

### 3. **数据库安全 (RLS)**
- ✅ `database.ts` 使用 `auth.uid()` 作为 employee ID
- ✅ 新的 RLS migration (`20251112_restore_auth_based_rls.sql`)
- ✅ 每个用户只能访问自己的数据

## 📦 新增依赖

```json
{
  "react-i18next": "^latest",
  "i18next": "^latest",
  "i18next-browser-languagedetector": "^latest"
}
```

已通过 `npm install` 安装。

## 🗂️ 新增文件

```
src/
├── i18n/
│   ├── config.ts                    # i18n 配置
│   └── locales/
│       ├── en.json                  # 英文翻译
│       └── zh.json                  # 中文翻译
├── store/
│   └── authStore.ts                 # 认证状态管理
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx       # 路由保护组件
├── pages/
│   ├── Login.tsx                    # 登录页面
│   └── Register.tsx                 # 注册页面
└── styles/
    └── auth.css                     # 认证页面样式

supabase/migrations/
└── 20251112_restore_auth_based_rls.sql  # 新的 RLS 策略
```

## 🔧 修改的文件

1. **src/main.tsx** - 导入 i18n 配置和认证样式
2. **src/config/routes.tsx** - 添加登录/注册路由，保护主应用路由
3. **src/pages/Settings.tsx** - 添加语言切换和退出登录
4. **src/services/supabase/database.ts** - 使用 `auth.uid()` 创建/更新 employee
5. **src/App.css** - 添加语言选择器和退出按钮样式

## 🚀 部署步骤

### Step 1: 应用数据库 Migration

需要在 Supabase 上执行新的 RLS 策略。有两种方式：

#### 方式 A: 通过 Supabase Dashboard (推荐)
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 → **SQL Editor**
3. 复制 `supabase/migrations/20251112_restore_auth_based_rls.sql` 内容
4. 执行 SQL

#### 方式 B: 通过 Supabase CLI
```bash
# 确保 Docker 已启动
npx supabase db reset  # 重置本地数据库并应用所有 migrations

# 或者只推送新的 migration
npx supabase db push
```

### Step 2: 验证 Supabase Auth 配置

确保 `.env.local` 包含正确的环境变量：

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: 启动开发服务器

```bash
npm run dev
```

### Step 4: 测试登录流程

1. **访问主页** → 自动重定向到 `/login`
2. **点击注册** → 创建新账号
3. **注册成功** → 自动跳转到 `/settings` 填写个人资料
4. **保存设置** → 创建 employee 记录（ID = auth.uid()）
5. **语言切换** → 测试中英文切换
6. **退出登录** → 清除会话，重定向到 `/login`

## 🔐 RLS 策略说明

新的 RLS 策略确保：

| 表名 | 策略 |
|------|------|
| `employees` | `id = auth.uid()` (用户只能访问自己的记录) |
| `schedules` | `employee_id = auth.uid()` |
| `time_records` | `employee_id = auth.uid()` |
| `mc_records` | `employee_id = auth.uid()` |
| `monthly_salaries` | `employee_id = auth.uid()` |

⚠️ **重要**:
- 所有表只允许 `authenticated` 用户访问
- 匿名访问已被禁用
- 每个用户只能访问自己的数据

## 🌐 国际化使用示例

在组件中使用翻译：

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <h1>{t('app.name')}</h1>
      <button onClick={() => i18n.changeLanguage('zh')}>
        切换到中文
      </button>
    </div>
  )
}
```

添加新的翻译：

1. 编辑 `src/i18n/locales/en.json`
2. 编辑 `src/i18n/locales/zh.json`
3. 在组件中使用 `t('your.translation.key')`

## 🐛 常见问题

### 问题 1: "invalid input syntax for type uuid"
**原因**: RLS migration 未应用
**解决**: 执行 Step 1 的 migration

### 问题 2: "User must be authenticated"
**原因**: 用户未登录
**解决**: 访问 `/login` 创建账号

### 问题 3: 语言切换无效
**原因**: 浏览器缓存
**解决**: 清除 localStorage 或硬刷新 (Ctrl+Shift+R)

### 问题 4: 无法创建 employee
**原因**: RLS 策略不匹配 auth.uid()
**解决**:
1. 检查 `database.ts` 是否使用 `user.id`
2. 检查 RLS 策略是否正确应用

## 📝 后续优化建议

1. **Email 确认**: 启用 Supabase Email 验证
2. **密码重置**: 添加忘记密码功能
3. **社交登录**: 集成 Google/Apple 登录
4. **更多语言**: 添加马来语、淡米尔语等
5. **翻译管理**: 考虑使用 [Crowdin](https://crowdin.com/) 协作翻译

## ✅ 检查清单

部署前确认：

- [ ] RLS migration 已应用到 Supabase
- [ ] `.env.local` 配置正确
- [ ] 可以成功注册新账号
- [ ] 可以创建 employee 记录
- [ ] 语言切换正常工作
- [ ] 退出登录正常工作
- [ ] 刷新页面后会话保持

---

**部署日期**: 2025-11-11
**功能版本**: v1.1.0
**Supabase Migration**: 20251112_restore_auth_based_rls
