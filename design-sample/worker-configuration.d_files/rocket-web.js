!(function () {
  let e = !1,
    t = !1,
    n = !1
  try {
    ;((e = !window.ReactNativeWebView && window.self === window.top),
      (t =
        window.self?.location?.host &&
        (window.self.location.host.includes('.netlify.app') ||
          window.self.location.host.includes('.public.builtwithrocket.new') ||
          !window.self.location.host.includes('localhost:'))),
      (n = navigator?.userAgent?.includes('Puppeteer')))
  } catch (M) {}
  let o = '',
    r = ''
  try {
    const C = (function () {
        const e = document.getElementsByTagName('script')
        for (let t of e) if (t.src.includes('rocket-web.js')) return t.src
        return null
      })(),
      P = new URL(C),
      B = new URLSearchParams(P?.search)
    ;((o = B.get('_cfg') || ''), (r = B.get('_be') || ''))
  } catch (H) {}
  try {
    'true' === new URLSearchParams(window.location.search).get('rk_owner') &&
      window?.localStorage?.setItem('rk_owner', 'true')
  } catch (k) {}
  function i(e) {
    try {
      return window?.localStorage?.getItem(e)
    } catch (e) {
      return null
    }
  }
  function a(e, t) {
    try {
      return (window?.localStorage?.setItem(e, t), !0)
    } catch (e) {
      return !1
    }
  }
  function s() {
    try {
      return Object.fromEntries(new URLSearchParams(window.location.search))
    } catch (e) {
      return {}
    }
  }
  function c() {
    try {
      return navigator.languages && navigator.languages.length
        ? navigator.languages[0]
        : navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en'
    } catch (e) {
      return 'en'
    }
  }
  function d(t) {
    e ||
      n ||
      fetch(`${o}/log-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      }).catch((e) => {})
  }
  function l(t) {
    e ||
      n ||
      fetch(`${o}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      }).catch((e) => {})
  }
  function u(o) {
    if (e && t && !n) {
      const e = (function () {
          const e = 'rk_visitor_id'
          let t = i(e)
          try {
            t || ((t = `${Date.now()}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`), a(e, t))
          } catch (e) {}
          return t || ''
        })(),
        t = (function () {
          const e = 'rk_session_id'
          try {
            let t = (function (e) {
              try {
                const t = `; ${document.cookie}`.split(`; ${e}=`)
                return 2 === t.length ? t.pop().split(';').shift() : null
              } catch (e) {
                return null
              }
            })(e)
            const n = (function () {
              try {
                return window.location.host.split(':')[0]
              } catch (e) {
                return null
              }
            })()
            return (
              t || (t = `${Date.now()}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`),
              (function (e, t, n, o) {
                try {
                  const n = new Date()
                  n.setTime(n.getTime() + 18e5)
                  const r = `expires=${n.toUTCString()}`,
                    i = o ? `; domain=${o}` : ''
                  return ((document.cookie = `${e}=${t}; ${r}${i}; path=/; Secure; SameSite=Lax`), !0)
                } catch (e) {
                  return !1
                }
              })(e, t, 0, n),
              t
            )
          } catch (e) {
            return ''
          }
        })(),
        n = (function () {
          const e = 'rk_owner'
          try {
            if ('true' === new URLSearchParams(window.location.search).get('rk_owner')) return (a(e, 'true'), !0)
          } catch (e) {}
          return 'true' === i(e)
        })()
      !(function (e, t) {
        if (!r) return
        const n = { ...e }
        fetch(`${r}/preview/v1/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n),
        })
          .then((e) => {
            if (!e.ok) throw new Error('Bad response')
            return e.json()
          })
          .then((e) => {
            t(e)
          })
          .catch((e) => {})
      })(
        {
          event: 'Public Preview Viewed',
          baseUrl: window.location.origin,
          previewUrl: window.location.href,
          visitorId: e,
          sessionId: t,
          queryParams: s(),
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          referrer: document.referrer,
          userAgent: window.navigator.userAgent,
          locale: c(),
          ...(n && { isOwner: n }),
        },
        (e) => {
          'function' == typeof o && e?.isPublic && o()
        },
      )
    }
  }
  function m() {
    e || window.parent.postMessage({ type: 'WEB_IFRAME_PATHNAME_CHANGE', pathname: window.location.pathname }, '*')
  }
  function p() {
    e || window.parent.postMessage({ type: 'WEB_IFRAME_DOCUMENT_LOADED' }, '*')
  }
  ;(e || window.parent.postMessage({ type: 'WEB_IFRAME_LOADING' }, '*'), m())
  try {
    const G = new WeakSet()
    function h(e = document) {
      try {
        const t = window?.next
        if (!t) return
        ;(e.querySelectorAll?.('[class*="nextjs-toast-errors-parent"]').forEach((e) => {
          try {
            e.isConnected &&
              ((e.style.display = 'none'),
              (e.style.visibility = 'hidden'),
              (e.style.opacity = '0'),
              (e.style.pointerEvents = 'none'))
          } catch (e) {}
        }),
          e.querySelectorAll?.('*').forEach((e) => {
            e.shadowRoot && h(e.shadowRoot)
          }))
      } catch (e) {}
    }
    function g(e = document) {
      try {
        e.querySelectorAll?.('*').forEach((e) => {
          e.shadowRoot &&
            !G.has(e.shadowRoot) &&
            (G.add(e.shadowRoot), $.observe(e.shadowRoot, { childList: !0, subtree: !0 }), g(e.shadowRoot))
        })
      } catch (e) {}
    }
    const $ = new MutationObserver((e) => {
        ;(h(),
          e.forEach((e) => {
            e.addedNodes.forEach((e) => {
              e.nodeType === Node.ELEMENT_NODE &&
                (e.shadowRoot &&
                  !G.has(e.shadowRoot) &&
                  (G.add(e.shadowRoot), $.observe(e.shadowRoot, { childList: !0, subtree: !0 }), g(e.shadowRoot)),
                g(e))
            })
          }))
      }),
      U = () => {
        try {
          document.documentElement && ($.observe(document.documentElement, { childList: !0, subtree: !0 }), g())
        } catch (e) {}
      }
    ;(document.addEventListener('load', () => {
      ;(h(), U())
    }),
      document.addEventListener('readystatechange', () => {
        ;('complete' !== document.readyState && 'interactive' !== document.readyState) || (h(), U())
      }))
  } catch (W) {}
  function f() {
    try {
      const e = document.createElement('link')
      ;((e.rel = 'stylesheet'),
        (e.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap'),
        document.head.appendChild(e))
      const t = document.createElement('div')
      ;((t.style.position = 'fixed'),
        (t.style.right = '0'),
        (t.style.bottom = '0'),
        (t.style.zIndex = '100000'),
        (t.style.transform = 'scale(0.7)'),
        (t.style.display = 'block'),
        (t.style.cursor = 'pointer'),
        (t.onclick = () => window.open('https://www.rocket.new', '_blank')),
        (t.innerHTML =
          '\n          <div style="\n            border-radius: 6px;\n            background: #fff;\n            box-shadow: 0px 0px 20px 2px rgba(0, 0, 0, 0.20);\n            display: flex;\n            padding: 4px;\n            justify-content: center;\n            align-items: center;\n            gap: 8px;\n            flex-direction: column;\n          ">\n            <div style="\n              border: 2px solid #000;\n              border-radius: 6px;\n              display: flex;\n              flex-direction: column;\n              padding: 10px;\n            ">\n              <img src="https://strapi.rocket.new/uploads/rocket_mono_e0dedcb10b.png" style="\n                width: 30px;\n                margin: auto auto 8px auto;\n              ">\n              <h3 style="\n                text-align: center;\n                font-family: Inter, sans-serif;\n                font-size: 12px;\n                font-style: normal;\n                font-weight: 500;\n                line-height: 20px;\n                color: #777777;\n                margin: 0;\n              ">Built with</h3>\n              <h3 style="\n                font-family: Inter, sans-serif;\n                font-size: 14px;\n                font-style: normal;\n                font-weight: 500;\n                line-height: 20px;\n                color: #000;\n                margin-top: -4px;\n                margin-bottom: 0;\n              ">Rocket.new</h3>\n            </div>\n          </div>\n        '),
        document.body.appendChild(t))
    } catch (e) {}
  }
  if (
    (document.addEventListener('DOMContentLoaded', () => {
      ;(p(), u(f))
    }),
    document.addEventListener('readystatechange', () => {
      'complete' === document.readyState && p()
    }),
    window.history && window.history.pushState)
  ) {
    const q = window.history.pushState
    window.history.pushState = function () {
      ;(q.apply(this, arguments), m(), u())
    }
    const F = window.history.replaceState
    ;((window.history.replaceState = function () {
      ;(F.apply(this, arguments), m(), u())
    }),
      window.addEventListener('popstate', function () {
        ;(m(), u())
      }))
  }
  ;(window.addEventListener('hashchange', function () {
    ;(m(), u())
  }),
    (window.__COMPONENT_ERROR__ = function (e, t) {
      let n = e?.stack || null,
        o = !1
      n && n.includes(e.message) && (o = !0)
      let r = n ? (o ? n : `${e.message}\n\n${n}`) : e.message
      ;(t.componentStack && (r += t.componentStack),
        d({ errorType: 'RUNTIME_ERROR', message: r, timestamp: new Date().toISOString() }))
    }),
    (window.onerror = function (e, t, n, o, r) {
      const i = r?.stack || null,
        a = i ? `${e}\n\n${i}` : e
      ;(l({ type: 'CONSOLE_ERROR', message: a, timestamp: new Date().toISOString(), url: window.location.href }),
        d({ errorType: 'RUNTIME_ERROR', message: a, timestamp: new Date().toISOString() }))
    }),
    (window.onunhandledrejection = function (e) {
      const t = e.reason?.message || String(e.reason),
        n = e.reason?.stack || null,
        o = n ? `${t}\n\n${n}` : t
      ;(l({ type: 'CONSOLE_ERROR', message: o, timestamp: new Date().toISOString(), url: window.location.href }),
        d({ errorType: 'RUNTIME_ERROR', message: o, timestamp: new Date().toISOString() }))
    }))
  const w = console.error,
    y = console.log,
    E = console.warn,
    b = console.info,
    v = console.debug
  function T(e) {
    return e
      ?.map((e) => {
        if (e instanceof Error) {
          const t = e?.stack || null
          return t ? `${e.message}\n\n${t}` : e.message
        }
        return e instanceof HTMLElement
          ? e.outerHTML
          : 'object' == typeof e && null !== e
            ? JSON.stringify(e, null, 2)
            : String(e)
      })
      .join(' ')
  }
  ;((console.error = function (...e) {
    setTimeout(() => {
      const t = e.some((e) => !0 === e.__ErrorBoundary)
      ;(l({ type: 'CONSOLE_ERROR', message: T(e), timestamp: new Date().toISOString(), url: window.location.href }),
        t || d({ errorType: 'RUNTIME_ERROR', message: T(e), timestamp: new Date().toISOString() }),
        w.apply(console, e))
    }, 100)
  }),
    (console.log = function (...e) {
      ;(l({ type: 'CONSOLE_LOG', message: T(e), timestamp: new Date().toISOString(), url: window.location.href }),
        y.apply(console, e))
    }),
    (console.warn = function (...e) {
      ;(l({ type: 'CONSOLE_WARN', message: T(e), timestamp: new Date().toISOString(), url: window.location.href }),
        E.apply(console, e))
    }),
    (console.info = function (...e) {
      ;(l({ type: 'CONSOLE_INFO', message: T(e), timestamp: new Date().toISOString(), url: window.location.href }),
        b.apply(console, e))
    }),
    (console.debug = function (...e) {
      ;(l({ type: 'CONSOLE_DEBUG', message: T(e), timestamp: new Date().toISOString(), url: window.location.href }),
        v.apply(console, e))
    }))
  let S = null,
    O = null
  const R = {
    MARGIN_TOP: 'margin-top',
    MARGIN_RIGHT: 'margin-right',
    MARGIN_BOTTOM: 'margin-bottom',
    MARGIN_LEFT: 'margin-left',
    PADDING_TOP: 'padding-top',
    PADDING_RIGHT: 'padding-right',
    PADDING_BOTTOM: 'padding-bottom',
    PADDING_LEFT: 'padding-left',
    BACKGROUND_COLOR: 'background-color',
    BORDER_RADIUS_TOP_LEFT: 'border-top-left-radius',
    BORDER_RADIUS_TOP_RIGHT: 'border-top-right-radius',
    BORDER_RADIUS_BOTTOM_RIGHT: 'border-bottom-right-radius',
    BORDER_RADIUS_BOTTOM_LEFT: 'border-bottom-left-radius',
    FONT_SIZE: 'font-size',
    FONT_WEIGHT: 'font-weight',
    TEXT_ALIGN: 'text-align',
    TEXT_COLOR: 'color',
    LINE_HEIGHT: 'line-height',
    TEXT_TRANSFORM: 'text-transform',
    LETTER_SPACING: 'letter-spacing',
    BORDER_STYLE: 'border-style',
    BORDER_COLOR: 'border-color',
    BORDER_RIGHT_WIDTH: 'border-right-width',
    BORDER_BOTTOM_WIDTH: 'border-bottom-width',
    BORDER_LEFT_WIDTH: 'border-left-width',
    BORDER_TOP_WIDTH: 'border-top-width',
    TEXT_CONTENT: 'text-content',
    OBJECT_FIT: 'object-fit',
    IMAGE_SRC: 'image-src',
    DISPLAY: 'display',
    FLEX_DIRECTION: 'flex-direction',
    JUSTIFY_CONTENT: 'justify-content',
    ALIGN_ITEMS: 'align-items',
    GRID_TEMPLATE_COLUMNS: 'grid-template-columns',
    GRID_TEMPLATE_ROWS: 'grid-template-rows',
    GRID_COLUMN_GAP: 'grid-column-gap',
    GRID_ROW_GAP: 'grid-row-gap',
    PLACE_ITEMS: 'place-items',
    FLEX_GAP: 'gap',
  }
  function _() {
    if (O)
      try {
        O.abort()
      } catch (e) {
      } finally {
        O = null
      }
  }
  function L(e) {
    if (!e) return !1
    const t = e.tagName?.toLowerCase?.()
    return 'input' === t || 'textarea' === t || 'select' === t
  }
  function I(e) {
    const t = e.target
    t && t instanceof HTMLElement && L(t) && e.preventDefault()
  }
  function N(e) {
    const t = e.target
    t &&
      t instanceof HTMLElement &&
      L(t) &&
      (e.preventDefault(), e.stopPropagation(), 'function' == typeof t.blur && t.blur())
  }
  function x(e) {
    ;(e.stopPropagation(), e.preventDefault())
    const t = e.target
    if (!t.ownerSVGElement && 'BODY' !== t.tagName && 'HTML' !== t.tagName) {
      const e = t.dataset.componentId
      e &&
        document.querySelectorAll(`[data-component-id="${e}"]`).forEach((e) => {
          e.setAttribute('data-component-hovered', 'true')
        })
      const n = t.getBoundingClientRect(),
        o = document.getElementById('highlighter')
      o &&
        ((o.style.display = 'block'),
        (o.innerText = t.tagName?.toLowerCase()),
        (function (e, t) {
          try {
            if (!e || !t) return
            const n = window.innerWidth || document.documentElement.clientWidth || 0,
              o = window.innerHeight || document.documentElement.clientHeight || 0
            if (n <= 0 || o <= 0) return
            ;((e.style.top = '-9999px'), (e.style.left = '-9999px'), e.offsetHeight)
            const r = e.getBoundingClientRect(),
              i = r.height || 0,
              a = r.width || 0
            if (i <= 0 || a <= 0) return
            const s = t.top || 0,
              c = o - (t.bottom || 0),
              d = (t.left, 5),
              l = 2
            let u
            ;((u = s >= i + d ? t.top - i - d : c >= i + l ? t.bottom + l : Math.max(5, t.top || 0)),
              (u = Math.max(0, u)))
            let m = t.left || 0
            ;(m + a > n && (m = Math.max(5, n - a - 5)),
              m < 0 && (m = 5),
              (m = Math.max(0, m)),
              (e.style.top = `${u}px`),
              (e.style.left = `${m}px`))
          } catch (e) {}
        })(o, n))
    }
  }
  function A(e) {
    ;(e.stopPropagation(), e.preventDefault())
    const t = document.getElementById('highlighter')
    t && (t.style.display = 'none')
    const n = e.target.dataset?.componentId
    n
      ? document.querySelectorAll(`[data-component-id="${n}"]`).forEach((e) => {
          e.removeAttribute('data-component-hovered')
        })
      : e.target.removeAttribute('data-component-hovered')
  }
  function D(e) {
    const { target: t } = e
    ;(function (e) {
      if (!e) return !1
      const t = e.closest('nav'),
        n = e.closest('[role="tablist"]'),
        o = e.closest('[role="tab"]'),
        r = 'BUTTON' === e.tagName
      return !(!(t || n || o) || !r)
    })(t) || (e.preventDefault(), e.stopPropagation())
    const n = (function (e) {
      if (!e) return {}
      const t = window.getComputedStyle(e),
        n = {}
      return (
        Object.keys(R).forEach((e) => {
          n[R[e]] = t.getPropertyValue(R[e])
        }),
        n
      )
    })(t)
    ;(document.querySelectorAll('[data-component-selected="true"]').forEach((e) => {
      e.removeAttribute('data-component-selected')
    }),
      document.querySelectorAll('[data-component-active="true"]').forEach((e) => {
        e.removeAttribute('data-component-active')
      }))
    const o = t.dataset.componentId
    o &&
      (document.querySelectorAll(`[data-component-id="${o}"]`).forEach((e) => {
        e.setAttribute('data-component-selected', 'true')
      }),
      t.setAttribute('data-component-active', 'true'))
    const r = (function (e) {
        if (!e) return !1
        if (!e.innerText?.trim() && !e.textContent?.trim()) return !1
        if (
          [
            'P',
            'H1',
            'H2',
            'H3',
            'H4',
            'H5',
            'H6',
            'SPAN',
            'A',
            'BUTTON',
            'LABEL',
            'LI',
            'TD',
            'TH',
            'BLOCKQUOTE',
            'FIGCAPTION',
            'CAPTION',
          ].includes(e.tagName)
        )
          return !0
        const t = ['SPAN', 'STRONG', 'EM', 'B', 'I', 'U', 'MARK', 'SMALL', 'SUB', 'SUP', 'CODE', 'A', 'BR'],
          n = Array.from(e.children)
        if (0 === n.length && e.childNodes.length > 0) return !0
        if (n.length > 0) {
          if (n.every((e) => t.includes(e.tagName))) return !0
          if (Array.from(e.childNodes).some((e) => e.nodeType === Node.TEXT_NODE && e.textContent.trim())) return !0
        }
        return !1
      })(t),
      i = t instanceof HTMLImageElement
    S = o
    const a = t.dataset?.componentLine ?? '0',
      s = t.dataset?.componentEndLine ?? '0',
      c = Number(a),
      d = Number(s),
      l = o ? document.querySelectorAll(`[data-component-id="${o}"]`).length : 1,
      u = {
        filePath: t.dataset?.componentPath ?? '',
        lineNumber: Number.isNaN(c) ? 0 : c,
        ...(!Number.isNaN(d) && { endLineNumber: d }),
        content: t.dataset?.componentContent ?? '',
        elementName: t.tagName?.toLocaleLowerCase() ?? '',
        componentId: o ?? '',
        componentName: t.dataset?.componentName ?? '',
        componentInstances: l,
      },
      m = { styles: n, browserClassNames: t.className?.trim?.() || '', metaData: u }
    if (r) {
      const n = t.childNodes.length > 1
      Object.assign(m, { textData: { textContent: e.target?.innerText ?? '', isCompositeText: n } })
    }
    if (i) {
      const e = null !== t.closest('picture')
      Object.assign(m, { imageData: { imageSrc: t.src ?? '', imageAlt: t.alt ?? '', isImgInsidePictureElement: e } })
    }
    window.parent.postMessage({ type: 'SET_INITIAL_DATA', payload: m }, '*')
  }
  ;(window.addEventListener('message', function (e) {
    try {
      const t = 'string' == typeof e.data ? JSON.parse(e.data) : e.data
      if (
        ('SET_EDIT_MODE' === t.type && window.toggleEditMode(t.payload),
        'NAVIGATION_REQUEST' === t.type &&
          (window?.next && window.next?.router
            ? window.next.router.push(t.url)
            : (history.pushState({}, '', t.url), window.dispatchEvent(new PopStateEvent('popstate')))),
        !S)
      )
        return
      if ('UPDATE_STYLES' === t.type) {
        const e = t.payload
        document.querySelectorAll(`[data-component-id="${S}"]`).forEach((t) => {
          Object.assign(t.style, e)
        })
      }
      if ('UPDATE_TEXT' === t.type) {
        const e = t.payload?.textContent
        if ('string' == typeof e) {
          const t = document.querySelector(`[data-component-id="${S}"][data-component-active="true"]`)
          t && (t.innerText = e)
        }
      }
      if ('UPDATE_IMAGE_SRC' === t.type) {
        const e = t.payload?.imageSrc,
          n = t.payload?.isImgInsidePictureElement ?? !1
        if ('string' == typeof e) {
          const t = document.querySelector(`[data-component-id="${S}"][data-component-active="true"]`)
          if (t) {
            if (n && t.closest('picture')) {
              t.closest('picture')
                .querySelectorAll('source')
                .forEach((t) => {
                  ;(t.hasAttribute('srcset') && (t.srcset = e), t.hasAttribute('src') && (t.src = e))
                })
            }
            t instanceof HTMLImageElement && (t.src = e)
          }
        }
      }
      if ('UPDATE_CLASSNAMES' === t.type) {
        const e = t.payload
        'string' == typeof e?.classNames &&
          document.querySelectorAll(`[data-component-id="${S}"]`).forEach((t) => {
            t.className = e.classNames
          })
      }
      'DELETE_ELEMENT' === t.type &&
        document.querySelectorAll(`[data-component-id="${S}"]`).forEach((e) => {
          e.remove()
        })
    } catch (e) {}
  }),
    (window.toggleEditMode = function (e) {
      e
        ? (function () {
            _()
            try {
              O = new AbortController()
              const e = O.signal
              ;((function () {
                if (
                  ((function () {
                    const e = document.createElement('style')
                    e.innerHTML =
                      '\n            #highlighter {\n                position: fixed;\n                z-index: 10000;\n                pointer-events: none;\n                background-color: #0da2e7;\n                color: white;\n                padding: 4px 8px;\n                border-radius: 4px;\n                font-size: 14px;\n                font-weight: bold;\n                line-height: 1;\n                white-space: nowrap;\n                display: none;\n                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\n                transition: opacity 0.2s ease-in-out;\n                margin: 0;\n            }\n            /* Highlight styling for hovered components */\n            [data-component-hovered] {\n                position: relative;\n            }\n            [data-component-hovered]::before {\n                content: \'\';\n                position: absolute;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                border-radius: 0px;\n                border: 1px dashed #0da2e7 !important;\n                box-sizing: border-box;\n                z-index: 10000;\n                pointer-events: none;\n            }\n            /* Highlight styling for selected components */\n            [data-component-selected] {\n                position: relative;\n            }\n            [data-component-selected]::before {\n                content: \'\';\n                position: absolute;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                border-radius: 0px;\n                border: 1px dashed #0da2e7 !important;\n                box-sizing: border-box;\n                z-index: 10000;\n                pointer-events: none;\n            }\n            /* Direct border styling for form controls and media elements that don\'t support pseudo-elements */\n            :is(input, img, textarea, select, video, audio, iframe, canvas, svg)[data-component-hovered] {\n                border: 1px dashed #0da2e7 !important;\n                box-sizing: border-box;\n            }\n            :is(input, img, textarea, select, video, audio, iframe, canvas, svg)[data-component-selected] {\n                border: 1px dashed #0da2e7 !important;\n                box-sizing: border-box;\n            }\n            /* Disable border on editable content to prevent visual conflicts */\n            [data-component-selected][contenteditable] {\n                border: none !important;\n            }\n            /* Handle elements that are clipped by parent overflow containers */\n            :is([class*="overflow-hidden"], [class*="overflow-clip"]) > :is(img, video, iframe, canvas):is([data-component-hovered], [data-component-selected]) {\n                border: none !important;\n            }\n            /* Style the overflow container parent when it contains highlighted media elements */\n            :is([class*="overflow-hidden"], [class*="overflow-clip"]):has(> :is(img, video, iframe, canvas)[data-component-hovered]) {\n                border: 1px dashed #0da2e7 !important;\n                box-sizing: border-box;\n            }\n            :is([class*="overflow-hidden"], [class*="overflow-clip"]):has(> :is(img, video, iframe, canvas)[data-component-selected]) {\n                border: 1px dashed #0da2e7 !important;\n                box-sizing: border-box;\n            }\n        '
                    const t = document.head.querySelectorAll('link[rel="stylesheet"]')
                    if (t.length > 0) document.head.insertBefore(e, t[0])
                    else {
                      const t = document.head.querySelectorAll('style')
                      t.length > 0 ? document.head.insertBefore(e, t[0]) : document.head.appendChild(e)
                    }
                  })(),
                  !document.getElementById('highlighter'))
                ) {
                  const e = document.createElement('div')
                  e.id = 'highlighter'
                  const t = document.body || document.getElementsByTagName('body')[0]
                  t && t.appendChild(e)
                }
              })(),
                document.addEventListener('mouseover', x, { capture: !0, signal: e }),
                document.addEventListener('mouseout', A, { capture: !0, signal: e }),
                document.addEventListener('click', D, { capture: !0, signal: e }),
                document.addEventListener('mousedown', N, { capture: !0, signal: e }),
                document.addEventListener('focusin', N, { capture: !0, signal: e }),
                document.addEventListener('beforeinput', I, { capture: !0, signal: e }),
                document.addEventListener('keydown', I, { capture: !0, signal: e }),
                document.addEventListener('paste', I, { capture: !0, signal: e }))
            } catch (e) {}
          })()
        : _()
    }),
    (function () {
      const t = (t, o) => {
          try {
            if (e || n) return
            const r = ((e, t) => {
              try {
                const n = e === window || e === document || e === document.documentElement,
                  o = window.innerWidth || document.documentElement.clientWidth,
                  r = window.innerHeight || document.documentElement.clientHeight,
                  i = window.scrollX,
                  a = window.scrollY
                let s = null
                if (t) {
                  const o = t.clientX || t.touches?.[0]?.clientX,
                    r = t.clientY || t.touches?.[0]?.clientY
                  if (
                    void 0 !== o &&
                    void 0 !== r &&
                    ((s = {
                      viewport: { x: Math.round(o), y: Math.round(r) },
                      page: { x: Math.round(o + i), y: Math.round(r + a) },
                    }),
                    !n && e?.getBoundingClientRect)
                  ) {
                    const t = e.getBoundingClientRect()
                    s.element = { x: Math.round(o - t.left), y: Math.round(r - t.top) }
                  }
                }
                if (n)
                  return {
                    tag: 'document',
                    id: '',
                    position: { x: i, y: a, width: o, height: r },
                    viewport: { width: o, height: r },
                    scroll: { x: i, y: a },
                    mouse: s,
                  }
                if (!e?.getBoundingClientRect) return null
                const c = e.getBoundingClientRect()
                return {
                  tag: e.tagName?.toLowerCase() || '',
                  id: e.id || '',
                  position: {
                    x: Math.round(c.left + i),
                    y: Math.round(c.top + a),
                    width: Math.round(c.width),
                    height: Math.round(c.height),
                  },
                  viewport: { width: o, height: r },
                  scroll: { x: i, y: a },
                  mouse: s,
                }
              } catch (e) {
                return null
              }
            })(o.target || o.srcElement, o)
            if (!r) return
            const i = { eventType: t, timestamp: new Date().toISOString(), element: r, page: window.location.pathname }
            window.parent.postMessage({ type: 'USER_INTERACTION', payload: i }, '*')
          } catch (e) {}
        },
        o = (() => {
          let e
          return function (...n) {
            ;(clearTimeout(e),
              (e = setTimeout(() => {
                ;(clearTimeout(e),
                  ((e) => {
                    t('mousemove', e)
                  })(...n))
              }, 10)))
          }
        })()
      ;(document.addEventListener('mousemove', o),
        document.addEventListener('click', (e) => t('click', e)),
        document.addEventListener('dblclick', (e) => t('dblclick', e)),
        document.addEventListener('mouseenter', (e) => t('mouseenter', e)),
        document.addEventListener('mouseleave', (e) => t('mouseleave', e)),
        document.addEventListener('touchstart', (e) => t('touchstart', e)),
        document.addEventListener('touchmove', (e) => t('touchmove', e)),
        document.addEventListener('touchend', (e) => t('touchend', e)),
        document.addEventListener('keydown', (e) => t('keydown', e)))
      const r = ['input', 'textarea', 'select', 'button', '[contenteditable="true"]']
      ;(document.addEventListener('focusin', (e) => {
        r.some((t) => e.target.matches(t)) && t('focus', e)
      }),
        document.addEventListener('focusout', (e) => {
          r.some((t) => e.target.matches(t)) && t('blur', e)
        }))
      const i = (e) => (n) => {
          var o
          ;(o = n.target) &&
            (o === document ||
              o === document.documentElement ||
              o === window ||
              o.scrollHeight > o.clientHeight ||
              o.scrollWidth > o.clientWidth) &&
            t(e, n)
        },
        a = i('scroll'),
        s = i('scrollend'),
        c = () => {
          try {
            ;(window.addEventListener('scroll', a, { passive: !0 }),
              window.addEventListener('scrollend', s, { passive: !0 }),
              document.querySelectorAll('*').forEach((e) => {
                ;(e.scrollHeight > e.clientHeight || e.scrollWidth > e.clientWidth) &&
                  (e.addEventListener('scroll', a, { passive: !0 }),
                  e.addEventListener('scrollend', s, { passive: !0 }))
              }))
          } catch (e) {}
        }
      c()
      const d = new MutationObserver(() => {
          c()
        }),
        l = () => {
          document.body && d.observe(document.body, { childList: !0, subtree: !0 })
        }
      document.body
        ? l()
        : (document.addEventListener('DOMContentLoaded', l),
          document.addEventListener('readystatechange', () => {
            'complete' === document.readyState && l()
          }))
    })())
})()
