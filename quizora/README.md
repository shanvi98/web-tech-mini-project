# Quizora

A timed quiz platform for web-technology topics, built with plain HTML, CSS and JavaScript. No frameworks, no backend, no build step, no external requests. Attempts and best scores are kept in the browser's `localStorage`.

Pick a quiz, choose Beginner or Intermediate, answer against a countdown, then review every question with the correct answer and an explanation. Your history and best scores survive a reload.

For the viva, see [VIVA.md](VIVA.md).

## Features

- **Library:** 5 quizzes, 50 questions, 3 subjects (HTML, CSS, JavaScript), with search and a subject filter.
- **Quiz engine:** four options per question, one answer each, countdown timer, progress and a numbered navigator, answers kept while moving between questions, confirmation before submitting, automatic submit when time runs out, and a guard so a quiz is scored only once.
- **Review:** every question marked Correct, Incorrect or Unanswered, with the right option, your option and an explanation. Answers are never shown before submitting.
- **History:** attempts, best score per quiz and level, average, recent attempts, and a confirmed Clear history.
- **Robustness:** damaged, outdated or hand-edited stored data is skipped safely; blocked or full storage falls back to memory with a visible notice.
- **Accessibility:** keyboard-only operation, visible focus, dialogs that trap focus, text (not only colour) for states, 200% text and 320px reflow, reduced-motion support.

## Design

Quizora looks like a printed problem set rather than a dashboard. All values are CSS custom properties at the top of `css/styles.css`.

| Choice | Value |
| --- | --- |
| Surface | Warm paper `#f3eee3`, question sheets `#faf7ef` |
| Ink | `#1b1a17`, hairline and 2px rules |
| Accent | Red pencil `#b8301a` (5.2:1 on paper), used sparingly |
| Type | System serif and system mono, no web fonts |
| Shape | Square corners, hard offset shadows, no blur, no gradients |

## Project structure

```
quizora/
  index.html        one page; sections are the screens
  css/styles.css    tokens, base, components, responsive rules
  js/data.js        quiz content only (no DOM code)
  js/quiz.js        engine: shuffle, answers, timing, scoring (no DOM code)
  js/storage.js     attempt history in localStorage, validated on every read
  js/results.js     answer review (data + DOM)
  js/app.js         screens, events, rendering, history
  assets/favicon.svg
```

Scripts load in that order with plain `<script>` tags (not ES modules), so the page also works when opened straight from the file system. All paths are relative, so it works from a subfolder such as `https://you.github.io/repo/`.

**Data model**

```js
LEVELS   = { beginner: { label, secondsPerQuestion: 45 }, intermediate: { label, secondsPerQuestion: 60 } }
quiz     = { id, title, category, featured, summary, levels: { beginner: [question], intermediate: [question] } }
question = { text, options: [4 strings], answerIndex, explanation }
attempt  = { quizId, quizTitle, levelKey, takenAt, secondsUsed, total, correct, incorrect, unanswered, reason }
stored   = { v: 1, attempts: [attempt, ...] }   // localStorage key "quizora:attempts", newest 50 kept
```

## Run locally

Easiest: open `index.html` in a browser.

To serve it the way a host would:

```
cd quizora
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Nothing has been deployed yet. The steps below are instructions for you to follow. What was verified is that the site loads correctly when served over local HTTP from a nested folder (all files returned 200, no console errors, a full quiz completed and saved).

The site is just static files. There is no build command and no output folder to configure: publish the folder that contains `index.html`.

### GitHub Pages

1. Create a GitHub repository (for example `quizora`).
2. Put the contents of this `quizora` folder at the **root** of the repository, so `index.html` is at the top level (not inside a subfolder).
3. Commit and push:
   ```
   git add .
   git commit -m "Quizora"
   git push origin main
   ```
4. On GitHub open **Settings, Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose branch `main` and folder `/ (root)`, and save.
5. Wait a minute or two. The site appears at `https://<your-username>.github.io/<repo-name>/`. The address is shown at the top of the Pages settings once it is live.
6. Open it and run the manual checklist below.

Notes: file names are case-sensitive on GitHub Pages (they already match). Pages only offers `/` and `/docs` as folders, so if the app lives in a subfolder of a larger repo, move it to the root or rename the folder to `docs`.

### Netlify

Drag and drop:

1. Sign in at netlify.com and open **Sites**.
2. Drag the `quizora` folder (the one containing `index.html`) onto the "drag and drop your site folder" area.
3. Netlify gives the site an address like `https://something-random.netlify.app`. Rename it under **Site configuration, Change site name** if you like.

From a Git repository instead:

1. **Add new site, Import an existing project**, and connect the repository.
2. Leave **Build command** empty and set **Publish directory** to `.` (or the folder containing `index.html`).
3. Deploy.

### After deploying

Open the live address and run the checklist. In the browser's developer tools (F12), confirm the Console shows no red errors and the Network tab shows all seven files returning 200.

## Manual testing checklist

Tick each on the deployed site, and again in a phone-sized window.

**Library**
- [ ] Five quiz cards appear; counts read 5 quizzes, 50 questions, 2 levels.
- [ ] Clicking HTML, CSS and JavaScript filters the cards; All subjects restores them.
- [ ] Searching "dom" shows one card; searching "zzzz" shows the empty state with a working Clear filters.
- [ ] View details opens a dialog; switching level changes the question count and time; Esc, the close button and clicking outside all close it.

**Taking a quiz**
- [ ] Start opens the quiz with the timer counting down and no answer marked.
- [ ] Selecting an answer marks that number in the navigator and updates "x of 5 answered".
- [ ] Previous, Next and the numbered buttons move between questions without losing answers.
- [ ] Submitting with unanswered questions warns you how many are unanswered; Keep working returns to the quiz.
- [ ] Leave quiz asks first and returns to the library without saving anything.
- [ ] Letting the clock run out submits automatically and says "Time's up."
- [ ] Reloading in the middle of a quiz returns to the library (the attempt is discarded, after a browser warning).

**Result and review**
- [ ] Correct, incorrect and unanswered counts add up to the total; the percentage matches.
- [ ] Every question shows the correct answer, your answer if you gave one, and an explanation.
- [ ] The Missed filter hides correct questions; Try again starts a clean quiz.

**History**
- [ ] After finishing, Your record shows the attempt; the card shows "Your best".
- [ ] Reloading the page keeps the history.
- [ ] A lower score then a higher score give the "Your best at this level" and "New personal best" messages.
- [ ] Clear history asks first; after confirming, history and badges are gone and stay gone after reload.
- [ ] In the console run `localStorage.setItem('quizora:attempts','{oops')` and reload: the page still works and shows a notice.

**Accessibility**
- [ ] Using only the keyboard (Tab, Shift+Tab, arrows, Enter, Esc) you can complete a quiz and read the review.
- [ ] A visible outline appears on every focused control.
- [ ] Zooming the browser to 200% causes no sideways scrolling.

## Screenshots for your report

Capture these at desktop width (about 1280px) and phone width (about 390px, using the browser's device toolbar):

1. Landing page with the hero, subject index and quiz cards.
2. A quiz card's details dialog with the level picker.
3. A question mid-quiz, showing the timer bar and numbered navigator.
4. The "Submit your answers?" confirmation with unanswered questions.
5. The result screen with score and review (include one incorrect and one unanswered question).
6. Your record with several attempts.
7. The low-time state (the bar and clock turn red in the last 20%).

## Limitations

- History stores summaries only (score, level, time), not which option you chose per question, so older attempts cannot be re-reviewed. The full review exists only on the result screen right after an attempt.
- History is per browser and per device. Clearing site data or using another browser starts fresh.
- The newest 50 attempts are kept; the table shows the latest 10.
- Reloading mid-quiz discards the attempt on purpose; resuming is not implemented.
- 50 questions in 5 quizzes is a demonstration set. The questions and explanations were written for this project; re-read them before relying on them for assessment.
- Verified in headless Chrome only. Not tested with a screen reader, in Safari or Firefox, or on physical touch devices.

## Adding your own quiz

Add an object to `QUIZ_DATA` in `js/data.js` following the data model above: a unique `id`, a `category`, and at least one question in both `beginner` and `intermediate`. Each question needs exactly four options and an `answerIndex` from 0 to 3. Invalid questions are skipped, and a quiz missing either level is left out of the library.

## Testing performed during development

Automated, run in headless Chrome and Node, all passing at the end of Phase 5:

- 25 engine tests (scoring, unanswered, timer, double-submit guard, shuffle correctness, bad data).
- 66 storage and review tests (round trip, malformed and hostile storage, caps, blocked storage, best-score logic).
- 94 in-page tests (quiz flow, timeouts, review, history, persistence, clearing, corrupt data).
- 31 keyboard-only checks with real key events.
- 25 reflow checks at 320, 375 and 768px and at 200% text.
- 24 semantic and reduced-motion checks.

Phase 6 added a serve-over-HTTP-from-a-subfolder check: all files 200, no console errors, a quiz completed and saved.

The checklist above is for you to run on the live site.
