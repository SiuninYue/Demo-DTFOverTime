import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import React, { useRef, useState } from "react";

export interface DockProps {
    className?: string;
    iconSize?: number;
    magnification?: number;
    distance?: number;
    direction?: "middle" | "top" | "bottom";
    children: React.ReactNode;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

export const Dock = React.forwardRef<HTMLDivElement, DockProps>(
    (
        {
            className,
            children,
            magnification = DEFAULT_MAGNIFICATION,
            distance = DEFAULT_DISTANCE,
            ...props
        },
        ref,
    ) => {
        const mouseX = useMotionValue(Infinity);

        const renderChildren = () => {
            return React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        mouseX,
                        magnification,
                        distance,
                    } as DockIconProps);
                }
                return child;
            });
        };

        return (
            <motion.div
                ref={ref}
                onMouseMove={(e) => mouseX.set(e.pageX)}
                onMouseLeave={() => mouseX.set(Infinity)}
                {...props}
                className={cn(
                    "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto flex h-[58px] w-max gap-2 rounded-2xl border p-2 backdrop-blur-md",
                    "border-neutral-200 bg-white/40 dark:border-neutral-800 dark:bg-black/40", // Glassmorphism
                    className
                )}
            >
                {renderChildren()}
            </motion.div>
        );
    },
);

Dock.displayName = "Dock";

export interface DockIconProps {
    magnification?: number;
    distance?: number;
    mouseX?: ReturnType<typeof useMotionValue<number>>;
    className?: string;
    children?: React.ReactNode;
    to?: string;
    label?: string;
    onClick?: () => void;
}

export const DockIcon = ({
    magnification = DEFAULT_MAGNIFICATION,
    distance = DEFAULT_DISTANCE,
    mouseX,
    className,
    children,
    to,
    label,
    onClick
}: DockIconProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const defaultMouseX = useMotionValue(Infinity);
    const effectiveMouseX = mouseX ?? defaultMouseX;

    const distanceCalc = useTransform(effectiveMouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(
        distanceCalc,
        [-distance, 0, distance],
        [40, magnification, 40],
    );

    const width = useSpring(widthSync, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });

    const [hovered, setHovered] = useState(false);

    // Wrap content: If 'to' is present, use Link, otherwise div/button
    const Content = (
        <motion.div
            ref={ref}
            style={{ width }}
            className={cn(
                "aspect-square cursor-pointer rounded-full flex items-center justify-center relative",
                className
            )}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Icon Container */}
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white/50 dark:bg-neutral-800/50 border border-white/20 dark:border-white/10 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/70 dark:hover:bg-neutral-700/70">
                {children}
            </div>

            {/* Label Tooltip - Visible on hover or maybe always on mobile? 
          For "Show all options", adding a small dot or label below might be better. 
          Let's use a nice tooltip for now, as standard docks do. 
      */}
            <AnimatePresence>
                {hovered && label && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 2, x: "-50%" }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 w-auto whitespace-nowrap rounded-md border border-neutral-200 bg-white/90 px-2 py-0.5 text-xs text-slate-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-100/90 dark:text-neutral-900"
                    >
                        {label}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    if (to) {
        return <RouterLink to={to} className="block">{Content}</RouterLink>;
    }

    return Content;
};

DockIcon.displayName = "DockIcon";
