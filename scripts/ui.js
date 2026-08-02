/* ============================================================
   植物大战僵尸 — UI 控制脚本 v1.0.0
   ============================================================ */
"use strict";

const APP_VERSION = "v1.0.1";

/* ---------- localStorage 键 ---------- */
const LS_KEYS = {
  level: "pvz_level",
  muted: "pvz_muted",
  mobileTipClosed: "pvz_mobile_tip_closed",
  iphonePWATipClosed: "pvz_iphone_pwa_tip_closed",
};

/* ---------- 音频静音 ---------- */
window._audioMuted = (function () {
  try { return localStorage.getItem(LS_KEYS.muted) === "true"; } catch (e) { return false; }
})();

/* ---------- DOM 引用 ---------- */
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("btn-start");
const helpBtn = document.getElementById("btn-help");
const aboutBtn = document.getElementById("btn-about");
const startMuteBtn = document.getElementById("btn-start-mute");
const startFullscreenBtn = document.getElementById("btn-start-fullscreen");
const toolbar = document.getElementById("game-toolbar");
const fullscreenBtn = document.getElementById("btn-fullscreen");
const muteBtn = document.getElementById("btn-mute");
const instructionsModal = document.getElementById("instructions-modal");
const aboutModal = document.getElementById("about-modal");
const resetConfirmModal = document.getElementById("reset-confirm-modal");
const mobileTip = document.getElementById("mobile-tip");
const iphonePWATip = document.getElementById("iphone-pwa-tip");
const rotateHint = document.getElementById("rotate-hint");
const exitImmersiveBtn = document.getElementById("exit-immersive-btn");
const loadingEl = document.getElementById("loading");
const aboutMuteToggle = document.getElementById("about-mute-toggle");
const aboutFullscreenToggle = document.getElementById("about-fullscreen-toggle");
const aboutResetBtn = document.getElementById("about-reset-btn");

const gameContainer = document.getElementById("wrap");

let pendingStart = false;
let startScreenHidden = false;

/* ============================================================
   版本号
   ============================================================ */
function setVersionElements() {
  const els = document.querySelectorAll("[data-version]");
  for (var i = 0; i < els.length; i++) els[i].textContent = APP_VERSION;
}
setVersionElements();

/* ============================================================
   开始游戏
   ============================================================ */
function doStart(e) {
  if (startScreenHidden) return;
  if (G.state === "ready") {
    hideStartScreen();
    startLevel();
    tryEnterFullscreenOnStart(e);
  } else if (G.state === "loading") {
    pendingStart = true;
    if (startBtn) { startBtn.textContent = "加载中..."; startBtn.disabled = true; }
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

function watchLoading() {
  if (!pendingStart) return;
  if (G.state === "ready") {
    if (startBtn) { startBtn.textContent = "开始游戏"; startBtn.disabled = false; }
    hideStartScreen();
    startLevel();
  } else if (G.state === "loading") {
    if (startBtn && typeof totalCount !== "undefined") {
      var pct = totalCount > 0 ? Math.round(loadedCount / totalCount * 100) : 0;
      startBtn.textContent = "加载中... " + pct + "%";
    }
    requestAnimationFrame(watchLoading);
  }
}

if (startBtn) {
  startBtn.addEventListener("click", function (e) {
    if (typeof initAudio === "function") initAudio();
    doStart(e);
    if (pendingStart) requestAnimationFrame(watchLoading);
  });
}

/* ============================================================
   环境检测
   ============================================================ */
function isWeChat() { return /MicroMessenger/i.test(navigator.userAgent); }
function getFullscreenEnvironment() {
  return {
    isWeChat: isWeChat(),
    fullscreenEnabled: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
    requestFullscreenAvailable: !!(gameContainer.requestFullscreen || gameContainer.webkitRequestFullscreen),
    currentFullscreenElement: !!(document.fullscreenElement || document.webkitFullscreenElement),
    immersiveModeActive: document.body.classList.contains("game-immersive-mode"),
  };
}
(function initDebugMode() {
  if (window.location.search.indexOf("debug=fullscreen") === -1) return;
  var env = getFullscreenEnvironment();
  var p = document.createElement("div");
  p.id = "debug-fullscreen";
  p.style.cssText = "position:fixed;top:4px;left:4px;z-index:999;background:rgba(0,0,0,0.85);color:#0f0;font:11px monospace;padding:6px 10px;border-radius:4px;max-width:95vw;";
  var lines = [];
  for (var k in env) lines.push(k + ": " + env[k]);
  p.textContent = lines.join(" | ");
  document.body.appendChild(p);
})();

function openWeChatGuidance() {
  var wm = document.getElementById("wechat-modal");
  if (wm) wm.classList.remove("hidden");
}
function copyGameURL() {
  var url = window.location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () {
      var btn = document.getElementById("wechat-copy-btn");
      if (btn) { btn.textContent = "已复制!"; setTimeout(function () { btn.textContent = "复制网址"; }, 2000); }
    }).catch(function () {});
  }
}

/* ============================================================
   全屏系统
   ============================================================ */

/* 能力检测 */
function checkFullscreenSupport() {
  return {
    native: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
    elementApi: !!(gameContainer.requestFullscreen || gameContainer.webkitRequestFullscreen),
    orientationLock: !!(screen.orientation && screen.orientation.lock),
  };
}

function isGameFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function enterGameFullscreen() {
  try {
    var el = gameContainer;
    if (el.requestFullscreen) {
      return el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      return el.webkitRequestFullscreen();
    }
  } catch (e) { /* ignore */ }
  return Promise.reject(new Error("Fullscreen not supported"));
}

function exitGameFullscreen() {
  try {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      return document.webkitExitFullscreen();
    }
  } catch (e) { /* ignore */ }
  return Promise.reject(new Error("Exit fullscreen not supported"));
}

function toggleGameFullscreen() {
  if (isGameFullscreen()) {
    exitGameFullscreen().catch(function () {});
  } else if (document.body.classList.contains("game-immersive-mode")) {
    disableImmersiveMode(); updateFullscreenUI(); resizeGameViewport();
  } else {
    if (isWeChat()) {
      enableImmersiveMode(); updateFullscreenUI(); resizeGameViewport(); openWeChatGuidance(); return;
    }
    enterGameFullscreen().then(function () {
      tryLockOrientation();
    }).catch(function () {
      if (!document.body.classList.contains("game-immersive-mode")) enableImmersiveMode();
      if (isWeChat()) openWeChatGuidance();
    });
  }
}

/* 横屏锁定 */
function tryLockOrientation() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(function () {});
    }
  } catch (e) { /* ignore */ }
}

function unlockOrientation() {
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  } catch (e) { /* ignore */ }
}

/* CSS 沉浸模式 */
function enableImmersiveMode() {
  document.body.classList.add("game-immersive-mode", "game-active");
  if (exitImmersiveBtn) exitImmersiveBtn.classList.add("visible");
}

function disableImmersiveMode() {
  document.body.classList.remove("game-immersive-mode", "game-active");
  if (exitImmersiveBtn) exitImmersiveBtn.classList.remove("visible");
}

/* 从启动页进入全屏 */
function tryEnterFullscreenOnStart(clickEvent) {
  if (isWeChat()) { enableImmersiveMode(); updateFullscreenUI(); resizeGameViewport(); return; }
  var support = checkFullscreenSupport();
  if (support.native) {
    enterGameFullscreen().then(tryLockOrientation).catch(function () { enableImmersiveMode(); });
  } else { enableImmersiveMode(); showIphonePWATipIfNeeded(); }
  resizeGameViewport();
}

/* 更新全屏按钮状态 */
function updateFullscreenUI() {
  var isFull = isGameFullscreen();
  var isImmersive = document.body.classList.contains("game-immersive-mode");
  var inWeChat = isWeChat();
  var icon = isFull ? "✕" : (isImmersive ? "✕" : "⛶");
  var title = isFull ? "退出全屏" : (isImmersive ? "退出沉浸布局" : (inWeChat ? "沉浸布局（微信不支持原生全屏）" : "全屏"));
  if (fullscreenBtn) { fullscreenBtn.textContent = icon; fullscreenBtn.title = title; fullscreenBtn.setAttribute("aria-label", title); fullscreenBtn.setAttribute("aria-pressed", isFull || isImmersive ? "true" : "false"); }
  if (startFullscreenBtn) {
    var sfEl = startFullscreenBtn.querySelector(".tool-label");
    if (sfEl) sfEl.textContent = inWeChat ? "沉浸" : "全屏";
    startFullscreenBtn.setAttribute("aria-pressed", isFull || isImmersive ? "true" : "false");
  }
  if (!isFull && !isImmersive) disableImmersiveMode();
}

/* 全屏事件监听 */
document.addEventListener("fullscreenchange", function () {
  if (!document.fullscreenElement) {
    disableImmersiveMode();
    unlockOrientation();
  }
  updateFullscreenUI();
  resizeGameViewport();
});
document.addEventListener("webkitfullscreenchange", function () {
  if (!document.webkitFullscreenElement) {
    disableImmersiveMode();
    unlockOrientation();
  }
  updateFullscreenUI();
  resizeGameViewport();
});
document.addEventListener("fullscreenerror", function () {
  if (!document.body.classList.contains("game-immersive-mode")) {
    enableImmersiveMode();
  }
  updateFullscreenUI();
});

/* 全屏按钮 */
if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", function () {
    if (document.body.classList.contains("game-immersive-mode") && !isGameFullscreen()) {
      disableImmersiveMode();
      updateFullscreenUI();
      resizeGameViewport();
      return;
    }
    toggleGameFullscreen();
  });
}

if (startFullscreenBtn) {
  startFullscreenBtn.addEventListener("click", function () {
    toggleGameFullscreen();
  });
}

/* 退出沉浸按钮 */
if (exitImmersiveBtn) {
  exitImmersiveBtn.addEventListener("click", function () {
    if (isGameFullscreen()) {
      exitGameFullscreen().catch(function () {});
    }
    disableImmersiveMode();
    updateFullscreenUI();
    resizeGameViewport();
  });
}

updateFullscreenUI();

/* ============================================================
   游戏视口适配
   ============================================================ */
function resizeGameViewport() {
  var canvas = document.getElementById("game");
  if (!canvas) return;
  var gameW = 900, gameH = 600;
  var vw = window.innerWidth, vh = window.innerHeight;
  var scale = Math.min(vw / gameW, vh / gameH);
  canvas.style.width = (gameW * scale) + "px";
  canvas.style.height = (gameH * scale) + "px";
}

window.addEventListener("resize", resizeGameViewport);
window.addEventListener("orientationchange", function () {
  updateRotateHint();
  setTimeout(resizeGameViewport, 100);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeGameViewport);
}
resizeGameViewport();

/* ============================================================
   旋转提示
   ============================================================ */
function updateRotateHint() {
  if (!rotateHint) return;
  var isPortrait = window.innerWidth < window.innerHeight;
  var isMobile = isTouchDevice() || window.innerWidth < 700;
  var isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  if (isMobile && isPortrait && !isStandalone && G && (G.state === "playing" || G.state === "win" || G.state === "lose")) {
    rotateHint.classList.remove("hidden");
  } else {
    rotateHint.classList.add("hidden");
  }
}

window.addEventListener("orientationchange", updateRotateHint);
window.addEventListener("resize", updateRotateHint);
document.addEventListener("fullscreenchange", updateRotateHint);

/* ============================================================
   静音控制
   ============================================================ */
function updateAllMuteUI() {
  var label = window._audioMuted ? "🔇" : "🔊";
  var title = window._audioMuted ? "取消静音" : "静音";

  if (muteBtn) {
    muteBtn.textContent = label;
    muteBtn.title = title;
    muteBtn.setAttribute("aria-label", title);
  }
  if (startMuteBtn) {
    var iconEl = startMuteBtn.querySelector(".tool-icon");
    if (iconEl) iconEl.textContent = label;
    startMuteBtn.setAttribute("aria-pressed", window._audioMuted ? "false" : "true");
  }
  if (aboutMuteToggle) {
    aboutMuteToggle.textContent = window._audioMuted ? "🔇 已静音" : "🔊 已开启";
  }
}

function toggleMute() {
  window._audioMuted = !window._audioMuted;
  try { localStorage.setItem(LS_KEYS.muted, String(window._audioMuted)); } catch (e) {}
  updateAllMuteUI();
}

if (muteBtn) muteBtn.addEventListener("click", toggleMute);
if (startMuteBtn) startMuteBtn.addEventListener("click", toggleMute);
if (aboutMuteToggle) aboutMuteToggle.addEventListener("click", toggleMute);
updateAllMuteUI();

/* ============================================================
   操作说明弹窗
   ============================================================ */
function openInstructions() {
  if (instructionsModal) instructionsModal.classList.remove("hidden");
}
function closeInstructions() {
  if (instructionsModal) instructionsModal.classList.add("hidden");
}

if (helpBtn) helpBtn.addEventListener("click", openInstructions);
if (instructionsModal) {
  instructionsModal.querySelector(".modal-close").addEventListener("click", closeInstructions);
  instructionsModal.querySelector(".modal-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeInstructions();
  });
}

/* ============================================================
   关于项目弹窗
   ============================================================ */
function openAbout() {
  if (aboutModal) {
    updateAllMuteUI();
    aboutModal.classList.remove("hidden");
  }
}
function closeAbout() {
  if (aboutModal) aboutModal.classList.add("hidden");
}

if (aboutBtn) aboutBtn.addEventListener("click", openAbout);
if (aboutModal) {
  aboutModal.querySelector(".modal-close").addEventListener("click", closeAbout);
  aboutModal.querySelector(".modal-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeAbout();
  });
}

/* 关于面板中的全屏切换 */
if (aboutFullscreenToggle) {
  aboutFullscreenToggle.addEventListener("click", function () {
    if (document.body.classList.contains("game-immersive-mode") && !isGameFullscreen()) {
      disableImmersiveMode();
      updateFullscreenUI();
      resizeGameViewport();
      return;
    }
    toggleGameFullscreen();
  });
}

/* ============================================================
   重置存档
   ============================================================ */
function openResetConfirm() {
  if (resetConfirmModal) resetConfirmModal.classList.remove("hidden");
}
function closeResetConfirm() {
  if (resetConfirmModal) resetConfirmModal.classList.add("hidden");
}
function doResetSave() {
  try {
    localStorage.removeItem(LS_KEYS.level);
  } catch (e) {}
  closeResetConfirm();
  window.location.reload();
}

if (aboutResetBtn) aboutResetBtn.addEventListener("click", openResetConfirm);
if (resetConfirmModal) {
  resetConfirmModal.querySelector(".modal-overlay").addEventListener("click", function (e) {
    if (e.target === this) closeResetConfirm();
  });
  var resetCancel = resetConfirmModal.querySelector(".btn-cancel");
  var resetConfirm = resetConfirmModal.querySelector(".btn-confirm");
  if (resetCancel) resetCancel.addEventListener("click", closeResetConfirm);
  if (resetConfirm) resetConfirm.addEventListener("click", doResetSave);
}

/* ============================================================
   手机提示
   ============================================================ */
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

/* ============================================================
   iPhone 添加主屏幕提示
   ============================================================ */
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator && window.navigator.standalone);
}

function showIphonePWATipIfNeeded() {
  if (!iphonePWATip) return;
  if (!isIOS() || isStandalone()) return;
  try {
    if (localStorage.getItem(LS_KEYS.iphonePWATipClosed) === "true") return;
  } catch (e) { return; }
  iphonePWATip.classList.remove("hidden");
}

function closeIphonePWATip() {
  if (iphonePWATip) iphonePWATip.classList.add("hidden");
  try { localStorage.setItem(LS_KEYS.iphonePWATipClosed, "true"); } catch (e) {}
}

if (iphonePWATip) {
  var iphoneClose = iphonePWATip.querySelector(".tip-close");
  if (iphoneClose) iphoneClose.addEventListener("click", closeIphonePWATip);
  /* 首次进入沉浸模式时检查 */
}

/* ============================================================
   Escape 关闭弹窗
   ============================================================ */
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  var closed = false;
  if (instructionsModal && !instructionsModal.classList.contains("hidden")) {
    closeInstructions(); closed = true;
  }
  if (aboutModal && !aboutModal.classList.contains("hidden")) {
    closeAbout(); closed = true;
  }
  if (resetConfirmModal && !resetConfirmModal.classList.contains("hidden")) {
    closeResetConfirm(); closed = true;
  }
  if (closed) { e.stopPropagation(); return; }
  /* ESC in game exits fullscreen */
  if (isGameFullscreen()) {
    exitGameFullscreen().catch(function () {});
    e.stopPropagation();
    return;
  }
  if (document.body.classList.contains("game-immersive-mode")) {
    disableImmersiveMode();
    updateFullscreenUI();
    resizeGameViewport();
    e.stopPropagation();
    return;
  }
});

/* ============================================================
   初始状态
   ============================================================ */
if (toolbar) toolbar.classList.add("hidden");
if (rotateHint) rotateHint.classList.add("hidden");

/* 如果游戏已经在运行，跳过启动屏 */
(function checkGameRunning() {
  if (typeof G !== "undefined" && (G.state === "playing" || G.state === "win" || G.state === "lose")) {
    hideStartScreen();
  }
})();

/* 初始视口适配 */
resizeGameViewport();

/* 横屏提示更新 */
updateRotateHint();

/* ============================================================
   standalone 模式的沉浸体验
   ============================================================ */
if (isStandalone()) {
  document.body.classList.add("game-active");
  resizeGameViewport();
}
