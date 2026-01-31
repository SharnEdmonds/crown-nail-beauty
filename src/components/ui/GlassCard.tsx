'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
}

export default function GlassCard({ children, className }: GlassCardProps) {
    return (
        <div
            className={cn(
                'bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                className
            )}
        >
            {children}
        </div>
    );
}
