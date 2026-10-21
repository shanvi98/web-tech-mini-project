/* Answer review for a submitted quiz.

   buildReview() is pure data: it refuses to run until the session has been
   submitted, so answers can never leak early. renderReview() turns that data
   into DOM using textContent only. */

(function (root) {
  'use strict';

  var STATUS_LABEL = { correct: 'Correct', incorrect: 'Incorrect', unanswered: 'Unanswered' };

  // Returns null for a missing or still-running session.
  function buildReview(session) {
    if (!session || !session.submitted) return null;

    return session.questions.map(function (q, i) {
      var chosen = session.answers[i];
      var status = chosen === null ? 'unanswered' : (chosen === q.correctIndex ? 'correct' : 'incorrect');
      return {
        number: i + 1,
        text: q.text,
        status: status,
        explanation: q.explanation,
        options: q.options.map(function (text, index) {
          return { text: text, isCorrect: index === q.correctIndex, isChosen: index === chosen };
        })
      };
    });
  }

  function countStatuses(review) {
    var counts = { correct: 0, incorrect: 0, unanswered: 0 };
    review.forEach(function (item) { counts[item.status]++; });
    return counts;
  }

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderReview(container, review) {
    container.textContent = '';
    review.forEach(function (item) {
      var entry = make('li', 'rev rev--' + item.status);
      entry.dataset.status = item.status;

      var head = make('div', 'rev__head');
      head.appendChild(make('span', 'rev__num', String(item.number).padStart(2, '0')));
      head.appendChild(make('span', 'stamp rev__stamp', STATUS_LABEL[item.status]));
      entry.appendChild(head);

      entry.appendChild(make('p', 'rev__q', item.text));
      if (item.status === 'unanswered') {
        entry.appendChild(make('p', 'rev__skipped label', 'You did not answer this question.'));
      }

      var list = make('ol', 'rev__opts');
      item.options.forEach(function (option, i) {
        var row = make('li', 'rev__opt' + (option.isCorrect ? ' rev__opt--correct' : '') + (option.isChosen && !option.isCorrect ? ' rev__opt--wrong' : ''));
        row.appendChild(make('span', 'rev__key', String.fromCharCode(65 + i)));
        row.appendChild(make('span', 'rev__text', option.text));
        var tags = [];
        if (option.isCorrect) tags.push('Correct answer');
        if (option.isChosen) tags.push('Your answer');
        if (tags.length) row.appendChild(make('span', 'rev__tag label', tags.join(' · ')));
        list.appendChild(row);
      });
      entry.appendChild(list);

      if (item.explanation) {
        var why = make('p', 'rev__why');
        why.appendChild(make('strong', '', 'Why. '));
        why.appendChild(document.createTextNode(item.explanation));
        entry.appendChild(why);
      }
      container.appendChild(entry);
    });
  }

  root.QuizResults = {
    buildReview: buildReview,
    countStatuses: countStatuses,
    renderReview: renderReview
  };
})(typeof window !== 'undefined' ? window : globalThis);
