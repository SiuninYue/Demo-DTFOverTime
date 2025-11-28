# Supabase CLI 配置指南

## 安全说明

⚠️ **SUPABASE_ACCESS_TOKEN 是敏感凭证**
- 只能存放在后端环境或终端
- **绝对不能**放在前端文件（.env.local、.env 等）
- **绝对不能**提交到 Git

## 配置方法

### 方法 1：使用 .env.supabase（推荐）

1. 创建 `.env.supabase` 文件（已在 .gitignore 中）：
   ```bash
   # Backend-only secrets for Supabase CLI
   export SUPABASE_ACCESS_TOKEN=your_token_here
   ```

2. 使用时加载：
   ```bash
   source .env.supabase && npx supabase <command>
   ```

### 方法 2：终端临时变量

```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
npx supabase <command>
```

### 方法 3：Shell 配置文件

在 `~/.bashrc` 或 `~/.zshrc` 中添加：
```bash
export SUPABASE_ACCESS_TOKEN=your_token_here
```

## 常用命令

```bash
# 链接项目（首次配置时）
source .env.supabase && npx supabase link --project-ref <ref> --password <pwd>

# 生成 TypeScript 类型
source .env.supabase && npx supabase gen types typescript --linked > src/types/supabase.ts

# 查看远程 schema 变更
source .env.supabase && npx supabase db diff

# 推送本地 migrations 到远程
source .env.supabase && npx supabase db push

# 从远程拉取 schema
source .env.supabase && npx supabase db pull
```

## 环境文件说明

| 文件 | 用途 | Git 追踪 | 前端访问 |
|------|------|----------|----------|
| `.env.example` | 模板 | ✓ | - |
| `.env.local` | 前端变量 | ✗ | ✓ |
| `.env.supabase` | **后端密钥** | ✗ | **✗** |

## 安全检查清单

- [ ] `.env.supabase` 在 .gitignore 中
- [ ] `.env.local` 不包含 SUPABASE_ACCESS_TOKEN
- [ ] `.env.local` 不包含 SUPABASE_SERVICE_ROLE_KEY
- [ ] Git 状态不显示敏感文件：`git status | grep .env.supabase`

## 故障排查

### Token 无效
```bash
# 检查 token 是否已加载
echo $SUPABASE_ACCESS_TOKEN

# 重新生成 token: https://supabase.com/dashboard/account/tokens
```

### WSL2 SSL 问题
```bash
# 确保使用 source 加载 .env.supabase
source .env.supabase
export PGSSLMODE=require
npx supabase <command>
```

### 网络超时（524 错误）
- 正常现象，重试即可
- Token 已正确识别，只是网络问题
