import { useState, useEffect, useRef } from "react";
import { X, Send, Image as ImageIcon, Search, MessageSquare, ShieldAlert } from "lucide-react";
import { getDb } from "../../lib/database";
import { generateId } from "../../lib/id-generator";

interface ChatMessage {
  id: string;
  sender: string;
  content: string | null;
  gif_url: string | null;
  created_at: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRELOADED_GIFS = [
  { name: "🎉 Celebrate", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZtcXZ1OHptOHoxbmhpdWhzdzY5bzRoZHZpNWlyYXYydml4NnF2NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26n61r3CWvZGJyvKg/giphy.gif" },
  { name: "🤦 Facepalm", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzF2Y3NsdzRpazZ0dTZndDB1MHd0YjFpeDNxY3ZtcTRmYzF6MGVwbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3og0INyM3Cfy9O3u0/giphy.gif" },
  { name: "🤯 Mind Blown", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDVqNzR3NGdnbTRhbGF6NmxtcTF6c29paDA1eWl0NDNmYXM1N2g1MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2rqEdFks1g5sk/giphy.gif" },
  { name: "👍 Thumbs Up", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2k3M3k4aDN6MmtyeGdtamxxMDdrZnBhbGRybmU0c2w0aG52ZnZ0ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XreQmk7ETCak0/giphy.gif" },
  { name: "👏 Clapping", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnRtZnB5d21xMzYzdWNud2E5NHVobGphcjEya2pob3dxeDZodnR4OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2XhfQ8oCkm1K76/giphy.gif" },
  { name: "🔥 Panic", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2dtbnVxbG1udDNoY2l6aDhyZHpxcTBrcHN6OGZlZ3A0dDB3bWd6dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HUKN6XVK4OqpW/giphy.gif" },
  { name: "☕ Typing", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnA4OTJvZnYyM244M2lnaDhzZGNmNHZ6NXUzdHpiZjZscGswcGVnbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XIqCQx02E1U9W/giphy.gif" },
  { name: "🤔 Thinking", url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3NldG4xaDFjdmR5azY4N3V6ZWtjdWttNnJ4anU4dmFmdDFwZWlhYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7bu8mXeO5i2TBOuc/giphy.gif" },
];

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeUser, setActiveUser] = useState("Mina");
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [showGifPanel, setShowGifPanel] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [giphyApiKey, setGiphyApiKey] = useState("");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const [isSearchingGifs, setIsSearchingGifs] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prof = localStorage.getItem("activeProfile") || "Mina";
    const syncEnabled = localStorage.getItem("serverSyncEnabled") === "true";
    const gKey = localStorage.getItem("giphyApiKey") || "";
    
    setActiveUser(prof);
    setIsSyncActive(syncEnabled);
    setGiphyApiKey(gKey);
  }, [isOpen]);

  // Periodic polling for messages (only when sidebar is open)
  useEffect(() => {
    if (!isOpen) return;

    loadMessages();
    const interval = setInterval(loadMessages, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const db = await getDb();
      const rows = await db.select<ChatMessage[]>(
        "SELECT * FROM chat_messages ORDER BY created_at ASC LIMIT 100"
      );
      setMessages(rows);
    } catch (e) {
      console.warn("Failed to load chat messages (may not be initialized):", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e?: React.FormEvent, customGif?: string) => {
    e?.preventDefault();
    if (!inputText.trim() && !customGif) return;

    try {
      const db = await getDb();
      const id = generateId("msg");
      const textToSend = inputText.trim() || null;
      const now = new Date().toISOString();

      await db.execute(
        "INSERT INTO chat_messages (id, sender, content, gif_url, created_at) VALUES ($1, $2, $3, $4, $5)",
        [id, activeUser, textToSend, customGif || null, now]
      );

      setInputText("");
      if (customGif) {
        setShowGifPanel(false);
      }
      loadMessages();
    } catch (e) {
      console.error("Failed to send chat message:", e);
    }
  };

  const handleSearchGiphy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gifQuery.trim() || !giphyApiKey) return;

    setIsSearchingGifs(true);
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(gifQuery.trim())}&limit=12&rating=g`
      );
      if (res.ok) {
        const data = await res.json();
        setGifResults(data.data.map((item: any) => item.images.fixed_height.url));
      }
    } catch (e) {
      console.error("GIPHY search failed:", e);
    } finally {
      setIsSearchingGifs(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-background/95 backdrop-blur-md border-l border-border z-[100] shadow-2xl flex flex-col transition-all duration-300 animate-slide-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-surfaceHighlight/40 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <MessageSquare className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-textMain uppercase tracking-wide">Studio Wi-Fi Chat</h3>
            <p className="text-[10px] text-textMuted flex items-center space-x-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isSyncActive ? "bg-success animate-pulse" : "bg-warning"}`}></span>
              <span>Logged as <strong className="text-primary">{activeUser}</strong></span>
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-textMuted hover:text-textMain transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Connection warning */}
      {!isSyncActive && (
        <div className="px-4 py-2.5 bg-warning/10 border-b border-warning/20 text-[10px] text-warning flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <p>
            <strong>Wi-Fi Sync is not enabled.</strong> You can type messages locally, but Mina won't receive them until you enable sync in settings.
          </p>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-textMuted p-6">
            <MessageSquare className="w-8 h-8 text-border/60 mb-2.5" />
            <p className="text-xs font-semibold">No messages yet</p>
            <p className="text-[10px] opacity-75 mt-1">Start the conversation! Type a message or send a reaction GIF below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === activeUser;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[9px] font-bold text-textMuted mb-1 uppercase tracking-wider px-1">
                  {msg.sender}
                </span>
                
                {msg.content && (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs leading-relaxed shadow-sm ${
                    isMe 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-surfaceHighlight text-textMain rounded-tl-none border border-border/40"
                  }`}>
                    {msg.content}
                  </div>
                )}

                {msg.gif_url && (
                  <div className={`mt-1.5 overflow-hidden rounded-xl border max-w-[85%] shadow-sm ${
                    isMe ? "border-primary" : "border-border"
                  }`}>
                    <img 
                      src={msg.gif_url} 
                      alt="Reaction GIF" 
                      className="max-h-40 w-full object-cover select-none" 
                      loading="lazy"
                    />
                  </div>
                )}

                <span className="text-[8px] text-textMuted/60 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* GIF Picker Panel Drawer */}
      {showGifPanel && (
        <div className="absolute bottom-[68px] inset-x-0 bg-surface border-t border-border z-10 p-4 shadow-xl flex flex-col max-h-[300px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-textMain uppercase tracking-wide">React with a GIF</span>
            <button onClick={() => setShowGifPanel(false)} className="text-textMuted hover:text-textMain text-xs font-medium">
              Close
            </button>
          </div>

          {/* Custom Search (only if API Key is configured) */}
          {giphyApiKey ? (
            <form onSubmit={handleSearchGiphy} className="flex space-x-2 mb-3">
              <input
                type="text"
                placeholder="Search Giphy..."
                value={gifQuery}
                onChange={e => setGifQuery(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary text-textMain"
              />
              <button 
                type="submit" 
                disabled={isSearchingGifs}
                className="bg-primary hover:bg-primaryHover text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                {isSearchingGifs ? "..." : <Search className="w-3.5 h-3.5" />}
              </button>
            </form>
          ) : (
            <p className="text-[10px] text-textMuted leading-relaxed mb-3">
              💡 Add your <strong>GIPHY API Key</strong> in Settings to search millions of GIFs. Using local reactions below:
            </p>
          )}

          {/* GIFs Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-4 gap-2">
            {giphyApiKey && gifResults.length > 0 ? (
              gifResults.map((url, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, url)}
                  className="rounded-lg overflow-hidden border border-border hover:border-primary focus:outline-none hover:scale-105 transition-all h-14 bg-background"
                >
                  <img src={url} alt="Giphy GIF" className="w-full h-full object-cover select-none" />
                </button>
              ))
            ) : (
              PRELOADED_GIFS.map((gif, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, gif.url)}
                  title={gif.name}
                  className="rounded-lg overflow-hidden border border-border hover:border-primary focus:outline-none hover:scale-105 transition-all relative h-14 bg-background"
                >
                  <img src={gif.url} alt={gif.name} className="w-full h-full object-cover select-none" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[8px] font-bold text-white uppercase text-center p-0.5">
                    {gif.name.split(" ")[1]}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={(e) => handleSend(e)} className="p-4 border-t border-border bg-surfaceHighlight/35 flex items-center space-x-2 shrink-0">
        <button
          type="button"
          onClick={() => setShowGifPanel(!showGifPanel)}
          className={`p-2 rounded-xl border hover:border-primary/50 text-textMuted hover:text-textMain transition-all shrink-0 hover:scale-105 ${
            showGifPanel ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border/80"
          }`}
          title="Send GIF"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message to Wi-Fi..."
          className="flex-1 bg-background border border-border/80 rounded-xl px-4 py-2 text-xs focus:border-primary outline-none text-textMain"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-primary hover:bg-primaryHover disabled:opacity-40 disabled:hover:bg-primary text-white p-2 rounded-xl transition-all hover:scale-105 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
