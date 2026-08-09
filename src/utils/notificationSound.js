// A long-lived shared AudioContext (the previous approach here) gets
// auto-suspended by Android's power management after periods of inactivity
// -- especially right after the app comes back from background, which is
// exactly when app-open checks and foreground pushes fire. Resuming it is
// async and, on some devices, audibly slow (multi-second lag between the
// popup and the sound). A plain <audio> element sidesteps that entirely:
// there's no persistent audio graph to suspend, just a one-shot play().
const CHIME_DATA_URI = synthesizeChimeDataUri();

function synthesizeChimeDataUri() {
  const sampleRate = 8000;
  const duration = 0.4;
  const totalSamples = Math.floor(sampleRate * duration);
  const samples = new Int16Array(totalSamples);

  const addTone = (freq, startTime, toneDuration) => {
    const startSample = Math.floor(startTime * sampleRate);
    const numSamples = Math.floor(toneDuration * sampleRate);
    for (let i = 0; i < numSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;
      const t = i / sampleRate;
      const envelope = Math.min(t / 0.02, 1) * Math.exp(-t * 8);
      const value = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
      samples[idx] = Math.max(-1, Math.min(1, samples[idx] / 32767 + value)) * 32767;
    }
  };

  addTone(880, 0, 0.18);
  addTone(1175, 0.15, 0.25);

  const headerSize = 44;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(headerSize + i * 2, samples[i], true);
  }

  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }

  return `data:audio/wav;base64,${btoa(binary)}`;
}

// No proactive "unlock on first tap" priming here -- that approach played an
// audible chime on literally any first tap post-launch (including normal
// navigation), which is worse than the thing it was trying to fix. This is
// genuinely best-effort: the browser blocks audio that isn't tied to a
// gesture, so playNotificationSound() below sometimes plays and sometimes
// silently doesn't, depending on whether the user happened to interact with
// something before the notification fired. That's an accepted tradeoff, not
// a bug to keep chasing.
export const playNotificationSound = async () => {
  try {
    const audio = new Audio(CHIME_DATA_URI);
    await audio.play();
  } catch (error) {
    // Sound is a nice-to-have -- never let it block the actual notification.
    // Logged (not swallowed silently) since autoplay-policy failures are
    // otherwise invisible during on-device testing.
    console.error("playNotificationSound failed:", error?.name, error?.message);
  }
};
