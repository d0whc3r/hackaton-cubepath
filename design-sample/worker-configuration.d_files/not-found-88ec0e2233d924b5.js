;(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [345],
  {
    674: (e, t, o) => {
      Promise.resolve().then(o.bind(o, 231))
    },
    231: (e, t, o) => {
      'use strict'
      ;(o.r(t), o.d(t, { default: () => l }))
      var r = o(5155)
      o(2115)
      var n = o(6046),
        s = o(4793),
        c = o(1581),
        i = o(1029)
      let a = function (e) {
        let {
            name: t,
            variant: o = 'outline',
            size: n = 24,
            className: a = '',
            onClick: l,
            disabled: d = !1,
            ...u
          } = e,
          x = ('solid' === o ? c : s)[t]
        return x
          ? (0, r.jsx)(x, {
              width: n,
              height: n,
              className: ''
                .concat(d ? 'opacity-50 cursor-not-allowed' : l ? 'cursor-pointer hover:opacity-80' : '', ' ')
                .concat(a),
              onClick: d ? void 0 : l,
              ...u,
            })
          : (0, r.jsx)(i.A, {
              width: n,
              height: n,
              className: 'text-gray-400 '.concat(d ? 'opacity-50 cursor-not-allowed' : '', ' ').concat(a),
              onClick: d ? void 0 : l,
              ...u,
            })
      }
      function l() {
        let e = (0, n.useRouter)()
        return (0, r.jsx)('div', {
          className: 'min-h-screen flex flex-col items-center justify-center bg-background p-4',
          children: (0, r.jsxs)('div', {
            className: 'text-center max-w-md',
            children: [
              (0, r.jsx)('div', {
                className: 'flex justify-center mb-6',
                children: (0, r.jsx)('div', {
                  className: 'relative',
                  children: (0, r.jsx)('h1', {
                    className: 'text-9xl font-bold text-primary opacity-20',
                    children: '404',
                  }),
                }),
              }),
              (0, r.jsx)('h2', {
                className: 'text-2xl font-medium text-onBackground mb-2',
                children: 'Page Not Found',
              }),
              (0, r.jsx)('p', {
                className: 'text-onBackground/70 mb-8',
                children: "The page you're looking for doesn't exist. Let's get you back!",
              }),
              (0, r.jsxs)('div', {
                className: 'flex flex-col sm:flex-row gap-4 justify-center',
                children: [
                  (0, r.jsxs)('button', {
                    onClick: () => {
                      var e
                      null === (e = window.history) || void 0 === e || e.back()
                    },
                    className:
                      'inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200',
                    children: [(0, r.jsx)(a, { name: 'ArrowLeftIcon', size: 16 }), 'Go Back'],
                  }),
                  (0, r.jsxs)('button', {
                    onClick: () => {
                      null == e || e.push('/')
                    },
                    className:
                      'inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-200',
                    children: [(0, r.jsx)(a, { name: 'HomeIcon', size: 16 }), 'Back to Home'],
                  }),
                ],
              }),
            ],
          }),
        })
      }
    },
  },
  (e) => {
    var t = (t) => e((e.s = t))
    ;(e.O(0, [558, 441, 517, 358], () => t(674)), (_N_E = e.O()))
  },
])
//# sourceMappingURL=not-found-88ec0e2233d924b5.js.map
