/* ============================================================
   植物大战僵尸 — UI 控制脚本
   ============================================================ */
"use strict";

const APP_VERSION = "v1.0.0";

// ---------- localStorage 键 ----------
const LS_KEYS = {
  level: "pvz_level",
  muted: "pvz_muted",
  mobileTipClosed: "pvz_mobile_tip_closed",
};

// ---------- 音频静音 ----------
window._audioMuted = (function () {
  try { return localStorage.getItem(LS_KEYS.muted) === "true"; } catch (e) { return false; }
})();

// ---------- DOM 引用 ----------
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("btn-start");
const helpBtn = document.getElementById("btn-help");
const githubBtn = document.getElementById("btn-github");
const resetBtn = document.getElementById("btn-reset");
const muteBtn = document.getElementById("btn-mute");
const fullscreenBtn = document.getElementById("btn-fullscreen");
const toolbar = document.getElementById("game-toolbar");
const instructionsModal = document.getElementById("instructions-modal");
const resetConfirmModal = document.getElementById("reset-confirm-modal");
const mobileTip = document.getElementById("mobile-tip");
const loadingBar = document.getElementById("prog");
const loadingPct = document.getElementById("pct");
const loadingEl = document.getElementById("loading");

let pendingStart = false;
let startScreenHidden = false;

// ---------- 版本号 ----------
function setVersionElements() {
  const els = document.querySelectorAll("[data-version]");
  for (const el of els) el.textContent = APP_VERSION;
}
setVersionElements();

// ---------- 开始游戏 ----------
function doStart() {
  if (startScreenHidden) return;
  if (G.state === "ready") {
    hideStartScreen();
    startLevel();
  } else if (G.state === "loading") {
    pendingStart = true;
    if (startBtn) {
      startBtn.textContent = "加载中...";
      startBtn.disabled = true;
      startBtn.style.opacity = "0.6";
    }
  } else if (G.state === "playing" || G.state === "win" || G.state === "lose") {
    hideStartScreen();
  }
}

function hideStartScreen() {
  if (startScreenHidden) return;
  startScreenHidden = true;
  if (startScreen) startScreen.classList.add("hidden");
  if (toolbar) toolbar.classList.remove("hidden");
  if (loadingEl) loadingEl.style.zIndex = "5";
  pendingStart = false;
}

function updateStartLoadingProgress() {
  if (!startBtn || !pendingStart) return;
  const pct = totalCount > 0 ? Math.round(loadedCount / totalCount * 100) : 0;
  startBtn.textContent = "加载中... " + pct + "%";
}

// 监听游戏加载完成
function watchLoading() {
  if (!pendingStart) return;
  if (G.state === "ready") {
    if (startBtn) { startBtn.textContent = "开始游戏"; startBtn.disabled = false; startBtn.style.opacity = "1"; }
    hideStartScreen();
    startLevel();
  } else if (G.state === "loading") {
    updateStartLoadingProgress();
    requestAnimationFrame(watchLoading);
  }
}

if (startBtn) {
  startBtn.addEventListener("click", function () {
    if (typeof initAudio === "function") initAudio();
    doStart();
    if (pendingStart) requestAnimationFrame(watchLoading);
  });
}

// ---------- 操作说明 ----------
function openInstructions() {
  if (instructionsModal) instructionsModal.classList.remove("hidden");
}

function closeInstructions() {
  if (instructionsModal) instructionsModal.classList.add("hidden");
}

if (helpBtn) {
  helpBtn.addEventListener("click", openInstructions);
}

if (instructionsModal) {
  instructionsModal.querySelector(".modal-close").addEventListener("click", closeInstructions);
  instructionsModal.querySelector(".modal-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeInstructions();
  });
}

// ---------- GitHub ----------
if (githubBtn) {
  githubBtn.addEventListener("click", function () {
    window.open("https://github.com/l123z456k789-png/pvz-clone", "_blank", "noopener");
  });
}

// ---------- 全屏按钮 ----------
function updateFullscreenIcon() {
  if (!fullscreenBtn) return;
  const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
  fullscreenBtn.textContent = isFull ? "⛶" : "⛶";
  fullscreenBtn.title = isFull ? "退出全屏" : "全屏";
  fullscreenBtn.style.opacity = isFull ? "1" : "0.7";
}

function toggleFullscreen() {
  try {
    const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isFull) {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(function () { /* 静默失败 */ });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  } catch (e) {
    // 浏览器不支持全屏
  }
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", toggleFullscreen);
}

document.addEventListener("fullscreenchange", updateFullscreenIcon);
document.addEventListener("webkitfullscreenchange", updateFullscreenIcon);

// ---------- 静音按钮 ----------
function updateMuteIcon() {
  if (!muteBtn) return;
  muteBtn.textContent = window._audioMuted ? "🔇" : "🔊";
  muteBtn.title = window._audioMuted ? "取消静音" : "静音";
}

function toggleMute() {
  window._audioMuted = !window._audioMuted;
  try { localStorage.setItem(LS_KEYS.muted, String(window._audioMuted)); } catch (e) {}
  updateMuteIcon();
}

if (muteBtn) {
  muteBtn.addEventListener("click", toggleMute);
}
updateMuteIcon();

// ---------- 重置存档 ----------
function openResetConfirm() {
  if (resetConfirmModal) resetConfirmModal.classList.remove("hidden");
}

function closeResetConfirm() {
  if (resetConfirmModal) resetConfirmModal.classList.add("hidden");
}

function doResetSave() {
  try {
    localStorage.removeItem(LS_KEYS.level);
    // 保留静音和手机提示偏好
  } catch (e) {}
  closeResetConfirm();
  window.location.reload();
}

if (resetBtn) {
  resetBtn.addEventListener("click", openResetConfirm);
}

if (resetConfirmModal) {
  resetConfirmModal.querySelector(".modal-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeResetConfirm();
  });
  var resetCancel = resetConfirmModal.querySelector(".btn-cancel");
  var resetConfirm = resetConfirmModal.querySelector(".btn-confirm");
  if (resetCancel) resetCancel.addEventListener("click", closeResetConfirm);
  if (resetConfirm) resetConfirm.addEventListener("click", doResetSave);
}

// ---------- 手机提示 ----------
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function isNarrowScreen() {
  return window.innerWidth < 700;
}

function shouldShowMobileTip() {
  if (!isTouchDevice() && !isNarrowScreen()) return false;
  try {
    if (localStorage.getItem(LS_KEYS.mobileTipClosed) === "true") return false;
  } catch (e) { return false; }
  return true;
}

function showMobileTip() {
  if (!mobileTip || !shouldShowMobileTip()) return;
  mobileTip.classList.remove("hidden");
}

function closeMobileTip() {
  if (mobileTip) mobileTip.classList.add("hidden");
  try { localStorage.setItem(LS_KEYS.mobileTipClosed, "true"); } catch (e) {}
}

if (mobileTip) {
  var tipClose = mobileTip.querySelector(".tip-close");
  if (tipClose) tipClose.addEventListener("click", closeMobileTip);
  showMobileTip();
}

// ---------- Escape 关闭弹窗 ----------
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if (instructionsModal && !instructionsModal.classList.contains("hidden")) {
    closeInstructions();
    e.stopPropagation();
    return;
  }
  if (resetConfirmModal && !resetConfirmModal.classList.contains("hidden")) {
    closeResetConfirm();
    e.stopPropagation();
    return;
  }
});

// ---------- 初始状态 ----------
if (toolbar) toolbar.classList.add("hidden");

// 页面加载时，如果游戏已经被某些方式启动（例如直接跳过开始屏幕的场景），确保工具栏可见
(function checkGameRunning() {
  if (G && (G.state === "playing" || G.state === "win" || G.state === "lose")) {
    hideStartScreen();
  }
})();
