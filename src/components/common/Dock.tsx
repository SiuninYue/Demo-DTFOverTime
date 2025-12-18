import React from 'react';
import { Dock as DockComponent, DockIcon } from '@/components/ui/dock';
import { CalendarDays, Clock, Home, Settings, Stethoscope, Upload, Wallet2 } from 'lucide-react';

const Dock: React.FC = () => {
    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
                <DockComponent className="mb-0 bg-white/40 dark:bg-black/40 border-white/20 shadow-xl backdrop-blur-xl">
                    <DockIcon to="/" label="Home">
                        <Home className="size-5" />
                    </DockIcon>
                    <DockIcon to="/calendar" label="Calendar">
                        <CalendarDays className="size-5" />
                    </DockIcon>
                    <DockIcon to="/salary" label="Salary">
                        <Wallet2 className="size-5" />
                    </DockIcon>
                    <DockIcon to="/timecard" label="Timecard">
                        <Clock className="size-5" />
                    </DockIcon>
                    <DockIcon to="/mc" label="MC">
                        <Stethoscope className="size-5" />
                    </DockIcon>
                    <DockIcon to="/schedule/import" label="Import">
                        <Upload className="size-5" />
                    </DockIcon>
                    <DockIcon to="/settings" label="Settings">
                        <Settings className="size-5" />
                    </DockIcon>
                </DockComponent>
            </div>
        </div>
    );
};

export default Dock;
