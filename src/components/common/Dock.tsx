import { Dock as DockComponent, DockIcon } from '@/components/ui/dock'
import { CalendarDays, Clock, Home, Settings, Stethoscope, Upload, Wallet2 } from 'lucide-react'

function Dock() {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <DockComponent className="mb-0 bg-white/40 dark:bg-black/40 border-white/20 shadow-xl backdrop-blur-xl">
          <DockIcon to="/" label="首页">
            <Home className="size-5" />
          </DockIcon>
          <DockIcon to="/calendar" label="日历">
            <CalendarDays className="size-5" />
          </DockIcon>
          <DockIcon to="/salary" label="工资">
            <Wallet2 className="size-5" />
          </DockIcon>
          <DockIcon to="/timecard" label="打卡">
            <Clock className="size-5" />
          </DockIcon>
          <DockIcon to="/mc" label="病假">
            <Stethoscope className="size-5" />
          </DockIcon>
          <DockIcon to="/schedule/import" label="导入">
            <Upload className="size-5" />
          </DockIcon>
          <DockIcon to="/settings" label="设置">
            <Settings className="size-5" />
          </DockIcon>
        </DockComponent>
      </div>
    </div>
  )
}

export default Dock
