"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Trash2, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/shared/glass-card"
import { MarkdownContent } from "@/components/shared/markdown-content"
import { trackChat } from "@/lib/activity-tracker"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import { LottieAnimation } from "@/components/ui/lottie-animation"

type Message = {
  role: "user" | "assistant" | "system"
  content: string
}

type Conversation = {
  id: string
  title: string
  messages: Message[]
  model: string
  timestamp: string
}

const SYSTEM_PROMPTS: Record<string, string> = {
  engineering: "You are an expert structural and civil engineering assistant. Help with calculations, code references (IBC, ASCE 7, ACI), design decisions, and technical analysis.",
  general: "You are a helpful AI assistant. Provide clear, detailed answers.",
  code: "You are a senior software engineer. Help with code reviews, architecture decisions, debugging, and best practices. Always show code examples.",
}

const MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
]

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("llama-3.3-70b-versatile")
  const [systemPrompt, setSystemPrompt] = useState("engineering")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [tokenUsage, setTokenUsage] = useState<{ prompt: number; completion: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const saved = getItem<Conversation[]>(STORAGE_KEYS.CHAT_HISTORY, [])
    setConversations(saved)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const saveConversation = (msgs: Message[]) => {
    const title = msgs.find((m) => m.role === "user")?.content.slice(0, 50) || "New Chat"
    const conv: Conversation = {
      id: activeConversation || `${Date.now()}`,
      title,
      messages: msgs,
      model,
      timestamp: new Date().toISOString(),
    }

    const saved = getItem<Conversation[]>(STORAGE_KEYS.CHAT_HISTORY, [])
    const idx = saved.findIndex((c) => c.id === conv.id)
    if (idx >= 0) saved[idx] = conv
    else saved.push(conv)
    if (saved.length > 20) saved.splice(0, saved.length - 20)
    setItem(STORAGE_KEYS.CHAT_HISTORY, saved)
    setConversations(saved)
    setActiveConversation(conv.id)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    setTokenUsage(null)

    try {
      const apiMessages = [
        { role: "system" as const, content: SYSTEM_PROMPTS[systemPrompt] },
        ...newMessages,
      ]

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model }),
      })

      const data = await res.json()

      if (data.success) {
        const assistantMsg: Message = { role: "assistant", content: data.response }
        const updated = [...newMessages, assistantMsg]
        setMessages(updated)
        saveConversation(updated)
        trackChat(userMsg.content.slice(0, 50))
        if (data.usage) {
          setTokenUsage({
            prompt: data.usage.prompt_tokens || 0,
            completion: data.usage.completion_tokens || 0,
          })
        }
      } else {
        setMessages([...newMessages, { role: "assistant", content: `Error: ${data.error}` }])
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Failed to connect to chat API." }])
    } finally {
      setIsLoading(false)
    }
  }

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages)
    setModel(conv.model)
    setActiveConversation(conv.id)
  }

  const newChat = () => {
    setMessages([])
    setActiveConversation(null)
    setTokenUsage(null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation sidebar */}
      <div className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.01]">
        <div className="p-3 border-b border-white/[0.06]">
          <Button onClick={newChat} variant="outline" size="sm" className="w-full gap-2 text-xs border-white/[0.08] text-white/50 hover:text-white">
            <Sparkles className="h-3 w-3" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.slice().reverse().map((conv) => (
            <button
              key={conv.id}
              onClick={() => loadConversation(conv)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate",
                activeConversation === conv.id
                  ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                  : "text-white/30 hover:bg-white/[0.03] hover:text-white/50"
              )}
            >
              {conv.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Config bar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.06] bg-white/[0.01]">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-8 rounded-lg border border-white/[0.08] bg-transparent px-2 text-[11px] text-white/50 outline-none"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900">{m.label}</option>
            ))}
          </select>
          <select
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="h-8 rounded-lg border border-white/[0.08] bg-transparent px-2 text-[11px] text-white/50 outline-none"
          >
            <option value="engineering" className="bg-slate-900">Engineering</option>
            <option value="general" className="bg-slate-900">General</option>
            <option value="code" className="bg-slate-900">Code</option>
          </select>
          {tokenUsage && (
            <span className="text-[10px] text-white/20 ml-auto">
              {tokenUsage.prompt + tokenUsage.completion} tokens
            </span>
          )}
          {messages.length > 0 && (
            <button onClick={newChat} className="ml-auto p-1.5 text-white/20 hover:text-white/50 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LottieAnimation src="/animations/ai-thinking.json" style={{ width: 80, height: 80 }} className="mb-2 opacity-40" />
              <p className="text-sm text-white/30">Start a conversation</p>
              <p className="text-xs text-white/15 mt-1">Powered by Groq • {MODELS.find((m) => m.id === model)?.label}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-purple-400" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-blue-500/10 border border-blue-500/15 text-white/80"
                  : "bg-white/[0.02] border border-white/[0.06] text-white/70"
              )}>
                {msg.role === "assistant" ? (
                  <MarkdownContent text={msg.content} />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 mt-0.5">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Bot className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
              </div>
              <div className="rounded-xl px-4 py-2.5 bg-white/[0.02] border border-white/[0.06]">
                <LottieAnimation src="/animations/loading-dots.json" style={{ width: 48, height: 24 }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/[0.06] bg-white/[0.01] p-3">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/30 transition-colors resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-purple-600 text-white hover:bg-purple-500"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
