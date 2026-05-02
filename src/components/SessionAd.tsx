/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface SessionAdProps {
  event: any;
  onClick: (event: any) => void;
}

export function SessionAd({ event, onClick }: SessionAdProps) {
  if (!event) return null;

  const eventDate = event.date ? new Date(event.date) : new Date();

  return (
    <div 
      onClick={() => onClick(event)}
      className="bg-white dark:bg-zinc-900 rounded-5xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm group cursor-pointer transition-all duration-500 hover:shadow-xl hover:border-ur-primary/10 overflow-hidden relative"
    >
      {/* Session Badge */}
      <div className="flex items-center gap-2 mb-4 bg-zinc-50 dark:bg-zinc-800/50 w-fit px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-700">
        <span className="material-symbols-outlined text-sm text-teal-500 font-fill">calendar_today</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">SESSION</span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 leading-tight group-hover:text-ur-primary transition-colors text-end" dir="rtl">
        {event.title}
      </h3>

      {/* Cover Image */}
      <div className="relative h-44 rounded-3xl overflow-hidden mb-4">
        <img 
          src={event.mediaUrl || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop"} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
      </div>

      {/* Subtitle / Repetition of title as seen in user image */}
      <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold mb-6 text-end line-clamp-1" dir="rtl">
        {event.title}
      </p>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={event.creatorPhoto || "https://ui-avatars.com/api/?name=URKIO&background=f4f3f0&color=004e99"} 
              alt="Creator" 
              className="w-10 h-10 rounded-xl object-cover" 
            />
            <div className="absolute -bottom-1 -inset-e-1 bg-white dark:bg-zinc-900 rounded-full p-0.5">
              <CheckCircle className="text-[#0a66c2] w-[14px] h-[14px]" />
            </div>
          </div>
          <div className="text-start">
            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">URKIO</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Specialist</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
           <Calendar className="w-3 h-3 opacity-50" />
           {format(eventDate, 'MMM d, h:mm a')}
        </div>
      </div>

      {/* Hover Play Button Overlay */}
      <div className="absolute top-1/2 inset-s-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 pointer-events-none">
        <Play className="text-ur-primary w-6 h-6" />
      </div>
    </div>
  );
}
