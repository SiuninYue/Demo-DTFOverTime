# ✅ UI 改进检查清单

**打印此文档，边做边勾选！**

---

## P0 - 核心体验 (必须完成) ⭐⭐⭐⭐⭐

### [ ] P0-01: 更新 Tailwind 配色
- [ ] 编辑 `tailwind.config.js`
- [ ] 添加 `brand` 色系
- [ ] 添加 `money` 功能色
- [ ] 添加 `ui` 灰阶
- [ ] 添加 `boxShadow` 定义
- [ ] 运行 `npm run dev` 无错误

### [ ] P0-02: 更新全局样式
- [ ] 编辑 `src/index.css`
- [ ] 修改 `background-color: #f8fafc`
- [ ] 删除深色渐变
- [ ] 检查页面背景变为浅灰

### [ ] P0-03: 简化 Root 布局
- [ ] 编辑 `src/pages/Root.tsx`
- [ ] 删除 `app-subtitle`
- [ ] 删除 `app-description`
- [ ] 删除 `app-nav` (桌面导航)
- [ ] 修改 BottomNav items（添加 More）
- [ ] 检查桌面无顶部导航

### [ ] P0-04: 创建 More 页面
- [ ] 新建 `src/pages/More.tsx`
- [ ] 实现 MenuItem 组件
- [ ] 添加菜单项：Timecard、MC、Import、Settings、Logout
- [ ] 修改 `src/config/routes.tsx` 添加路由
- [ ] 访问 `/more` 页面正常

### [ ] P0-05: 删除 Home Refresh
- [ ] 编辑 `src/pages/Home.tsx`
- [ ] 删除 L72-74 Refresh 按钮
- [ ] 检查页面正常显示

### [ ] P0-06: 删除 Salary Refresh
- [ ] 编辑 `src/pages/Salary.tsx`
- [ ] 删除 L36-38 Refresh 按钮
- [ ] 保留 Export 按钮
- [ ] 检查页面正常显示

### [ ] P0-07: 删除 Calendar Refresh
- [ ] 编辑 `src/pages/Calendar.tsx`
- [ ] 删除 L233-234 Refresh 按钮
- [ ] 调整工具栏布局
- [ ] 检查页面正常显示

### [ ] P0-08: 删除 Calendar Footer
- [ ] 编辑 `src/pages/Calendar.tsx`
- [ ] 删除 L260-267 Footer
- [ ] 检查页面正常显示

### [ ] P0-09: 重构 App 布局
- [ ] 编辑 `src/App.css`
- [ ] `.app-content` 改为透明背景
- [ ] 删除大白卡样式
- [ ] 删除桌面导航样式
- [ ] 检查页面无白色大卡片

---

## P1 - 视觉提升 (重要) ⭐⭐⭐⭐

### [ ] P1-01: 创建 Button 组件
- [ ] 新建 `src/components/ui/Button.tsx`
- [ ] 实现 4 种 variant
- [ ] 实现 3 种 size
- [ ] 支持 loading 状态
- [ ] 导出组件

### [ ] P1-02: 创建 Card 组件
- [ ] 新建 `src/components/ui/Card.tsx`
- [ ] 实现基础 Card
- [ ] 实现 Card.Header
- [ ] 实现 Card.Body
- [ ] 实现 Card.Footer
- [ ] 导出组件

### [ ] P1-03: 创建 EmptyState 组件
- [ ] 新建 `src/components/common/EmptyState.tsx`
- [ ] 实现 icon、title、description
- [ ] 实现 action 和 secondaryAction
- [ ] 导出组件

### [ ] P1-04: Calendar 使用 EmptyState
- [ ] 编辑 `src/pages/Calendar.tsx`
- [ ] 导入 EmptyState
- [ ] 替换旧的空状态代码
- [ ] 检查空状态显示正常

### [ ] P1-05: 简化 Home 信息密度
- [ ] 编辑 `src/pages/Home.tsx`
- [ ] Quick Actions 减至 2 个
- [ ] Upcoming 减至 3 天
- [ ] 检查页面更简洁

---

## P2 - 交互增强 (推荐) ⭐⭐⭐

### [ ] P2-01: 创建 BottomSheet 组件
- [ ] 新建 `src/components/common/BottomSheet.tsx`
- [ ] 实现从底部滑入动画
- [ ] 支持背景蒙层
- [ ] 支持拖拽关闭（可选）
- [ ] 新建 `src/styles/animations.css`
- [ ] 添加 slide-up 动画
- [ ] 导出组件

### [ ] P2-02: DayDetailModal 改用 BottomSheet
- [ ] 编辑 `src/components/calendar/DayDetailModal.tsx`
- [ ] 导入 BottomSheet
- [ ] 替换 Modal 为 BottomSheet
- [ ] 检查点击日期弹出抽屉

### [ ] P2-03: 创建 useSwipe Hook
- [ ] 新建 `src/hooks/useSwipe.ts`
- [ ] 实现 touch 事件监听
- [ ] 实现左右滑动检测
- [ ] 导出 Hook

### [ ] P2-04: Calendar 添加手势
- [ ] 编辑 `src/pages/Calendar.tsx`
- [ ] 导入 useSwipe
- [ ] 应用手势处理器
- [ ] 检查左右滑动切换月份

### [ ] P2-05: 添加微动画
- [ ] 编辑 `src/styles/animations.css`
- [ ] 添加按钮点击动画
- [ ] 添加卡片悬停动画
- [ ] 添加页面淡入动画
- [ ] 在 `src/index.css` 导入
- [ ] 检查动画效果

---

## P3 - 体验优化 (可选) ⭐⭐

### [ ] P3-01: 创建 FAB 组件
- [ ] 新建 `src/components/common/FloatingActionButton.tsx`
- [ ] 实现浮动按钮
- [ ] 支持位置配置
- [ ] 导出组件

### [ ] P3-02: 创建 Skeleton 组件
- [ ] 新建 `src/components/common/Skeleton.tsx`
- [ ] 实现基础 Skeleton
- [ ] 支持多种类型
- [ ] 添加脉冲动画
- [ ] 新建 `src/components/skeleton/SalarySummarySkeleton.tsx`
- [ ] 导出组件

---

## 最终验收 ✅

### 视觉检查
- [ ] 页面背景是浅灰色，不是深色
- [ ] 无白色大卡片，使用小卡片布局
- [ ] 按钮样式统一（使用 Tailwind 类）
- [ ] 卡片有阴影和圆角

### 导航检查
- [ ] 底部导航有 4 项（Home, Calendar, Salary, More）
- [ ] 桌面无顶部导航
- [ ] More 页面可访问
- [ ] More 页面包含所有次要功能

### 交互检查
- [ ] 无任何 Refresh 按钮
- [ ] 页面进入自动加载数据
- [ ] BottomSheet 从底部滑入（P2）
- [ ] 左右滑动切换月份（P2）
- [ ] 按钮有点击动画（P2）

### 代码检查
- [ ] `npm run dev` 无错误
- [ ] `npm run build` 成功
- [ ] `npm run lint` 无错误
- [ ] 无 TypeScript 错误
- [ ] 无 console 错误

### Git 提交
- [ ] 已提交所有改动
- [ ] Commit 信息清晰
- [ ] 代码已 push

---

## 统计

**总任务数:** 21
**已完成:** ____ / 21
**完成率:** ____%

**P0 完成:** ____ / 9
**P1 完成:** ____ / 5
**P2 完成:** ____ / 5
**P3 完成:** ____ / 2

---

## 备注

**开始时间:** ____________________

**P0 完成时间:** ____________________

**P1 完成时间:** ____________________

**P2 完成时间:** ____________________

**全部完成时间:** ____________________

**遇到的问题:**
-
-
-

**解决方案:**
-
-
-

---

**签名:** ________________  **日期:** ________________
