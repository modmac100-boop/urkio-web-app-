import React, { useState } from 'react';
import clsx from 'clsx';

const EMOJI_CATEGORIES = [
  { name: 'Frequently Used', emojis: ['❤️', '👍', '🔥', '😂', '😮', '😢', '🙏', '✨'] },
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😆', '😅', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
  { name: 'Hands & Body', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁', '👅', '👄'] },
  { name: 'Healing & Nature', emojis: ['🌿', '🌱', '🍃', '🍀', '🌵', '🌴', '🌳', '🌲', '🪴', '🌸', '🌼', '🌻', '🌞', '🌙', '⭐️', '✨', '☁️', '🌧', '❄️', '🌊', '🧘‍♀️', '🧘‍♂️', '💆‍♀️', '💆‍♂️', '🧖‍♀️', '🧖‍♂️', '🍃', '🍵', '🕯️', '🧿', '💎'] },
  { name: 'Objects', emojis: ['⌚️', '📱', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛️', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧺', '🧻', '🧼', '🪥', '🧽', '🪣', '🧴', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🚪', '🧹', '🧺'] }
];

export function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void, onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].name);

  return (
    <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reactions</span>
        <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex gap-1 p-2 overflow-x-auto no-scrollbar border-b border-zinc-50 dark:border-zinc-800/50">
        {EMOJI_CATEGORIES.map(cat => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={clsx(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0",
              activeCategory === cat.name 
                ? "bg-msgr-primary text-white shadow-sm" 
                : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="h-60 overflow-y-auto p-3 custom-scrollbar">
        {EMOJI_CATEGORIES.map(category => (
          <div key={category.name} className={clsx(activeCategory === category.name ? "block" : "hidden")}>
            <div className="grid grid-cols-6 gap-1">
              {category.emojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xl transition-all hover:scale-125 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
