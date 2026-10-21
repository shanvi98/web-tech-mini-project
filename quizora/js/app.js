/* Quizora: screen wiring.
   Discovery (library, search, filters, details), the running quiz, the
   answer review and the saved history.
   Scoring and timing rules live in quiz.js; this file only draws and listens.
   Text is always inserted with textContent, never innerHTML. */

(function () {
  'use strict';

  var LEVELS = window.QUIZ_LEVELS;
  var RAW_DATA = window.QUIZ_DATA;

  var state = { query: '', category: 'all' };
  var quizzes = [];
  var openQuiz = null;

  // Quiz run state. `session` is null whenever no quiz is in progress.
  var session = null;
  var lastRun = null;      // { quiz, levelKey } so "Try again" can restart
  var timerId = null;
  var announced = {};      // timer announcements already spoken this run
  var confirmResolve = null;

  function byId(id) { return document.getElementById(id); }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function levelLabel(key) { return LEVELS[key] ? LEVELS[key].label : key; }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  // ---------- data ----------

  // Keep only quizzes that have what the UI needs, so one bad entry
  // cannot break the whole page.
  function isUsableQuiz(quiz) {
    if (!quiz || typeof quiz.id !== 'string' || typeof quiz.title !== 'string' || typeof quiz.category !== 'string' || !quiz.levels) {
      return false;
    }
    return Object.keys(LEVELS).every(function (key) {
      return Array.isArray(quiz.levels[key]) && quiz.levels[key].length > 0;
    });
  }

  function loadQuizzes() {
    if (!LEVELS || !Array.isArray(RAW_DATA)) return [];
    var usable = RAW_DATA.filter(isUsableQuiz);
    // Featured first; sort is stable in modern browsers, so authored order is kept within each group.
    return usable.sort(function (a, b) { return Number(!!b.featured) - Number(!!a.featured); });
  }

  function minutesFor(quiz, levelKey) {
    var seconds = quiz.levels[levelKey].length * LEVELS[levelKey].secondsPerQuestion;
    return Math.max(1, Math.round(seconds / 60));
  }

  function durationRange(quiz) {
    var mins = Object.keys(LEVELS).map(function (key) { return minutesFor(quiz, key); });
    var lo = Math.min.apply(null, mins);
    var hi = Math.max.apply(null, mins);
    return lo === hi ? lo + ' min' : lo + '–' + hi + ' min';
  }

  function questionRange(quiz) {
    var counts = Object.keys(LEVELS).map(function (key) { return quiz.levels[key].length; });
    var lo = Math.min.apply(null, counts);
    var hi = Math.max.apply(null, counts);
    return lo === hi ? plural(lo, 'question') : lo + '–' + hi + ' questions';
  }

  function categories() {
    var seen = [];
    quizzes.forEach(function (quiz) {
      if (seen.indexOf(quiz.category) === -1) seen.push(quiz.category);
    });
    return seen;
  }

  // ---------- filtering ----------

  function matches(quiz) {
    if (state.category !== 'all' && quiz.category !== state.category) return false;
    var needle = state.query.trim().toLowerCase();
    if (!needle) return true;
    var haystack = (quiz.title + ' ' + quiz.category + ' ' + (quiz.summary || '')).toLowerCase();
    return needle.split(/\s+/).every(function (word) { return haystack.indexOf(word) !== -1; });
  }

  // ---------- rendering ----------

  function renderStats() {
    var total = quizzes.reduce(function (sum, quiz) {
      return sum + Object.keys(LEVELS).reduce(function (inner, key) { return inner + quiz.levels[key].length; }, 0);
    }, 0);
    byId('stat-quizzes').textContent = quizzes.length;
    byId('stat-questions').textContent = total;
    byId('stat-levels').textContent = Object.keys(LEVELS).length;
  }

  function renderSubjects() {
    var list = byId('subject-list');
    list.textContent = '';

    var rows = [{ value: 'all', label: 'All subjects', count: quizzes.length }];
    categories().forEach(function (name) {
      rows.push({
        value: name,
        label: name,
        count: quizzes.filter(function (quiz) { return quiz.category === name; }).length
      });
    });

    rows.forEach(function (row, i) {
      var item = make('li');
      var button = make('button', 'index__row');
      button.type = 'button';
      button.dataset.category = row.value;
      button.setAttribute('aria-pressed', String(state.category === row.value));
      button.appendChild(make('span', 'index__num', String(i).padStart(2, '0')));
      button.appendChild(make('span', 'index__title', row.label));
      button.appendChild(make('span', 'index__count', String(row.count)));
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  function buildCard(quiz, history) {
    var card = make('article', 'card');

    var bar = make('div', 'card__bar label');
    bar.appendChild(make('span', '', quiz.category));
    if (quiz.featured) bar.appendChild(make('span', 'stamp', 'Featured'));
    card.appendChild(bar);

    var body = make('div', 'card__body');
    body.appendChild(make('h3', 'card__title', quiz.title));
    body.appendChild(make('p', 'card__summary', quiz.summary || ''));
    var best = QuizStore.bestFor(history, quiz.id);
    if (best) {
      body.appendChild(make('p', 'label card__best', 'Your best: ' + best.percent + '% · ' + levelLabel(best.levelKey)));
    }
    card.appendChild(body);

    var foot = make('div', 'card__foot');
    foot.appendChild(make('p', 'label', questionRange(quiz) + ' · ' + durationRange(quiz)));
    var button = make('button', 'btn btn--ghost', 'View details');
    button.type = 'button';
    button.dataset.quizId = quiz.id;
    button.setAttribute('aria-label', 'View details for ' + quiz.title);
    foot.appendChild(button);
    card.appendChild(foot);

    return card;
  }

  function renderGrid() {
    var grid = byId('quiz-grid');
    var empty = byId('empty-state');
    var visible = quizzes.filter(matches);
    var history = QuizStore.load();

    grid.textContent = '';
    visible.forEach(function (quiz) { grid.appendChild(buildCard(quiz, history)); });

    grid.hidden = visible.length === 0;
    empty.hidden = visible.length !== 0;

    if (visible.length === 0) {
      var query = state.query.trim();
      byId('empty-title').textContent = query
        ? 'No quizzes match “' + query + '”.'
        : 'No quizzes in this subject yet.';
    }

    byId('result-count').textContent = 'Showing ' + visible.length + ' of ' + quizzes.length;
  }

  function syncSubjectButtons() {
    var buttons = byId('subject-list').querySelectorAll('.index__row');
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.category === state.category));
    });
  }

  // ---------- details dialog ----------

  function selectedLevel() {
    var checked = document.querySelector('input[name="level"]:checked');
    return checked ? checked.value : Object.keys(LEVELS)[0];
  }

  function updateFacts() {
    if (!openQuiz) return;
    var key = selectedLevel();
    byId('fact-questions').textContent = String(openQuiz.levels[key].length);
    byId('fact-time').textContent = minutesFor(openQuiz, key) + ' min';
  }

  function openDetails(quiz) {
    openQuiz = quiz;
    byId('details-meta').textContent = quiz.category + (quiz.featured ? ' · Featured' : '');
    byId('details-title').textContent = quiz.title;
    byId('details-summary').textContent = quiz.summary || '';

    var options = byId('level-options');
    options.textContent = '';
    var history = QuizStore.load();
    Object.keys(LEVELS).forEach(function (key, i) {
      var label = make('label', 'level');
      var input = make('input');
      input.type = 'radio';
      input.name = 'level';
      input.value = key;
      input.checked = i === 0;
      label.appendChild(input);
      var name = make('span', 'level__name', LEVELS[key].label);
      var best = QuizStore.bestFor(history, quiz.id, key);
      if (best) name.appendChild(make('span', 'level__best', 'best ' + best.percent + '%'));
      label.appendChild(name);
      label.appendChild(make('span', 'level__meta', plural(quiz.levels[key].length, 'question') + ' · ' + minutesFor(quiz, key) + ' min'));
      options.appendChild(label);
    });

    byId('start-error').hidden = true;
    updateFacts();
    byId('details').showModal();
  }

  function closeDetails() {
    var dialog = byId('details');
    if (dialog.open) dialog.close();
  }

  // ---------- events ----------

  function wireEvents() {
    byId('search-form').addEventListener('submit', function (event) { event.preventDefault(); });

    byId('search').addEventListener('input', function (event) {
      state.query = event.target.value;
      renderGrid();
    });

    // Event delegation: one listener for every subject row.
    byId('subject-list').addEventListener('click', function (event) {
      var button = event.target.closest('.index__row');
      if (!button) return;
      state.category = button.dataset.category;
      syncSubjectButtons();
      renderGrid();
    });

    // ...and one for every card button.
    byId('quiz-grid').addEventListener('click', function (event) {
      var button = event.target.closest('[data-quiz-id]');
      if (!button) return;
      var quiz = quizzes.filter(function (item) { return item.id === button.dataset.quizId; })[0];
      if (quiz) openDetails(quiz);
    });

    byId('clear-filters').addEventListener('click', function () {
      state.query = '';
      state.category = 'all';
      byId('search').value = '';
      syncSubjectButtons();
      renderGrid();
      byId('search').focus();
    });

    byId('level-options').addEventListener('change', updateFacts);
    byId('details-close').addEventListener('click', closeDetails);
    byId('details-dismiss').addEventListener('click', closeDetails);

    // Clicking the dimmed backdrop closes the dialog.
    byId('details').addEventListener('click', function (event) {
      if (event.target === event.currentTarget) closeDetails();
    });
    byId('details').addEventListener('close', function () { openQuiz = null; });

    // Header navigation: mark the section the user jumped to.
    var links = document.querySelectorAll('.nav a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        links.forEach(function (other) { other.removeAttribute('aria-current'); });
        link.setAttribute('aria-current', 'page');
      });
    });
  }

  // ---------- screens ----------

  var SCREENS = ['discover', 'quiz', 'result'];

  function showScreen(name, focusId) {
    SCREENS.forEach(function (key) { byId('screen-' + key).hidden = key !== name; });
    document.body.dataset.screen = name;
    window.scrollTo(0, 0);
    if (focusId) byId(focusId).focus({ preventScroll: true });
  }

  function leaveToLibrary() {
    showScreen('discover');
    byId('quizzes').scrollIntoView();
  }

  // ---------- confirm dialog (resolves true only on the confirm button) ----------

  function ask(options) {
    var dialog = byId('confirm');
    if (confirmResolve) closeConfirm(false);
    byId('confirm-title').textContent = options.title;
    byId('confirm-message').textContent = options.message;
    byId('confirm-ok').textContent = options.ok;
    byId('confirm-cancel').textContent = options.cancel;
    return new Promise(function (resolve) {
      confirmResolve = resolve;
      dialog.dataset.answer = 'no';
      dialog.showModal();
    });
  }

  // Answer first, then close, so the result never depends on the
  // timing of the dialog's "close" event (which still covers the Esc key).
  function closeConfirm(answer) {
    var dialog = byId('confirm');
    dialog.dataset.answer = answer ? 'yes' : 'no';
    settleConfirm();
    if (dialog.open) dialog.close();
  }

  function settleConfirm() {
    var resolve = confirmResolve;
    confirmResolve = null;
    if (resolve) resolve(byId('confirm').dataset.answer === 'yes');
  }

  // ---------- timer ----------

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();   // never run two timers
    timerId = setInterval(tick, 500);
  }

  function formatClock(seconds) {
    var m = Math.floor(seconds / 60);
    var r = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  function renderTimer(left) {
    byId('quiz-clock').textContent = formatClock(left);
    var ratio = session.totalSeconds > 0 ? left / session.totalSeconds : 0;
    byId('quiz-bar').style.setProperty('--left', (ratio * 100).toFixed(1) + '%');
    byId('quiz-bar').parentNode.classList.toggle('tick--low', ratio <= 0.2);
  }

  function announceTime(left) {
    var message = null;
    if (left <= 10 && !announced.ten) { announced.ten = true; message = '10 seconds left'; }
    else if (left <= 30 && !announced.thirty) { announced.thirty = true; message = '30 seconds left'; }
    else if (left <= 60 && session.totalSeconds > 90 && !announced.minute) { announced.minute = true; message = '1 minute left'; }
    if (message) byId('quiz-live').textContent = message;
  }

  function tick() {
    if (!session || session.submitted) { stopTimer(); return; }
    var left = QuizEngine.remainingSeconds(session, Date.now());
    renderTimer(left);
    announceTime(left);
    if (left <= 0) finishQuiz('timeout');
  }

  // ---------- running a quiz ----------

  function onBeforeUnload(event) {
    event.preventDefault();
    event.returnValue = '';
  }

  function startQuiz(quiz, levelKey) {
    stopTimer();
    var created;
    try {
      created = QuizEngine.createSession({
        quiz: quiz,
        levelKey: levelKey,
        secondsPerQuestion: LEVELS[levelKey].secondsPerQuestion,
        now: Date.now()
      });
    } catch (error) {
      return error.message;
    }

    session = created;
    lastRun = { quiz: quiz, levelKey: levelKey };
    announced = {};
    byId('quiz-live').textContent = '';
    byId('review-list').textContent = '';

    byId('quiz-kicker').textContent = quiz.category;
    byId('quiz-heading').textContent = quiz.title;
    byId('quiz-level').textContent = LEVELS[levelKey].label;

    buildNavigator();
    renderQuestion();
    renderTimer(QuizEngine.remainingSeconds(session, Date.now()));
    window.addEventListener('beforeunload', onBeforeUnload);
    showScreen('quiz', 'quiz-heading');
    startTimer();
    return null;
  }

  function buildNavigator() {
    var nav = byId('q-nav');
    nav.textContent = '';
    session.questions.forEach(function (_, i) {
      var item = make('li');
      var button = make('button', '', String(i + 1));
      button.type = 'button';
      button.dataset.index = String(i);
      item.appendChild(button);
      nav.appendChild(item);
    });
  }

  function renderNavigator() {
    var buttons = byId('q-nav').querySelectorAll('button');
    buttons.forEach(function (button, i) {
      var answered = session.answers[i] !== null;
      button.classList.toggle('is-done', answered);
      button.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + (answered ? 'answered' : 'not answered'));
      if (i === session.current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });

    var answeredNow = QuizEngine.answeredCount(session);
    byId('quiz-progress').textContent = answeredNow + ' of ' + session.questions.length + ' answered';
  }

  // Disabling a focused button would drop focus to <body>; hand it on first.
  function setDisabled(button, disabled, fallback) {
    if (disabled && document.activeElement === button) fallback.focus();
    button.disabled = disabled;
  }

  function renderQuestion() {
    var index = session.current;
    var question = session.questions[index];
    var total = session.questions.length;

    byId('quiz-position').textContent = 'Question ' + (index + 1) + ' of ' + total;
    byId('q-number').textContent = String(index + 1).padStart(2, '0');
    byId('q-text').textContent = question.text;

    var options = byId('q-options');
    options.textContent = '';
    question.options.forEach(function (text, i) {
      var label = make('label', 'option');
      var input = make('input', 'option__input');
      input.type = 'radio';
      input.name = 'answer';
      input.value = String(i);
      input.checked = session.answers[index] === i;
      label.appendChild(input);
      label.appendChild(make('span', 'option__key', String.fromCharCode(65 + i)));
      label.appendChild(make('span', 'option__text', text));
      options.appendChild(label);
    });

    setDisabled(byId('q-prev'), index === 0, byId('quiz-submit'));
    setDisabled(byId('q-next'), index === total - 1, byId('quiz-submit'));
    renderNavigator();
  }

  function goToQuestion(index) {
    if (!session || session.submitted) return;
    if (!QuizEngine.goTo(session, index)) return;
    renderQuestion();
    byId('quiz-live').textContent = 'Question ' + (index + 1) + ' of ' + session.questions.length;
  }

  function finishQuiz(reason) {
    if (!session || session.submitted) return;   // guard: score once
    stopTimer();
    var result = QuizEngine.submit(session, Date.now(), reason);
    window.removeEventListener('beforeunload', onBeforeUnload);
    if (byId('confirm').open) closeConfirm(false);
    var outcome = recordAttempt(result);
    renderResult(result, outcome);
    showScreen('result', 'result-heading');
  }

  function confirmSubmit() {
    if (!session || session.submitted) return;
    var open = QuizEngine.unansweredCount(session);
    var message = open === 0
      ? 'You have answered every question. Your answers cannot be changed after submitting.'
      : 'You have ' + plural(open, 'unanswered question') + '. Unanswered questions score zero, and answers cannot be changed after submitting.';
    ask({ title: 'Submit your answers?', message: message, ok: 'Submit', cancel: 'Keep working' })
      .then(function (yes) { if (yes) finishQuiz('submitted'); });
  }

  function confirmLeave() {
    if (!session || session.submitted) return;
    ask({ title: 'Leave this quiz?', message: 'Your answers so far will be discarded.', ok: 'Leave quiz', cancel: 'Stay' })
      .then(function (yes) {
        if (!yes || !session || session.submitted) return;
        stopTimer();
        session = null;
        window.removeEventListener('beforeunload', onBeforeUnload);
        leaveToLibrary();
      });
  }

  // Save the attempt once (finishQuiz is guarded) and refresh anything that shows history.
  function recordAttempt(result) {
    var before = QuizStore.bestFor(QuizStore.load(), result.quizId, result.levelKey);
    var state = QuizStore.save({
      quizId: result.quizId,
      quizTitle: lastRun.quiz.title,
      levelKey: result.levelKey,
      takenAt: Date.now(),
      secondsUsed: result.secondsUsed,
      total: result.total,
      correct: result.correct,
      incorrect: result.incorrect,
      unanswered: result.unanswered,
      reason: result.reason
    });
    renderHistory();
    renderGrid();
    return { before: before, state: state };
  }

  function bestMessage(result, before) {
    if (!before) return 'First attempt at this level.';
    if (result.percent > before.percent) return 'New personal best: ' + result.percent + '% (previous ' + before.percent + '%).';
    if (result.percent === before.percent) return 'Matches your best of ' + before.percent + '%.';
    return 'Your best at this level is ' + before.percent + '%.';
  }

  function renderResult(result, outcome) {
    var timedOut = result.reason === 'timeout';
    byId('result-kicker').textContent = lastRun.quiz.title + ' · ' + LEVELS[result.levelKey].label;
    byId('result-heading').textContent = timedOut ? 'Time’s up.' : 'Submitted.';
    byId('result-correct').textContent = String(result.correct);
    byId('result-total').textContent = ' / ' + result.total;
    byId('result-percent').textContent = result.percent + '%';
    byId('res-correct').textContent = String(result.correct);
    byId('res-incorrect').textContent = String(result.incorrect);
    byId('res-unanswered').textContent = String(result.unanswered);
    byId('res-time').textContent = formatClock(result.secondsUsed);

    byId('result-best').textContent = outcome.state === 'invalid' ? '' : bestMessage(result, outcome.before);
    var note = byId('result-save-note');
    if (outcome.state === 'memory') {
      note.textContent = 'This browser is not letting Quizora save history, so this attempt will be lost when you close the tab.';
      note.hidden = false;
    } else if (outcome.state === 'invalid') {
      note.textContent = 'This attempt could not be recorded.';
      note.hidden = false;
    } else {
      note.hidden = true;
    }

    // Review is built only from a submitted session.
    var review = QuizResults.buildReview(session);
    var counts = QuizResults.countStatuses(review);
    var missed = counts.incorrect + counts.unanswered;
    QuizResults.renderReview(byId('review-list'), review);
    byId('review-all').textContent = 'All (' + review.length + ')';
    byId('review-missed').textContent = 'Missed (' + missed + ')';
    byId('review-missed').disabled = missed === 0;
    byId('review-none').hidden = missed !== 0;
    setReviewFilter('all');
  }

  function setReviewFilter(mode) {
    byId('review-all').setAttribute('aria-pressed', String(mode === 'all'));
    byId('review-missed').setAttribute('aria-pressed', String(mode === 'missed'));
    byId('review-list').querySelectorAll('.rev').forEach(function (item) {
      item.hidden = mode === 'missed' && item.dataset.status === 'correct';
    });
  }

  // ---------- history ----------

  var RECENT_SHOWN = 10;

  function formatWhen(timestamp) {
    try {
      return new Date(timestamp).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  }

  function addRow(tbody, cells) {
    var row = make('tr');
    cells.forEach(function (cell) {
      row.appendChild(make('td', cell.className || '', cell.text));
    });
    tbody.appendChild(row);
  }

  function renderHistory() {
    var attempts = QuizStore.load();
    var status = QuizStore.status();
    var messages = [];
    if (status.damaged) messages.push('Some saved history could not be read and was skipped.');
    if (!status.available) messages.push('This browser is blocking saved history, so attempts last only until the tab is closed.');
    var note = byId('history-note');
    note.textContent = messages.join(' ');
    note.hidden = messages.length === 0;

    var empty = attempts.length === 0;
    byId('history-empty').hidden = !empty;
    byId('history-body').hidden = empty;
    if (empty) return;

    var totals = QuizStore.stats(attempts);
    byId('hist-count').textContent = String(totals.count);
    byId('hist-best').textContent = totals.bestPercent + '%';
    byId('hist-avg').textContent = totals.averagePercent + '%';

    var bestBody = byId('best-table').querySelector('tbody');
    bestBody.textContent = '';
    QuizStore.bestByQuizLevel(attempts).forEach(function (group) {
      addRow(bestBody, [
        { text: group.quizTitle },
        { text: levelLabel(group.levelKey) },
        { text: group.best.percent + '%', className: 'num' },
        { text: String(group.count), className: 'num hide-sm' }
      ]);
    });

    var recentBody = byId('attempts-table').querySelector('tbody');
    recentBody.textContent = '';
    attempts.slice().reverse().slice(0, RECENT_SHOWN).forEach(function (a) {
      addRow(recentBody, [
        { text: formatWhen(a.takenAt), className: 'nowrap' },
        { text: a.quizTitle },
        { text: levelLabel(a.levelKey), className: 'hide-sm' },
        { text: a.correct + '/' + a.total + ' · ' + a.percent + '%' + (a.reason === 'timeout' ? ' · timed out' : ''), className: 'num' },
        { text: formatClock(a.secondsUsed), className: 'num hide-sm' }
      ]);
    });

    var shown = [];
    if (attempts.length > RECENT_SHOWN) shown.push('Showing the latest ' + RECENT_SHOWN + ' of ' + attempts.length + '.');
    if (attempts.length >= QuizStore.MAX_ATTEMPTS) shown.push('Only the latest ' + QuizStore.MAX_ATTEMPTS + ' attempts are kept.');
    byId('history-shown').textContent = shown.join(' ');
  }

  function confirmClearHistory() {
    var count = QuizStore.load().length;
    if (count === 0) return;
    ask({
      title: 'Clear all history?',
      message: 'This deletes ' + plural(count, 'saved attempt') + ' and your best scores from this browser. It cannot be undone.',
      ok: 'Clear history',
      cancel: 'Keep it'
    }).then(function (yes) {
      if (!yes) return;
      var cleared = QuizStore.clear();
      renderHistory();
      renderGrid();
      var heading = byId('history-title');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      if (!cleared) {
        var note = byId('history-note');
        note.textContent = 'History could not be cleared. Try again, or clear this site’s data in your browser settings.';
        note.hidden = false;
      }
    });
  }

  function wireQuizEvents() {
    // Event delegation on the options and the navigator.
    byId('q-options').addEventListener('change', function (event) {
      if (!session || !event.target.matches('input[name="answer"]')) return;
      QuizEngine.selectAnswer(session, session.current, Number(event.target.value));
      renderNavigator();
    });

    byId('q-nav').addEventListener('click', function (event) {
      var button = event.target.closest('button[data-index]');
      if (button) goToQuestion(Number(button.dataset.index));
    });

    byId('q-prev').addEventListener('click', function () { if (session) goToQuestion(session.current - 1); });
    byId('q-next').addEventListener('click', function () { if (session) goToQuestion(session.current + 1); });
    byId('quiz-submit').addEventListener('click', confirmSubmit);
    byId('quiz-leave').addEventListener('click', confirmLeave);

    byId('confirm-ok').addEventListener('click', function () { closeConfirm(true); });
    byId('confirm-cancel').addEventListener('click', function () { closeConfirm(false); });
    // Esc closes the dialog without a button. A late "close" event from an
    // earlier dialog must not cancel a newly opened one, hence the open check.
    byId('confirm').addEventListener('close', function () {
      if (!byId('confirm').open) settleConfirm();
    });

    byId('result-retry').addEventListener('click', function () {
      if (lastRun) startQuiz(lastRun.quiz, lastRun.levelKey);
    });
    byId('review-all').addEventListener('click', function () { setReviewFilter('all'); });
    byId('review-missed').addEventListener('click', function () { setReviewFilter('missed'); });
    byId('history-clear').addEventListener('click', confirmClearHistory);

    byId('result-back').addEventListener('click', function () {
      session = null;
      leaveToLibrary();
    });

    byId('details-start').addEventListener('click', function () {
      if (!openQuiz) return;
      var quiz = openQuiz;
      var error = startQuiz(quiz, selectedLevel());
      var box = byId('start-error');
      if (error) {
        box.textContent = error;
        box.hidden = false;
      } else {
        box.hidden = true;
        closeDetails();
      }
    });
  }

  // ---------- start ----------

  function init() {
    quizzes = loadQuizzes();

    if (quizzes.length === 0) {
      byId('quiz-grid').hidden = true;
      document.querySelector('.library__side').hidden = true;
      byId('error-state').hidden = false;
      byId('search').disabled = true;
      byId('result-count').textContent = '';
      return;
    }

    renderStats();
    renderSubjects();
    renderGrid();
    renderHistory();
    wireEvents();
    wireQuizEvents();
    document.body.dataset.screen = 'discover';
  }

  init();
})();
