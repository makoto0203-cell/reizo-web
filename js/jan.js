import { Scanner } from "./scanner.js";
import { normalizeJan, isValidJan } from "./jan.js";

const $ = (id) => document.getElementById(id);

const els = {
  status: $("status"),
  camera: document.querySelector(".camera"),
  video: $("video"),
  message: $("camera-message"),
  messageText: $("camera-message-text"),
  retry: $("retry-button"),
  result: $("result"),
  resultCode: $("result-code"),
  resultHint: $("result-hint"),
  historyList: $("history-list"),
  historyEmpty: $("history-empty"),
};

// 将来、商品情報やカテゴリーもここに持たせる想定
const state = {
  scans: [], // { code, time }
};

/* ---------- 表示まわり ---------- */

function setStatus(text, type = "") {
  els.status.textContent = text;
  els.status.className = "status" + (type ? " is-" + type : "");
}

function showCameraMessage(text, showButton = true) {
  els.messageText.textContent = text;
  els.retry.hidden = !showButton;
  els.message.hidden = false;
}

function hideCameraMessage() {
  els.message.hidden = true;
}

function flashHit() {
  els.camera.classList.add("is-hit");
  els.result.classList.add("is-hit");
  setTimeout(() => {
    els.camera.classList.remove("is-hit");
    els.result.classList.remove("is-hit");
  }, 600);
}

function renderHistory() {
  els.historyList.innerHTML = "";
  els.historyEmpty.hidden = state.scans.length > 0;

  for (const scan of state.scans) {
    const li = document.createElement("li");

    const code = document.createElement("span");
    code.textContent = scan.code;

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = scan.time.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    li.append(code, time);
    els.historyList.appendChild(li);
  }
}

/* ---------- 読み取り ---------- */

function handleDetect(rawText) {
  const code = normalizeJan(rawText);
  if (!isValidJan(code)) return; // 読み間違いは無視

  state.scans.unshift({ code, time: new Date() });
  if (state.scans.length > 50) state.scans.pop();

  els.resultCode.textContent = code;
  els.resultHint.textContent = "次のバーコードを読み取れます";
  renderHistory();
  flashHit();
}

const scanner = new Scanner({ video: els.video, onDetect: handleDetect });

function errorText(err) {
  switch (err && err.name) {
    case "NotAllowedError":
      return "カメラの使用が許可されていません。Safariのアドレスバー左の「aA」→「Webサイトの設定」→「カメラ」で許可してください。";
    case "NotFoundError":
      return "カメラが見つかりませんでした。";
    case "NotReadableError":
      return "カメラを他のアプリが使用中です。閉じてからやり直してください。";
  }
  if (err && err.message === "ZXING_NOT_LOADED") {
    return "読み取りライブラリを読み込めませんでした。通信状況を確認してください。";
  }
  if (err && err.message === "CAMERA_UNSUPPORTED") {
    return "この環境ではカメラを使えません。HTTPSで開いているか確認してください。";
  }
  return "カメラを起動できませんでした。";
}

async function startCamera() {
  hideCameraMessage();
  setStatus("カメラ起動中");
  try {
    await scanner.start();
    setStatus("読み取り中", "active");
  } catch (err) {
    console.error(err);
    setStatus("エラー", "error");
    showCameraMessage(errorText(err));
  }
}

/* ---------- 初期化 ---------- */

els.retry.addEventListener("click", startCamera);

// タブ切り替え(今は「スキャン」のみ。画面を追加するとそのまま使えます)
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
    tab.classList.add("is-active");
    $(tab.dataset.view).classList.add("is-active");
  });
});

// 画面を離れたらカメラを止め、戻ったら再開する(iPhone対策)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    scanner.stop();
  } else {
    startCamera();
  }
});

renderHistory();
startCamera();
