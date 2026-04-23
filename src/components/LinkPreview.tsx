import React, { useState, useEffect } from 'react';
import { ExternalLink, Youtube, Instagram, Facebook, Twitter, Play, Globe } from 'lucide-react';
import clsx from 'clsx';

interface LinkPreviewProps {
  url: string;
  mini?: boolean;
}

export function LinkPreview({ url, mini = true }: LinkPreviewProps) {
  const [domain, setDomain] = useState<string>('');
  const [platform, setPlatform] = useState<'youtube' | 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'generic'>('generic');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    try {
      const parsedUrl = new URL(url);
      setDomain(parsedUrl.hostname.replace('www.', ''));

      // Platform detection
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        setPlatform('youtube');
        const videoId = url.includes('v=') 
          ? url.split('v=')[1]?.split('&')[0] 
          : url.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          setThumbnail(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
      } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        setPlatform('facebook');
      } else if (url.includes('instagram.com')) {
        setPlatform('instagram');
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        setPlatform('twitter');
      } else if (url.includes('tiktok.com')) {
        setPlatform('tiktok');
      } else {
        setPlatform('generic');
        // Use a high-quality favicon service for generic links
        setThumbnail(`https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`);
      }
    } catch (e) {
      setDomain(url);
    }
  }, [url]);

  const getIcon = () => {
    switch (platform) {
      case 'youtube': return <Youtube className="w-4 h-4 text-rose-500" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'twitter': return <Twitter className="w-4 h-4 text-sky-500" />;
      default: return <Globe className="w-4 h-4 text-primary" />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (platform === 'youtube' && !showEmbed) {
      e.preventDefault();
      setShowEmbed(true);
    }
  };

  if (showEmbed && platform === 'youtube') {
    const videoId = url.includes('v=') 
          ? url.split('v=')[1]?.split('&')[0] 
          : url.split('youtu.be/')[1]?.split('?')[0];
    return (
      <div className="aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black relative animate-in fade-in zoom-in duration-300">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0"
        ></iframe>
        <button 
          onClick={() => setShowEmbed(false)}
          className="absolute top-4 inset-e-4 z-10 size-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    );
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "group/link block relative overflow-hidden transition-all duration-300",
        mini ? "rounded-2xl bg-slate-50/50 dark:bg-white/5 border border-white/20 p-3 hover:border-primary/40 hover:bg-slate-100/50 dark:hover:bg-white/10" 
             : "rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-white/20 p-5"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail/Icon Sector */}
        <div className="relative shrink-0">
          <div className={clsx(
            "rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative",
            mini ? "size-14" : "size-20"
          )}>
            {thumbnail ? (
              <img src={thumbnail} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover/link:scale-110" />
            ) : (
              <div className="text-slate-400">
                {getIcon()}
              </div>
            )}
            
            {platform === 'youtube' && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/link:opacity-100 transition-opacity">
                <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-current ms-0.5" />
                </div>
              </div>
            )}
          </div>
          
          {/* Mini Platform Badge */}
          <div className="absolute -bottom-1 -inset-e-1 size-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
            {getIcon()}
          </div>
        </div>

        {/* Content Sector */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary truncate max-w-[120px]">
              {platform === 'generic' ? 'Link' : platform}
            </span>
            <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">
              {domain}
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 truncate group-hover/link:text-primary transition-colors">
            {url.split('/').pop() || domain}
          </h4>
          <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover/link:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary">
              <ExternalLink className="w-3 h-3" />
              <span>{platform === 'youtube' ? 'Watch on Urkio' : 'Visit Site'}</span>
            </div>
          </div>
        </div>

        {/* Action Sector (Hidden on mobile maybe?) */}
        <div className="shrink-0 hidden sm:flex items-center justify-center size-10 rounded-xl bg-white/40 dark:bg-black/20 border border-white/20 group-hover/link:bg-primary group-hover/link:text-white group-hover/link:border-primary transition-all">
          <span className="material-symbols-outlined text-[20px]">
            {platform === 'youtube' ? 'play_arrow' : 'open_in_new'}
          </span>
        </div>
      </div>
    </a>
  );
}
