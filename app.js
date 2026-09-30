(function () {
  "use strict";

  var MAX_MINUTES = 99;
  var MAX_SECONDS = 59;
  var TICK_INTERVAL_MS = 200;

  var form = document.getElementById("timer-form");
  var minutesInput = document.getElementById("minutes");
  var secondsInput = document.getElementById("seconds");
  var remainingEl = document.getElementById("remaining");
  var statusEl = document.getElementById("status");
  var errorEl = document.getElementById("error");
  var startButton = document.getElementById("start");
  var pauseButton = document.getElementById("pause");
  var resetButton = document.getElementById("reset");

  var remainingMs = 0; // 残り時間
  var deadline = 0; // 実行中の終了予定時刻
  var intervalId = null;
  var state = "idle"; // idle | running | paused | finished

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function formatTime(ms) {
    var totalSeconds = Math.ceil(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return pad(minutes) + ":" + pad(seconds);
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function parseField(input, max, label) {
    var raw = input.value.trim();
    if (raw === "") {
      return { error: label + "を入力してください。" };
    }
    if (!/^\d+$/.test(raw)) {
      return { error: label + "は0以上の整数で入力してください。" };
    }
    var value = Number(raw);
    if (value > max) {
      return { error: label + "は0〜" + max + "の範囲で入力してください。" };
    }
    return { value: value };
  }

  function readSettings() {
    var minutes = parseField(minutesInput, MAX_MINUTES, "分");
    if (minutes.error) {
      return { error: minutes.error, focus: minutesInput };
    }
    var seconds = parseField(secondsInput, MAX_SECONDS, "秒");
    if (seconds.error) {
      return { error: seconds.error, focus: secondsInput };
    }
    var ms = (minutes.value * 60 + seconds.value) * 1000;
    if (ms <= 0) {
      return { error: "1秒以上の時間を設定してください。", focus: minutesInput };
    }
    return { ms: ms };
  }

  function render() {
    remainingEl.textContent = formatTime(remainingMs);
    remainingEl.classList.toggle("finished", state === "finished");
    document.title = state === "idle"
      ? "シンプルタイマー"
      : formatTime(remainingMs) + " - シンプルタイマー";
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function updateControls() {
    var running = state === "running";
    startButton.disabled = running;
    pauseButton.disabled = !(running || state === "paused");
    pauseButton.textContent = state === "paused" ? "再開" : "一時停止";
    minutesInput.disabled = running || state === "paused";
    secondsInput.disabled = running || state === "paused";
  }

  function stopTicking() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function tick() {
    remainingMs = Math.max(0, deadline - Date.now());
    render();
    if (remainingMs === 0) {
      finish();
    }
  }

  function finish() {
    stopTicking();
    state = "finished";
    remainingMs = 0;
    render();
    updateControls();
    setStatus("時間になりました。");
    notify();
  }

  function notify() {
    playBeep();
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([200, 100, 200]);
    }
  }

  function playBeep() {
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    try {
      var context = new AudioContextClass();
      var startAt = context.currentTime;
      var gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.2);
      gain.connect(context.destination);

      var oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, startAt);
      oscillator.connect(gain);
      oscillator.start(startAt);
      oscillator.stop(startAt + 1.25);
      oscillator.onended = function () {
        if (typeof context.close === "function") {
          context.close();
        }
      };
    } catch (e) {
      // 音が鳴らせない環境では、視覚的な表示のみでお知らせします。
    }
  }

  function start() {
    if (state === "running") {
      return;
    }
    if (state === "paused") {
      resume();
      return;
    }
    var settings = readSettings();
    if (settings.error) {
      showError(settings.error);
      setStatus("入力内容を確認してください。");
      if (settings.focus) {
        settings.focus.focus();
      }
      return;
    }
    clearError();
    remainingMs = settings.ms;
    beginCountdown();
    setStatus("カウントダウン中です。");
  }

  function beginCountdown() {
    state = "running";
    deadline = Date.now() + remainingMs;
    stopTicking();
    intervalId = setInterval(tick, TICK_INTERVAL_MS);
    render();
    updateControls();
  }

  function pause() {
    if (state !== "running") {
      return;
    }
    stopTicking();
    remainingMs = Math.max(0, deadline - Date.now());
    state = "paused";
    render();
    updateControls();
    setStatus("一時停止中です。残り " + formatTime(remainingMs) + " です。");
  }

  function resume() {
    if (state !== "paused") {
      return;
    }
    beginCountdown();
    setStatus("カウントダウンを再開しました。");
  }

  function togglePause() {
    if (state === "running") {
      pause();
    } else if (state === "paused") {
      resume();
    }
  }

  function reset() {
    stopTicking();
    clearError();
    state = "idle";
    var settings = readSettings();
    remainingMs = settings.error ? 0 : settings.ms;
    render();
    updateControls();
    setStatus("リセットしました。");
  }

  function handleSettingsChange() {
    if (state === "running" || state === "paused") {
      return;
    }
    clearError();
    state = "idle";
    var settings = readSettings();
    remainingMs = settings.error ? 0 : settings.ms;
    render();
    updateControls();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    start();
  });

  startButton.addEventListener("click", start);
  pauseButton.addEventListener("click", togglePause);
  resetButton.addEventListener("click", reset);
  minutesInput.addEventListener("input", handleSettingsChange);
  secondsInput.addEventListener("input", handleSettingsChange);

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && state === "running") {
      tick();
    }
  });

  handleSettingsChange();
  setStatus("停止中です。");
})();
