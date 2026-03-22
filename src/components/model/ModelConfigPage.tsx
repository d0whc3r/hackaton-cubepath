import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OLLAMA_BASE_URL_DEFAULT } from '@/lib/router/models'

import type { SectionDef, SectionGroupId } from './settings/types'

import { ActiveSectionEditor } from './settings/ActiveSectionEditor'
import { SECTIONS } from './settings/constants'
import { isModelInstalled } from './settings/helpers'
import { MissingModelsDialog } from './settings/MissingModelsDialog'
import { ModelDetailsPanel } from './settings/ModelDetailsPanel'
import { SectionCardsStrip } from './settings/SectionCardsStrip'
import { useModelConfigPage } from './settings/use-model-config-page'

const GROUPS: { id: SectionGroupId; label: string }[] = [
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'generation', label: 'Generation' },
  { id: 'language', label: 'Language' },
]

function getGroupSections(groupId: SectionGroupId): SectionDef[] {
  return SECTIONS.filter((section) => section.group === groupId)
}

export function ModelConfigPage() {
  const {
    config,
    customModels,
    installedModels,
    pullStates,
    activeSection,
    activeSectionDef,
    activeIsCustom,
    activeModelInstalled,
    ollamaBaseUrl,
    copiedModelId,
    runtimeModelDetails,
    isDirty,
    setActiveSection,
    setOllamaBaseUrl,
    getSelectValue,
    isCustom,
    getDefaultModelForSection,
    handleModelChange,
    handleCustomModelChange,
    handlePull,
    handleCopyPull,
    handleSave,
    handleReset,
  } = useModelConfigPage()

  const [activeGroup, setActiveGroup] = useState<SectionGroupId>(activeSectionDef.group)
  const [showMissingDialog, setShowMissingDialog] = useState(false)
  const isConfirmingNavigationRef = useRef(false)
  const allowNavigationRef = useRef(false)
  const groupedSections = getGroupSections(activeGroup)
  const groupedSectionsLabel = GROUPS.find((group) => group.id === activeGroup)?.label ?? activeGroup
  const currentSectionModelId = config[activeSectionDef.configKey] as string
  const missingSections = SECTIONS.filter((section) => {
    const modelId = config[section.configKey] as string
    return !isModelInstalled(installedModels, modelId)
  })
  const canSave = installedModels !== null && missingSections.length === 0

  useEffect(() => {
    setActiveGroup(activeSectionDef.group)
  }, [activeSectionDef.group])

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
      event.returnValue = warningMessage
    }

    const onDocumentClickCapture = (event: MouseEvent) => {
      if (isConfirmingNavigationRef.current) {
        return
      }
      if (allowNavigationRef.current) {
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

      const target = event.target as Element | null
      const anchor = target?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor) {
        return
      }
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return
      }

      const nextUrl = new URL(anchor.href, globalThis.location.href)
      const currentUrl = new URL(globalThis.location.href)
      if (nextUrl.href === currentUrl.href) {
        return
      }

      isConfirmingNavigationRef.current = true
      const shouldLeave = globalThis.confirm(warningMessage)
      isConfirmingNavigationRef.current = false
      if (shouldLeave) {
        allowNavigationRef.current = true
        return
      }
      if (!shouldLeave) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const onPopState = () => {
      if (isConfirmingNavigationRef.current) {
        return
      }
      if (allowNavigationRef.current) {
        return
      }
      isConfirmingNavigationRef.current = true
      const shouldLeave = globalThis.confirm(warningMessage)
      isConfirmingNavigationRef.current = false
      if (shouldLeave) {
        allowNavigationRef.current = true
        return
      }
      if (!shouldLeave) {
        globalThis.history.go(1)
      }
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

  function handleGroupChange(nextGroup: SectionGroupId) {
    setActiveGroup(nextGroup)
    const [nextSection] = getGroupSections(nextGroup)
    if (nextSection) {
      setActiveSection(nextSection.id)
    }
  }

  function handleSaveClick() {
    if (!canSave) {
      setShowMissingDialog(true)
      return
    }
    allowNavigationRef.current = true
    handleSave()
  }

  function handleInstallMissingModels() {
    const missingModels = [
      ...new Set(missingSections.map((section) => config[section.configKey] as string).filter(Boolean)),
    ]

    for (const modelId of missingModels) {
      handlePull(modelId, ollamaBaseUrl)
    }

    const [firstMissing] = missingSections
    if (firstMissing) {
      setActiveSection(firstMissing.id)
      setActiveGroup(firstMissing.group)
    }

    setShowMissingDialog(false)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Model Settings</h1>
          <p className="text-xs text-muted-foreground">
            Choose the best model for each task and your local Ollama endpoint.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button type="button" size="sm" onClick={handleSaveClick} disabled={installedModels === null}>
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Label htmlFor="ollama-url" className="shrink-0 text-xs font-medium text-muted-foreground">
          Ollama Base URL
        </Label>
        <Input
          id="ollama-url"
          value={ollamaBaseUrl}
          onChange={(event) => setOllamaBaseUrl(event.target.value)}
          placeholder={OLLAMA_BASE_URL_DEFAULT}
          className="max-w-xl font-mono text-xs"
        />
        <span className="text-[11px] text-muted-foreground">Default: {OLLAMA_BASE_URL_DEFAULT}</span>
      </div>

      <Separator className="my-6" />

      <Tabs value={activeGroup} onValueChange={(value) => handleGroupChange(value as SectionGroupId)}>
        <TabsList variant="line" className="mb-4 h-10">
          {GROUPS.map((group) => (
            <TabsTrigger key={group.id} value={group.id} className="px-3">
              {group.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeGroup}>
          <p className="mb-2 text-xs text-muted-foreground">
            Functions in <span className="font-medium text-foreground">{groupedSectionsLabel}</span>
          </p>
          {missingSections.length > 0 && (
            <p className="mb-2 text-xs text-destructive">
              {missingSections.length} selected model{missingSections.length > 1 ? 's are' : ' is'} not installed.
              Install or change them before saving.
            </p>
          )}

          <SectionCardsStrip
            sections={groupedSections}
            activeSectionId={activeSection}
            getModelId={(section) => config[section.configKey] as string}
            isInstalled={(modelId) => isModelInstalled(installedModels, modelId)}
            onSelectSection={(section) => setActiveSection(section.id)}
          />

          <ActiveSectionEditor
            section={activeSectionDef}
            selectValue={getSelectValue(activeSectionDef)}
            defaultModelId={getDefaultModelForSection(activeSectionDef)}
            customValue={customModels[activeSectionDef.id] ?? ''}
            isCustom={isCustom(activeSectionDef.id)}
            onModelChange={(value) => handleModelChange(activeSectionDef, value)}
            onCustomModelChange={(value) => handleCustomModelChange(activeSectionDef, value)}
          />

          <ModelDetailsPanel
            section={activeSectionDef}
            config={config}
            isCustom={activeIsCustom}
            isInstalled={activeModelInstalled}
            copiedModelId={copiedModelId}
            pullState={pullStates[currentSectionModelId]}
            runtimeDetails={runtimeModelDetails}
            ollamaBaseUrl={ollamaBaseUrl}
            onPull={handlePull}
            onCopyPull={handleCopyPull}
          />
        </TabsContent>
      </Tabs>

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
