"use client"
import { useEffect, useMemo, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Switch } from "@/components/ui/switch"
import LyricsRenderer from "@/components/lyrics-renderer"
import AIConfig from "@/components/ai-config"
import { parseLrc, type Lyrics } from "@/lib/lyrics"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkCjkFriendly from "remark-cjk-friendly"
import { analyzePrompt } from "@/prompts/analyze"
import { NavMenu } from "@/components/nav-menu"
import { Provider } from "@/components/provider-selector"
import { useLyrics } from "@/hooks/use-api"
import { Player } from "@/components/player"

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [provider, setProvider] = useState<Provider>("tencent")
  const [inputValue, setInputValue] = useState("")
  // const [lyrics, setLyrics] = useState<Lyrics | null>(null) // Now derived
  // const [lyricError, setLyricError] = useState<string>("") // Now derived
  const [analysis, setAnalysis] = useState("")
  const [reasoning, setReasoning] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  // const [loading, setLoading] = useState(false) // Now derived
  const [aLoading, setALoading] = useState(false)
  const [showTranslation, setShowTranslation] = useState(true)
  // const [coverUrl, setCoverUrl] = useState("") // Now derived
  // const [songInfo, setSongInfo] = useState<{ name: string; artist: string[]; album: string } | null>(null) // Now derived
  const [showReasoning, setShowReasoning] = useState(false)
  const analysisInProgressRef = useRef(false)

  // URL Params -> Hook Params
  const urlProvider = (searchParams.get("provider") as Provider)
  const urlId = searchParams.get("id")

  // The hook should drive the data
  // Only query if both are present in URL (or we want to trigger from input too? Design decision: URL drives query to allow sharing)
  // Actually original code synced local state with URL.
  
  // Use a separate state to "trigger" the query?
  // Or just use the URL params as the source of truth for the Query.
  // The input value is local state for editing.
  
  const { data: lyricsData, isLoading: loading, error: lyricErrorObject } = useLyrics(urlId || "", urlProvider || "tencent")
  const lyricError = lyricErrorObject ? (lyricErrorObject as Error).message : ""

  const lyrics: Lyrics | null = useMemo(() => {
    if (!lyricsData) return null
    return parseLrc(lyricsData.lrc || "", lyricsData.tlyric || "")
  }, [lyricsData])
  
  const coverUrl = lyricsData?.coverUrl || ""
  const songInfo = lyricsData?.songInfo || null

  // Sync local state with URL params
  useEffect(() => {
    if (urlProvider) setProvider(urlProvider)
    if (urlId) setInputValue(urlId)
  }, [urlProvider, urlId])


  useEffect(() => {
    const u = localStorage.getItem("ai_base_url")
    const k = localStorage.getItem("ai_api_key")
    const m = localStorage.getItem("ai_model")
    if (u) setBaseUrl(u)
    if (k) setApiKey(k)
    if (m) setModel(m)
  }, [])

  useEffect(() => {
    if (lyrics && inputValue) {
        // Note: using inputValue here might be slightly off if user changed input but didn't fetch.
        // Better to use urlId if that's what fetched the lyrics.
        // But original used simple 'inputValue'.
        // Let's stick to 'urlId' if available for cache key to be consistent with data
        const idToUse = urlId || inputValue
        const provToUse = urlProvider || provider

        const cacheKey = `analysis_${provToUse}_${idToUse}_${model}`
        const cachedAnalysis = localStorage.getItem(cacheKey)
        if (cachedAnalysis) {
          const parsed = JSON.parse(cachedAnalysis)
          setAnalysis(parsed.analysis || "")
          setReasoning(parsed.reasoning || "")
        } else {
          setAnalysis("")
          setReasoning("")
        }
      }
  }, [model, provider, lyrics, inputValue, urlId, urlProvider])

  useEffect(() => {
    if (!analysisInProgressRef.current && reasoning) {
      setShowReasoning(false)
    }
  }, [reasoning])

  const plainText = useMemo(() => {
    if (!lyrics) return ""
    return lyrics.lines.map((l) => {
      const timeStr = l.time != null ? `[${formatTime(l.time)}]` : ""
      return `${timeStr}${l.text}`
    }).join("\n")
  }, [lyrics])

  function formatTime(t: number) {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  // Wrapped fetchLyrics is no longer needed as a standalone async function for data fetching
  // But we need a handler for the "Get Lyrics" button
  function handleFetchLyrics() {
    // Just push to URL, the hook detects change and fetches
    if (!inputValue) return
    const params = new URLSearchParams(searchParams)
    params.set("id", inputValue)
    params.set("provider", provider)
    router.push(`/?${params.toString()}`)
  }

  async function analyze() {
    if (!lyrics) return
    setALoading(true)
    analysisInProgressRef.current = true
    setAnalysis("")
    setReasoning("")
    try {
      const defaultPrompt = "你是一位资深乐评人"
      const messages = [
        { role: "system", content: defaultPrompt },
        { role: "user", content: analyzePrompt(plainText, songInfo?.name, songInfo?.artist?.join(" / ")) },
      ]
      
      const res = await fetch(baseUrl + "/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          model, 
          messages,
          stream: true 
        }),
      })
      
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "analyze_failed")
      }
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""
      let fullReasoning = ""
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                const reasoning = parsed.choices?.[0]?.delta?.reasoning_content || parsed.choices?.[0]?.delta?.reasoning
                if (content) {
                  fullContent += content
                  setAnalysis(fullContent)
                }
                if (reasoning) {
                  fullReasoning += reasoning
                  setReasoning(fullReasoning)
                }
              } catch {
              }
            }
          }
        }
      }
      
      const idToUse = urlId || inputValue
      const provToUse = urlProvider || provider
      const cacheKey = `analysis_${provToUse}_${idToUse}_${model}`
      const cacheData = JSON.stringify({ analysis: fullContent, reasoning: fullReasoning })
      localStorage.setItem(cacheKey, cacheData)
    } catch {
      setAnalysis("")
      setReasoning("")
    } finally {
      setALoading(false)
      analysisInProgressRef.current = false
    }
  }

  function saveSettings() {
    localStorage.setItem("ai_base_url", baseUrl)
    localStorage.setItem("ai_api_key", apiKey)
    localStorage.setItem("ai_model", model)
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-4xl py-10 px-6">
        <NavMenu />
        
        <PageHeader 
          title="歌词分析"
          provider={provider}
          setProvider={setProvider}
          inputValue={inputValue}
          setInputValue={setInputValue}
          placeholder="输入歌曲链接或 ID..."
          actionLabel="获取歌词"
          onAction={handleFetchLyrics}
          loading={loading}
        />
        {lyricError && (
          <p className="mt-2 text-sm text-red-600 mb-4">{lyricError}</p>
        )}

        {lyrics && (
          <div className="grid grid-cols-1 gap-6 mt-6">
            <div  className="space-y-4">
                {coverUrl && songInfo && (
                  <Player 
                    id={urlId || inputValue} 
                    provider={provider} 
                    coverUrl={coverUrl} 
                    songInfo={songInfo} 
                  />
                )}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">歌词</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm">显示翻译</span>
                  <Switch checked={showTranslation} onCheckedChange={setShowTranslation} />
                </div>
              </div>
                <LyricsRenderer lyrics={lyrics} showTranslation={showTranslation} showTimestamp={true} />
            </div>
            <div>
              <h2 className="text-lg font-medium mb-2">AI 赏析</h2>
              <div className="space-y-2">
                <AIConfig
                  baseUrl={baseUrl}
                  apiKey={apiKey}
                  model={model}
                  onBaseUrlChange={setBaseUrl}
                  onApiKeyChange={setApiKey}
                  onModelChange={setModel}
                  onSave={saveSettings}
                  onAnalyze={analyze}
                  loading={aLoading}
                />
                {reasoning && (
                  <div className="border rounded-md bg-amber-50 dark:bg-amber-950/30">
                    <button 
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                    >
                      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">思考过程</h3>
                      <span className="text-amber-800 dark:text-amber-300">
                        {showReasoning ? "▼" : "▶"}
                      </span>
                    </button>
                    {showReasoning && (
                      <div className="px-4 pb-4 prose prose-zinc dark:prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkCjkFriendly]} 
                        >
                          {reasoning}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
                <div className="min-h-40 p-4 border rounded-md bg-white dark:bg-zinc-950 prose prose-zinc dark:prose-invert max-w-none">
                  {analysis ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkCjkFriendly]} 
                    >
                      {analysis}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">将在此显示 AI 赏析</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!lyrics && (
          <p className="mt-6 text-sm text-zinc-600">请输入歌曲链接或 ID，然后点击获取歌词。</p>
        )}
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10">Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}
