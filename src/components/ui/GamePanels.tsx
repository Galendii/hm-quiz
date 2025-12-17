import React from 'react';
import { cn } from '../../lib/utils';

export const WoodPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn(
        "relative bg-[#5D4037] border-4 border-[#3E2723] rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)]",
        "before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] before:opacity-20 before:pointer-events-none",
        "after:absolute after:inset-[2px] after:border-2 after:border-[#8D6E63]/30 after:rounded-md after:pointer-events-none",
        className
    )} style={{
        backgroundImage: 'repeating-linear-gradient(45deg, #5D4037 0px, #5D4037 10px, #4E342E 10px, #4E342E 12px)'
    }}>
        <div className="relative z-10">{children}</div>
    </div>
);

export const ChalkboardPanel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn(
        "bg-[#212121] border-8 border-[#5D4037] rounded-xl shadow-2xl p-4 sm:p-6",
        className
    )}>
        <div className="h-full w-full border border-white/10 rounded-lg p-3 sm:p-4 font-handwriting text-white">
            {children}
        </div>
    </div>
);
