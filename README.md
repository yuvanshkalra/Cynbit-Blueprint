# Project Blueprint

An interactive project scoping tool prototype for [cynbit.in](https://www.cynbit.in/). A visitor chooses what they want built, how far along it is, what it needs and how fast, and gets an indicative budget range, timeline, team size, phase plan, suggested stack and risks. The result becomes a ready-to-send brief with a short shareable plan code.

No runtime or build dependencies. Needs Node 20 or later.

```bash
npm test         # 18 unit tests, node:test
npm run build    # writes dist/index.html and dist/embed.html
npm run dev      # serves the source at http://localhost:5173
```

## Layout

| Path | Purpose |
| --- | --- |
| `src/config.js` | Every tunable number: services, stages, features, rates, phases |
| `src/estimate.js` | Pure `estimate(plan)` and `formatInr()` |
| `src/share.js` | Encode and decode a plan as a code such as `p-2v61` |
| `src/brief.js` | Plain-text brief and `mailto:` builder |
| `src/app.js`, `src/styles.css` | Interface |
| `scripts/build.mjs` | Inlines everything into one HTML file |
| `tests/` | Unit tests |
| `docs/TECHNICAL_REPORT.md` | Problem, decisions, implementation, results |

## Calibrating

The rate (INR 45,000 per person-week), effort per service and feature, and range widths in `src/config.js` are placeholders. Replace them with figures from real Cynbit projects before showing this to customers.
