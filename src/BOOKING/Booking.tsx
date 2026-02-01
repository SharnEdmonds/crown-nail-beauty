'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Sparkles,
    Check,
    ChevronRight,
    ChevronLeft,
    User,
    Phone,
    Mail,
    MessageSquare,
    Scissors,
    Eye,
    HandMetal,
    Paintbrush,
} from 'lucide-react';
import type { ServiceCategory } from '@/lib/types';

interface BookingProps {
    categories: ServiceCategory[];
    phone?: string;
}

const technicians = [
    { name: 'Sarah', specialty: 'Nail Artistry & Gel Extensions', icon: HandMetal },
    { name: 'Amy', specialty: 'Lash Extensions & Tinting', icon: Eye },
    { name: 'Jade', specialty: 'Facial Treatments & Waxing', icon: Sparkles },
    { name: 'No Preference', specialty: 'Any available technician', icon: User },
];

const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM',
];

const premiumAddOns = [
    { id: 'gel-removal', label: 'Gel Removal', price: 10 },
    { id: 'nail-repair', label: 'Nail Repair (per nail)', price: 5 },
    { id: 'cuticle-treatment', label: 'Cuticle Oil Treatment', price: 8 },
    { id: 'hand-massage', label: 'Hand & Arm Massage', price: 15 },
    { id: 'foot-massage', label: 'Foot & Leg Massage', price: 20 },
    { id: 'nail-art', label: 'Custom Nail Art (per nail)', price: 8 },
    { id: 'paraffin-wax', label: 'Paraffin Wax Treatment', price: 15 },
];

const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = i - 2;
    return {
        day: day > 0 && day <= 28 ? day : null,
        available: day > 0 && day <= 28 && ![1, 7, 8, 14, 21, 28].includes(day),
    };
});

// Category icon mapping
const categoryIcons: Record<string, typeof Scissors> = {
    'gel-polish': HandMetal,
    'normal-polish': HandMetal,
    'builder-gel': HandMetal,
    'dipping-powder': HandMetal,
    'eyelash-extension': Eye,
    'tinting': Eye,
    'waxing': Scissors,
    'facial-care': Sparkles,
    'permanent-makeup': Paintbrush,
};

const TOTAL_STEPS = 4;

export default function Booking({ categories, phone }: BookingProps) {
    const [step, setStep] = useState(1);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedTech, setSelectedTech] = useState<string | null>(null);
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactNotes, setContactNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const selectedCategory = useMemo(
        () => categories?.find((c) => c._id === selectedCategoryId) ?? null,
        [categories, selectedCategoryId]
    );

    const selectedService = useMemo(
        () => selectedCategory?.services.find((s) => s._key === selectedServiceKey) ?? null,
        [selectedCategory, selectedServiceKey]
    );

    const addOnTotal = selectedAddOns.reduce((sum, id) => {
        const addon = premiumAddOns.find((a) => a.id === id);
        return sum + (addon?.price ?? 0);
    }, 0);

    const servicePrice = useMemo(() => {
        if (!selectedService) return 0;
        const match = selectedService.price.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    }, [selectedService]);

    const canProceed = () => {
        switch (step) {
            case 1: return selectedCategoryId !== null && selectedServiceKey !== null;
            case 2: return selectedDay !== null && selectedTime !== null;
            case 3: return selectedTech !== null;
            case 4: return contactName.trim() !== '' && contactPhone.trim() !== '';
            default: return false;
        }
    };

    function toggleAddOn(id: string) {
        setSelectedAddOns((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    }

    function handleSubmit() {
        if (!canProceed()) return;
        setSubmitted(true);
    }

    function handleReset() {
        setStep(1);
        setSelectedCategoryId(null);
        setSelectedServiceKey(null);
        setSelectedDay(null);
        setSelectedTime(null);
        setSelectedTech(null);
        setSelectedAddOns([]);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setContactNotes('');
        setSubmitted(false);
    }

    function nextStep() {
        if (canProceed() && step < TOTAL_STEPS) setStep(step + 1);
    }

    function prevStep() {
        if (step > 1) setStep(step - 1);
    }

    return (
        <section id="booking" className="py-32 relative z-10 bg-marble-stone">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <motion.span
                        className="text-xs tracking-[0.3em] uppercase text-brushed-gold mb-4 block"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        Reservations
                    </motion.span>
                    <motion.h2
                        className="font-serif text-5xl lg:text-6xl"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        Reserve Your <span className="italic">Experience</span>
                    </motion.h2>
                    <motion.p
                        className="text-charcoal-grey mt-4 max-w-lg mx-auto"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Choose your treatment, pick a time, and let us take care of the rest.
                    </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    {submitted ? (
                        /* ───────── Confirmation ───────── */
                        <motion.div
                            key="confirmation"
                            className="max-w-2xl mx-auto bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-12 text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-soft-rose/30 flex items-center justify-center mx-auto mb-6">
                                <Check size={28} className="text-brushed-gold" />
                            </div>
                            <h3 className="font-serif text-3xl mb-4">Booking Request Sent</h3>

                            <div className="bg-marble-stone/50 rounded-sm p-6 mb-6 text-left space-y-3 max-w-md mx-auto">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-grey">Service</span>
                                    <span className="text-crown-black font-medium">{selectedService?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-grey">Category</span>
                                    <span className="text-crown-black">{selectedCategory?.title}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-grey">Date</span>
                                    <span className="text-crown-black">February {selectedDay}, 2026</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-grey">Time</span>
                                    <span className="text-crown-black">{selectedTime}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-grey">Technician</span>
                                    <span className="text-crown-black">{selectedTech}</span>
                                </div>
                                {selectedAddOns.length > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-stone-grey">Add-ons</span>
                                        <span className="text-crown-black">{selectedAddOns.length} selected</span>
                                    </div>
                                )}
                                <div className="border-t border-stone-grey/15 pt-3 flex justify-between text-sm">
                                    <span className="text-stone-grey">Estimated Total</span>
                                    <span className="text-brushed-gold font-medium text-base">${servicePrice + addOnTotal}</span>
                                </div>
                            </div>

                            <p className="text-xs text-stone-grey mb-8">
                                Thank you, {contactName}! We&apos;ll confirm your appointment via {contactEmail ? 'email' : 'phone'} shortly.
                            </p>

                            <button
                                onClick={handleReset}
                                className="px-8 py-3 border border-warm-black text-warm-black tracking-widest text-sm rounded-sm hover:bg-warm-black hover:text-clean-white transition-all duration-300"
                            >
                                BOOK ANOTHER
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            className="max-w-6xl mx-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Step Indicator */}
                            <div className="flex items-center justify-center gap-2 mb-12">
                                {[
                                    { num: 1, label: 'Service' },
                                    { num: 2, label: 'Date & Time' },
                                    { num: 3, label: 'Technician' },
                                    { num: 4, label: 'Details' },
                                ].map((s, i) => (
                                    <div key={s.num} className="flex items-center gap-2">
                                        <button
                                            onClick={() => s.num < step && setStep(s.num)}
                                            className={`flex items-center gap-2 transition-colors ${s.num < step ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <span
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${s.num === step
                                                        ? 'bg-brushed-gold text-clean-white'
                                                        : s.num < step
                                                            ? 'bg-brushed-gold/20 text-brushed-gold'
                                                            : 'bg-stone-grey/10 text-stone-grey'
                                                    }`}
                                            >
                                                {s.num < step ? <Check size={14} /> : s.num}
                                            </span>
                                            <span className={`text-xs tracking-wider uppercase hidden sm:block ${s.num === step ? 'text-crown-black' : 'text-stone-grey'
                                                }`}>
                                                {s.label}
                                            </span>
                                        </button>
                                        {i < 3 && (
                                            <div className={`w-8 lg:w-16 h-px mx-1 ${s.num < step ? 'bg-brushed-gold/40' : 'bg-stone-grey/20'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Step Content */}
                            <AnimatePresence mode="wait">
                                {/* ───────── Step 1: Service Selection ───────── */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Category Selection */}
                                        <div className="mb-10">
                                            <h3 className="font-serif text-2xl mb-6 text-center">Choose a Service Category</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                                {categories?.map((cat) => {
                                                    const IconComp = categoryIcons[cat.slug?.current] || Sparkles;
                                                    return (
                                                        <button
                                                            key={cat._id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedCategoryId(cat._id);
                                                                setSelectedServiceKey(null);
                                                            }}
                                                            className={`relative p-5 border rounded-sm text-center transition-all duration-300 hover:-translate-y-1 ${selectedCategoryId === cat._id
                                                                    ? 'border-brushed-gold bg-brushed-gold/5 shadow-sm'
                                                                    : 'border-stone-grey/15 bg-clean-white/60 hover:border-soft-rose'
                                                                }`}
                                                        >
                                                            <IconComp size={22} className={`mx-auto mb-3 ${selectedCategoryId === cat._id ? 'text-brushed-gold' : 'text-stone-grey'}`} />
                                                            <p className="font-sans font-medium text-sm text-crown-black leading-tight">{cat.title}</p>
                                                            <p className="text-[10px] text-brushed-gold tracking-wider mt-1">from {cat.priceFrom}</p>
                                                            {selectedCategoryId === cat._id && (
                                                                <motion.span
                                                                    layoutId="category-check"
                                                                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brushed-gold flex items-center justify-center"
                                                                >
                                                                    <Check size={12} className="text-clean-white" />
                                                                </motion.span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Individual Service Selection */}
                                        <AnimatePresence mode="wait">
                                            {selectedCategory && (
                                                <motion.div
                                                    key={selectedCategoryId}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -15 }}
                                                    transition={{ duration: 0.25 }}
                                                >
                                                    <h3 className="font-serif text-2xl mb-6 text-center">
                                                        Select Your <span className="italic">{selectedCategory.title}</span> Treatment
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                                                        {selectedCategory.services.map((service) => (
                                                            <button
                                                                key={service._key}
                                                                type="button"
                                                                onClick={() => setSelectedServiceKey(service._key)}
                                                                className={`flex justify-between items-center p-5 border rounded-sm text-left transition-all duration-200 ${selectedServiceKey === service._key
                                                                        ? 'border-brushed-gold bg-brushed-gold/5'
                                                                        : 'border-stone-grey/15 bg-clean-white/60 hover:border-soft-rose'
                                                                    }`}
                                                            >
                                                                <div className="flex-1 min-w-0 mr-3">
                                                                    <p className="text-sm font-medium text-crown-black truncate">{service.name}</p>
                                                                    {service.note && (
                                                                        <p className="text-[10px] text-stone-grey mt-0.5">{service.note}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <span className="text-sm font-medium text-brushed-gold whitespace-nowrap">{service.price}</span>
                                                                    {selectedServiceKey === service._key && (
                                                                        <motion.span
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            className="w-5 h-5 rounded-full bg-brushed-gold flex items-center justify-center"
                                                                        >
                                                                            <Check size={12} className="text-clean-white" />
                                                                        </motion.span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}

                                {/* ───────── Step 2: Date & Time ───────── */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
                                    >
                                        {/* Calendar */}
                                        <div className="bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Calendar size={18} className="text-brushed-gold" />
                                                <h3 className="font-serif text-xl">Select Date</h3>
                                            </div>

                                            <div className="text-center mb-4">
                                                <p className="text-sm tracking-widest uppercase text-charcoal-grey">February 2026</p>
                                            </div>

                                            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                                    <span key={i} className="text-stone-grey py-2 font-medium">{d}</span>
                                                ))}
                                                {calendarDays.map((cell, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        disabled={!cell.available}
                                                        onClick={() => cell.available && cell.day && setSelectedDay(cell.day)}
                                                        className={`py-2.5 rounded-sm text-sm transition-all duration-200 ${cell.day === null
                                                                ? 'cursor-default'
                                                                : cell.day === selectedDay
                                                                    ? 'bg-brushed-gold text-clean-white font-medium scale-110'
                                                                    : cell.available
                                                                        ? 'text-crown-black bg-soft-rose/20 cursor-pointer hover:bg-soft-rose/40'
                                                                        : 'text-stone-grey/30 cursor-default line-through'
                                                            }`}
                                                    >
                                                        {cell.day}
                                                    </button>
                                                ))}
                                            </div>

                                            {selectedDay && (
                                                <motion.p
                                                    className="mt-4 text-xs text-brushed-gold text-center"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    Selected: February {selectedDay}, 2026
                                                </motion.p>
                                            )}
                                        </div>

                                        {/* Time Slots */}
                                        <div className="bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Clock size={18} className="text-brushed-gold" />
                                                <h3 className="font-serif text-xl">Preferred Time</h3>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2.5">
                                                {timeSlots.map((slot) => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setSelectedTime(slot)}
                                                        className={`py-3 px-2 border rounded-sm text-xs tracking-wider transition-all duration-200 ${selectedTime === slot
                                                                ? 'border-brushed-gold bg-brushed-gold text-clean-white font-medium'
                                                                : 'border-stone-grey/15 text-charcoal-grey hover:border-soft-rose hover:bg-soft-rose/10'
                                                            }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>

                                            {selectedTime && (
                                                <motion.p
                                                    className="mt-4 text-xs text-brushed-gold text-center"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    Preferred time: {selectedTime}
                                                </motion.p>
                                            )}

                                            <p className="text-[10px] text-stone-grey mt-4 text-center">
                                                Times are subject to availability. We&apos;ll confirm your exact slot.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ───────── Step 3: Technician & Add-ons ───────── */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
                                    >
                                        {/* Technicians */}
                                        <div className="bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <User size={18} className="text-brushed-gold" />
                                                <h3 className="font-serif text-xl">Choose Technician</h3>
                                            </div>

                                            <div className="space-y-3">
                                                {technicians.map((tech) => {
                                                    const TechIcon = tech.icon;
                                                    return (
                                                        <button
                                                            key={tech.name}
                                                            type="button"
                                                            onClick={() => setSelectedTech(tech.name)}
                                                            className={`w-full text-left p-4 border rounded-sm transition-all duration-200 ${selectedTech === tech.name
                                                                    ? 'border-brushed-gold bg-brushed-gold/5'
                                                                    : 'border-stone-grey/15 hover:border-soft-rose'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedTech === tech.name ? 'bg-brushed-gold/15' : 'bg-marble-stone'
                                                                    }`}>
                                                                    <TechIcon size={18} className={selectedTech === tech.name ? 'text-brushed-gold' : 'text-stone-grey'} />
                                                                </span>
                                                                <div className="flex-1">
                                                                    <p className="font-sans font-medium text-crown-black">{tech.name}</p>
                                                                    <p className="text-xs text-stone-grey mt-0.5">{tech.specialty}</p>
                                                                </div>
                                                                {selectedTech === tech.name ? (
                                                                    <span className="w-5 h-5 rounded-full bg-brushed-gold flex items-center justify-center flex-shrink-0">
                                                                        <Check size={12} className="text-clean-white" />
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] tracking-widest uppercase text-brushed-gold flex-shrink-0">
                                                                        Available
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Premium Add-ons */}
                                        <div className="bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Sparkles size={18} className="text-brushed-gold" />
                                                <h3 className="font-serif text-xl">Premium Add-ons</h3>
                                            </div>

                                            <div className="space-y-2.5">
                                                {premiumAddOns.map((addon) => (
                                                    <label
                                                        key={addon.id}
                                                        className={`flex items-center justify-between p-3.5 border rounded-sm cursor-pointer transition-all duration-200 ${selectedAddOns.includes(addon.id)
                                                                ? 'border-brushed-gold bg-brushed-gold/5'
                                                                : 'border-stone-grey/15 hover:border-soft-rose'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAddOns.includes(addon.id)}
                                                                onChange={() => toggleAddOn(addon.id)}
                                                                className="w-4 h-4 rounded-sm accent-[#C9A962]"
                                                            />
                                                            <span className="text-sm text-charcoal-grey">{addon.label}</span>
                                                        </div>
                                                        <span className="text-xs text-brushed-gold tracking-wider">+${addon.price}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            {addOnTotal > 0 && (
                                                <motion.div
                                                    className="mt-4 pt-3 border-t border-stone-grey/10 flex justify-between text-sm"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    <span className="text-charcoal-grey">Add-ons total</span>
                                                    <span className="text-brushed-gold font-medium">${addOnTotal}</span>
                                                </motion.div>
                                            )}

                                            <p className="text-[10px] text-stone-grey mt-4">
                                                Optional — enhance your visit with premium extras.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ───────── Step 4: Contact Details & Review ───────── */}
                                {step === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
                                    >
                                        {/* Contact Form */}
                                        <div className="bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Mail size={18} className="text-brushed-gold" />
                                                <h3 className="font-serif text-xl">Your Details</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs tracking-wider uppercase text-stone-grey mb-1.5 block">
                                                        Name <span className="text-soft-rose">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-grey" />
                                                        <input
                                                            type="text"
                                                            value={contactName}
                                                            onChange={(e) => setContactName(e.target.value)}
                                                            placeholder="Full name"
                                                            className="w-full pl-10 pr-4 py-3 border border-stone-grey/15 rounded-sm text-sm bg-clean-white/80 focus:border-brushed-gold focus:outline-none transition-colors placeholder:text-stone-grey/50"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs tracking-wider uppercase text-stone-grey mb-1.5 block">
                                                        Phone <span className="text-soft-rose">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-grey" />
                                                        <input
                                                            type="tel"
                                                            value={contactPhone}
                                                            onChange={(e) => setContactPhone(e.target.value)}
                                                            placeholder="e.g. 022 123 4567"
                                                            className="w-full pl-10 pr-4 py-3 border border-stone-grey/15 rounded-sm text-sm bg-clean-white/80 focus:border-brushed-gold focus:outline-none transition-colors placeholder:text-stone-grey/50"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs tracking-wider uppercase text-stone-grey mb-1.5 block">
                                                        Email <span className="text-stone-grey/50">(optional)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-grey" />
                                                        <input
                                                            type="email"
                                                            value={contactEmail}
                                                            onChange={(e) => setContactEmail(e.target.value)}
                                                            placeholder="your@email.com"
                                                            className="w-full pl-10 pr-4 py-3 border border-stone-grey/15 rounded-sm text-sm bg-clean-white/80 focus:border-brushed-gold focus:outline-none transition-colors placeholder:text-stone-grey/50"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs tracking-wider uppercase text-stone-grey mb-1.5 block">
                                                        Special Requests <span className="text-stone-grey/50">(optional)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <MessageSquare size={16} className="absolute left-3 top-3 text-stone-grey" />
                                                        <textarea
                                                            value={contactNotes}
                                                            onChange={(e) => setContactNotes(e.target.value)}
                                                            placeholder="Any allergies, design preferences, or special requests..."
                                                            rows={3}
                                                            className="w-full pl-10 pr-4 py-3 border border-stone-grey/15 rounded-sm text-sm bg-clean-white/80 focus:border-brushed-gold focus:outline-none transition-colors placeholder:text-stone-grey/50 resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Booking Summary */}
                                        <div className="bg-clean-white/60 backdrop-blur-xl border border-stone-grey/10 rounded-sm p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Check size={18} className="text-brushed-gold" />
                                                <h3 className="font-serif text-xl">Booking Summary</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start pb-3 border-b border-stone-grey/10">
                                                    <div>
                                                        <p className="text-xs tracking-wider uppercase text-stone-grey">Service</p>
                                                        <p className="text-sm font-medium text-crown-black mt-1">{selectedService?.name}</p>
                                                        <p className="text-xs text-stone-grey">{selectedCategory?.title}</p>
                                                    </div>
                                                    <span className="text-sm font-medium text-brushed-gold">{selectedService?.price}</span>
                                                </div>

                                                <div className="flex justify-between pb-3 border-b border-stone-grey/10">
                                                    <div>
                                                        <p className="text-xs tracking-wider uppercase text-stone-grey">When</p>
                                                        <p className="text-sm text-crown-black mt-1">February {selectedDay}, 2026</p>
                                                        <p className="text-xs text-stone-grey">{selectedTime}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between pb-3 border-b border-stone-grey/10">
                                                    <div>
                                                        <p className="text-xs tracking-wider uppercase text-stone-grey">Technician</p>
                                                        <p className="text-sm text-crown-black mt-1">{selectedTech}</p>
                                                    </div>
                                                </div>

                                                {selectedAddOns.length > 0 && (
                                                    <div className="pb-3 border-b border-stone-grey/10">
                                                        <p className="text-xs tracking-wider uppercase text-stone-grey mb-2">Add-ons</p>
                                                        {selectedAddOns.map((id) => {
                                                            const addon = premiumAddOns.find((a) => a.id === id);
                                                            return addon ? (
                                                                <div key={id} className="flex justify-between text-sm text-charcoal-grey mb-1">
                                                                    <span>{addon.label}</span>
                                                                    <span className="text-brushed-gold">+${addon.price}</span>
                                                                </div>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="text-sm font-medium text-crown-black">Estimated Total</span>
                                                    <span className="font-serif text-2xl text-brushed-gold">${servicePrice + addOnTotal}</span>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-stone-grey/10">
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={!canProceed()}
                                                    className={`w-full py-4 tracking-widest text-sm rounded-sm transition-all duration-300 ${canProceed()
                                                            ? 'bg-warm-black text-clean-white hover:bg-crown-black cursor-pointer'
                                                            : 'bg-warm-black/40 text-clean-white/60 cursor-not-allowed'
                                                        }`}
                                                >
                                                    CONFIRM BOOKING
                                                </button>
                                                {!canProceed() && (
                                                    <p className="text-[11px] text-stone-grey mt-3 text-center">
                                                        Please fill in your name and phone number.
                                                    </p>
                                                )}
                                            </div>

                                            {phone && (
                                                <p className="text-[11px] text-stone-grey mt-4 text-center">
                                                    Prefer to call? Reach us at{' '}
                                                    <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="text-brushed-gold hover:underline">
                                                        {phone}
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center max-w-5xl mx-auto mt-10">
                                <button
                                    onClick={prevStep}
                                    className={`flex items-center gap-2 px-6 py-3 border border-stone-grey/20 rounded-sm text-sm tracking-wider text-charcoal-grey hover:border-warm-black hover:text-crown-black transition-colors ${step === 1 ? 'invisible' : ''
                                        }`}
                                >
                                    <ChevronLeft size={16} />
                                    BACK
                                </button>

                                {step < TOTAL_STEPS && (
                                    <button
                                        onClick={nextStep}
                                        disabled={!canProceed()}
                                        className={`flex items-center gap-2 px-8 py-3 rounded-sm text-sm tracking-widest transition-all duration-300 ${canProceed()
                                                ? 'bg-warm-black text-clean-white hover:bg-crown-black cursor-pointer'
                                                : 'bg-warm-black/30 text-clean-white/50 cursor-not-allowed'
                                            }`}
                                    >
                                        NEXT
                                        <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
