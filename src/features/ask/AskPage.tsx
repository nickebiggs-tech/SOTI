import { useState, useRef, useEffect, useMemo } from 'react'
import { Bot, Send, Sparkles, AlertCircle, User, Loader2, Database, Lightbulb } from 'lucide-react'
import { useData } from '../../data/DataProvider'
import { formatCompact, formatCurrency } from '../../lib/formatters'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  'What are the fastest growing Rx categories?',
  'How is the OTC market performing vs last year?',
  'Which manufacturers dominate the prescription market?',
  'What is the total pharmacy market value?',
  'Which categories are declining the most?',
  'What is the average growth rate across all Rx categories?',
]

/** Build a data context summary for the AI from live data */
function buildDataContext(data: ReturnType<typeof useData>): string {
  const { ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY, state } = data

  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const otcGrowth = otcTotalLY ? ((otcTotalTY - otcTotalLY) / otcTotalLY) * 100 : 0
  const totalMarket = ethTotalTY + otcTotalTY

  const topRx = ethCategories.slice(0, 10).map(c =>
    `${c.category}: TY ${formatCurrency(c.tyValue)}, Growth ${c.valueGrowth >= 0 ? '+' : ''}${c.valueGrowth.toFixed(1)}%, ${c.manufacturerCount} manufacturers`
  ).join('\n')

  const topOtc = otcCategories.slice(0, 10).map(c =>
    `${c.category}: TY ${formatCurrency(c.tyValue)}, Growth ${c.valueGrowth >= 0 ? '+' : ''}${c.valueGrowth.toFixed(1)}%, ${c.manufacturerCount} manufacturers`
  ).join('\n')

  const rxGrowing = [...ethCategories].filter(c => c.lyValue > 10000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
  const rxDeclining = [...ethCategories].filter(c => c.lyValue > 10000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)
  const otcGrowing = [...otcCategories].filter(c => c.lyValue > 50000).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
  const otcDeclining = [...otcCategories].filter(c => c.lyValue > 50000).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)

  return `You are SOTI AI, the intelligent assistant for the State of the Industry (SOTI) platform by NostraData. You provide data-driven insights about the Australian pharmacy market.

MARKET OVERVIEW:
- Total Pharmacy Market: ${formatCurrency(totalMarket)}
- Prescription (Rx/Dispense): ${formatCurrency(ethTotalTY)} (${ethGrowth >= 0 ? '+' : ''}${ethGrowth.toFixed(1)}% YoY)
- OTC/Front of Shop: ${formatCurrency(otcTotalTY)} (${otcGrowth >= 0 ? '+' : ''}${otcGrowth.toFixed(1)}% YoY)
- Total Rx Records: ${formatCompact(state.eth.length)}
- Total OTC Records: ${formatCompact(state.otc.length)}
- Rx Categories: ${ethCategories.length}
- OTC Categories: ${otcCategories.length}

TOP 10 RX CATEGORIES (by value):
${topRx}

TOP 10 OTC CATEGORIES (by value):
${topOtc}

FASTEST GROWING RX:
${rxGrowing.map(c => `${c.category}: +${c.valueGrowth.toFixed(1)}%`).join(', ')}

DECLINING RX:
${rxDeclining.map(c => `${c.category}: ${c.valueGrowth.toFixed(1)}%`).join(', ')}

FASTEST GROWING OTC:
${otcGrowing.map(c => `${c.category}: +${c.valueGrowth.toFixed(1)}%`).join(', ')}

DECLINING OTC:
${otcDeclining.map(c => `${c.category}: ${c.valueGrowth.toFixed(1)}%`).join(', ')}

INSTRUCTIONS:
- Answer questions about the Australian pharmacy market using the data above
- Be concise but insightful — think like a senior market analyst
- Use specific numbers and percentages from the data
- If you don't have specific data to answer, say so honestly
- Format responses with clear structure (use bullet points when listing items)
- Always ground insights in the actual data provided`
}

/** Call Anthropic API directly */
async function callClaude(messages: { role: string; content: string }[], systemPrompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY_MISSING')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error: ${response.status} — ${err}`)
  }

  const data = (await response.json()) as { content: { type: string; text: string }[] }
  const textBlock = data.content.find(b => b.type === 'text')
  return textBlock?.text ?? 'No response generated.'
}

/** Fallback: Rule-based answers when no API key */
function fallbackAnswer(question: string, data: ReturnType<typeof useData>): string {
  const q = question.toLowerCase()
  const { ethCategories, otcCategories, ethTotalTY, ethTotalLY, otcTotalTY, otcTotalLY } = data
  const ethGrowth = ethTotalLY ? ((ethTotalTY - ethTotalLY) / ethTotalLY) * 100 : 0
  const otcGrowth = otcTotalLY ? ((otcTotalTY - otcTotalLY) / otcTotalLY) * 100 : 0

  if (q.includes('total') && q.includes('market')) {
    return `The total Australian pharmacy market is valued at ${formatCurrency(ethTotalTY + otcTotalTY)}, comprising ${formatCurrency(ethTotalTY)} in Prescription/Dispense (${ethGrowth >= 0 ? '+' : ''}${ethGrowth.toFixed(1)}% YoY) and ${formatCurrency(otcTotalTY)} in OTC/Front of Shop (${otcGrowth >= 0 ? '+' : ''}${otcGrowth.toFixed(1)}% YoY).`
  }

  if (q.includes('growing') || q.includes('growth') || q.includes('fastest')) {
    const isOtc = q.includes('otc')
    const cats = isOtc ? otcCategories : ethCategories
    const minVal = isOtc ? 50000 : 10000
    const top = [...cats].filter(c => c.lyValue > minVal).sort((a, b) => b.valueGrowth - a.valueGrowth).slice(0, 5)
    const segment = isOtc ? 'OTC' : 'Rx'
    return `Top growing ${segment} categories:\n${top.map((c, i) => `${i + 1}. ${c.category} — +${c.valueGrowth.toFixed(1)}% (${formatCurrency(c.tyValue)})`).join('\n')}`
  }

  if (q.includes('declining') || q.includes('decline') || q.includes('worst') || q.includes('under pressure')) {
    const isOtc = q.includes('otc')
    const cats = isOtc ? otcCategories : ethCategories
    const minVal = isOtc ? 50000 : 10000
    const bottom = [...cats].filter(c => c.lyValue > minVal).sort((a, b) => a.valueGrowth - b.valueGrowth).slice(0, 5)
    const segment = isOtc ? 'OTC' : 'Rx'
    return `Most declining ${segment} categories:\n${bottom.map((c, i) => `${i + 1}. ${c.category} — ${c.valueGrowth.toFixed(1)}% (${formatCurrency(c.tyValue)})`).join('\n')}`
  }

  if (q.includes('manufacturer') || q.includes('supplier')) {
    const mfrs = new Set(data.state.eth.map(r => r.manufacturer))
    const otcMfrs = new Set(data.state.otc.map(r => r.manufacturer))
    return `There are ${mfrs.size} manufacturers in the Rx market and ${otcMfrs.size} in the OTC market. For detailed manufacturer breakdowns, visit the Dispense or OTC pages and click into a category.`
  }

  if (q.includes('otc') && (q.includes('perform') || q.includes('how'))) {
    return `The OTC market is valued at ${formatCurrency(otcTotalTY)} with ${otcGrowth >= 0 ? 'growth' : 'contraction'} of ${otcGrowth >= 0 ? '+' : ''}${otcGrowth.toFixed(1)}% YoY. There are ${otcCategories.length} categories tracked across ${new Set(data.state.otc.map(r => r.manufacturer)).size} manufacturers.`
  }

  if (q.includes('average') && q.includes('growth')) {
    const avgRx = ethCategories.length ? ethCategories.reduce((s, c) => s + c.valueGrowth, 0) / ethCategories.length : 0
    const avgOtc = otcCategories.length ? otcCategories.reduce((s, c) => s + c.valueGrowth, 0) / otcCategories.length : 0
    return `Average category growth rates:\n- Rx: ${avgRx >= 0 ? '+' : ''}${avgRx.toFixed(1)}% across ${ethCategories.length} categories\n- OTC: ${avgOtc >= 0 ? '+' : ''}${avgOtc.toFixed(1)}% across ${otcCategories.length} categories`
  }

  return `I can answer questions about the Australian pharmacy market using SOTI's ${formatCompact(data.state.eth.length + data.state.otc.length)} data points. Try asking about:\n- Market totals and growth\n- Top/bottom performing categories\n- Rx vs OTC comparisons\n- Manufacturer counts\n\nFor AI-powered answers, add your Anthropic API key to .env.local:\nVITE_ANTHROPIC_API_KEY=sk-ant-...`
}

export function AskPage() {
  const data = useData()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const hasApiKey = !!import.meta.env.VITE_ANTHROPIC_API_KEY

  const systemPrompt = useMemo(() => buildDataContext(data), [data])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      let response: string
      if (hasApiKey) {
        const chatHistory = [...messages, userMsg]
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role, content: m.content }))
        response = await callClaude(chatHistory, systemPrompt)
      } else {
        // Simulate brief delay for UX
        await new Promise(r => setTimeout(r, 500))
        response = fallbackAnswer(userMsg.content, data)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }])
    } catch (err) {
      const errorMsg = err instanceof Error && err.message === 'ANTHROPIC_API_KEY_MISSING'
        ? 'No API key configured. Add VITE_ANTHROPIC_API_KEY to .env.local for Claude-powered answers. Using built-in rule-based responses instead.'
        : `Error: ${err instanceof Error ? err.message : 'Unknown error'}`

      if (err instanceof Error && err.message === 'ANTHROPIC_API_KEY_MISSING') {
        // Fallback to rule-based
        const response = fallbackAnswer(userMsg.content, data)
        setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date() }])
      } else {
        setMessages(prev => [...prev, { role: 'system', content: errorMsg, timestamp: new Date() }])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100vh-4rem)] page-enter">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-0.5 sm:hidden">
          <span className="text-base font-extrabold tracking-tight"><span className="text-primary">SOTI</span></span>
          <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest border border-slate-200 rounded px-1.5 py-0.5">AI</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">SOTI AI</h1>
            <p className="text-[10px] text-slate-400">
              {hasApiKey ? 'Powered by Claude' : 'Rule-based responses'} &middot; {formatCompact(data.state.eth.length + data.state.otc.length)} data points
            </p>
          </div>
        </div>
        {!hasApiKey && (
          <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700">Add your Anthropic API key to <code className="bg-amber-100 px-1 rounded">.env.local</code> to enable Claude-powered answers.</p>
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary/60" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-1">Ask SOTI anything</h2>
            <p className="text-xs text-slate-400 max-w-xs mb-6">I can answer questions about the Australian pharmacy market using live data.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  className="text-left px-3 py-2.5 bg-white rounded-lg border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-600 group-hover:text-primary transition-colors">{q}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role !== 'user' && (
              <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'system' ? 'bg-red-50' : 'bg-gradient-to-br from-primary/15 to-accent/15'}`}>
                {msg.role === 'system' ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
            )}

            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-primary text-white'
                : msg.role === 'system'
                ? 'bg-red-50 border border-red-200'
                : 'bg-white border border-slate-200'
            }`}>
              <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user' ? 'text-white' : msg.role === 'system' ? 'text-red-700' : 'text-slate-700'
              }`}>
                {msg.content}
              </p>
              <p className={`text-[9px] mt-1.5 ${
                msg.role === 'user' ? 'text-white/50' : 'text-slate-300'
              }`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 shrink-0 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span className="text-xs text-slate-400">Analysing market data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white safe-area-bottom">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask about the pharmacy market..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[9px] text-slate-300 mt-2">
          Powered by <span className="font-semibold text-slate-400">NostraData</span>
        </p>
      </div>
    </div>
  )
}
