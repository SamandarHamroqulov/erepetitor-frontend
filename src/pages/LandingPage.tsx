import { Link } from 'react-router-dom'
import {
    GraduationCap, Users, BookOpen, CheckCircle2,
    CreditCard, BarChart3, ArrowRight, ChevronRight,
} from 'lucide-react'

const features = [
    {
        icon: Users,
        title: "O'quvchilarni boshqarish",
        desc: "O'quvchilarni oson qo'shing va boshqaring.",
        color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
    {
        icon: BookOpen,
        title: 'Guruhlarni boshqarish',
        desc: 'Guruhlar va dars jadvalini tartibga soling.',
        color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    },
    {
        icon: CheckCircle2,
        title: 'Davomat tizimi',
        desc: 'Davomatni tez va qulay belgilang.',
        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
    },
    {
        icon: CreditCard,
        title: "To'lovlarni boshqarish",
        desc: "Oylik to'lovlarni kuzating va qarzdorlarni aniqlang.",
        color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
        icon: BarChart3,
        title: 'Statistika',
        desc: "O'quv markazingiz faoliyatini statistikalar orqali kuzating.",
        color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20',
    },
]

const steps = [
    { num: '01', title: "Ro'yxatdan o'ting", desc: "Tizimda bepul hisob yarating." },
    { num: '02', title: "Guruh va o'quvchilarni qo'shing", desc: "Guruhlaringiz va o'quvchilarni kiritib boshlang." },
    { num: '03', title: "Davomat va to'lovlarni boshqaring", desc: "Kundalik davomatni belgilang, to'lovlarni kuzating." },
]

export default function LandingPage() {
    return (
        <div className="min-h-dvh bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* ── HEADER ──────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/20">
                            <GraduationCap size={20} className="text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">eRepetitor</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Imkoniyatlar</a>
                        <a href="#how" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Qanday ishlaydi</a>
                        <a href="#contact" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Aloqa</a>
                    </nav>

                    {/* Auth buttons */}
                    <div className="flex items-center gap-2">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                            Kirish
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-900/20"
                        >
                            Ro'yxatdan o'tish
                        </Link>
                    </div>
                </div>
            </header>

            {/* ── HERO ────────────────────────────── */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950" />
                <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                            <GraduationCap size={14} />
                            O'quv markazlar uchun CRM
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                            Repetitorlar va o'quv markazlar uchun{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                                zamonaviy boshqaruv tizimi
                            </span>
                        </h1>

                        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            eRepetitor yordamida o'quvchilar, guruhlar, to'lovlar va davomatni bitta platformada boshqaring.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Ro'yxatdan o'tish
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                to="/login"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            >
                                Kirish
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Product screenshot placeholder */}
                    <div className="mt-16 max-w-5xl mx-auto">
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/10 dark:shadow-black/30">

                            <img
                                src="/images/product.png"
                                alt="eRepetitor platform preview"
                                className="w-full object-cover"
                            />

                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ─────────────────────────── */}
            <section id="features" className="py-20 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Imkoniyatlar</h2>
                        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                            eRepetitor sizga kerak bo'lgan barcha vositalarni bitta joyda taqdim etadi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/10 transition-shadow">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                                    <f.icon size={22} />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────── */}
            <section id="how" className="py-20 sm:py-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Qanday ishlaydi?</h2>
                        <p className="mt-3 text-slate-600 dark:text-slate-400">3 oddiy qadamda boshlang</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-indigo-600/20">
                                    {s.num}
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SCREENSHOTS ───────────────────────── */}
            <section className="py-20 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">

                    <div className="text-center mb-14">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                            Tizim ko'rinishi
                        </h2>
                        <p className="mt-3 text-slate-600 dark:text-slate-400">
                            eRepetitor platformasining interfeysi
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Dashboard screenshot */}
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
                            <img
                                src="/screenshots/dashboard.png"
                                alt="Dashboard preview"
                                className="w-full h-full object-cover"
                            />

                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                <p className="text-sm text-white font-medium">
                                    Dashboard preview
                                </p>
                            </div>
                        </div>

                        {/* Attendance screenshot */}
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
                            <img
                                src="/screenshots/attendance.png"
                                alt="Attendance preview"
                                className="w-full h-full object-cover"
                            />

                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                <p className="text-sm text-white font-medium">
                                    Attendance preview
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
            {/* ── CTA ───────────────────────────────── */}
            <section className="py-20 sm:py-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-10 sm:p-14 text-center shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent_60%)]" />
                        <div className="relative">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                Bugun eRepetitor bilan ishlashni boshlang
                            </h2>
                            <p className="text-indigo-100 mb-8 max-w-lg mx-auto">
                                Minglab repetitorlar allaqachon eRepetitor'dan foydalanmoqda. Siz ham qo'shiling!
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-indigo-700 bg-white rounded-xl hover:bg-indigo-50 transition-colors shadow-lg"
                                >
                                    Ro'yxatdan o'tish
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/login"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    Kirish
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────── */}
            <footer id="contact" className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                    <GraduationCap size={16} className="text-white" />
                                </div>
                                <span className="text-white font-bold">eRepetitor</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                O'quv markazlar uchun zamonaviy boshqaruv tizimi.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Havolalar</h4>
                            <ul className="space-y-2">
                                <li><Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Kirish</Link></li>
                                <li><Link to="/register" className="text-sm text-slate-400 hover:text-white transition-colors">Ro'yxatdan o'tish</Link></li>
                                <li><a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Imkoniyatlar</a></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Aloqa</h4>
                            <ul className="space-y-2">
                                <li className="text-sm text-slate-400">info@erepetitor.uz</li>
                                <li className="text-sm text-slate-400">Toshkent, O'zbekiston</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-500">
                            © {new Date().getFullYear()} eRepetitor. Barcha huquqlar himoyalangan.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
