'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import MotionLink from '@/components/ui/MotionLink';
import { urlFor } from '@/lib/sanity-image';
import type { SiteSettings, Navigation } from '@/lib/types';

interface NavBarProps {
    siteSettings: SiteSettings | null;
    navigation: Navigation | null;
}

export default function NavBar({ siteSettings, navigation }: NavBarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const links = navigation?.links ?? [];
    const wordmark = siteSettings?.logoWordmark ?? '';
    const submark = siteSettings?.logoSubmark ?? '';
    // Prefer the uploaded brand image if Sanity has one; fall back to the
    // wordmark+submark text lockup otherwise. Both paths render the same
    // accessible label (the business name) so screen readers are unaffected.
    const logoSrc = siteSettings?.logo?.asset
        ? urlFor(siteSettings.logo).width(280).quality(90).url()
        : null;
    const logoAlt = siteSettings?.businessName || wordmark || 'Home';

    return (
        <>
            <div className={`fixed top-0 left-0 right-0 z-50 h-[env(safe-area-inset-top)] transition-colors duration-500 ${isScrolled ? 'glass' : 'bg-transparent'}`} />

            <motion.nav
                aria-label="Main navigation"
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass pt-[calc(env(safe-area-inset-top)+16px)] pb-5 shadow-sm' : 'bg-transparent pt-[calc(env(safe-area-inset-top)+28px)] pb-8'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            >
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <Link href="/" className="z-50 relative group" aria-label={logoAlt}>
                        {logoSrc ? (
                            <Image
                                src={logoSrc}
                                alt={logoAlt}
                                width={140}
                                height={140}
                                priority
                                // Square mark — 56px on mobile, 64px on desktop. Matches
                                // the height of the rest of the nav row on both sizes.
                                className="w-14 h-14 md:w-16 md:h-16 object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="font-serif text-2xl md:text-3xl tracking-wide text-crown-black transition-colors duration-300">
                                    {wordmark}
                                </span>
                                <span className="text-[10px] md:text-xs tracking-[0.2em] font-sans text-stone-grey group-hover:text-brushed-gold transition-colors duration-300">
                                    {submark}
                                </span>
                            </div>
                        )}
                    </Link>

                    <div className="hidden lg:flex items-center space-x-12 font-sans text-sm tracking-widest uppercase">
                        {links.map((link) => (
                            <MotionLink key={link.href} href={link.href}>{link.label}</MotionLink>
                        ))}

                        {navigation?.reserveLabel && (
                            <a
                                href={navigation.reserveHref}
                                className="px-8 py-3 bg-crown-black text-clean-white hover:bg-warm-black transition-all duration-300 transform hover:scale-105 rounded-sm"
                            >
                                {navigation.reserveLabel}
                            </a>
                        )}
                    </div>

                    <button
                        className="lg:hidden z-50 p-2 space-y-1.5"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-expanded={isMobileMenuOpen}
                        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                    >
                        <motion.div
                            animate={isMobileMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                            className="w-8 h-0.5 bg-crown-black"
                        />
                        <motion.div
                            animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                            className="w-8 h-0.5 bg-crown-black"
                        />
                        <motion.div
                            animate={isMobileMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                            className="w-8 h-0.5 bg-crown-black"
                        />
                    </button>
                </div>
            </motion.nav>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        role="dialog"
                        aria-label="Mobile navigation menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-marble-stone flex flex-col justify-center items-center"
                    >
                        <div className="flex flex-col items-center space-y-8 font-serif text-4xl">
                            {navigation?.mobileHomeLabel && (
                                <MotionLink href={navigation.mobileHomeHref} onClick={() => setIsMobileMenuOpen(false)}>
                                    {navigation.mobileHomeLabel}
                                </MotionLink>
                            )}
                            {links.map((link) => (
                                <MotionLink key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                                    {link.label}
                                </MotionLink>
                            ))}
                            {navigation?.reserveLabel && (
                                <a
                                    href={navigation.reserveHref}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="mt-8 px-10 py-4 bg-crown-black text-clean-white text-lg font-sans tracking-widest"
                                >
                                    {navigation.reserveLabel}
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
