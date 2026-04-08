"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle, Send } from "lucide-react";

export default function ContactPage(): JSX.Element {
  return (
    <main
      dir="rtl"
      className="bg-[#F9F9F7] min-h-[calc(100vh-4rem)]"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl mx-auto pt-16 pb-12"
      >
        <h1 className="font-heading text-5xl font-bold text-zinc-900 tracking-tight">
          יצירת קשר
        </h1>
        <p className="mt-4 text-lg text-zinc-600 font-medium">
          הפרטיות שלכם חשובה לנו. אנחנו לא אוגרים מידע באתר. בחרו את הדרך הנוחה
          לכם לפנות אלינו ישירות.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto px-4 pb-24">
        <a
          href={`mailto:teder.yesharel@gmail.com?subject=${encodeURIComponent("פנייה מהאתר תדר-ישר-אל")}`}
          className="block"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all h-full"
          >
            <Mail
              className="size-14 text-zinc-800 mb-4"
              strokeWidth={1.5}
              aria-hidden
            />
            <h2 className="font-heading text-xl font-bold text-zinc-900">
              אימייל ישיר
            </h2>
            <p className="mt-2 text-zinc-600 font-medium">
              שלחו לנו הודעה לתיבת הדואר שלנו.
            </p>
          </motion.div>
        </a>

        <a
          href="https://chat.whatsapp.com/Iq8QddwEdkCGjSodHfaGLK?mode=gi_t"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all h-full"
          >
            <MessageCircle
              className="size-14 text-emerald-500 mb-4"
              strokeWidth={1.5}
              aria-hidden
            />
            <h2 className="font-heading text-xl font-bold text-zinc-900">
              WhatsApp
            </h2>
            <p className="mt-2 text-zinc-600 font-medium">
              שלחו לנו הודעה מהירה ומאובטחת בוואטסאפ.
            </p>
          </motion.div>
        </a>

        <a
          href="https://t.me/tederyesharel"
          target="_blank"
          rel="noopener noreferrer"
          className="block md:col-span-2 md:max-w-md md:mx-auto md:w-full"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-white border border-zinc-200 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all h-full"
          >
            <Send
              className="size-14 text-sky-500 mb-4"
              strokeWidth={1.5}
              aria-hidden
            />
            <h2 className="font-heading text-xl font-bold text-zinc-900">
              טלגרם
            </h2>
            <p className="mt-2 text-zinc-600 font-medium">
              עקבו אחרינו או שלחו הודעה בטלגרם.
            </p>
          </motion.div>
        </a>
      </div>
    </main>
  );
}
