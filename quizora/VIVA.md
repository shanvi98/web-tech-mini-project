# Viva guide: how Quizora works

Each section names the concept, where it lives, and a short way to say it. Open the file and point at the lines as you answer.

## HTML

**Semantic structure.** `index.html` uses `header`, `nav`, `main`, `section`, `article`, `footer`, `aside`, `dl`, `table` and `dialog` rather than generic `div`s, so the page has meaning for browsers, screen readers and search.
*Say:* "Elements describe what content is, not how it looks. CSS handles the look."

**Screens as sections.** The page has three screen regions (`#screen-discover`, `#screen-quiz`, `#screen-result`) and JavaScript shows one at a time with the `hidden` attribute. There is one page, no routing.

**Forms and buttons.** The search is a `form role="search"` with a real `label` (hidden visually with `.sr-only`) and `type="search"`. Answer choices are real `input type="radio"` elements sharing `name="answer"`, inside a `fieldset` whose `legend` is the question. Because they are native radios, arrow keys and focus work without extra code. Every action is a `button type="button"`.

**Accessibility (ARIA only where needed).**
- `aria-label` names the × close button and the navigator buttons ("Question 3, answered").
- `aria-current="step"` marks the current question; `aria-pressed` marks active filters.
- `role="timer"` on the clock, `aria-live="polite"` on a hidden region for time warnings, `role="alert"` on errors.
- `aria-labelledby` ties dialogs to their titles.
- A skip link jumps to `#main`.
*Say:* "Use native HTML first; add ARIA only to fill gaps."

**The `dialog` element.** `showModal()` gives focus trapping, the backdrop, and Esc-to-close for free.

## CSS

**Custom properties (design tokens).** `:root` at the top of `styles.css` holds colours, type sizes, spacing, shadows and timings. Components use `var(--accent)` etc., so changing a value changes the whole site, and a dark theme would only override these.

**Flexbox vs Grid.** Flexbox for one-dimensional rows: the masthead, button rows, toolbar, question navigator. Grid for two-dimensional layout: the library (sidebar + cards), the card grid `repeat(auto-fill, minmax(min(16.5rem, 100%), 1fr))`, the stats row, the question sheet (number column + content).
*Say:* "Flex lays out along one axis; grid controls rows and columns together."

**Responsive design.** Media queries at `max-width: 52rem` and `34rem` stack the library and tighten the quiz. `minmax(0, 1fr)` and `overflow-wrap` stop long content breaking layouts. Fluid type uses `clamp()`.

**Transitions and animations.** Buttons and cards lift with `transform` and a hard `box-shadow` on hover; the timer bar animates `width`; dialogs use a short `@keyframes rise`. `@media (prefers-reduced-motion: reduce)` switches them all off.

**State styling without JavaScript.** `:has(input:checked)` styles the chosen option, `:focus-visible` draws the focus outline, `[aria-pressed="true"]` styles the active filter, and `[hidden]` is forced to `display: none`.

**Specificity and the cascade.** Tokens are set once; components use single class selectors, so overrides are predictable.

## JavaScript

**Separation of concerns.** `data.js` has content only. `quiz.js` has rules (no DOM). `storage.js` talks to localStorage. `results.js` builds the review. `app.js` handles events and drawing.
*Say:* "The engine can be tested without a browser because it never touches the DOM."

**Scoping.** Each file is an IIFE `(function () { ... })()` that exposes only what it must on `window`. This avoids global clashes and works from `file://` where ES modules are blocked.

**Data and array methods.** `filter` (search, valid questions), `map` (shuffling options, building rows), `reduce` (total questions), `forEach` (rendering), `every`/`some` (search words), `sort` (featured first), `find`-style loops for best scores.

**Shuffling safely.** `createSession` shuffles questions and, per question, an index order for the options with Fisher-Yates. It then recalculates `correctIndex` from the new order, so the correct answer can never drift. The source data is copied, never mutated.

**DOM manipulation and safety.** Elements are created with `document.createElement` and text is set with `textContent`, never `innerHTML`, so user input or stored text cannot inject markup.

**Event delegation.** One listener on the card grid, one on the subject list, one on the options and one on the navigator use `event.target.closest(...)` to find which child was clicked. New items need no extra listeners.

**The timer.** The quiz stores a `deadline` timestamp. A `setInterval` every 500ms recomputes `remainingSeconds = ceil((deadline - now) / 1000)`. Using a deadline instead of subtracting 1 each tick means a throttled background tab cannot drift. The interval id is kept and cleared (`clearInterval`) on submit, timeout and leave, and a new one is never started without clearing the old, so timers cannot leak.

**State and the submit guard.** The session object holds `answers`, `current`, `submitted` and `result`. `submit()` returns the stored result if `submitted` is already true, so a double click or a timer firing just after a manual submit scores once.

**Unanswered handling.** An unanswered question is `null` in `answers`, counted separately, and never treated as correct.

**localStorage and JSON.** `JSON.stringify` writes `{ v: 1, attempts: [...] }`; `JSON.parse` reads it inside `try/catch`. Because storage is untrusted, `normalize()` checks every field, rejects entries whose counts do not add up, and recomputes percent. Bad entries are skipped rather than crashing. If storage is blocked or full, attempts live in memory and the user is told.

**Defensive programming.** Examples: invalid questions are filtered out; a quiz with no playable questions shows an error instead of starting; missing quiz data shows an error state; confirm dialogs resolve through one function so Esc and buttons behave the same; the engine rejects out-of-range question and option indexes.

**Promises.** The confirm dialog returns a `Promise` that resolves `true` or `false`, so callers write `ask(...).then(yes => ...)`.

## Likely questions and short answers

**Why no framework?** The brief required plain HTML, CSS and JavaScript, and the app is small. It shows the underlying platform: DOM, events and storage.

**Where is the data stored and can users cheat?** In the browser's localStorage, so a user can edit it. That is why reads are validated. There is no server, so scores are for personal tracking only.

**Why does reloading lose a half-finished quiz?** It was a deliberate choice to keep the engine simple and avoid restoring a stale timer. The browser warns before leaving.

**What stops answers leaking before submit?** The quiz screen never renders the correct option or explanation. `buildReview()` returns `null` until the session is submitted.

**How do you know scoring is correct?** Tests answered every quiz at both levels all-right (100%) and all-wrong (0%) through the real page, plus mixed and unanswered cases, and compared counts with the engine and the stored record.

**What would you add next?** A dark theme (override the tokens), keyboard shortcuts for options, resuming a quiz, storing per-question answers for later review, and more questions.

## Things to be ready to demonstrate

1. Open the DevTools Application tab and show the `quizora:attempts` JSON.
2. Break it (`{oops`) and reload to show the app recovering.
3. Resize the window to show the grid reflowing.
4. Tab through a quiz with the keyboard.
5. In Elements, show the `hidden` attribute switching between screens.
