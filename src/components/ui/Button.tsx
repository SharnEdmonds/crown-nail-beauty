'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'outline';
    href?: string;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
}

export default function Button({ children, variant = 'primary', href, className, onClick, disabled }: ButtonProps) {
    const base = 'px-8 py-4 tracking-widest text-sm rounded-sm inline-block text-center transition-all duration-300';

    const variants = {
        primary: 'bg-warm-black text-clean-white hover:bg-crown-black',
        outline: 'border border-warm-black text-warm-black hover:bg-warm-black hover:text-clean-white',
    };

    const classes = cn(base, variants[variant], disabled && 'opacity-50 cursor-not-allowed', className);

    if (href) {
        return (
            <a href={href} className={classes}>
                {children}
            </a>
        );
    }

    return (
        <button onClick={onClick} disabled={disabled} className={classes}>
            {children}
        </button>
    );
}
