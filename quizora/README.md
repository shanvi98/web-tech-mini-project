# Quizora

A timed quiz platform for web-technology topics, built with plain HTML, CSS and JavaScript. No frameworks, no backend, no build step. Progress is stored in the browser's `localStorage`.

> Status: **Phase 3 of 6** (quiz engine). You can browse, start, take, and submit a timed quiz and see a score summary. Answer review and saved history are built in Phase 4.

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
  js/data.js        quiz content (5 quizzes, 50 questions)
  js/quiz.js        quiz engine: shuffle, answers, timing, scoring (no DOM)
  js/app.js         screens: library, details, quiz, result summary
  js/               (later) storage.js, results.js
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
LEVELS   = { beginner: { label, secondsPerQuestion: 45 }, intermediate: { label, secondsPerQuestion: 60 } }
quiz     = { id, title, category, featured, summary, levels: { beginner: [question], intermediate: [question] } }
question = { id, text, options: [4 strings], answerIndex, explanation }
attempt  = { v: 1, quizId, level, takenAt, secondsUsed, total, correct, incorrect, unanswered, answers: [index | null] }
prefs    = { v: 1, ... }
```

Stored keys are prefixed `quizora:` and carry a version so outdated data can be discarded safely. Scores are always computed from `answers` against `answerIndex`, never stored as an assumption.

## Phase 2 notes

- Scripts are plain `<script>` tags, not ES modules, so the page also works when opened from `file://` (browsers block modules there).
- Quiz time is derived: questions x seconds per level, rounded to minutes.
- All text from data or the search box is inserted with `textContent`, never `innerHTML`.
- The details dialog uses the native `<dialog>` element (focus trap, Esc to close). Its Start button is intentionally disabled until the engine exists in Phase 3.

## Phase 3 notes

- **Engine vs. screen:** `quiz.js` holds all rules and takes the clock as an argument, so it is testable without waiting. `app.js` only draws and listens.
- **Shuffling:** questions and options are shuffled per attempt; `correctIndex` is recomputed after the shuffle and the source data is never modified.
- **Timer:** uses a deadline timestamp, not a decrementing counter, so a throttled background tab cannot drift. One interval at a time; it is cleared on submit, timeout, and leave.
- **Submit guard:** `submit()` scores once and returns the same result on later calls, so a double click or the timer firing just after a manual submit cannot score twice.
- **Reload:** reloading mid-quiz discards the attempt on purpose (a browser warning appears first). Resuming is not implemented.
- **Unanswered:** stored as `null`, counted separately, never as correct.
- **Answers stay hidden:** the quiz screen never renders correct answers or explanations; the engine holds them until Phase 4 review.

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

1. Foundation (done)
2. Landing page, search, filters, quiz cards (done)
3. Quiz engine (done)
4. Results, review and history
5. Quality and accessibility pass
6. Deployment and handover
