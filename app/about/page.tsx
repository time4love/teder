"use client";

import { motion } from "framer-motion";

export default function AboutPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-[#F9F9F7] px-5 md:px-10 lg:px-16 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-3xl mx-auto pt-12 pb-16"
      >
        <h1 className="font-heading text-5xl md:text-7xl font-bold text-zinc-900 tracking-tight leading-tight text-balance">
          להתחבר לתדר אחר.
        </h1>
        <p className="mt-6 text-xl text-zinc-600 font-medium leading-relaxed">
          ארכיון חשיפות, עדויות דוקומנטריות וחיפוש בלתי מתפשר אחר האמת.
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

      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto mt-24 pb-24"
      >
        <div className="md:columns-2 gap-12 text-lg text-zinc-700 leading-relaxed font-serif space-y-6 md:space-y-0">
          <p className="mb-6 break-inside-avoid">
            בעולם שבו מידע מסונן, נמחק ומעוּות — האמת אינה תמיד נגישה. כוחות
            שליטה, היעדר שקיפות ושתיקה מכוונת הופכים את החשיפה לניסיון מתמיד
            מול דחייה. תדר-ישר-אל נולד מתוך הכרה עמוקה בכך שהאמת אינה מותרות
            של מיעוט, אלא יסוד שמגיע לכל מי שמחפש אותה בכנות ובאומץ.
          </p>
          <p className="mb-6 break-inside-avoid">
            אנו בונים מקלט דיגיטלי לעדויות, לסיפורים שלא תמיד מוצאים את הבמה
            המגיעה להם: חומרים דוקומנטריים, הקלטות וחשיפות שנאספו בקפידה —
            כדי שקולות לא ייעלמו ברעש. כאן המפגש הוא לא רק צפייה, אלא שמירה על
            זיכרון, על הקשר ההיסטורי ועל האחריות המשותפת שלנו לשמוע ולראות.
          </p>
          <p className="mb-6 break-inside-avoid">
            השם &quot;תדר-ישר-אל&quot; מבטא תדר של אהבה, ריפוי ויישור — תדר
            שמחבר בין לב לאמת, בין קהילה לתוכן עמוק. אנו מזמינים אתכם להצטרף
            למסע: לא רק לצרוך, אלא להתחבר לערוץ שבו האמת נשמעת בבהירות, ברוך
            ובכבוד.
          </p>
        </div>
      </motion.article>
    </main>
  );
}
