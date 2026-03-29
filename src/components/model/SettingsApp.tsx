import { AppProviders } from '@/components/AppProviders'
import { ModelConfigPage } from './ModelConfigPage'

export function SettingsApp() {
  return (
    <AppProviders>
      <ModelConfigPage />
    </AppProviders>
  )
}
