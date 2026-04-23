const fs = require('fs');

const indexCssPath = '/Users/sameralhalaki/Desktop/urkio-web-test/src/index.css';
let indexCss = fs.readFileSync(indexCssPath, 'utf8');

if (!indexCss.includes('--color-background-light')) {
  indexCss += `
/* New Messenger Design System */
@theme {
  --color-primary: #136dec;
  --color-background-light: #f6f7f8;
  --color-background-dark: #0a0e14;
  --color-surface-dark: #161d27;
  --color-accent-purple: #8b5cf6;
}

.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.dark .glass {
  background: rgba(22, 29, 39, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.chat-bubble-received {
  background: rgba(19, 109, 236, 0.1);
  border: 1px solid rgba(19, 109, 236, 0.2);
}

.glow-active {
  box-shadow: 0 0 15px rgba(19, 109, 236, 0.4);
}
`;
  fs.writeFileSync(indexCssPath, indexCss);
  console.log("Updated index.css");
}

const messengerPath = '/Users/sameralhalaki/Desktop/urkio-web-test/src/pages/Messenger.tsx';
let messenger = fs.readFileSync(messengerPath, 'utf8');

const newMessengerReturn = `  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen overflow-hidden">
      <div className="flex h-full w-full">
        {/* Side Navigation (Minimalist Vertical Bar) */}
        <aside className="w-20 shrink-0 flex flex-col items-center py-6 border-r border-slate-200 dark:border-primary/10 bg-background-light dark:bg-background-dark z-20">
          <div className="mb-10 text-primary cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-4xl font-bold">blur_on</span>
          </div>
          <nav className="flex flex-col gap-8 flex-1">
            <a className="text-primary group relative cursor-pointer" onClick={() => navigate('/messenger')}>
              <span className="material-symbols-outlined text-2xl">chat_bubble</span>
              <span className="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-primary glow-active"></span>
            </a>
            <a className="text-slate-400 hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/video')}>
              <span className="material-symbols-outlined text-2xl">videocam</span>
            </a>
            <a className="text-slate-400 hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/healing-circle')}>
              <span className="material-symbols-outlined text-2xl">group</span>
            </a>
            <a className="text-slate-400 hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/files')}>
              <span className="material-symbols-outlined text-2xl">folder_open</span>
            </a>
          </nav>

          <div className="mt-auto flex flex-col gap-6">
            <button className="text-slate-400 hover:text-primary transition-colors" onClick={() => navigate('/settings')}>
              <span className="material-symbols-outlined text-2xl">settings</span>
            </button>
            <div className="size-10 rounded-full border-2 border-primary/50 p-0.5 cursor-pointer" onClick={() => navigate('/profile')}>
              <img src={currentUser?.photoURL || \`https://ui-avatars.com/api/?name=\${currentUser?.displayName || 'U'}\`} className="rounded-full w-full h-full object-cover" alt="User profile avatar" />
            </div>
          </div>
        </aside>

        {/* Sidebar: Active Chats (Glassmorphism) */}
        <section className={clsx("w-80 xl:w-96 shrink-0 glass border-r border-slate-200 dark:border-primary/10 flex flex-col z-10", selectedConvId && "hidden md:flex")}>
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Messages</h2>
              <button className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-[18px]">edit_square</span>
              </button>
            </div>
            
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-primary/5 border border-slate-200 dark:border-transparent rounded-xl pl-10 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400" 
              />
            </div>
            
            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
              <button onClick={() => setActiveFilter('All')} className={clsx("text-xs font-semibold px-4 py-1.5 rounded-full transition-colors", activeFilter === 'All' ? "bg-primary text-white" : "bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-primary/20")}>All</button>
              <button onClick={() => setActiveFilter('Unread')} className={clsx("text-xs font-semibold px-4 py-1.5 rounded-full transition-colors", activeFilter === 'Unread' ? "bg-primary text-white" : "bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-primary/20")}>Unread</button>
              <button onClick={() => setActiveFilter('Experts')} className={clsx("text-xs font-semibold px-4 py-1.5 rounded-full transition-colors", activeFilter === 'Experts' ? "bg-primary text-white" : "bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-primary/20")}>Experts</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8"><div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">forum</span>
                <p className="text-sm">No conversations</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const pId = conv.participants.find((id: string) => id !== currentUser?.uid);
                const partner = pId ? partnersData[pId] : null;
                const isActive = selectedConvId === conv.id;
                const unread = conv.unreadCount?.[currentUser?.uid || ''] || 0;
                const isTyping = pId && conv.typing?.[pId];

                return (
                  <div 
                    key={conv.id} 
                    onClick={() => setSearchParams({ id: conv.id })}
                    className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group relative", 
                      isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-slate-100 dark:hover:bg-primary/5 border border-transparent"
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-primary rounded-r-full"></div>}
                    
                    <div className="relative shrink-0">
                      <img 
                        src={partner?.photoURL || \`https://ui-avatars.com/api/?name=\${partner?.displayName || '?'}&background=random\`} 
                        className="size-12 rounded-xl object-cover" 
                        alt={partner?.displayName || ''} 
                      />
                      {partner?.isOnline && (
                        <span className="absolute -bottom-1 -right-1 size-3 bg-green-500 border-2 border-white dark:border-background-dark rounded-full"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h3 className={clsx("font-semibold text-[14px] truncate", isActive ? "text-primary dark:text-white" : "text-slate-800 dark:text-slate-200")}>
                          {partner?.displayName || conv.name || 'Unknown'}
                        </h3>
                        {unread > 0 ? (
                           <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">{unread}</span>
                        ) : (
                           <span className="text-[10px] text-slate-400">
                             {conv.updatedAt ? formatDistanceToNow(conv.updatedAt.toMillis?.() || conv.updatedAt.seconds * 1000, { addSuffix: false }) : ''}
                           </span>
                        )}
                      </div>
                      <p className={clsx("text-[13px] truncate", unread > 0 ? "text-slate-800 dark:text-slate-200 font-semibold" : "text-slate-500")}>
                        {isTyping ? (
                          <span className="text-primary font-medium italic">Typing...</span>
                        ) : (
                          conv.lastMessage?.senderId === currentUser?.uid 
                            ? \`You: \${conv.lastMessage?.text || 'Sent an attachment'}\`
                            : conv.lastMessage?.text || 'No messages yet'
                        )}
                      </p>
                    </div>
                    
                    {!isActive && unread === 0 && <div className="hidden group-hover:flex size-1.5 rounded-full bg-primary glow-active absolute right-4"></div>}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Main Content Area */}
        {selectedConvId || (selectedPartner && selectedConvId === 'new') ? (
          <ChatWindow 
            conversationId={selectedConvId || 'new'}
            currentUser={currentUser}
            userData={userData}
            partner={selectedPartner}
            onBack={() => setSearchParams({})}
            simplified={true}
          />
        ) : (
          <main className="flex-1 flex flex-col relative bg-background-light dark:bg-background-dark items-center justify-center">
            <div className="absolute inset-0 bg-primary/5 opacity-50 bg-[radial-gradient(#136dec_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
            <div className="z-10 flex flex-col items-center">
              <div className="size-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-5xl">forum</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Welcome to Urkio Messenger</h2>
              <p className="text-slate-500 max-w-sm text-center">Select a conversation or invite a contact to start an end-to-end encrypted chat.</p>
              <button className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all font-medium">
                <span className="material-symbols-outlined">add</span>
                Start New Chat
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );`;

let mStartIndex = messenger.indexOf('  return (\n    <div className="bg-msgr-surface');
if (mStartIndex === -1) {
    mStartIndex = messenger.indexOf('  return (\n    <div className="bg-background-light'); // retry
    if (mStartIndex === -1) mStartIndex = messenger.indexOf('  return (\n');
}
const mEndIndex = messenger.lastIndexOf('  );\n}') + 6;

if (mStartIndex !== -1) {
    const updatedMessenger = messenger.substring(0, mStartIndex) + newMessengerReturn + '\n' + messenger.substring(mEndIndex);
    fs.writeFileSync(messengerPath, updatedMessenger);
    console.log("Updated Messenger.tsx");
} else {
    console.log("Could not find start index for Messenger.tsx");
}

const chatWindowPath = '/Users/sameralhalaki/Desktop/urkio-web-test/src/components/messaging/ChatWindow.tsx';
let chatWindow = fs.readFileSync(chatWindowPath, 'utf8');

const newChatWindowReturn = `  return (
    <>
      <main className="flex-1 flex flex-col relative bg-background-light dark:bg-background-dark min-w-0">
        {/* Header */}
        <header className="h-20 px-4 md:px-8 shrink-0 border-b border-slate-200 dark:border-primary/10 flex items-center justify-between bg-white/50 dark:bg-background-dark/50 backdrop-blur-md z-10 relative">
            <div className="flex items-center gap-4 min-w-0">
              {onBack && (
                <button onClick={onBack} className="md:hidden p-2 text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              )}
              <div className="relative shrink-0 cursor-pointer" onClick={() => setShowExpertSidebar(!showExpertSidebar)}>
                <img src={partner?.photoURL || \`https://ui-avatars.com/api/?name=\${partner?.displayName || '?'}&background=random\`} className="size-12 rounded-xl object-cover" alt="" />
                {partner?.isOnline && <div className="absolute -bottom-1 -right-1 size-3.5 bg-green-500 border-2 border-white dark:border-background-dark rounded-full" />}
              </div>
              <div className="cursor-pointer min-w-0" onClick={() => setShowExpertSidebar(!showExpertSidebar)}>
                <h2 className="font-bold text-lg truncate text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {partner?.displayName || 'Chat'}
                  {partner?.role === 'specialist' && <span className="material-symbols-outlined text-[18px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {isPartnerTyping ? (
                    <span className="text-primary italic font-medium animate-pulse">Typing...</span>
                  ) : (
                    <>
                      {partner?.isOnline ? "Active Now" : "Offline"}
                      {partner?.currentMood && <span title={partner.currentMood}>
                        {partner.currentMood === 'happy' && '😊'}
                        {partner.currentMood === 'calm' && '😌'}
                        {partner.currentMood === 'sad' && '😔'}
                        {partner.currentMood === 'energetic' && '⚡'}
                        {partner.currentMood === 'neutral' && '🧘'}
                      </span>}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {isSpecialRole && (
                 <>
                   <button onClick={() => startCall('audio')} className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-surface-dark text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors hidden sm:flex">
                     <span className="material-symbols-outlined text-[20px]">call</span>
                   </button>
                   <button onClick={() => startCall('video')} className="size-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-surface-dark text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-primary/20 transition-colors hidden sm:flex">
                     <span className="material-symbols-outlined text-[20px]">videocam</span>
                   </button>
                 </>
              )}
              <button onClick={() => setShowExpertSidebar(!showExpertSidebar)} className={clsx("size-10 flex items-center justify-center rounded-xl transition-colors", showExpertSidebar ? "bg-primary text-white" : "bg-slate-100 dark:bg-surface-dark text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-primary/20")}>
                <span className="material-symbols-outlined text-[20px]">info</span>
              </button>
            </div>
        </header>

        {/* Chat Space */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar" id="messages-feed" style={{ overflowAnchor: 'auto' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center gap-3 opacity-60">
              <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs uppercase tracking-widest font-bold text-slate-500">Loading</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12 px-6">
              <div className="bg-primary/10 rounded-full p-5 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
              </div>
              <div className="max-w-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">End-to-End Encrypted</h4>
                <p className="text-slate-500 text-sm font-medium">Your messages are private and protected.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isOwn = msg.senderId === currentUser.uid;
              const isSameSender = idx > 0 && messages[idx - 1].senderId === msg.senderId;
              return (
                 <motion.div 
                   key={msg.id} 
                   initial={{ opacity: 0, y: 10, scale: 0.98 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   className={clsx("flex gap-3 max-w-[85%] group", isOwn ? "ml-auto flex-row-reverse" : "mr-auto", !isSameSender && "mt-4")}
                 >
                   {!isOwn && (
                     <img src={partner?.photoURL || \`https://ui-avatars.com/api/?name=\${partner?.displayName || '?'}&background=random\`} className="size-8 rounded-full object-cover shrink-0 self-end mb-4 hidden sm:block" alt="" />
                   )}
                   <div className={clsx("space-y-1 relative", isOwn ? "text-right" : "")}>
                     {msg.replyTo && (
                       <div className="bg-slate-100 dark:bg-surface-dark border-l-2 border-primary p-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 text-left mb-1 opacity-80 inline-block max-w-[250px]">
                         <span className="font-bold text-primary">{msg.replyTo.senderId === currentUser.uid ? 'You' : partner?.displayName}</span>
                         <p className="truncate block mt-0.5">{msg.replyTo.text}</p>
                       </div>
                     )}
                     
                     <div className="flex relative items-center">
                        <div className={clsx("absolute opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10", isOwn ? "-left-[72px]" : "-right-[72px]")}>
                           <button onClick={() => setReplyingTo(msg)} className="p-1.5 bg-background-light dark:bg-surface-dark text-slate-500 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 hover:text-primary transition-all hover:scale-110">
                             <span className="material-symbols-outlined text-[14px]">reply</span>
                           </button>
                           <div className="flex bg-background-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-0.5 rounded-full shadow-sm">
                              {['👍', '❤️'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => toggleReaction(msg.id, emoji)}
                                  className="p-1 hover:scale-125 transition-transform text-[12px]"
                                >
                                  {emoji}
                                </button>
                              ))}
                           </div>
                        </div>
                        
                        <div className={clsx(
                          "px-4 py-3 text-[14px] leading-relaxed shadow-sm block text-left", 
                          isOwn 
                            ? "bg-primary text-white rounded-[20px] rounded-br-sm glow-active" 
                            : "chat-bubble-received text-slate-800 dark:text-slate-200 rounded-[20px] rounded-bl-sm"
                        )}>
                          {msg.type === 'text' && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                          {msg.type === 'file' && (
                             <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-black/10 dark:bg-white/5 p-2 rounded-xl hover:bg-black/20 transition-colors">
                               <div className="size-10 bg-white/20 rounded-lg flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-lg">description</span></div>
                               <div className="min-w-0 pr-2">
                                 <p className="text-xs font-bold truncate">{msg.text}</p>
                                 <p className="text-[10px] opacity-70">Document</p>
                               </div>
                               <span className="material-symbols-outlined text-sm ml-auto opacity-70">open_in_new</span>
                             </a>
                          )}
                          {msg.type === 'video' && (
                             <video src={msg.videoUrl!} controls className="max-w-full sm:max-w-sm rounded-[14px] mt-1 shadow-md" />
                          )}
                          {msg.type === 'audio' && (
                              <AudioMessage url={msg.audioUrl!} duration={msg.duration} isOwn={isOwn} />
                          )}
                          {msg.type === 'call' && (
                             <div className="flex items-center gap-2">
                               <span className="material-symbols-outlined">{msg.callType === 'video' ? 'videocam' : 'call'}</span>
                               <span className="font-semibold">{msg.text}</span>
                               <button onClick={() => navigate(\`/room/\${msg.callRoomId}\`)} className={clsx("ml-3 px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all", isOwn ? "bg-white text-primary" : "bg-primary text-white")}>Join</button>
                             </div>
                          )}
                        </div>
                     </div>
                     
                     <div className={clsx("flex flex-col gap-1 mt-1", isOwn ? "items-end" : "items-start")}>
                         <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                              {msg.timestamp ? format(msg.timestamp.toMillis?.() || msg.timestamp.seconds * 1000, 'h:mm a') : ''}
                            </span>
                            {isOwn && (
                              <span className={clsx("material-symbols-outlined text-[14px]", msg.read ? "text-primary" : "text-slate-400")}>
                                {msg.read ? 'done_all' : 'done'}
                              </span>
                            )}
                         </div>
                         
                         {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                             <div className="flex flex-wrap gap-1">
                               {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                 <button
                                   key={emoji}
                                   onClick={() => toggleReaction(msg.id, emoji)}
                                   className={clsx(
                                     "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] transition-all border",
                                     (userIds as string[]).includes(currentUser.uid)
                                       ? "bg-primary/20 border-primary/30 text-primary"
                                       : "bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800 text-slate-500"
                                   )}
                                 >
                                   <span>{emoji}</span>
                                   {(userIds as string[]).length > 1 && <span className="font-semibold">{(userIds as string[]).length}</span>}
                                 </button>
                               ))}
                             </div>
                         )}
                     </div>
                   </div>
                 </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-primary/10 glass shrink-0 relative z-20">
          <AnimatePresence>
              {replyingTo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-100 dark:bg-surface-dark mb-4 rounded-xl p-3 flex justify-between items-center border-l-4 border-primary shadow-sm"
                >
                  <div className="min-w-0 pr-4 pl-1">
                     <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">reply</span> 
                        Replying to {replyingTo.senderId === currentUser.uid ? 'You' : partner?.displayName}
                     </p>
                     <p className="text-[13px] text-slate-600 dark:text-slate-400 truncate italic font-medium">{replyingTo.text}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </motion.div>
              )}
          </AnimatePresence>
          
          <form onSubmit={handleSendMessage} className="flex flex-col relative">
             <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-surface-dark p-2 rounded-[20px] shadow-sm border border-slate-200 dark:border-slate-800 focus-within:border-primary/50 focus-within:shadow-md transition-all">
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'file')} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="size-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-primary/10 rounded-full transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={\`Message \${partner?.displayName || '...'}\`}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-2 px-1 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none font-medium"
                />
                
                <div className="flex items-center gap-1 md:gap-2 pr-1 shrink-0">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="size-10 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-surface-dark rounded-full transition-colors relative">
                    <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute bottom-14 right-0 z-50 shadow-2xl rounded-[24px] overflow-hidden border border-slate-200 dark:border-surface-dark"
                        >
                           <EmojiPicker onEmojiSelect={(e: string) => { setNewMessage(prev => prev + e); setShowEmojiPicker(false); }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  {isRecording ? (
                    <div className="flex items-center gap-3 pr-1">
                       <span className="text-xs text-red-500 font-bold animate-pulse">{recordingTime}s</span>
                       <button type="button" onClick={() => handleStopRecording(true)} className="size-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-lg shadow-red-500/30 transition-transform active:scale-95">
                          <span className="material-symbols-outlined text-[20px]">stop</span>
                       </button>
                    </div>
                  ) : newMessage.trim() ? (
                    <button type="submit" disabled={isSending || uploading} className="size-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 disabled:opacity-50 active:scale-95 hover:scale-105 group">
                      {isSending || uploading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px] ml-0.5 group-hover:-rotate-12 transition-transform duration-300">send</span>}
                    </button>
                  ) : (
                    <button type="button" onClick={handleStartRecording} className="size-10 text-slate-400 hover:text-white dark:hover:text-white hover:bg-primary dark:hover:bg-primary rounded-full flex items-center justify-center transition-colors active:scale-95">
                      <span className="material-symbols-outlined text-[20px]">mic</span>
                    </button>
                  )}
                </div>
             </div>
          </form>
        </div>
      </main>

      {/* Right Sidebar (Collapsible Context) */}
      <AnimatePresence>
        {(showExpertSidebar && partner) && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-slate-200 dark:border-primary/10 bg-background-light dark:bg-surface-dark hidden xl:flex flex-col shrink-0 overflow-hidden"
          >
            <div className="w-80 h-full flex flex-col">
                <div className="p-8 pb-4 flex-1 overflow-y-auto custom-scrollbar">
                   <div className="text-center mb-8 relative">
                      <button onClick={() => setShowExpertSidebar(false)} className="absolute -top-4 -right-4 p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                      <img 
                        src={partner?.photoURL || \`https://ui-avatars.com/api/?name=\${partner?.displayName || '?'}&background=random\`} 
                        className="size-24 rounded-[24px] object-cover mx-auto mb-4 border border-slate-200 dark:border-primary/20 shadow-md" 
                        alt={partner?.displayName || ''} 
                      />
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{partner?.displayName}</h2>
                      <p className="text-[13px] text-primary font-bold uppercase tracking-widest">{partner?.role === 'specialist' ? partner?.specialties?.join(', ') || 'Expert Consultant' : 'Urkio Member'}</p>
                   </div>
                   
                   <div className="space-y-8">
                     {partner?.description && (
                       <div>
                         <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Context</h3>
                         <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{partner.description}</p>
                       </div>
                     )}
                     
                     <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Shared Assets</h3>
                        </div>
                        <div className="bg-slate-100 dark:bg-background-dark rounded-2xl border border-slate-200 dark:border-slate-800/50 p-5 text-center">
                           <span className="material-symbols-outlined text-3xl text-slate-400 mb-2 opacity-50">folder_off</span>
                           <p className="text-xs text-slate-500 font-medium">No media shared yet</p>
                        </div>
                     </div>
                     
                     <div>
                       <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Session Notes</h3>
                       <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                         <div className="flex gap-3">
                           <span className="material-symbols-outlined text-amber-600 text-[20px]">lock</span>
                           <p className="text-xs text-amber-700 dark:text-amber-500/80 font-medium leading-relaxed">End-to-end encrypted session. System logs are not retained.</p>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
                
                <div className="p-6 border-t border-slate-200 dark:border-primary/10 shrink-0">
                   <button onClick={() => toast("Sync scheduled functionality pending.", { icon: "📅" })} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all">
                      <span className="material-symbols-outlined">calendar_today</span>
                      Schedule Sync
                   </button>
                </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );`;

let cStartIndex = chatWindow.indexOf('  return (\n    <div className="flex flex-col');
if (cStartIndex === -1) {
    cStartIndex = chatWindow.indexOf('  return (\n');
}

const cEndIndex = chatWindow.indexOf('}\n\nconst HeaderAction');

if (cStartIndex !== -1) {
    const updatedChatWindow = chatWindow.substring(0, cStartIndex) + newChatWindowReturn + '\n' + chatWindow.substring(cEndIndex);
    fs.writeFileSync(chatWindowPath, updatedChatWindow);
    console.log("Updated ChatWindow.tsx");
} else {
    console.log("Could not find start index for ChatWindow.tsx");
}
