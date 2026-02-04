import { Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';
import type { SiteSettings } from '@/lib/types';

interface FooterProps {
    siteSettings: SiteSettings | null;
}

export default function Footer({ siteSettings }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const address = siteSettings?.address;
    const phone = siteSettings?.phone;
    const email = siteSettings?.email;
    const social = siteSettings?.socialLinks;

    return (
        <footer className="bg-crown-black text-clean-white py-20 px-6">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
                {/* Brand */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex flex-col">
                        <span className="font-serif text-3xl tracking-wide">CROWN</span>
                        <span className="text-xs tracking-[0.2em] text-stone-grey">NAIL & BEAUTY</span>
                    </div>
                    <p className="text-stone-grey max-w-xs font-light">
                        {siteSettings?.tagline || 'Where meticulous craftsmanship meets serene luxury.'} Experience the art of refined beauty in our private sanctuary.
                    </p>
                    {siteSettings?.openingHours && (
                        <div className="space-y-1 pt-2">
                            <p className="text-xs tracking-[0.15em] uppercase text-brushed-gold mb-2">Hours</p>
                            {siteSettings.openingHours.map((oh, i) => (
                                <p key={i} className="text-stone-grey text-sm">
                                    <span className="text-clean-white/80">{oh.days}:</span> {oh.hours}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* Links */}
                <div className="lg:col-span-2 lg:col-start-7 space-y-6">
                    <h4 className="text-sm tracking-widest uppercase text-brushed-gold">Explore</h4>
                    <ul className="space-y-4 text-stone-grey">
                        <li><a href="#services" className="hover:text-clean-white transition-colors">Services</a></li>
                        <li><a href="#menu" className="hover:text-clean-white transition-colors">Full Menu</a></li>
                        <li><a href="#gallery" className="hover:text-clean-white transition-colors">Portfolio</a></li>
                        <li><a href="#about" className="hover:text-clean-white transition-colors">About Us</a></li>
                        <li><a href="#booking" className="hover:text-clean-white transition-colors">Reservations</a></li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="lg:col-span-3 space-y-6">
                    <h4 className="text-sm tracking-widest uppercase text-brushed-gold">Visit</h4>
                    <div className="space-y-2 text-stone-grey">
                        {address ? (
                            <>
                                <p>{address.street}</p>
                                <p>{address.suburb}, {address.city} {address.postcode}</p>
                            </>
                        ) : (
                            <>
                                <p>10/4343 Great North Road</p>
                                <p>Glendene, Auckland 0602</p>
                            </>
                        )}
                        {email && (
                            <p className="pt-4"><a href={`mailto:${email}`} className="hover:text-clean-white transition-colors">{email}</a></p>
                        )}
                        {phone && (
                            <p><a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="hover:text-clean-white transition-colors">{phone}</a></p>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto mt-20 pt-8 border-t border-charcoal-grey/30 flex flex-col md:flex-row justify-between items-center text-xs text-stone-grey tracking-wider">
                <p>&copy; {currentYear} {siteSettings?.businessName || 'Crown Nail & Beauty'} NZ. All rights reserved.</p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                    <a href={social?.instagram || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-clean-white transition-colors" aria-label="Instagram">
                        <Instagram size={18} />
                    </a>
                    <a href={social?.facebook || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-clean-white transition-colors" aria-label="Facebook">
                        <Facebook size={18} />
                    </a>
                </div>
            </div>
        </footer>
    );
}
