'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export default function MotionLink({ href, children, className = '', onClick }: MotionLinkProps) {
    const isAnchor = href.startsWith('#');

    const inner = (
        <>
            <span className="relative z-10 block transition-colors duration-300 group-hover:text-warm-black">
                {children}
            </span>
            <motion.span
                className="absolute left-0 bottom-0 w-full h-[1px] bg-crown-black origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
            />
        </>
    );

    if (isAnchor) {
        return (
            <a href={href} onClick={onClick} className={`relative group inline-block ${className}`}>
                {inner}
            </a>
        );
    }

    return (
        <Link href={href} onClick={onClick} className={`relative group inline-block ${className}`}>
            {inner}
        </Link>
    );
}
