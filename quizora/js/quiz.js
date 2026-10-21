/* Quiz engine: state, scoring and timing only. No DOM access.
   Every function takes the clock (`now`, in ms) as an argument, so the
   logic can be tested without waiting for real time to pass.

   A session looks like:
   {
     quizId, levelKey,
     questions: [{ text, options: [4 strings], correctIndex, explanation }],
     answers:   [ chosenOptionIndex | null, ... ],   // one slot per question
     current, startedAt, totalSeconds, deadline,
     submitted, result
   }
   Questions and options are shuffled into the session. correctIndex is
   recalculated after shuffling, so the answer can never drift. The quiz
   data itself is never modified. */

(function (root) {
  'use strict';

  function isValidQuestion(q) {
    return !!q &&
      typeof q.text === 'string' && q.text.length > 0 &&
      Array.isArray(q.options) && q.options.length === 4 &&
      q.options.every(function (o) { return typeof o === 'string' && o.length > 0; }) &&
      Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex < 4;
  }

  // Fisher-Yates on a copy.
  function shuffle(list, random) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // options: { quiz, levelKey, secondsPerQuestion, now, random?, shuffle? }
  function createSession(options) {
    var pool = options.quiz && options.quiz.levels && options.quiz.levels[options.levelKey];
    var source = Array.isArray(pool) ? pool.filter(isValidQuestion) : [];
    if (source.length === 0) {
      throw new Error('This quiz has no playable questions.');
    }

    var random = options.random || Math.random;
    var doShuffle = options.shuffle !== false;
    var ordered = doShuffle ? shuffle(source, random) : source.slice();

    var questions = ordered.map(function (q) {
      var order = q.options.map(function (_, i) { return i; });
      if (doShuffle) order = shuffle(order, random);
      return {
        text: q.text,
        options: order.map(function (i) { return q.options[i]; }),
        correctIndex: order.indexOf(q.answerIndex),
        explanation: q.explanation || ''
      };
    });

    var totalSeconds = questions.length * options.secondsPerQuestion;
    var answers = [];
    for (var i = 0; i < questions.length; i++) answers.push(null);

    return {
      quizId: options.quiz.id,
      levelKey: options.levelKey,
      questions: questions,
      answers: answers,
      current: 0,
      startedAt: options.now,
      totalSeconds: totalSeconds,
      deadline: options.now + totalSeconds * 1000,
      submitted: false,
      result: null
    };
  }

  // Record an answer. Returns false (and changes nothing) for bad input
  // or after the quiz has been submitted.
  function selectAnswer(session, questionIndex, optionIndex) {
    if (!session || session.submitted) return false;
    if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= session.questions.length) return false;
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= session.questions[questionIndex].options.length) return false;
    session.answers[questionIndex] = optionIndex;
    return true;
  }

  function goTo(session, index) {
    if (!session || !Number.isInteger(index)) return false;
    if (index < 0 || index >= session.questions.length) return false;
    session.current = index;
    return true;
  }

  function answeredCount(session) {
    return session.answers.filter(function (a) { return a !== null; }).length;
  }

  function unansweredCount(session) {
    return session.questions.length - answeredCount(session);
  }

  function remainingSeconds(session, now) {
    return Math.max(0, Math.ceil((session.deadline - now) / 1000));
  }

  // Score the session exactly once. Calling it again (a double click, or the
  // timer firing right after a manual submit) returns the first result.
  function submit(session, now, reason) {
    if (session.submitted) return session.result;

    var correct = 0;
    var unanswered = 0;
    session.questions.forEach(function (q, i) {
      var chosen = session.answers[i];
      if (chosen === null) unanswered++;
      else if (chosen === q.correctIndex) correct++;
    });

    var total = session.questions.length;
    var elapsed = Math.round((now - session.startedAt) / 1000);
    var timedOut = reason === 'timeout';

    session.submitted = true;
    session.result = {
      quizId: session.quizId,
      levelKey: session.levelKey,
      total: total,
      correct: correct,
      incorrect: total - correct - unanswered,
      unanswered: unanswered,
      percent: total === 0 ? 0 : Math.round((correct / total) * 100),
      secondsUsed: timedOut ? session.totalSeconds : Math.min(session.totalSeconds, Math.max(0, elapsed)),
      reason: timedOut ? 'timeout' : 'submitted'
    };
    return session.result;
  }

  root.QuizEngine = {
    createSession: createSession,
    selectAnswer: selectAnswer,
    goTo: goTo,
    answeredCount: answeredCount,
    unansweredCount: unansweredCount,
    remainingSeconds: remainingSeconds,
    submit: submit
  };
})(typeof window !== 'undefined' ? window : globalThis);
