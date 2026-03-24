import { ChevronDown, Code2, Languages, RotateCcw, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer'
import { Button } from '@/components/ui/button'
import { getTranslateModel, loadModelConfig } from '@/lib/config/model-config'
import { appWretch } from '@/lib/http/app-client'
import { TRANSLATE_MODELS } from '@/lib/router/models'

// When includeCode is false, code blocks are extracted client-side before
// Sending text to the model, then restored verbatim after translation.

function extractCodeBlocks(markdown: string): { stripped: string; blocks: string[] } {
  const blocks: string[] = []

  // Extract fenced code blocks first (``` ... ```)
  let stripped = markdown.replaceAll(/```[\s\S]*?```/g, (match) => {
    const idx = blocks.push(match) - 1
    return `[[CODE:${idx}]]`
  })

  // Then extract inline code spans (` ... `)
  stripped = stripped.replaceAll(/`[^`\n]+`/g, (match) => {
    const idx = blocks.push(match) - 1
    return `[[CODE:${idx}]]`
  })

  return { blocks, stripped }
}

function restoreCodeBlocks(translated: string, blocks: string[]): string {
  return translated.replaceAll(/\[\[CODE:(\d+)\]\]/g, (_match, idx) => blocks[Number.parseInt(idx, 10)] ?? '')
}

async function* readSseChunks(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) {
        continue
      }
      try {
        const json = JSON.parse(line.slice(5).trim()) as Record<string, unknown>
        if (typeof json.text === 'string') {
          yield json.text
        }
      } catch {
        /* Ignore malformed */
      }
    }
  }
}

const LANGUAGES = [
  // Romance
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ro', label: 'Română' },
  { code: 'ca', label: 'Català' },
  // Germanic
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
  { code: 'no', label: 'Norsk' },
  { code: 'fi', label: 'Suomi' },
  // Slavic
  { code: 'pl', label: 'Polski' },
  { code: 'cs', label: 'Čeština' },
  { code: 'sk', label: 'Slovenčina' },
  { code: 'hr', label: 'Hrvatski' },
  { code: 'sl', label: 'Slovenščina' },
  { code: 'bg', label: 'Български' },
  { code: 'sr', label: 'Српски' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  // Baltic & Finno-Ugric
  { code: 'lt', label: 'Lietuvių' },
  { code: 'lv', label: 'Latviešu' },
  { code: 'et', label: 'Eesti' },
  { code: 'hu', label: 'Magyar' },
  // Other European
  { code: 'el', label: 'Ελληνικά' },
  { code: 'tr', label: 'Türkçe' },
  // Middle Eastern
  { code: 'ar', label: 'العربية' },
  { code: 'he', label: 'עברית' },
  // South Asian
  { code: 'hi', label: 'हिन्दी' },
  // East Asian
  { code: 'zh', label: '中文 (简体)' },
  { code: 'zh-tw', label: '中文 (繁體)' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  // Southeast Asian
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const

type LangCode = (typeof LANGUAGES)[number]['code']

type Status = 'idle' | 'translating' | 'done' | 'error'

interface TranslateButtonProps {
  content: string
}

export function TranslateButton({ content }: TranslateButtonProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [selectedLang, setSelectedLang] = useState<LangCode | null>(null)
  const [translatedText, setTranslatedText] = useState('')
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [includeCode, setIncludeCode] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Resolve whether the active translate model supports code block translation
  const config = loadModelConfig()
  const currentModelId = getTranslateModel(config)
  const modelCanTranslateCode = TRANSLATE_MODELS.find((model) => model.id === currentModelId)?.canTranslateCode === true

  async function translate(langCode: LangCode) {
    const language = LANGUAGES.find((lang) => lang.code === langCode)
    if (!language) {
      return
    }

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort

    setSelectedLang(langCode)
    setStatus('translating')
    setTranslatedText('')
    setTranslateError(null)
    setOpen(false)

    // Extract code blocks unless the model can handle them AND user opted in
    const shouldExtract = !(includeCode && modelCanTranslateCode)
    const { stripped, blocks } = shouldExtract ? extractCodeBlocks(content) : { blocks: [], stripped: content }

    const cfg = loadModelConfig()
    const model = getTranslateModel(cfg)

    try {
      const res = await appWretch
        .url('/api/translate')
        .options({ signal: abort.signal })
        .post({
          model,
          ollamaBaseUrl: cfg.ollamaBaseUrl,
          targetLanguage: language.label,
          text: stripped,
        })
        .res()

      if (!res.body) {
        throw new Error('No stream')
      }

      // Buffer chunks — restore code blocks only once the full translation
      // Is done, so placeholders never appear in the rendered output.
      let raw = ''
      for await (const chunk of readSseChunks(res.body)) {
        raw += chunk
      }

      setTranslatedText(shouldExtract ? restoreCodeBlocks(raw, blocks) : raw)
      setStatus('done')
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return
      }
      setTranslateError('Translation failed. Make sure the translate model is running in Ollama.')
      setStatus('error')
    }
  }

  function dismiss() {
    abortRef.current?.abort()
    setStatus('idle')
    setSelectedLang(null)
    setTranslatedText('')
    setTranslateError(null)
  }

  const selectedLangLabel = LANGUAGES.find((lang) => lang.code === selectedLang)?.label

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      {/* Trigger row */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen((prev) => !prev)}
            className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Languages className="h-3.5 w-3.5" />
            {selectedLangLabel ? `Translated to ${selectedLangLabel}` : 'Translate'}
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>

          {/* Language dropdown */}
          {open && (
            <div className="absolute bottom-full left-0 z-20 mb-1 max-h-56 w-44 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
              <div className="p-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => translate(lang.code)}
                    className={[
                      'w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted',
                      selectedLang === lang.code ? 'font-medium text-foreground' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Code-block toggle — only shown when the active model supports it */}
        {modelCanTranslateCode && (
          <button
            type="button"
            onClick={() => setIncludeCode((prev) => !prev)}
            title={includeCode ? 'Code blocks will be translated' : 'Code blocks are skipped (click to include)'}
            className={[
              'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
              includeCode
                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                : 'text-muted-foreground/50 hover:text-muted-foreground',
            ].join(' ')}
          >
            <Code2 className="h-2.5 w-2.5" />
            {includeCode ? 'Code on' : 'Code off'}
          </button>
        )}

        {/* Re-translate / dismiss controls */}
        {(status === 'done' || status === 'error') && selectedLang && (
          <>
            <button
              type="button"
              onClick={() => translate(selectedLang)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Retry
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground"
            >
              <X className="h-2.5 w-2.5" />
              Dismiss
            </button>
          </>
        )}
      </div>

      {/* Translation output */}
      {status === 'translating' && (
        <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <p className="mb-2 text-[10px] font-medium text-blue-600 dark:text-blue-400">
            Translating to {selectedLangLabel}…
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {status === 'done' && translatedText && (
        <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <p className="mb-2 text-[10px] font-medium text-blue-600 dark:text-blue-400">{selectedLangLabel}</p>
          <MarkdownRenderer content={translatedText} />
        </div>
      )}

      {status === 'error' && (
        <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {translateError}
        </div>
      )}
    </div>
  )
}
