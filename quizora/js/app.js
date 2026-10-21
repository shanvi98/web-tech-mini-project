/* Quizora: screen wiring for the discovery page.
   Phase 2 covers the library, search, subject filter and quiz details.
   Text is always inserted with textContent, never innerHTML. */

(function () {
  'use strict';

  var LEVELS = window.QUIZ_LEVELS;
  var RAW_DATA = window.QUIZ_DATA;

  var state = { query: '', category: 'all' };
  var quizzes = [];
  var openQuiz = null;

  function byId(id) { return document.getElementById(id); }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

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

  function buildCard(quiz) {
    var card = make('article', 'card');

    var bar = make('div', 'card__bar label');
    bar.appendChild(make('span', '', quiz.category));
    if (quiz.featured) bar.appendChild(make('span', 'stamp', 'Featured'));
    card.appendChild(bar);

    var body = make('div', 'card__body');
    body.appendChild(make('h3', 'card__title', quiz.title));
    body.appendChild(make('p', 'card__summary', quiz.summary || ''));
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

    grid.textContent = '';
    visible.forEach(function (quiz) { grid.appendChild(buildCard(quiz)); });

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
    Object.keys(LEVELS).forEach(function (key, i) {
      var label = make('label', 'level');
      var input = make('input');
      input.type = 'radio';
      input.name = 'level';
      input.value = key;
      input.checked = i === 0;
      label.appendChild(input);
      label.appendChild(make('span', 'level__name', LEVELS[key].label));
      label.appendChild(make('span', 'level__meta', plural(quiz.levels[key].length, 'question') + ' · ' + minutesFor(quiz, key) + ' min'));
      options.appendChild(label);
    });

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
    wireEvents();
  }

  init();
})();
