'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import MotionLink from '@/components/ui/MotionLink';

export default function NavBar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                aria-label="Main navigation"
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass py-4 shadow-sm' : 'py-8 bg-transparent'
                    }`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            >
                <div className="container mx-auto px-6 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="z-50 relative group">
                        <div className="flex flex-col items-center">
                            <span className={`font-serif text-2xl md:text-3xl tracking-wide transition-colors duration-300 ${isMobileMenuOpen ? 'text-crown-black' : 'text-crown-black'}`}>
                                CROWN
                            </span>
                            <span className="text-[10px] md:text-xs tracking-[0.2em] font-sans text-stone-grey group-hover:text-brushed-gold transition-colors duration-300">
                                NAIL & BEAUTY
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center space-x-12 font-sans text-sm tracking-widest uppercase">
                        <MotionLink href="#services">Services</MotionLink>
                        <MotionLink href="#menu">Menu</MotionLink>
                        <MotionLink href="#gallery">Gallery</MotionLink>
                        <MotionLink href="#about">About</MotionLink>

                        <a
                            href="#booking"
                            className="px-8 py-3 bg-crown-black text-clean-white hover:bg-warm-black transition-all duration-300 transform hover:scale-105 rounded-sm"
                        >
                            Reserve
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden z-50 p-2 space-y-1.5"
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

            {/* Mobile Menu Overlay */}
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
                            <MotionLink href="#hero" onClick={() => setIsMobileMenuOpen(false)}>Home</MotionLink>
                            <MotionLink href="#services" onClick={() => setIsMobileMenuOpen(false)}>Services</MotionLink>
                            <MotionLink href="#menu" onClick={() => setIsMobileMenuOpen(false)}>Menu</MotionLink>
                            <MotionLink href="#gallery" onClick={() => setIsMobileMenuOpen(false)}>Gallery</MotionLink>
                            <MotionLink href="#about" onClick={() => setIsMobileMenuOpen(false)}>About</MotionLink>
                            <a
                                href="#booking"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="mt-8 px-10 py-4 bg-crown-black text-clean-white text-lg font-sans tracking-widest"
                            >
                                Reserve
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
