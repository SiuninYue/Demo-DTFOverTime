import { InteractiveMenu, type InteractiveMenuItem } from '@/components/ui/modern-mobile-menu'
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react'

const lucideDemoMenuItems: InteractiveMenuItem[] = [
  { label: '首页', icon: Home },
  { label: '策略', icon: Briefcase },
  { label: '期间', icon: Calendar },
  { label: '安全', icon: Shield },
  { label: '设置', icon: Settings },
]

const customAccentColor = 'var(--color-chart-2)'

function MobileMenuDemo() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 bg-slate-50 dark:bg-slate-900 p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">现代移动菜单演示</h1>
        <p className="text-muted-foreground">可调整窗口大小或切换主题测试效果。</p>
      </div>

      <div className="space-y-8 w-full max-w-md">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">默认</h2>
          <div className="p-4 border rounded-xl bg-background shadow-sm">
            <InteractiveMenu />
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            自定义（图标与颜色）
          </h2>
          <div className="p-4 border rounded-xl bg-background shadow-sm">
            <InteractiveMenu items={lucideDemoMenuItems} accentColor={customAccentColor} />
          </div>
        </section>
      </div>
    </div>
  )
}

export default MobileMenuDemo
