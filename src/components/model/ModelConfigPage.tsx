import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { SectionGroupId } from './settings/types'
import { formatGb, getUniqueSelectedModelIds, getUniqueSelectedSizeGb, isModelInstalled } from './settings/helpers'
import { MissingModelsDialog } from './settings/MissingModelsDialog'
import { PlatformStatusPanel } from './settings/PlatformStatusPanel'
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
    handleModelRuntimeChange,
    handlePull,
    handleReset,
    handleSave,
    installedModels,
    isCustom,
    isDirty,
    modelRuntime,
    ollamaBaseUrl,
    pullStates,
    sections,
    setActiveSection,
    setOllamaBaseUrl,
  } = useModelConfigPage()

  const [showMissingDialog, setShowMissingDialog] = useState(false)
  const isConfirmingNavigationRef = useRef(false)
  const allowNavigationRef = useRef(false)

  const isLocalRuntime = modelRuntime === 'local' || modelRuntime === 'small'
  const missingSections = isLocalRuntime
    ? sections.filter((section) => !isModelInstalled(installedModels, config[section.configKey] as string))
    : []
  const canSave = !isLocalRuntime || (installedModels !== null && missingSections.length === 0)

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
    document.addEventListener('click', onDocumentClickCapture, false)
    globalThis.addEventListener('popstate', onPopState)

    return () => {
      globalThis.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onDocumentClickCapture, false)
      globalThis.removeEventListener('popstate', onPopState)
    }
  }, [isDirty])

  function handleSaveClick() {
    if (!canSave) {
      setShowMissingDialog(true)
      return
    }
    allowNavigationRef.current = true
    void handleSave()
  }

  function handleInstallMissingModels() {
    const missingModelIds = [
      ...new Set(missingSections.map((section) => config[section.configKey] as string).filter(Boolean)),
    ]
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
      <div className="sticky top-14 z-10 -mx-4 mb-6 flex items-start justify-between gap-3 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/60 md:-mx-6 md:px-6">
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
          <div className="inline-flex rounded-md border border-border bg-background p-0.5">
            <Button
              type="button"
              variant={modelRuntime === 'local' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => handleModelRuntimeChange('local')}
            >
              Local
            </Button>
            <Button
              type="button"
              variant={modelRuntime === 'small' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              title="Optimised for machines with 4 GB RAM — all models ≤ 2.5 GB"
              onClick={() => handleModelRuntimeChange('small')}
            >
              Small PC
            </Button>
            <Button
              type="button"
              variant={modelRuntime === 'cloud' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => handleModelRuntimeChange('cloud')}
            >
              Cloud
            </Button>
          </div>

          {isLocalRuntime &&
            installedModels !== null &&
            missingSections.length > 0 &&
            (() => {
              const missingModelIds = [
                ...new Set(missingSections.map((section) => config[section.configKey] as string).filter(Boolean)),
              ]
              const isPulling = missingModelIds.some((id) => pullStates[id]?.status === 'pulling')
              return (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleInstallMissingModels}
                  disabled={isPulling}
                >
                  {isPulling ? 'Pulling…' : `Pull${missingModelIds.length > 1 ? ' All' : ''}`}
                </Button>
              )
            })()}
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveClick}
            disabled={isLocalRuntime && installedModels === null}
          >
            Save
          </Button>
        </div>
      </div>

      <PlatformStatusPanel config={{ ...config, modelRuntime, ollamaBaseUrl }} onEndpointChange={setOllamaBaseUrl} />

      <Separator className="my-8" />

      {/* Groups */}
      <div className="space-y-8">
        {GROUPS.map((group) => {
          const groupSections = sections.filter((section) => section.group === group.id)
          return (
            <section key={group.id} aria-labelledby={`group-heading-${group.id}`}>
              <div className="mb-4">
                <h2 id={`group-heading-${group.id}`} className="text-base font-semibold text-foreground">
                  {group.label}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(() => {
                    const uniqueModels = getUniqueSelectedModelIds(config, groupSections)
                    const sizeGb = getUniqueSelectedSizeGb(config, groupSections)
                    return `${groupSections.length} tasks · ${uniqueModels.length} unique models · ${formatGb(sizeGb)}`
                  })()}
                </p>
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
                        modelRuntime={modelRuntime}
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
