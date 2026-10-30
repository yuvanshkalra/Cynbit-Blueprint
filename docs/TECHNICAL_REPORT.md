# Project Blueprint: Technical Report

Prototype improvement for cynbit.in. October 2026.

## 1. Analysis of the existing site

I reviewed the home, services and contact pages as published on 30 October 2026. The review is based on the page content and structure returned by a page fetch, so it covers copy, navigation, calls to action and forms. It does not cover measured performance, accessibility audits or analytics, which I could not run.

**What works.** Positioning is clear (AI automation and software from Jaipur). The site offers a lot of breadth: services, three products, a training program (BitElevate), case studies and a blog. The six-step delivery lifecycle is a strong trust signal. The navigation is organized and every page ends with a call to action.

**User perspective.**

- The most important action is starting a project, and the path to it is a plain form: name, email, optional company and industry, and one free-text message. The page promises that the team will "analyze your requirements and prepare a tailored strategic overview", but a blank message box gives a first-time visitor nothing to react to.
- The services page lists capabilities (agents, full-stack, cloud, SEO) and a long technology list, but offers no way to tell what a project of a given size costs or how long it takes. Several "Inquire" buttons lead to the same generic form.
- Visitors who are not ready to talk to sales have no self-serve step between reading and contacting. That is a drop-off point for the most common buyer question: roughly how much and how long.

**Developer perspective.**

- Markup and metadata suggest a modern server-rendered React setup (a Next.js size-adjust meta tag appears, and Next.js is listed in the stack). Meta tags are thorough: titles, descriptions, Open Graph, Twitter cards.
- The Open Graph and Twitter image is the SVG logo. Many social platforms do not render SVG previews, so shared links may show no image.
- Every page carries the same Open Graph URL (the home page), which weakens link previews for inner pages.
- The contact form is the single conversion point, so improving what it captures has leverage across the whole site.

## 2. Problem statement

Visitors who are interested in Cynbit cannot get a sense of scope, cost and timeline without a conversation, and when they do reach out, the inquiry arrives as unstructured free text. This costs Cynbit twice: some qualified visitors leave without contacting, and the sales team must spend the first call recovering basic scope information.

## 3. Proposed improvement

**Project Blueprint**, an interactive estimator placed between the services page and the contact form. It matches the existing contact-page heading "The Blueprint" and the site's architect language.

The visitor answers four questions (what, how far along, what it needs, how fast) and sees an indicative estimate that updates live. They then get a structured brief that can be sent to Cynbit.

Goals:

1. Give visitors a useful answer immediately, without an email wall.
2. Make the inquiry that follows structured and comparable.
3. Be honest about uncertainty: every result shows a range and a confidence rating, and states that it is not a quote.

## 4. Technical decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Language | Plain JavaScript ES modules with JSDoc types | Runs in any browser with no build step; types stay checkable later by adding a TypeScript config |
| Dependencies | None | See below |
| Estimation | One pure function over a plain config object | Deterministic, trivially testable, and easy for the business to recalibrate |
| State | Single `plan` object, re-rendered into the DOM on change | The interface is small; a framework would add more than it removes |
| Sharing | The whole plan packs into one integer, written in base 36 (`p-2v61`) | Short enough to paste anywhere and needs no server |
| Packaging | A Node script inlines CSS and bundled JS into one HTML file | Deployable to any static host, and embeddable |
| Tests | Node's built-in `node:test` | No install needed |

**Why no framework.** I started with React, TypeScript and Vite. The workspace I built in denies access to the npm registry (the egress proxy returns a 403 for `registry.npmjs.org`), so dependencies could not be installed. I did not work around the restriction. I rebuilt the prototype on platform features instead. For a tool this size that is a reasonable outcome on its own: the whole page is 36 KB with no framework payload. The estimation core has no dependencies and no DOM access, so it moves unchanged into the real site's Next.js codebase, where a React component would wrap it.

## 5. Implementation

**Estimation model** (`src/estimate.js`, parameters in `src/config.js`):

1. Each selected service has a base effort in person-weeks. Services are sorted largest first. The first counts in full and each further service counts at 85%, because accounts, infrastructure and design work are shared.
2. Stage multiplies service effort (1.0, 1.6, 2.6). Features grow with stage at half that rate.
3. Effort is the sum. Team size is `ceil(effort / 10)` clamped to 1 to 8.
4. Duration is `effort / (team × 0.75) + 1.5` weeks, scaled by pace (0.8 urgent, 1.15 flexible).
5. Budget is effort × a blended rate × pace cost (1.25 urgent, 0.95 flexible), shown as a range from 0.85× to 1.3×, rounded to ₹5,000.
6. The timeline is split across Cynbit's own six lifecycle phases (8%, 10%, 14%, 46%, 12%, 10%) and drawn to scale.
7. Confidence falls as stage, service count, feature count and urgency rise, and the reason is shown in plain words.

**Interface** (`src/app.js`, `src/styles.css`):

- The estimate is shown as a drawing sheet with a title block (prepared for, plan code, date), drawing on the architect metaphor in the site's copy.
- A summary strip with the budget range stays at the bottom of the screen on phones.
- Light and dark themes follow the system setting.
- All user text is escaped before it is inserted into the page.
- The browser address hash is updated with the plan code, so a link restores the same plan.

**Brief** (`src/brief.js`): a plain-text summary with contact details, selections, the estimate and the plan code, with copy buttons and a `mailto:` link.

## 6. Results

- **Unit tests:** 18 of 18 pass. They cover the estimate (monotonic in scope, stage, features and pace), phase arithmetic, range ordering over every scale and pace combination, confidence levels, Indian number formatting, share-code round trips and rejection of malformed codes, and the brief.
- **Browser checks** (headless Chromium, desktop light at 1280 px and phone dark at 390 px): the page loads with no console errors or page errors; changing selections updates the estimate and the address hash; clearing all services shows an empty state and hides the mobile strip; a plan code reloaded in a fresh page restores the same selections; HTML typed into the company field is shown as text and not interpreted. A horizontal overflow bug found in this pass (a hidden input) and a cramped phone layout were fixed.
- **Size:** 36 KB for the single built file, with no runtime dependencies. Web fonts load from Google Fonts and fall back to system fonts.

Not measured: the effect on conversion. That needs real traffic.

## 7. Limitations

- All rates, efforts and multipliers are placeholders I chose to make the model behave plausibly. They are not Cynbit prices and have not been checked against Cynbit's project history.
- The prototype does not send anything. The brief is copied or opened in an email app. On the real site it would post to the existing inquiry endpoint.
- It has not been tested with real visitors, with a screen reader, or on real phones beyond the emulated viewport.
- The share code lives in the address hash because the prototype is hosted as a single static page. On the real site, a query string or a dedicated route would be better.

## 8. Next steps

1. Calibrate `config.js` with the sales team using the last 20 to 30 delivered projects, then check how often final cost lands inside the shown range.
2. Mount the module on a `/blueprint` route in the Next.js site and link it from every "Inquire" button on the services page.
3. Post the brief and plan code to the existing contact endpoint and add them to the CRM record.
4. Add analytics for step completion and brief copies so conversion can be measured against the current form.
5. Add pre-filled variants per service (for example, "AI agent for support") as entry points from the blog and case studies.
