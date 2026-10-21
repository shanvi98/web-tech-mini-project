# Build Quizora — A Premium Vanilla JavaScript Quiz Platform

You are a senior frontend engineer, UI/UX designer, and testing engineer. Help me build a polished, fully functional quiz web application called **Quizora** for my Web Technologies evaluation and developer portfolio.

## 1. Core requirements

Build the application using ONLY:
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

Do not use React, Vue, Angular, TypeScript, Node.js, a backend, or a database.

Do not require API keys, authentication services, or paid services.

The finished application must run locally and be deployable as a static website to GitHub Pages or Netlify.

Use localStorage for persistent user preferences and quiz history where appropriate.

You may use a browser-compatible external library such as Chart.js only if genuinely useful. Prefer native CSS, SVG, and JavaScript to keep the project lightweight and easy to explain in a viva.

## 2. Product vision

Quizora is a modern quiz platform where users can discover quizzes, select difficulty levels, complete timed quizzes, review explanations, and track their performance.

It must feel like a polished, real product rather than a basic student assignment.

The UI should have:
- Strong visual hierarchy and professional typography.
- A consistent design system with CSS custom properties.
- A responsive layout for desktop, tablet, and mobile.
- Smooth but restrained transitions and animations.
- Carefully designed cards, buttons, progress indicators, dialogs, and feedback states.
- Thoughtful loading, empty, success, and error states where applicable.
- Accessible semantic HTML, visible keyboard focus, and sufficient color contrast.

Choose a distinctive premium visual direction. Avoid generic templates, excessive gradients, emoji-based icons, and unnecessary decorative elements. Use a cohesive icon style, preferably inline SVG.

## 3. Core functionality

Implement the following features progressively:

### Quiz discovery
- Landing page with featured quizzes and categories.
- Search and category filtering.
- Difficulty selection.
- Quiz details, number of questions, and estimated duration.
- Clear quiz-start workflow.

### Quiz engine
- Multiple-choice questions with four options.
- Single-answer selection.
- Configurable countdown timer.
- Progress indicator and question navigation.
- Previous and next controls.
- Clear indication of answered and unanswered questions.
- Confirmation before submitting early.
- Automatic submission when the timer expires.
- Protection against duplicate scoring or multiple submissions.
- Clear handling of unanswered questions.

### Results and review
- Final score and percentage.
- Correct, incorrect, and unanswered counts.
- Time taken.
- Review of every question with the correct answer and explanation.
- Retry quiz and return-to-discovery actions.
- No revealing answers before the quiz is submitted, unless review mode is explicitly enabled.

### Persistence and progress
- Store quiz history and preferences using localStorage.
- Display previous attempts and best scores.
- Handle missing, malformed, or outdated stored data safely.
- Provide a way to clear local history with confirmation.

### Question data
- Store questions separately from rendering logic.
- Include a minimum of three quiz categories and enough questions to demonstrate the complete experience.
- Include beginner and intermediate difficulty levels.
- Use accurate, original questions with verified answers and useful explanations.
- Randomize question and option order only when it can be implemented without breaking answer correctness.
- Never hardcode a score or fake a successful result.

### Optional enhancements
Do not implement these until the core application is complete and tested:
- Dark/light theme toggle.
- Keyboard shortcuts.
- Achievement badges.
- A leaderboard based only on clearly labeled local demo data.
- Additional question formats if time permits.

## 4. Web Technologies learning objectives

Structure the implementation so I can explain the following during my evaluation:

HTML:
- Semantic elements and page structure.
- Forms and buttons.
- Accessible labels and ARIA where appropriate.

CSS:
- Flexbox and Grid.
- Responsive media queries.
- CSS custom properties.
- Transitions, animations, and visual states.

JavaScript:
- Variables, functions, arrays, objects, and modules where appropriate.
- DOM manipulation and event listeners.
- Conditional logic, loops, and array methods.
- Form validation and input handling.
- Timer management and state transitions.
- Data rendering and event delegation where useful.
- JSON serialization and localStorage.
- Error handling and defensive programming.

Use clear, readable code suitable for a student to understand and explain. Do not overengineer the architecture.

## 5. Project structure

Start with a simple structure such as:

quizora/
  index.html
  css/
    styles.css
  js/
    app.js
    data.js
    storage.js
    quiz.js
    results.js
  assets/
  README.md

You may adjust this structure if a clear technical reason exists. Avoid unnecessary files and dependencies.

Use relative paths for static assets and scripts so deployment works from a GitHub Pages project subdirectory.

## 6. Mandatory phased workflow

Work through the following phases in order. **Complete only one phase per response. Do not continue automatically to the next phase.**

### Phase 1 — Planning and project foundation
- Inspect the current directory before making changes.
- If the directory is empty, initialize the project.
- If files already exist, inspect them and preserve unrelated work.
- Define the architecture, page states, data model, design system, and implementation plan.
- Create the initial HTML structure and CSS design tokens if appropriate.
- Add a README with project goals, features, setup instructions, and deployment plan.
- Run any available checks and provide exact local run instructions.
- Report the files created and any issues.

Do not build the entire application in Phase 1.

Stop after Phase 1 and wait for my approval.

### Phase 2 — Visual foundation
- Build the landing page and responsive layout.
- Implement navigation, quiz cards, search, and category filters.
- Add empty states and functional interactions for the implemented screens.
- Verify the layout at desktop and mobile widths.
- Test the phase before stopping.

Stop and wait for approval.

### Phase 3 — Quiz engine
- Implement question rendering, selection, navigation, timer, progress, and submission.
- Separate quiz data from application logic.
- Prevent timer leaks, duplicate submissions, and incorrect score calculation.
- Test boundary cases such as the final question, unanswered questions, and timer expiration.

Stop and wait for approval.

### Phase 4 — Results and persistence
- Implement results, explanations, answer review, retry, and local history.
- Add safe localStorage reads and writes.
- Handle malformed stored data and empty history.
- Test score calculations and repeated attempts.

Stop and wait for approval.

### Phase 5 — Quality and accessibility
- Test all user flows from beginning to end.
- Fix console errors, broken paths, layout issues, and interaction bugs.
- Verify keyboard navigation, focus indicators, labels, and contrast.
- Test empty, error, timeout, and completion states.
- Check for unsafe HTML insertion and unnecessary dependencies.
- Re-test after every fix.

Stop and wait for approval.

### Phase 6 — Deployment and handover
- Prepare the app for static deployment.
- Verify relative asset paths and production behavior.
- Write step-by-step GitHub Pages and Netlify deployment instructions.
- Update the README with features, screenshots guidance, limitations, and testing steps.
- Provide a final manual testing checklist.
- Explain the main HTML, CSS, and JavaScript concepts for my viva.

Do not claim deployment succeeded unless it was actually performed and verified. Do not claim tests passed unless they were actually run.

## 7. Testing expectations

For each phase:
1. Inspect the implementation.
2. Run relevant available checks.
3. If a browser-testing tool is available, use it; otherwise provide explicit manual test steps.
4. Fix failures before declaring the phase complete.
5. Clearly distinguish automated checks from manual checks and untested behavior.

For the quiz engine, verify:
- The score is calculated from the selected answers.
- An unanswered question is not counted as correct.
- The timer cannot submit twice.
- Changing questions does not erase answers.
- Restarting a quiz resets the previous attempt's state.
- Reloading does not accidentally restore a half-finished quiz unless that behavior is intentionally implemented.
- History survives a reload and can be cleared safely.

## 8. Working rules

- Do not implement all phases in one response.
- Do not skip testing to save time.
- Do not fabricate test results.
- Do not introduce backend requirements.
- Do not add dependencies without explaining why.
- Do not leave nonfunctional buttons or placeholder interactions in a completed phase.
- If a requirement is ambiguous, choose a reasonable minimal implementation and explain the decision.
- If a blocker arises, report it instead of silently working around it.
- Keep code maintainable and understandable for a Web Technologies student.

At the end of every phase, provide:
1. What was implemented.
2. Files created or modified.
3. Tests/checks actually performed and their results.
4. Any known limitations.
5. How I can run and manually verify the phase.
6. What the next phase will add.

Then STOP and wait for me to explicitly approve continuing.

## Start now

Begin with Phase 1 only. Inspect the directory, establish the project foundation, implement only the Phase 1 scope, test it, and report the outcome. Do not proceed to Phase 2 until I approve.