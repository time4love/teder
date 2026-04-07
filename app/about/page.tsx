"use client";

import { motion } from "framer-motion";

export default function AboutPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-[#F9F9F7] px-5 pb-16 md:px-10 md:pb-24 lg:px-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl mx-auto pt-12 pb-16"
      >
        <h1 className="font-heading text-5xl md:text-7xl font-bold text-zinc-900 tracking-tight leading-tight text-balance">
          להתחבר לתדר אמת.
        </h1>
        <p className="mt-6 text-xl text-zinc-600 font-medium leading-relaxed">
          ארכיון חשיפות, עדויות ומידע.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative max-w-5xl mx-auto"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 md:-inset-12 rounded-[2.5rem] bg-gradient-to-br from-amber-200/40 via-sky-200/35 to-indigo-200/30 blur-3xl opacity-90"
        />
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 bg-white">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto object-cover relative z-10"
            src="/about-logo.mp4"
            poster="/logo.png"
          />
        </div>
      </motion.div>
    </main>
  );
}
