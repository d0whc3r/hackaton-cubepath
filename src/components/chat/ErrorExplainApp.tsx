import { Send, Square } from 'lucide-react'
import { useState } from 'react'

import { AppProviders } from '@/components/AppProviders'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { useChatSession } from '@/hooks/use-chat-session'
import { ChatContext } from '@/lib/context/chat-context'

export function ErrorExplainApp() {
  const session = useChatSession('error-explain')
  const [errorMsg, setErrorMsg] = useState('')
  const [codeSnippet, setCodeSnippet] = useState('')
  const [touched, setTouched] = useState(false)

  const isErrorEmpty = errorMsg.trim() === ''

  function handleSubmit() {
    if (isErrorEmpty) {
      setTouched(true)
      return
    }

    const parts = [`ERROR:\n${errorMsg.trim()}`]
    if (codeSnippet.trim()) {
      parts.push(`CODE:\n${codeSnippet.trim()}`)
    }
    const combined = parts.join('\n\n')

    session.handleSubmit(combined, 'error-explain')
    setErrorMsg('')
    setCodeSnippet('')
    setTouched(false)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <AppProviders>
      <SidebarProvider className="h-screen overflow-hidden">
        <AppSidebar fixedTaskType="error-explain" />
        <SidebarInset className="flex h-full flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Error Explain</span>
              <span className="hidden truncate text-[11px] text-muted-foreground sm:block">
                Paste an error message and optional code snippet to get a root-cause explanation.
              </span>
            </div>
          </header>

          <ChatContext.Provider
            value={{
              activeTask: session.activeTask,
              currentModel: session.currentModel,
              entries: session.entries,
              fixedTaskType: 'error-explain',
              handleCancel: session.handleCancel,
              handleClearHistory: session.handleClearHistory,
              handleSubmit: session.handleSubmit,
              isHydrated: session.isHydrated,
              isLoading: session.isLoading,
              setActiveTask: session.setActiveTask,
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatMessages />

              <div className="border-t border-border/60 bg-background/95 p-3 backdrop-blur-sm md:p-4">
                <div className="mb-3 flex flex-col gap-1">
                  <label htmlFor="error-msg" className="text-xs font-medium text-foreground">
                    Error message <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="error-msg"
                    value={errorMsg}
                    onChange={(event) => setErrorMsg(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste the error message or stack trace…"
                    className={[
                      'max-h-40 resize-none overflow-y-auto font-mono text-xs leading-relaxed',
                      touched && isErrorEmpty ? 'border-destructive focus-visible:ring-destructive' : '',
                    ].join(' ')}
                    disabled={session.isLoading}
                  />
                  {touched && isErrorEmpty && <p className="text-xs text-destructive">Error message is required.</p>}
                </div>

                <div className="mb-3 flex flex-col gap-1">
                  <label htmlFor="code-snippet" className="text-xs font-medium text-muted-foreground">
                    Code snippet <span className="text-muted-foreground/60">(optional)</span>
                  </label>
                  <Textarea
                    id="code-snippet"
                    value={codeSnippet}
                    onChange={(event) => setCodeSnippet(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste the relevant code snippet for more context…"
                    className="max-h-32 resize-none overflow-y-auto font-mono text-xs leading-relaxed"
                    disabled={session.isLoading}
                  />
                </div>

                <div className="flex justify-end">
                  {session.isLoading ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={session.handleCancel}
                      className="h-8 gap-1.5"
                    >
                      <Square className="h-3 w-3 fill-current" />
                      Stop
                    </Button>
                  ) : (
                    <Button type="button" size="sm" onClick={handleSubmit} className="h-8 gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      Send
                      <kbd className="hidden rounded border border-primary-foreground/30 px-1 py-0.5 font-mono text-[9px] opacity-70 sm:inline">
                        ⌘↵
                      </kbd>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ChatContext.Provider>
        </SidebarInset>
      </SidebarProvider>
    </AppProviders>
  )
}
