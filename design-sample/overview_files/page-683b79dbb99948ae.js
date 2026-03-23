;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [553],
  {
    2581: (e, s, r) => {
      Promise.resolve().then(r.bind(r, 8816))
    },
    8816: (e, s, r) => {
      'use strict'
      r.d(s, { default: () => x })
      var t = r(5155),
        o = r(2115),
        a = r(8173),
        l = r.n(a),
        d = r(6046),
        n = r(9345),
        i = r(7268),
        c = r(6825),
        m = r(7581)
      function x() {
        let [e, s] = (0, o.useState)(!1),
          [r, a] = (0, o.useState)(m.p9),
          x = (0, d.useRouter)()
        ;(0, o.useEffect)(() => {
          try {
            let e = localStorage.getItem(m.x4)
            e && a(JSON.parse(e))
          } catch (e) {
            a(m.p9)
          }
        }, [e])
        let u = m.n3.filter((e) => 'Analysis' === e.category),
          p = m.n3.filter((e) => 'Generation' === e.category)
        return (0, t.jsx)(c.N, {
          children: (0, t.jsxs)('div', {
            className: 'min-h-screen bg-background text-foreground',
            children: [
              (0, t.jsx)(n.A, { onOpenModelConfig: () => s(!0) }),
              (0, t.jsx)(i.A, { open: e, onClose: () => s(!1) }),
              (0, t.jsxs)('main', {
                children: [
                  (0, t.jsxs)('section', {
                    className: 'relative overflow-hidden border-b border-border/60',
                    children: [
                      (0, t.jsx)('div', {
                        className:
                          'pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl',
                        'aria-hidden': 'true',
                      }),
                      (0, t.jsx)('div', {
                        className:
                          'pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl',
                        'aria-hidden': 'true',
                      }),
                      (0, t.jsx)('div', {
                        className: 'relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24',
                        children: (0, t.jsxs)('div', {
                          className: 'grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center',
                          children: [
                            (0, t.jsxs)('div', {
                              className: 'space-y-6',
                              children: [
                                (0, t.jsxs)('span', {
                                  className:
                                    'inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono-code text-xs font-medium text-primary',
                                  children: [
                                    (0, t.jsx)('span', {
                                      className: 'h-1.5 w-1.5 rounded-full bg-primary animate-pulse-subtle',
                                    }),
                                    'Local-first \xb7 Ollama-powered \xb7 Zero cloud cost',
                                  ],
                                }),
                                (0, t.jsxs)('h1', {
                                  className:
                                    'text-3xl font-bold tracking-tight text-foreground md:text-4xl xl:text-5xl text-balance leading-tight',
                                  children: [
                                    'Route coding tasks to',
                                    ' ',
                                    (0, t.jsx)('span', {
                                      className: 'text-primary',
                                      children: 'specialist local LLMs',
                                    }),
                                  ],
                                }),
                                (0, t.jsx)('p', {
                                  className: 'text-base text-muted-foreground leading-relaxed max-w-lg',
                                  children:
                                    'OllamaRouter surfaces 10 specialist AI coding workflows through a single routing layer. All inference runs locally via Ollama — no cloud API keys, no billing, no data exposure.',
                                }),
                                (0, t.jsxs)('div', {
                                  className: 'flex flex-wrap gap-3',
                                  children: [
                                    (0, t.jsx)('button', {
                                      onClick: () => x.push('/task-workspace'),
                                      className:
                                        'rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
                                      children: 'Open Task Workspace',
                                    }),
                                    (0, t.jsx)('a', {
                                      href: '#task-catalog',
                                      className:
                                        'rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                      children: 'Browse Task Catalog',
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            (0, t.jsxs)('div', {
                              className: 'rounded-xl border border-border bg-card p-5 shadow-sm',
                              children: [
                                (0, t.jsx)('p', {
                                  className:
                                    'font-mono-code text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4',
                                  children: 'Task Scope Summary',
                                }),
                                (0, t.jsxs)('div', {
                                  className: 'grid grid-cols-2 gap-3',
                                  children: [
                                    (0, t.jsxs)('div', {
                                      className: 'rounded-lg border border-border/60 bg-background p-3',
                                      children: [
                                        (0, t.jsx)('p', {
                                          className:
                                            'font-mono-code text-[10px] uppercase tracking-widest text-muted-foreground mb-2',
                                          children: 'Analysis',
                                        }),
                                        (0, t.jsx)('ul', {
                                          className: 'space-y-1',
                                          children: u.map((e) =>
                                            (0, t.jsxs)(
                                              'li',
                                              {
                                                className: 'flex items-center gap-1.5 text-xs text-foreground',
                                                children: [
                                                  (0, t.jsx)('span', {
                                                    className: 'h-1 w-1 rounded-full bg-primary shrink-0',
                                                  }),
                                                  e.title,
                                                ],
                                              },
                                              'scope-analysis-'.concat(e.slug),
                                            ),
                                          ),
                                        }),
                                      ],
                                    }),
                                    (0, t.jsxs)('div', {
                                      className: 'rounded-lg border border-border/60 bg-background p-3',
                                      children: [
                                        (0, t.jsx)('p', {
                                          className:
                                            'font-mono-code text-[10px] uppercase tracking-widest text-muted-foreground mb-2',
                                          children: 'Generation',
                                        }),
                                        (0, t.jsx)('ul', {
                                          className: 'space-y-1',
                                          children: p.map((e) =>
                                            (0, t.jsxs)(
                                              'li',
                                              {
                                                className: 'flex items-center gap-1.5 text-xs text-foreground',
                                                children: [
                                                  (0, t.jsx)('span', {
                                                    className: 'h-1 w-1 rounded-full bg-primary shrink-0',
                                                  }),
                                                  e.title,
                                                ],
                                              },
                                              'scope-generation-'.concat(e.slug),
                                            ),
                                          ),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                (0, t.jsx)('p', {
                                  className: 'mt-3 text-xs text-muted-foreground',
                                  children: 'Each task routes to a dedicated Ollama model — configurable per workflow.',
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                  (0, t.jsx)('section', {
                    className: 'border-b border-border/60',
                    children: (0, t.jsx)('div', {
                      className: 'mx-auto max-w-7xl px-4 py-8 md:px-6',
                      children: (0, t.jsx)('div', {
                        className: 'grid grid-cols-2 gap-4 lg:grid-cols-4',
                        children: [
                          { value: '10', label: 'Specialist Tasks', desc: 'Distinct AI coding workflows' },
                          { value: '3', label: 'Analyst Models', desc: 'Pre-routing intelligence options' },
                          { value: '12', label: 'Translation Targets', desc: 'Prose language destinations' },
                          { value: '$0', label: 'Cloud API Cost', desc: '100% local Ollama inference' },
                        ].map((e, s) =>
                          (0, t.jsxs)(
                            'div',
                            {
                              className: 'rounded-xl border border-border bg-card p-5 shadow-sm',
                              children: [
                                (0, t.jsx)('p', {
                                  className: 'font-mono-code text-3xl font-bold text-primary tabular-nums',
                                  children: e.value,
                                }),
                                (0, t.jsx)('p', {
                                  className: 'mt-1 text-sm font-semibold text-foreground',
                                  children: e.label,
                                }),
                                (0, t.jsx)('p', {
                                  className: 'mt-0.5 text-xs text-muted-foreground',
                                  children: e.desc,
                                }),
                              ],
                            },
                            'metric-'.concat(s),
                          ),
                        ),
                      }),
                    }),
                  }),
                  (0, t.jsx)('section', {
                    id: 'platform',
                    className: 'border-b border-border/60',
                    children: (0, t.jsxs)('div', {
                      className: 'mx-auto max-w-7xl px-4 py-14 md:px-6',
                      children: [
                        (0, t.jsxs)('div', {
                          className: 'mb-8',
                          children: [
                            (0, t.jsx)('h2', {
                              className: 'text-2xl font-bold text-foreground',
                              children: 'Platform Architecture',
                            }),
                            (0, t.jsx)('p', {
                              className: 'mt-1 text-sm text-muted-foreground',
                              children: 'How OllamaRouter routes, dispatches, and streams AI responses locally.',
                            }),
                          ],
                        }),
                        (0, t.jsx)('div', {
                          className: 'grid grid-cols-1 gap-4 md:grid-cols-3',
                          children: [
                            {
                              badge: 'Routing Intelligence',
                              title: 'Smart Task Dispatch',
                              desc: 'An analyst model pre-processes every input to determine the optimal specialist. No manual routing required — the router reads intent.',
                            },
                            {
                              badge: 'Specialist Models',
                              title: 'Dedicated Inference Lanes',
                              desc: 'Each coding task type routes to a separately configured Ollama model. Swap models per task without restarting the application.',
                            },
                            {
                              badge: 'Zero Cloud',
                              title: 'Fully Local Execution',
                              desc: 'All inference runs on your machine via Ollama. No tokens sent to external APIs. No billing. No rate limits. No data exposure.',
                            },
                          ].map((e, s) =>
                            (0, t.jsxs)(
                              'div',
                              {
                                className: 'rounded-xl border border-border bg-card p-6 shadow-sm',
                                children: [
                                  (0, t.jsx)('span', {
                                    className:
                                      'inline-block rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono-code text-[10px] font-semibold uppercase tracking-wider text-primary mb-4',
                                    children: e.badge,
                                  }),
                                  (0, t.jsx)('h3', {
                                    className: 'text-base font-semibold text-foreground mb-2',
                                    children: e.title,
                                  }),
                                  (0, t.jsx)('p', {
                                    className: 'text-sm text-muted-foreground leading-relaxed',
                                    children: e.desc,
                                  }),
                                ],
                              },
                              'arch-'.concat(s),
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
                  (0, t.jsx)('section', {
                    id: 'workflow',
                    className: 'border-b border-border/60',
                    children: (0, t.jsxs)('div', {
                      className: 'mx-auto max-w-7xl px-4 py-14 md:px-6',
                      children: [
                        (0, t.jsxs)('div', {
                          className: 'mb-8',
                          children: [
                            (0, t.jsx)('h2', {
                              className: 'text-2xl font-bold text-foreground',
                              children: 'Operational Workflow',
                            }),
                            (0, t.jsx)('p', {
                              className: 'mt-1 text-sm text-muted-foreground',
                              children: 'Five steps from input to streamed AI response.',
                            }),
                          ],
                        }),
                        (0, t.jsx)('div', {
                          className: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5',
                          children: [
                            {
                              num: '01',
                              title: 'Select Task',
                              desc: 'Choose from 10 specialist coding workflows in the task catalog.',
                            },
                            {
                              num: '02',
                              title: 'Compose Input',
                              desc: 'Paste your code, diff, or error message into the monospace composer.',
                            },
                            {
                              num: '03',
                              title: 'Route & Dispatch',
                              desc: 'The analyst model pre-processes your input and selects the specialist.',
                            },
                            {
                              num: '04',
                              title: 'Local Inference',
                              desc: 'Ollama runs the specialist model on your hardware — no cloud round-trip.',
                            },
                            {
                              num: '05',
                              title: 'Stream Output',
                              desc: 'Response streams token-by-token into the workspace with syntax highlighting.',
                            },
                          ].map((e, s) =>
                            (0, t.jsxs)(
                              'div',
                              {
                                className: 'rounded-xl border border-border bg-card p-5 shadow-sm',
                                children: [
                                  (0, t.jsx)('p', {
                                    className: 'font-mono-code text-2xl font-bold text-primary/40 mb-3',
                                    children: e.num,
                                  }),
                                  (0, t.jsx)('h3', {
                                    className: 'text-sm font-semibold text-foreground mb-1.5',
                                    children: e.title,
                                  }),
                                  (0, t.jsx)('p', {
                                    className: 'text-xs text-muted-foreground leading-relaxed',
                                    children: e.desc,
                                  }),
                                ],
                              },
                              'step-'.concat(e.num),
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
                  (0, t.jsx)('section', {
                    id: 'task-catalog',
                    className: 'border-b border-border/60',
                    children: (0, t.jsxs)('div', {
                      className: 'mx-auto max-w-7xl px-4 py-14 md:px-6',
                      children: [
                        (0, t.jsxs)('div', {
                          className: 'mb-8 flex items-start justify-between gap-4',
                          children: [
                            (0, t.jsxs)('div', {
                              children: [
                                (0, t.jsx)('h2', {
                                  className: 'text-2xl font-bold text-foreground',
                                  children: 'Task Catalog',
                                }),
                                (0, t.jsx)('p', {
                                  className: 'mt-1 text-sm text-muted-foreground',
                                  children:
                                    '10 specialist AI coding workflows, each routed to a dedicated local model.',
                                }),
                              ],
                            }),
                            (0, t.jsx)(l(), {
                              href: '/settings',
                              className:
                                'shrink-0 text-sm text-primary hover:underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                              children: 'Adjust model assignments →',
                            }),
                          ],
                        }),
                        (0, t.jsx)('div', {
                          className:
                            'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
                          children: m.n3.map((e) =>
                            (0, t.jsxs)(
                              l(),
                              {
                                href: '/task-workspace?task='.concat(e.slug),
                                className:
                                  'group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                children: [
                                  (0, t.jsxs)('div', {
                                    className: 'flex items-start justify-between gap-2 mb-3',
                                    children: [
                                      (0, t.jsx)('h3', {
                                        className:
                                          'text-sm font-semibold text-foreground group-hover:text-primary transition-colors',
                                        children: e.title,
                                      }),
                                      (0, t.jsx)('span', {
                                        className:
                                          'shrink-0 rounded-full px-2 py-0.5 font-mono-code text-[9px] font-semibold uppercase tracking-wider '.concat(
                                            'Analysis' === e.category
                                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                              : 'bg-primary/10 text-primary border border-primary/20',
                                          ),
                                        children: e.category,
                                      }),
                                    ],
                                  }),
                                  (0, t.jsx)('p', {
                                    className: 'text-xs text-muted-foreground leading-relaxed mb-4',
                                    children: e.description,
                                  }),
                                  (0, t.jsxs)('div', {
                                    className: 'flex items-center justify-between',
                                    children: [
                                      (0, t.jsx)('span', {
                                        className:
                                          'font-mono-code text-[10px] text-muted-foreground bg-muted rounded px-2 py-0.5 border border-border/60',
                                        children: r[e.modelKey],
                                      }),
                                      (0, t.jsx)('span', {
                                        className:
                                          'text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity',
                                        children: 'Open →',
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              'catalog-'.concat(e.slug),
                            ),
                          ),
                        }),
                      ],
                    }),
                  }),
                  (0, t.jsx)('section', {
                    children: (0, t.jsx)('div', {
                      className: 'mx-auto max-w-7xl px-4 py-14 md:px-6',
                      children: (0, t.jsxs)('div', {
                        className: 'rounded-2xl border border-border bg-muted/30 p-8',
                        children: [
                          (0, t.jsxs)('div', {
                            className: 'mb-6',
                            children: [
                              (0, t.jsx)('h2', {
                                className: 'text-xl font-bold text-foreground',
                                children: 'Project Snapshot',
                              }),
                              (0, t.jsx)('p', {
                                className: 'mt-1 text-sm text-muted-foreground',
                                children: 'Technical stack and architectural constraints at a glance.',
                              }),
                            ],
                          }),
                          (0, t.jsx)('div', {
                            className: 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4',
                            children: [
                              'Next.js 15 App Router',
                              'React 19 Client Islands',
                              'Ollama HTTP API',
                              'Tailwind CSS v4',
                              'localStorage config',
                              'Zero external APIs',
                              'Streaming responses',
                              'Per-task model assignment',
                            ].map((e) =>
                              (0, t.jsx)(
                                'div',
                                {
                                  className: 'rounded-lg border border-border/60 bg-card px-3 py-2',
                                  children: (0, t.jsx)('p', {
                                    className: 'font-mono-code text-xs text-foreground',
                                    children: e,
                                  }),
                                },
                                'snapshot-'.concat(e),
                              ),
                            ),
                          }),
                        ],
                      }),
                    }),
                  }),
                ],
              }),
              (0, t.jsx)('footer', {
                className: 'border-t border-border/60 py-8',
                children: (0, t.jsx)('div', {
                  className: 'mx-auto max-w-7xl px-4 md:px-6',
                  children: (0, t.jsxs)('div', {
                    className: 'flex flex-col items-center justify-between gap-3 sm:flex-row',
                    children: [
                      (0, t.jsxs)('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          (0, t.jsx)('div', {
                            className:
                              'flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground',
                            children: (0, t.jsx)('svg', {
                              width: '10',
                              height: '10',
                              viewBox: '0 0 16 16',
                              fill: 'none',
                              'aria-hidden': 'true',
                              children: (0, t.jsx)('path', {
                                d: 'M5 8l2 2 4-4',
                                stroke: 'currentColor',
                                strokeWidth: '1.5',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                              }),
                            }),
                          }),
                          (0, t.jsx)('span', {
                            className: 'font-mono-code text-xs font-semibold text-muted-foreground',
                            children: 'OllamaRouter',
                          }),
                        ],
                      }),
                      (0, t.jsx)('p', {
                        className: 'font-mono-code text-xs text-muted-foreground',
                        children: 'Local inference only \xb7 No cloud dependency \xb7 v0.1.0',
                      }),
                    ],
                  }),
                }),
              }),
            ],
          }),
        })
      }
    },
  },
  (e) => {
    var s = (s) => e((e.s = s))
    ;(e.O(0, [28, 430, 441, 517, 358], () => s(2581)), (_N_E = e.O()))
  },
])
//# sourceMappingURL=page-683b79dbb99948ae.js.map
