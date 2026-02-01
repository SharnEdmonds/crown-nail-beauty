'use client';

import { motion } from 'framer-motion';

export default function BookingCTA() {
    return (
        <section className="py-20 md:py-32 bg-warm-black text-clean-white relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="block text-sm tracking-[0.2em] text-stone-grey mb-6 uppercase">
                        Start Your Journey
                    </span>
                    <h2 className="text-3xl md:text-6xl font-serif mb-8 leading-tight">
                        Ready to Experience <br />
                        <span className="italic text-gray-400">Excellence?</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-gray-400 mb-12 font-light leading-relaxed">
                        Secure your appointment today and let us treat you to the finest nail and beauty care in a serene, luxurious setting.
                    </p>

                    <a
                        href="/"
                        className="inline-block px-10 py-5 bg-clean-white text-warm-black text-sm tracking-widest hover:bg-gray-200 transition-all duration-300 rounded-sm"
                    >
                        BOOK AN APPOINTMENT
                    </a>
                </motion.div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gray-500 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-700 rounded-full blur-[120px]" />
            </div>
        </section>
    );
}
