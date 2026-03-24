import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'
import type { SectionDef, SectionGroupId } from './settings/types'
import { SECTIONS } from './settings/constants'
import { isModelInstalled } from './settings/helpers'
import { MissingModelsDialog } from './settings/MissingModelsDialog'
import { TaskRow } from './settings/TaskRow'
import { useModelConfigPage } from './settings/use-model-config-page'

const GROUPS: { id: SectionGroupId; label: string; description: string }[] = [
  {
    description: 'Models that handle pre-processing and initial analysis before specialist dispatch.',
    id: 'infrastructure',
    label: 'Core Routing',
  },
  {
    description: 'Read-only intelligence tasks; explain, diagnose, identify, and suggest.',
    id: 'analysis',
    label: 'Analysis Tasks',
  },
  {
    description: 'Active transformation tasks; generate, refactor, and rewrite code.',
    id: 'generation',
    label: 'Generation Tasks',
  },
  {
    description: 'Multilingual processing; translation and localization.',
    id: 'language',
    label: 'Language',
  },
]

function getGroupSections(groupId: SectionGroupId): SectionDef[] {
  return SECTIONS.filter((section) => section.group === groupId)
}

export function ModelConfigPage() {
  const {
    activeSection,
    config,
    copiedModelId,
    customModels,
    getDefaultModelForSection,
    getSelectValue,
    handleCopyPull,
    handleCustomModelChange,
    handleModelChange,
    handlePull,
    handleReset,
    handleSave,
    installedModels,
    isCustom,
    isDirty,
    ollamaBaseUrl,
    pullStates,
    setActiveSection,
    setOllamaBaseUrl,
  } = useModelConfigPage()

  const [showMissingDialog, setShowMissingDialog] = useState(false)
  const isConfirmingNavigationRef = useRef(false)
  const allowNavigationRef = useRef(false)

  const missingSections = SECTIONS.filter(
    (section) => !isModelInstalled(installedModels, config[section.configKey] as string),
  )
  const canSave = installedModels !== null && missingSections.length === 0

  useEffect(() => {
    if (!isDirty) {
      return
    }

    const warningMessage = 'You have unsaved changes in settings. Leave this page and discard them?'

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) {
        return
      }
      event.preventDefault()
    }

    const onDocumentClickCapture = (event: MouseEvent) => {
      if (isConfirmingNavigationRef.current || allowNavigationRef.current) {
        return
      }
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return
      }

      const nextUrl = new URL(anchor.href, globalThis.location.href)
      if (nextUrl.href === globalThis.location.href) {
        return
      }

      isConfirmingNavigationRef.current = true
      const shouldLeave = globalThis.confirm(warningMessage)
      isConfirmingNavigationRef.current = false
      if (shouldLeave) {
        allowNavigationRef.current = true
        return
      }
      event.preventDefault()
      event.stopPropagation()
    }

    const onPopState = () => {
      if (isConfirmingNavigationRef.current || allowNavigationRef.current) {
        return
      }
      isConfirmingNavigationRef.current = true
      const shouldLeave = globalThis.confirm(warningMessage)
      isConfirmingNavigationRef.current = false
      if (shouldLeave) {
        allowNavigationRef.current = true
        return
      }
      globalThis.history.go(1)
    }

    globalThis.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onDocumentClickCapture, true)
    globalThis.addEventListener('popstate', onPopState)

    return () => {
      globalThis.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onDocumentClickCapture, true)
      globalThis.removeEventListener('popstate', onPopState)
    }
  }, [isDirty])

  function handleSaveClick() {
    if (!canSave) {
      setShowMissingDialog(true)
      return
    }
    allowNavigationRef.current = true
    handleSave()
  }

  function handleInstallMissingModels() {
    const missingModelIds = [...new Set(missingSections.map((s) => config[s.configKey] as string).filter(Boolean))]
    for (const modelId of missingModelIds) {
      handlePull(modelId, ollamaBaseUrl)
    }
    const [firstMissing] = missingSections
    if (firstMissing) {
      setActiveSection(firstMissing.id)
    }
    setShowMissingDialog(false)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-start justify-between gap-3 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 md:-mx-6 md:px-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Model Configuration</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Assign an Ollama model to each task role. Configuration is persisted to{' '}
            <code className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-xs">localStorage</code>{' '}
            under key{' '}
            <code className="rounded border border-border/60 bg-muted px-1 py-0.5 font-mono text-xs">
              slm-router-model-config
            </code>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" size="sm" onClick={handleSaveClick} disabled={installedModels === null}>
            Save
          </Button>
        </div>
      </div>

      {/* Ollama URL with status indicator */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <Label htmlFor="ollama-url" className="shrink-0 font-mono text-xs text-muted-foreground">
            Ollama endpoint
          </Label>
        </div>
        <Input
          id="ollama-url"
          value={ollamaBaseUrl}
          onChange={(event) => setOllamaBaseUrl(event.target.value)}
          placeholder={OLLAMA_BASE_URL_DEFAULT}
          className="max-w-xs font-mono text-xs"
        />
      </div>

      {missingSections.length > 0 && (
        <p className="mb-4 text-xs text-destructive">
          {missingSections.length} selected model{missingSections.length > 1 ? 's are' : ' is'} not installed. Install
          or change them before saving.
        </p>
      )}

      <Separator className="mb-8" />

      {/* Groups */}
      <div className="space-y-8">
        {GROUPS.map((group) => {
          const groupSections = getGroupSections(group.id)
          return (
            <section key={group.id} aria-labelledby={`group-heading-${group.id}`}>
              <div className="mb-4">
                <h2 id={`group-heading-${group.id}`} className="text-base font-semibold text-foreground">
                  {group.label}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="divide-y divide-border/60">
                  {groupSections.map((section) => {
                    const modelId = config[section.configKey] as string
                    return (
                      <TaskRow
                        key={section.id}
                        section={section}
                        modelId={modelId}
                        isActive={activeSection === section.id}
                        selectValue={getSelectValue(section)}
                        defaultModelId={getDefaultModelForSection(section)}
                        customValue={customModels[section.id] ?? ''}
                        isCustom={isCustom(section.id)}
                        isInstalled={isModelInstalled(installedModels, modelId)}
                        installedModelsReady={installedModels !== null}
                        pullState={pullStates[modelId]}
                        ollamaBaseUrl={ollamaBaseUrl}
                        copiedModelId={copiedModelId}
                        onActivate={() => setActiveSection(section.id)}
                        onModelChange={(value) => handleModelChange(section, value)}
                        onCustomModelChange={(value) => handleCustomModelChange(section, value)}
                        onPull={handlePull}
                        onCopyPull={handleCopyPull}
                        showGroupBadge={false}
                      />
                    )
                  })}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <MissingModelsDialog
        open={showMissingDialog}
        sections={missingSections}
        getModelId={(section) => config[section.configKey] as string}
        onOpenChange={setShowMissingDialog}
        onInstallMissing={handleInstallMissingModels}
      />
    </main>
  )
}
