'use strict'
;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [430],
  {
    7268: (e, r, t) => {
      t.d(r, { A: () => i })
      var o = t(5155),
        a = t(2115),
        n = t(7581)
      function i(e) {
        let { open: r, onClose: t } = e,
          [i, l] = (0, a.useState)(n.p9)
        return ((0, a.useEffect)(() => {
          if (r)
            try {
              let e = localStorage.getItem(n.x4)
              e ? l(JSON.parse(e)) : l(n.p9)
            } catch (e) {
              l(n.p9)
            }
        }, [r]),
        r)
          ? (0, o.jsx)('div', {
              className: 'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
              onClick: (e) => {
                e.target === e.currentTarget && t()
              },
              role: 'dialog',
              'aria-modal': 'true',
              'aria-label': 'Quick model configuration',
              children: (0, o.jsxs)('div', {
                className: 'w-full max-w-md rounded-xl border border-border bg-card shadow-2xl',
                children: [
                  (0, o.jsxs)('div', {
                    className: 'flex items-center justify-between border-b border-border px-5 py-4',
                    children: [
                      (0, o.jsx)('h2', {
                        className: 'font-mono-code text-sm font-semibold text-foreground',
                        children: 'Quick Model Config',
                      }),
                      (0, o.jsx)('button', {
                        onClick: t,
                        'aria-label': 'Close dialog',
                        className:
                          'text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1',
                        children: (0, o.jsx)('svg', {
                          width: '14',
                          height: '14',
                          viewBox: '0 0 14 14',
                          fill: 'none',
                          'aria-hidden': 'true',
                          children: (0, o.jsx)('path', {
                            d: 'M1 1l12 12M13 1L1 13',
                            stroke: 'currentColor',
                            strokeWidth: '1.5',
                            strokeLinecap: 'round',
                          }),
                        }),
                      }),
                    ],
                  }),
                  (0, o.jsx)('div', {
                    className: 'max-h-80 overflow-y-auto scrollbar-thin px-5 py-3 space-y-2',
                    children: [
                      { key: 'analyst', label: 'Analyst (pre-routing)' },
                      { key: 'translator', label: 'Translator' },
                      { key: 'explain', label: 'Explain Code' },
                      { key: 'errorExplain', label: 'Error Explain' },
                      { key: 'test', label: 'Generate Tests' },
                      { key: 'refactor', label: 'Refactor' },
                      { key: 'commit', label: 'Commit Message' },
                      { key: 'docstring', label: 'Docstring' },
                      { key: 'naming', label: 'Naming' },
                      { key: 'deadCode', label: 'Dead Code' },
                      { key: 'typeHints', label: 'Type Hints' },
                      { key: 'performanceHint', label: 'Performance Hint' },
                    ].map((e) =>
                      (0, o.jsxs)(
                        'div',
                        {
                          className: 'flex items-center justify-between gap-3',
                          children: [
                            (0, o.jsx)('label', {
                              htmlFor: 'dialog-'.concat(e.key),
                              className: 'text-xs text-muted-foreground w-36 shrink-0 font-mono-code',
                              children: e.label,
                            }),
                            (0, o.jsx)('input', {
                              id: 'dialog-'.concat(e.key),
                              type: 'text',
                              value: i[e.key],
                              onChange: (r) => l((t) => ({ ...t, [e.key]: r.target.value })),
                              className:
                                'flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 font-mono-code text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                            }),
                          ],
                        },
                        'dialog-row-'.concat(e.key),
                      ),
                    ),
                  }),
                  (0, o.jsxs)('div', {
                    className: 'flex items-center justify-end gap-2 border-t border-border px-5 py-4',
                    children: [
                      (0, o.jsx)('button', {
                        onClick: t,
                        className:
                          'rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        children: 'Cancel',
                      }),
                      (0, o.jsx)('button', {
                        onClick: () => {
                          ;(localStorage.setItem(n.x4, JSON.stringify(i)), t())
                        },
                        className:
                          'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
                        children: 'Save',
                      }),
                    ],
                  }),
                ],
              }),
            })
          : null
      }
    },
    9345: (e, r, t) => {
      t.d(r, { A: () => d })
      var o = t(5155),
        a = t(2115),
        n = t(8173),
        i = t.n(n),
        l = t(6046),
        s = t(6825)
      function d(e) {
        let { onOpenModelConfig: r } = e,
          { theme: t, toggleTheme: n } = (0, s.D)(),
          d = (0, l.usePathname)(),
          [c, u] = (0, a.useState)(!1),
          m = [
            { label: 'Overview', href: '/overview-dashboard', anchor: !1 },
            { label: 'Tasks', href: '/overview-dashboard#task-catalog', anchor: !0 },
            { label: 'Workspace', href: '/task-workspace', anchor: !1 },
            { label: 'Settings', href: '/settings', anchor: !1 },
          ],
          g = (e) => d === e.split('#')[0]
        return (0, o.jsxs)('header', {
          className: 'sticky top-0 z-50 h-14 w-full border-b border-border/60 bg-background/80 backdrop-blur-md',
          children: [
            (0, o.jsxs)('div', {
              className: 'mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6',
              children: [
                (0, o.jsxs)(i(), {
                  href: '/overview-dashboard',
                  className:
                    'flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md',
                  children: [
                    (0, o.jsx)('div', {
                      className:
                        'flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground',
                      children: (0, o.jsxs)('svg', {
                        width: '16',
                        height: '16',
                        viewBox: '0 0 16 16',
                        fill: 'none',
                        xmlns: 'http://www.w3.org/2000/svg',
                        'aria-hidden': 'true',
                        children: [
                          (0, o.jsx)('path', {
                            d: 'M2 8C2 4.686 4.686 2 8 2s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z',
                            stroke: 'currentColor',
                            strokeWidth: '1.5',
                          }),
                          (0, o.jsx)('path', {
                            d: 'M5 8l2 2 4-4',
                            stroke: 'currentColor',
                            strokeWidth: '1.5',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                          }),
                        ],
                      }),
                    }),
                    (0, o.jsx)('span', {
                      className: 'font-mono-code text-sm font-semibold tracking-tight text-foreground',
                      children: 'OllamaRouter',
                    }),
                  ],
                }),
                (0, o.jsx)('nav', {
                  className: 'hidden items-center gap-1 md:flex',
                  'aria-label': 'Main navigation',
                  children: m.map((e) =>
                    (0, o.jsx)(
                      i(),
                      {
                        href: e.href,
                        className:
                          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring '.concat(
                            g(e.href)
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                          ),
                        children: e.label,
                      },
                      'nav-'.concat(e.label.toLowerCase()),
                    ),
                  ),
                }),
                (0, o.jsxs)('div', {
                  className: 'flex items-center gap-2',
                  children: [
                    (0, o.jsx)('button', {
                      onClick: r,
                      title: 'Model configuration',
                      'aria-label': 'Open model configuration',
                      className:
                        'flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground transition-colors hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      children: (0, o.jsx)('svg', {
                        width: '15',
                        height: '15',
                        viewBox: '0 0 15 15',
                        fill: 'none',
                        xmlns: 'http://www.w3.org/2000/svg',
                        'aria-hidden': 'true',
                        children: (0, o.jsx)('path', {
                          d: 'M7.5 1a.75.75 0 01.75.75v.857a4.501 4.501 0 012.596 1.074l.742-.742a.75.75 0 111.06 1.06l-.741.742A4.501 4.501 0 0113 7.5h.25a.75.75 0 010 1.5H13a4.501 4.501 0 01-1.093 2.759l.742.741a.75.75 0 11-1.06 1.061l-.742-.742A4.501 4.501 0 018.25 13.893v.357a.75.75 0 01-1.5 0v-.357a4.501 4.501 0 01-2.596-1.074l-.742.742a.75.75 0 11-1.06-1.06l.741-.742A4.501 4.501 0 012 7.5H1.75a.75.75 0 010-1.5H2a4.501 4.501 0 011.093-2.759l-.742-.741a.75.75 0 111.06-1.061l.742.742A4.501 4.501 0 016.75 1.607V.75A.75.75 0 017.5 1zm0 3a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 1.5a2 2 0 110 4 2 2 0 010-4z',
                          fill: 'currentColor',
                        }),
                      }),
                    }),
                    (0, o.jsx)('button', {
                      onClick: n,
                      title: 'Switch to '.concat('dark' === t ? 'light' : 'dark', ' mode'),
                      'aria-label': 'Switch to '.concat('dark' === t ? 'light' : 'dark', ' mode'),
                      className:
                        'flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground transition-colors hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      children:
                        'dark' === t
                          ? (0, o.jsx)('svg', {
                              width: '15',
                              height: '15',
                              viewBox: '0 0 15 15',
                              fill: 'none',
                              xmlns: 'http://www.w3.org/2000/svg',
                              'aria-hidden': 'true',
                              children: (0, o.jsx)('path', {
                                d: 'M7.5 0a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1A.75.75 0 017.5 0zm4.243 2.257a.75.75 0 010 1.06l-.707.708a.75.75 0 11-1.06-1.061l.707-.707a.75.75 0 011.06 0zM15 7.5a.75.75 0 01-.75.75h-1a.75.75 0 010-1.5h1A.75.75 0 0115 7.5zm-2.257 4.243a.75.75 0 01-1.06 0l-.708-.707a.75.75 0 111.061-1.06l.707.707a.75.75 0 010 1.06zM7.5 13.5a.75.75 0 01.75.75v1a.75.75 0 01-1.5 0v-1a.75.75 0 01.75-.75zm-4.243-1.257a.75.75 0 011.06 0l.708.707a.75.75 0 11-1.061 1.06l-.707-.707a.75.75 0 010-1.06zM1.5 7.5A.75.75 0 01.75 8.25H-.25a.75.75 0 010-1.5H.75A.75.75 0 011.5 7.5zm.757-4.243a.75.75 0 011.06 1.06l-.707.708a.75.75 0 11-1.06-1.061l.707-.707zM7.5 4a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
                                fill: 'currentColor',
                              }),
                            })
                          : (0, o.jsx)('svg', {
                              width: '15',
                              height: '15',
                              viewBox: '0 0 15 15',
                              fill: 'none',
                              xmlns: 'http://www.w3.org/2000/svg',
                              'aria-hidden': 'true',
                              children: (0, o.jsx)('path', {
                                d: 'M2.89 0.686A.75.75 0 012.04 1.9a5.5 5.5 0 107.06 7.06.75.75 0 011.214.85A7 7 0 112.89.685z',
                                fill: 'currentColor',
                              }),
                            }),
                    }),
                    (0, o.jsx)('button', {
                      onClick: () => u((e) => !e),
                      'aria-label': 'Toggle mobile menu',
                      className:
                        'flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground transition-colors hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden',
                      children: c
                        ? (0, o.jsx)('svg', {
                            width: '15',
                            height: '15',
                            viewBox: '0 0 15 15',
                            fill: 'none',
                            'aria-hidden': 'true',
                            children: (0, o.jsx)('path', {
                              d: 'M2 2l11 11M13 2L2 13',
                              stroke: 'currentColor',
                              strokeWidth: '1.5',
                              strokeLinecap: 'round',
                            }),
                          })
                        : (0, o.jsx)('svg', {
                            width: '15',
                            height: '15',
                            viewBox: '0 0 15 15',
                            fill: 'none',
                            'aria-hidden': 'true',
                            children: (0, o.jsx)('path', {
                              d: 'M1 3h13M1 7.5h13M1 12h13',
                              stroke: 'currentColor',
                              strokeWidth: '1.5',
                              strokeLinecap: 'round',
                            }),
                          }),
                    }),
                  ],
                }),
              ],
            }),
            c &&
              (0, o.jsx)('div', {
                className: 'border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden',
                children: (0, o.jsx)('nav', {
                  className: 'flex flex-col px-4 py-3 gap-1',
                  'aria-label': 'Mobile navigation',
                  children: m.map((e) =>
                    (0, o.jsx)(
                      i(),
                      {
                        href: e.href,
                        onClick: () => u(!1),
                        className: 'rounded-md px-3 py-2 text-sm font-medium transition-colors '.concat(
                          g(e.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                        ),
                        children: e.label,
                      },
                      'mobile-nav-'.concat(e.label.toLowerCase()),
                    ),
                  ),
                }),
              }),
          ],
        })
      }
    },
    6825: (e, r, t) => {
      t.d(r, { D: () => l, N: () => i })
      var o = t(5155),
        a = t(2115)
      let n = (0, a.createContext)({ theme: 'dark', toggleTheme: () => {} })
      function i(e) {
        let { children: r } = e,
          [t, i] = (0, a.useState)('dark')
        return (
          (0, a.useEffect)(() => {
            let e = localStorage.getItem('ollama-router-theme'),
              r = null != e ? e : 'dark'
            ;(i(r), document.documentElement.classList.toggle('dark', 'dark' === r))
          }, []),
          (0, o.jsx)(n.Provider, {
            value: {
              theme: t,
              toggleTheme: () => {
                i((e) => {
                  let r = 'dark' === e ? 'light' : 'dark'
                  return (
                    localStorage.setItem('ollama-router-theme', r),
                    document.documentElement.classList.toggle('dark', 'dark' === r),
                    r
                  )
                })
              },
            },
            children: r,
          })
        )
      }
      function l() {
        return (0, a.useContext)(n)
      }
    },
    7581: (e, r, t) => {
      t.d(r, { n3: () => n, p9: () => a, x4: () => o })
      let o = 'slm-router-model-config',
        a = {
          analyst: 'llama3.2:3b',
          translator: 'llama3.2:3b',
          explain: 'deepseek-coder:6.7b',
          errorExplain: 'deepseek-coder:6.7b',
          test: 'codellama:13b',
          refactor: 'codellama:13b',
          commit: 'llama3.2:3b',
          docstring: 'deepseek-coder:6.7b',
          naming: 'llama3.2:3b',
          deadCode: 'codellama:7b',
          typeHints: 'codellama:7b',
          performanceHint: 'codellama:13b',
        },
        n = [
          {
            slug: 'explain',
            title: 'Explain Code',
            description: 'Get a plain-English breakdown of what a code block does, line by line.',
            modelKey: 'explain',
            category: 'Analysis',
            placeholder: 'Paste the code you want explained here...',
          },
          {
            slug: 'error-explain',
            title: 'Error Explain',
            description: 'Diagnose a runtime or compile-time error and get a fix recommendation.',
            modelKey: 'errorExplain',
            category: 'Analysis',
            placeholder: 'Paste the error message and the relevant code...',
          },
          {
            slug: 'test',
            title: 'Generate Tests',
            description: 'Generate unit test cases for a function or module with edge case coverage.',
            modelKey: 'test',
            category: 'Generation',
            placeholder: 'Paste the function or module to generate tests for...',
          },
          {
            slug: 'refactor',
            title: 'Refactor',
            description: 'Improve code structure, readability, and maintainability without changing behavior.',
            modelKey: 'refactor',
            category: 'Generation',
            placeholder: 'Paste the code you want refactored...',
          },
          {
            slug: 'commit',
            title: 'Commit Message',
            description: 'Generate a conventional commit message from a diff or change summary.',
            modelKey: 'commit',
            category: 'Generation',
            placeholder: 'Paste your git diff or describe the changes...',
          },
          {
            slug: 'docstring',
            title: 'Docstring',
            description: 'Add or improve docstrings/JSDoc comments for functions and classes.',
            modelKey: 'docstring',
            category: 'Generation',
            placeholder: 'Paste the function or class to document...',
          },
          {
            slug: 'naming',
            title: 'Naming',
            description: 'Suggest clearer variable, function, and class names based on context.',
            modelKey: 'naming',
            category: 'Analysis',
            placeholder: 'Paste the code with naming issues...',
          },
          {
            slug: 'dead-code',
            title: 'Dead Code',
            description: 'Identify unreachable or unused code blocks that can be safely removed.',
            modelKey: 'deadCode',
            category: 'Analysis',
            placeholder: 'Paste the module or file to analyze for dead code...',
          },
          {
            slug: 'type-hints',
            title: 'Type Hints',
            description: 'Add or improve TypeScript/Python type annotations throughout a codebase.',
            modelKey: 'typeHints',
            category: 'Generation',
            placeholder: 'Paste the untyped or partially typed code...',
          },
          {
            slug: 'performance-hint',
            title: 'Performance Hint',
            description: 'Identify bottlenecks and suggest algorithmic or structural improvements.',
            modelKey: 'performanceHint',
            category: 'Analysis',
            placeholder: 'Paste the code you want performance-reviewed...',
          },
        ]
    },
  },
])
//# sourceMappingURL=430-24b899266302743c.js.map
