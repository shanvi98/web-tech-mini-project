# Quizora

A timed quiz platform for web-technology topics, built with plain HTML, CSS and JavaScript. No frameworks, no backend, no build step. Progress is stored in the browser's `localStorage`.

> Status: **Phase 1 of 6** (foundation). The landing shell and design system exist; quizzes, the engine and history are built in later phases.

## Goals

- Show a complete product flow: discover, configure, take, review, track.
- Keep every concept explainable in a viva: semantic HTML, Grid/Flexbox, custom properties, DOM events, timers, JSON and `localStorage`.
- Deploy as a static site with relative paths only.

## Design direction

Quizora looks like a printed problem set rather than a SaaS dashboard.

| Choice | Value |
| --- | --- |
| Surface | Warm paper `#f3eee3`, question sheets `#faf7ef` |
| Ink | `#1b1a17`, hairline and 2px rules |
| Accent | Red-pencil `#b8301a` (5.1:1 on paper), used sparingly |
| Type | System serif for voice, system mono for labels and numbers (no web fonts) |
| Shape | Square corners, hard offset shadows, no blur, no gradients |

All values are CSS custom properties at the top of `css/styles.css`; a dark theme later only needs to override those tokens.

## Architecture

```
quizora/
  index.html        single page; sections act as screens
  css/styles.css    tokens, base, components
  js/               (Phase 2+) app.js, data.js, storage.js, quiz.js, results.js
  assets/           favicon
```

**Screens (one visible at a time):** discover, briefing, quiz, results, history.

**Planned modules**

| File | Responsibility |
| --- | --- |
| `data.js` | Quiz and question data only, no DOM |
| `storage.js` | Safe `localStorage` read/write with validation and versioning |
| `quiz.js` | Quiz state, timer, answers, submission guard |
| `results.js` | Score calculation and review rendering |
| `app.js` | Screen switching, event wiring, discovery filters |

**Data model**

```js
quiz     = { id, title, category, summary, levels: { beginner: [question], intermediate: [question] }, minutesPerLevel }
question = { id, text, options: [4 strings], answerIndex, explanation }
attempt  = { v: 1, quizId, level, takenAt, secondsUsed, total, correct, incorrect, unanswered, answers: [index | null] }
prefs    = { v: 1, ... }
```

Stored keys are prefixed `quizora:` and carry a version so outdated data can be discarded safely. Scores are always computed from `answers` against `answerIndex`, never stored as an assumption.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```
cd quizora
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deployment plan

Static hosting only. GitHub Pages (publish from the `quizora` folder or repo root) or Netlify (drag-and-drop the folder, no build command). Paths are relative so a project subdirectory works. Detailed steps arrive in Phase 6.

## Roadmap

1. Foundation (this phase)
2. Landing page, search, filters, quiz cards
3. Quiz engine
4. Results, review and history
5. Quality and accessibility pass
6. Deployment and handover
