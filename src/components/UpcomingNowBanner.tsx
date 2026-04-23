import React from 'react';
import { Calendar, Users, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface UpcomingNowBannerProps {
  event: any;
  onDetailsClick?: (event: any) => void;
}

export function UpcomingNowBanner({ event, onDetailsClick }: UpcomingNowBannerProps) {
  if (!event) return null;

  const eventDate = new Date(event.date);
  const isToday = new Date().toDateString() === eventDate.toDateString();

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:-translate-y-1">
      {/* Background with Ambient Glow */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/30 via-transparent to-accent/20 opacity-40 group-hover:opacity-60 transition-opacity"></div>
      
      {/* Image / Content Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={event.creatorPhoto || `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop`} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        
        {/* Status Badge */}
        <div className="absolute top-6 inset-s-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
          <div className="size-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            {isToday ? 'Live Soon' : 'Upcoming Now'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-8 -mt-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-surface/10 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 leading-tight">Expert Session</p>
            <p className="text-xs font-bold text-white leading-tight">
              {eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} @ {event.time || eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <h3 className="text-2xl font-black text-white mb-3 leading-tight group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        <p className="text-sm text-white/60 line-clamp-2 mb-6 font-medium leading-relaxed">
          {event.description || "Join this exclusive session with our leading experts to explore your healing journey."}
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="size-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden ring-1 ring-white/10">
                <img src={`https://i.pravatar.cc/100?u=${event.id + i}`} alt="Attendee" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <span className="text-xs font-bold text-white/40">+{event.attendeesCount || 12} joining</span>
        </div>

        <button 
          onClick={() => onDetailsClick?.(event)}
          className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          {isToday ? (
            <><Play className="w-4 h-4 fill-current" /> JOIN SESSION</>
          ) : (
            <>VIEW DETAILS <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Interactive Footer Decor */}
      <div className="px-8 pb-6 text-center">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
          Powered by Urkio Events
        </p>
      </div>
    </div>
  );
}
