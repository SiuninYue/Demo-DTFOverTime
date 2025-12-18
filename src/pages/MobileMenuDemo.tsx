import React from 'react';
import { InteractiveMenu, InteractiveMenuItem } from "@/components/ui/modern-mobile-menu";
import { Home, Briefcase, Calendar, Shield, Settings } from 'lucide-react';

const lucideDemoMenuItems: InteractiveMenuItem[] = [
    { label: 'home', icon: Home },
    { label: 'strategy', icon: Briefcase },
    { label: 'period', icon: Calendar },
    { label: 'security', icon: Shield },
    { label: 'settings', icon: Settings },
];

const customAccentColor = 'var(--color-chart-2)';

const MobileMenuDemo = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-10 bg-slate-50 dark:bg-slate-900 p-8">
            <div className="space-y-4 text-center">
                <h1 className="text-2xl font-bold">Modern Mobile Menu Demo</h1>
                <p className="text-muted-foreground">Resize window or switch themes to test.</p>
            </div>

            <div className="space-y-8 w-full max-w-md">
                <section className="space-y-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Default</h2>
                    <div className="p-4 border rounded-xl bg-background shadow-sm">
                        <InteractiveMenu />
                    </div>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customized (Icons & Color)</h2>
                    <div className="p-4 border rounded-xl bg-background shadow-sm">
                        <InteractiveMenu items={lucideDemoMenuItems} accentColor={customAccentColor} />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default MobileMenuDemo;
