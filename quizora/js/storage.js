/* Quiz history in localStorage. No DOM access.

   Stored under one key as JSON:  { v: 1, attempts: [attempt, ...] }
   attempt = { quizId, quizTitle, levelKey, takenAt, secondsUsed,
               total, correct, incorrect, unanswered, reason }

   Everything read back is treated as untrusted: it may be missing, not
   JSON, from an older version, hand-edited, or half-written. Entries that
   fail validation are skipped, and percent is always recomputed from the
   counts rather than trusted from storage.

   If localStorage is blocked (private mode, disabled cookies) or full,
   attempts are kept in memory for the current tab and save() says so. */

(function (root) {
  'use strict';

  var KEY = 'quizora:attempts';
  var VERSION = 1;
  var MAX_ATTEMPTS = 50;
  var REASONS = ['submitted', 'timeout'];

  var memory = [];            // fallback copy when storage is unavailable
  var lastStatus = { available: true, damaged: false };

  function getStore() {
    try {
      var store = root.localStorage;
      if (!store) return null;
      var probe = '__quizora_probe__';
      store.setItem(probe, '1');
      store.removeItem(probe);
      return store;
    } catch (error) {
      return null;
    }
  }

  function isCount(n, max) {
    return Number.isInteger(n) && n >= 0 && n <= max;
  }

  // Returns a clean copy of a valid attempt, or null.
  function normalize(a) {
    if (!a || typeof a !== 'object') return null;
    if (typeof a.quizId !== 'string' || a.quizId === '' || a.quizId.length > 80) return null;
    if (typeof a.levelKey !== 'string' || a.levelKey === '' || a.levelKey.length > 40) return null;
    if (!Number.isFinite(a.takenAt) || a.takenAt <= 0) return null;
    if (!Number.isFinite(a.secondsUsed) || a.secondsUsed < 0 || a.secondsUsed > 86400) return null;
    if (!Number.isInteger(a.total) || a.total < 1 || a.total > 200) return null;
    if (!isCount(a.correct, a.total) || !isCount(a.incorrect, a.total) || !isCount(a.unanswered, a.total)) return null;
    if (a.correct + a.incorrect + a.unanswered !== a.total) return null;
    if (REASONS.indexOf(a.reason) === -1) return null;

    var title = typeof a.quizTitle === 'string' && a.quizTitle ? a.quizTitle.slice(0, 120) : a.quizId;
    return {
      quizId: a.quizId,
      quizTitle: title,
      levelKey: a.levelKey,
      takenAt: a.takenAt,
      secondsUsed: Math.round(a.secondsUsed),
      total: a.total,
      correct: a.correct,
      incorrect: a.incorrect,
      unanswered: a.unanswered,
      percent: Math.round((a.correct / a.total) * 100),
      reason: a.reason
    };
  }

  // Oldest first. Always returns an array; never throws.
  function load() {
    var store = getStore();
    if (!store) {
      lastStatus = { available: false, damaged: false };
      return memory.slice();
    }

    var raw;
    try {
      raw = store.getItem(KEY);
    } catch (error) {
      lastStatus = { available: false, damaged: false };
      return memory.slice();
    }

    if (raw === null) {
      lastStatus = { available: true, damaged: false };
      return [];
    }

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      lastStatus = { available: true, damaged: true };
      return [];
    }

    if (!parsed || parsed.v !== VERSION || !Array.isArray(parsed.attempts)) {
      lastStatus = { available: true, damaged: true };
      return [];
    }

    var clean = [];
    parsed.attempts.forEach(function (item) {
      var ok = normalize(item);
      if (ok) clean.push(ok);
    });
    lastStatus = { available: true, damaged: clean.length !== parsed.attempts.length };
    return clean;
  }

  // Returns 'stored' (persisted), 'memory' (kept for this tab only) or 'invalid'.
  function save(attempt) {
    var clean = normalize(attempt);
    if (!clean) return 'invalid';

    var list = load();
    list.push(clean);
    if (list.length > MAX_ATTEMPTS) list = list.slice(list.length - MAX_ATTEMPTS);

    var store = getStore();
    if (store) {
      try {
        store.setItem(KEY, JSON.stringify({ v: VERSION, attempts: list }));
        memory = list;
        lastStatus = { available: true, damaged: false };
        return 'stored';
      } catch (error) {
        // quota exceeded or write blocked: fall through to memory
      }
    }
    memory = list;
    lastStatus = { available: false, damaged: false };
    return 'memory';
  }

  // Returns true when everything is gone, false if storage refused.
  function clear() {
    memory = [];
    var store = getStore();
    if (!store) {
      lastStatus = { available: false, damaged: false };
      return true;
    }
    try {
      store.removeItem(KEY);
      lastStatus = { available: true, damaged: false };
      return true;
    } catch (error) {
      return false;
    }
  }

  function status() {
    return { available: lastStatus.available, damaged: lastStatus.damaged };
  }

  // ---------- pure helpers over a list of attempts ----------

  // Higher percent wins; on a tie the faster attempt wins; then the newer one.
  function isBetter(a, b) {
    if (a.percent !== b.percent) return a.percent > b.percent;
    if (a.secondsUsed !== b.secondsUsed) return a.secondsUsed < b.secondsUsed;
    return a.takenAt > b.takenAt;
  }

  function bestFor(attempts, quizId, levelKey) {
    var best = null;
    attempts.forEach(function (a) {
      if (a.quizId !== quizId) return;
      if (levelKey && a.levelKey !== levelKey) return;
      if (!best || isBetter(a, best)) best = a;
    });
    return best;
  }

  // [{ quizId, quizTitle, levelKey, best, count }], strongest first.
  function bestByQuizLevel(attempts) {
    var map = {};
    var order = [];
    attempts.forEach(function (a) {
      var key = a.quizId + '|' + a.levelKey;
      if (!map[key]) {
        map[key] = { quizId: a.quizId, quizTitle: a.quizTitle, levelKey: a.levelKey, best: a, count: 0 };
        order.push(key);
      }
      map[key].count++;
      if (isBetter(a, map[key].best)) map[key].best = a;
      map[key].quizTitle = a.quizTitle;
    });
    return order.map(function (k) { return map[k]; })
      .sort(function (x, y) { return y.best.percent - x.best.percent || x.quizTitle.localeCompare(y.quizTitle); });
  }

  function stats(attempts) {
    if (attempts.length === 0) return { count: 0, bestPercent: 0, averagePercent: 0 };
    var sum = 0;
    var top = 0;
    attempts.forEach(function (a) {
      sum += a.percent;
      if (a.percent > top) top = a.percent;
    });
    return { count: attempts.length, bestPercent: top, averagePercent: Math.round(sum / attempts.length) };
  }

  root.QuizStore = {
    KEY: KEY,
    MAX_ATTEMPTS: MAX_ATTEMPTS,
    load: load,
    save: save,
    clear: clear,
    status: status,
    bestFor: bestFor,
    bestByQuizLevel: bestByQuizLevel,
    stats: stats
  };
})(typeof window !== 'undefined' ? window : globalThis);
