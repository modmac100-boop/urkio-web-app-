import React, { useState } from 'react';
import { Search, HelpCircle, MessageCircle, FileText, ExternalLink, ChevronRight, Video, LifeBuoy } from 'lucide-react';
import clsx from 'clsx';

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Getting Started',
      icon: <HelpCircle className="w-5 h-5 text-blue-500" />,
      articles: ['Creating your profile', 'Following experts', 'Booking your first session']
    },
    {
      title: 'Privacy & Security',
      icon: <Shield className="w-5 h-5 text-emerald-500" />,
      articles: ['Managing visibility', 'Data encryption', 'Blocking users']
    },
    {
      title: 'Expert Services',
      icon: <Video className="w-5 h-5 text-purple-500" />,
      articles: ['How sessions work', 'Payment methods', 'Cancellation policy']
    }
  ];

  const faqs = [
    { q: "Is my data truly private?", a: "Yes, all healing journey milestones and private messages are end-to-end encrypted." },
    { q: "How do I become a verified expert?", a: "You can apply through the Specialist Hub after completing your basic profile." },
    { q: "What is Homii?", a: "Homii is your AI-powered healing assistant that helps track your progress and provides insights." }
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Search */}
      <section className="bg-linear-to-br from-primary to-purple-600 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl shadow-primary/20">
        <div className="absolute inset-0 bg-grid-white/[0.05] grayscale opacity-50"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-black text-white tracking-tight uppercase">How can we help?</h2>
          <p className="text-white/80 font-medium">Search our knowledge base or browse categories below</p>
          <div className="relative group">
            <Search className="absolute inset-s-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search for articles, guides..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-none rounded-4xl ps-16 pe-8 py-6 text-slate-900 dark:text-white shadow-2xl focus:ring-4 focus:ring-white/20 outline-none transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => (
          <div key={i} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl border border-white/20 dark:border-slate-800 p-8 hover:shadow-xl transition-all group/card">
            <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-6 group-hover/card:scale-110 transition-transform">
              {cat.icon}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">{cat.title}</h3>
            <ul className="space-y-3">
              {cat.articles.map((art, j) => (
                <li key={j}>
                  <button className="flex items-center justify-between w-full text-start text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
                    {art}
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <section className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-5xl border border-white/20 dark:border-slate-800 p-12">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-primary" />
          Frequently Asked Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq, i) => (
            <div key={i} className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-start gap-2">
                <span className="text-primary font-black">Q:</span>
                {faq.q}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed ps-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-slate-900 rounded-5xl text-white">
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight uppercase italic">Still need help?</h3>
          <p className="text-slate-400 font-medium">Our support team is available 24/7 to assist you.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-10 py-4 bg-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <LifeBuoy className="w-4 h-4" />
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper icon
function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
