// 同じバーコードがこの時間(ms)映らなくなったら、次は新しい読み取りとして扱う
const REPEAT_GAP_MS = 1500;

export class Scanner {
  constructor({ video, onDetect }) {
    this.video = video;
    this.onDetect = onDetect;
    this.reader = null;
    this.running = false;
    this.lastText = "";
    this.lastSeen = 0;
  }

  async start() {
    if (this.running) return;

    if (!window.ZXing) {
      throw new Error("ZXING_NOT_LOADED");
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("CAMERA_UNSUPPORTED");
    }

    this.running = true;

    const hints = new Map();
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
      ZXing.BarcodeFormat.EAN_13,
      ZXing.BarcodeFormat.EAN_8,
    ]);
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

    this.reader = new ZXing.BrowserMultiFormatReader(hints, 200);

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };

    try {
      await this.reader.decodeFromConstraints(constraints, this.video, (result) => {
        if (result) this._handle(result.getText());
      });
    } catch (err) {
      this.stop();
      throw err;
    }
  }

  stop() {
    this.running = false;
    if (this.reader) {
      this.reader.reset();
      this.reader = null;
    }
  }

  _handle(text) {
    const now = Date.now();
    const isRepeat = text === this.lastText && now - this.lastSeen < REPEAT_GAP_MS;
    this.lastText = text;
    this.lastSeen = now;
    if (isRepeat) return; // 映しっぱなしの同じバーコードは1回だけ
    this.onDetect(text);
  }
}
