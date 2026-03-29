import { Moon, Sun } from 'lucide-react'
import { ThemeProvider, useTheme } from 'next-themes'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import { Button } from '@/components/ui/button'

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export function ThemeToggle() {
  return (
    <AppErrorBoundary boundaryName="layout.theme-toggle" variant="inline">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ThemeToggleButton />
      </ThemeProvider>
    </AppErrorBoundary>
  )
}
