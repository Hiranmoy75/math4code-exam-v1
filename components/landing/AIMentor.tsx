"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState, useEffect } from "react";
import {
    Bot, X, Loader2, Send, MessageSquare, ShoppingCart,
    ChevronsRight, ChevronsLeft, Plus, ChevronDown,
    Paperclip, Mic, ArrowUp
} from "lucide-react";
import { useChatHistory, useChatMessages, useCreateSession, useSaveMessage } from "@/hooks/student/useChat";
import { usePublicCourses } from "@/hooks/usePublicCourses";
import { usePublicTestSeries } from "@/hooks/usePublicTestSeries";
import { useRouter } from "next/navigation";

// --- TYPES ---
export type Message = {
    id?: string;
    role: 'user' | 'ai';
    content: string;
    created_at?: string;
};

export type ChatSession = {
    id: string;
    title: string;
    created_at: string;
};

// --- REACT QUERY KEYS ---
export const chatKeys = {
    all: ['chat'] as const,
    sessions: () => [...chatKeys.all, 'sessions'] as const,
    messages: (sessionId: string | null) => [...chatKeys.all, 'messages', sessionId] as const,
};



export const callGemini = async (prompt: string, systemInstruction: string = "") => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    let delay = 1000;
    for (let i = 0; i < 3; i++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined
                    })
                }
            );
            if (!response.ok) throw new Error(response.statusText);
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        } catch (error) {
            if (i === 2) throw error;
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
        }
    }
};

// --- KaTeX Components ---
const useKaTeX = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if ((window as any).katex) { setIsLoaded(true); return; }
        const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'; document.head.appendChild(link);
        const script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'; script.onload = () => setIsLoaded(true); document.head.appendChild(script);
    }, []);
    return isLoaded;
};
const LatexSpan = ({ content }: { content: string }) => {
    const spanRef = useRef<HTMLSpanElement>(null);
    const katexLoaded = useKaTeX();
    useEffect(() => {
        if (katexLoaded && spanRef.current && (window as any).katex) {
            try { (window as any).katex.render(content, spanRef.current, { throwOnError: false, output: 'mathml' }); } catch (e) { spanRef.current.innerText = content; }
        }
    }, [content, katexLoaded]);
    if (!katexLoaded) return <span className="font-mono text-pink-600">{content}</span>;
    return <span ref={spanRef} className="mx-1" />;
};

// --- MAIN CHAT COMPONENT ---
// --- MAIN CHAT COMPONENT ---
function AIMentorContent() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Initialize Unique User ID for Browser-wise History
    useEffect(() => {
        const initUserId = () => {
            let id = localStorage.getItem('chat_browser_id');
            if (!id) {
                // Fallback for browsers without crypto.randomUUID
                id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
                localStorage.setItem('chat_browser_id', id);
            }
            setUserId(id);
        };
        initUserId();
    }, []);

    // React Query Hooks (Now using userId)
    const { data: chatHistory, isLoading: isHistoryLoading } = useChatHistory(userId);
    const { data: serverMessages, isLoading: isMessagesLoading } = useChatMessages(currentSessionId);

    // FETCH REAL CATALOG DATA
    const { data: courses, isLoading: coursesLoading } = usePublicCourses();
    const { data: testSeries, isLoading: testsLoading } = usePublicTestSeries();

    // Mutations
    const createSessionMutation = useCreateSession();
    const saveMessageMutation = useSaveMessage();

    // Local UI state
    const [messages, setMessages] = useState<Message[] | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Construct Dynamic Knowledge Base from Real Data
    const knowledgeBase = useMemo(() => {
        if (coursesLoading || testsLoading) return "Catalog loading...";

        return JSON.stringify({
            courses: courses?.map(c => ({
                id: c.id,
                title: c.title,
                price: c.price,
                description: c.description || "No description available",
                category: c.category
            })) || [],
            test_series: testSeries?.map(t => ({
                id: t.id,
                title: t.title,
                price: t.price,
                description: t.description || "No description available"
            })) || []
        });
    }, [courses, testSeries, coursesLoading, testsLoading]);

    // Sync Server Messages
    useEffect(() => {
        if (serverMessages) {
            setMessages(serverMessages);
        } else if (currentSessionId === null) {
            setMessages(null);
        }
    }, [serverMessages, currentSessionId]);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { if (isOpen && messages) scrollToBottom(); }, [messages, isOpen]);

    const loadSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        setIsSidebarOpen(false);
    };

    const startNewChat = () => {
        setCurrentSessionId(null);
        setMessages(null);
        setIsSidebarOpen(false);
    };

    const handleSend = async () => {
        if (!query.trim()) return;
        const userText = query;

        // Optimistic Update
        const optimisticUserMsg: Message = { role: 'user', content: userText, created_at: new Date().toISOString() };
        setMessages(prev => prev ? [...prev, optimisticUserMsg] : [optimisticUserMsg]);
        setQuery("");
        setIsGenerating(true);

        try {
            let activeSessionId = currentSessionId;
            if (!activeSessionId) {
                if (!userId) throw new Error("User ID not initialized");

                const newSession = await createSessionMutation.mutateAsync({ firstMessage: userText, userId });
                activeSessionId = newSession.id;
                setCurrentSessionId(activeSessionId);
            }

            saveMessageMutation.mutate({ sessionId: activeSessionId, role: 'user', content: userText });

            const systemPrompt = `
                You are Hiranmoy, an expert AI tutor for Math4Code.
                
                CATALOG DATA: ${knowledgeBase}
                
                CRITICAL RULES:
                1. Answer user questions based on the catalog data above.
                2. If you recommend a specific Course or Test Series, you MUST append its exact ID wrapped in double curly braces {{id}} immediately after the name.
                3. Use **bold** markdown for course titles/prices.
                4. Use LaTeX format enclosed in single $ symbols for ANY math expressions.
                Keep answers helpful, concise, and friendly.
            `;

            const aiResponseText = await callGemini(userText, systemPrompt);

            const aiMsg: Message = { role: 'ai', content: aiResponseText, created_at: new Date().toISOString() };
            setMessages(prev => prev ? [...prev, aiMsg] : [aiMsg]);

            saveMessageMutation.mutate({ sessionId: activeSessionId, role: 'ai', content: aiResponseText });

        } catch (e) {
            console.error("Chat Error:", e);
            const errorMsg: Message = { role: 'ai', content: "Sorry, I'm having trouble connecting to the server.", created_at: new Date().toISOString() };
            setMessages(prev => prev ? [...prev, errorMsg] : [errorMsg]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBuy = (productId: string) => {
        console.log("Navigating to product:", productId);
        setIsOpen(false);
        // router.push(`/courses/${productId}`); // Uncomment for real navigation
    };

    const parseFormattedText = (text: string) => {
        if (!text) return null;
        const boldChunks = text.split(/(\*\*.*?\*\*)/g);
        return boldChunks.map((chunk, i) => {
            if (chunk.startsWith('**') && chunk.endsWith('**')) {
                return <strong key={`bold-${i}`} className="font-bold text-[#1F2A6B]">{chunk.slice(2, -2)}</strong>;
            }
            const mathChunks = chunk.split(/(\$[^\$]+\$)/g);
            return mathChunks.map((subChunk, j) => {
                if (subChunk.startsWith('$') && subChunk.endsWith('$')) {
                    return <LatexSpan key={`math-${i}-${j}`} content={subChunk.slice(1, -1)} />;
                }
                return <span key={`text-${i}-${j}`}>{subChunk}</span>;
            });
        });
    };

    const renderMessageContent = (text: string) => {
        if (!text) return null;

        // 1. Extract IDs from the text to separate them from the message content
        const productIds: string[] = [];
        const cleanText = text.replace(/\{\{([a-zA-Z0-9-_]+)\}\}/g, (match, id) => {
            productIds.push(id);
            return ""; // Remove the ID tag from the display text
        });

        // 2. Resolve Products from the IDs
        const products = productIds.map(id => {
            return courses?.find(c => c.id === id) || testSeries?.find(t => t.id === id);
        }).filter(Boolean); // Filter out undefined if ID not found

        return (
            <div className="flex flex-col gap-3">
                {/* Render the clean text (without {{id}} tags) */}
                <div className="whitespace-pre-wrap leading-relaxed">
                    {parseFormattedText(cleanText)}
                </div>

                {/* Render Horizontal Scrolling Carousel if products exist */}
                {products.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent items-stretch">
                        {products.map((product, idx) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={`${product!.id}-${idx}`}
                                className="min-w-[240px] w-[240px] bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden shrink-0"
                            >
                                {/* Thumbnail Image */}
                                <div className="h-32 w-full bg-gray-100 relative overflow-hidden">
                                    {product!.thumbnail_url ? (
                                        <img
                                            src={product!.thumbnail_url}
                                            alt={product!.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-200">
                                            <Bot size={40} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-indigo-600 shadow-sm">
                                        ${product!.price}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3 flex flex-col flex-1">
                                    <div className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider mb-1">
                                        {(product as any).category || 'Course'}
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2" title={product!.title}>
                                        {product!.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 flex-1">
                                        {product!.description || "No description available."}
                                    </p>

                                    <button
                                        onClick={() => handleBuy(product!.id)}
                                        className="w-full bg-[#1F2A6B] hover:bg-indigo-800 active:scale-95 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-auto"
                                    >
                                        <ShoppingCart size={14} /> View Details
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 w-[90vw] md:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden flex flex-col font-sans"
                    >
                        {/* --- HEADER --- */}
                        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-50 z-20">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                            >
                                <ChevronsRight size={20} />
                            </button>

                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    <Bot size={14} />
                                </div>
                                <span className="font-semibold text-gray-800 text-sm">Hiranmoy Mandal</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <button onClick={startNewChat} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="New Chat">
                                    <Plus size={20} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Close">
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        </div>

                        {/* --- CONTENT CONTAINER --- */}
                        <div className="flex-1 relative flex overflow-hidden">

                            {/* --- SIDEBAR (HISTORY) --- */}
                            <AnimatePresence>
                                {isSidebarOpen && (
                                    <motion.div
                                        initial={{ x: "-100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "-100%" }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="absolute top-0 left-0 bottom-0 w-64 bg-white z-30 shadow-[4px_0_24px_rgba(0,0,0,0.05)] border-r border-gray-100 flex flex-col"
                                    >
                                        <div className="p-4 flex justify-between items-center text-gray-500 text-xs font-medium tracking-wider">
                                            QUICK ACTIONS
                                            <button onClick={() => setIsSidebarOpen(false)} className="hover:text-gray-800"><ChevronsLeft size={18} /></button>
                                        </div>

                                        <div className="px-2">
                                            <button onClick={startNewChat} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl text-left text-gray-700 transition-colors">
                                                <MessageSquare size={18} className="text-gray-400" />
                                                <span className="text-sm font-medium">Start new chat</span>
                                            </button>
                                        </div>

                                        <div className="mt-6 px-4 text-gray-500 text-xs font-medium tracking-wider mb-2">
                                            RECENT CONVERSATIONS
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
                                            {isHistoryLoading ? (
                                                <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
                                            ) : chatHistory?.length === 0 ? (
                                                <div className="px-4 text-xs text-gray-400 italic">No history yet</div>
                                            ) : (
                                                chatHistory?.map((hist: any) => (
                                                    <button
                                                        key={hist.id}
                                                        onClick={() => loadSession(hist.id)}
                                                        className={`w-full text-left p-3 rounded-xl text-sm truncate transition-all duration-200
                                                        ${currentSessionId === hist.id
                                                                ? 'bg-indigo-50 text-[#1F2A6B] font-medium shadow-sm'
                                                                : 'hover:bg-gray-50 text-gray-600'
                                                            }`}
                                                    >
                                                        {hist.title}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* --- CHAT AREA --- */}
                            <div className="flex-1 flex flex-col bg-white w-full">
                                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">

                                    {/* Empty State */}
                                    {!messages && !isMessagesLoading && (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center mb-6 shadow-lg shadow-pink-200">
                                                <Bot size={32} className="text-white" />
                                            </div>
                                            <h2 className="text-xl font-medium text-gray-800">Hello! How can I assist you today?</h2>
                                            <p className="text-sm text-gray-400 mt-2">
                                                {coursesLoading ? "Loading catalog..." : "Ask about courses, test series, or math problems."}
                                            </p>
                                        </div>
                                    )}

                                    {/* Loading State (Messages) */}
                                    {isMessagesLoading && (
                                        <div className="flex justify-center items-center h-full">
                                            <Loader2 className="animate-spin text-gray-300" size={24} />
                                        </div>
                                    )}

                                    {/* Messages List */}
                                    {messages && messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'ai' && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center mr-2 shrink-0 mt-1 shadow-sm">
                                                    <Bot size={16} className="text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm
                                                ${msg.role === 'user'
                                                        ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
                                                        : 'bg-white border border-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {renderMessageContent(msg.content)}
                                            </div>
                                        </div>
                                    ))}

                                    {isGenerating && (
                                        <div className="flex items-center gap-2 pl-2 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center shadow-sm">
                                                <Bot size={16} className="text-white" />
                                            </div>
                                            <div className="bg-gray-100 rounded-full px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
                                                <Loader2 size={12} className="animate-spin" /> Thinking...
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* --- FOOTER INPUT --- */}
                                <div className="p-4 bg-white z-10 border-t border-gray-50">
                                    <div className="relative group">
                                        <div className={`absolute -inset-[1px] rounded-[24px] bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-30 transition-opacity duration-300 ${query ? 'opacity-100' : 'group-hover:opacity-60 opacity-0'}`} />

                                        <div className="relative flex items-center bg-white border border-gray-200 rounded-[22px] px-4 py-2 shadow-sm focus-within:border-transparent">
                                            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1" title="Attach file (Demo)">
                                                <Paperclip size={20} />
                                            </button>

                                            <input
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSend();
                                                    }
                                                }}
                                                placeholder="Ask me anything..."
                                                className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-gray-700 placeholder:text-gray-400 font-normal"
                                            />

                                            <div className="flex items-center gap-2">
                                                {!query && (
                                                    <button className="text-gray-400 hover:text-gray-600 p-1" title="Voice Input (Demo)">
                                                        <Mic size={20} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleSend}
                                                    disabled={!query.trim() || isGenerating}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 
                                                    ${query.trim() ? 'bg-black text-white hover:scale-105 shadow-md' : 'bg-gray-100 text-gray-300'}`}
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className="text-[10px] text-gray-400">AI can make mistakes. Please double-check responses.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9998] bg-[#1F2A6B] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300"
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </>
    );
}

// --- WRAPPER WITH QUERY PROVIDER ---
export default function AIMentor() {
    // This wrapper ensures React Query works even if the global provider is missing in the playground


    return (
        <AIMentorContent />
    );
}