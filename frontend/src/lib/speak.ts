// The farmer's phone actually speaks the alert — free, offline, built into the browser.
// Replaces the Twilio voice call for the demo. Prefers a Hindi (hi-IN) voice, falls back
// to Indian English, then any voice.

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Only a voice whose language ACTUALLY matches — never a fallback to English, because
// reading Kannada/Hindi text with an English voice sounds wrong and confuses everyone.
export function voiceFor(lang: string): SpeechSynthesisVoice | undefined {
  if (!canSpeak()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const target = lang.toLowerCase().replace("_", "-");
  const two = target.slice(0, 2);
  return (
    voices.find((v) => v.lang?.toLowerCase().replace("_", "-") === target) ||
    voices.find((v) => v.lang?.toLowerCase().replace("_", "-").startsWith(two))
  );
}

// Is there a real voice for this language on THIS device?
export function hasVoiceFor(lang: string): boolean {
  return !!voiceFor(lang);
}

// Amazon Polly audio, when /api/speak returns mp3. stopSpeak/pause/resume
// cover both this clip and the browser voice so Accept still cuts the alert.
let pollyAudio: HTMLAudioElement | null = null;

export async function playAudioBlob(blob: Blob, onEnd?: () => void) {
  stopSpeak();
  const url = URL.createObjectURL(blob);
  const el = new Audio(url);
  pollyAudio = el;
  el.onended = () => {
    URL.revokeObjectURL(url);
    if (pollyAudio === el) pollyAudio = null;
    onEnd?.();
  };
  await el.play();
}

export function speak(text: string, lang = "hi-IN", onEnd?: () => void) {
  if (!canSpeak()) {
    onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  let started = false;
  const run = () => {
    if (started) return;
    started = true;
    const v = voiceFor(lang);
    if (!v) {
      // No voice for this language — do NOT read it in the wrong voice.
      onEnd?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = v.lang || lang;
    u.rate = 0.95;
    u.pitch = 1;
    u.voice = v;
    if (onEnd) u.onend = onEnd;
    synth.speak(u);
  };

  // some browsers populate voices asynchronously
  if (synth.getVoices().length === 0) {
    synth.onvoiceschanged = () => {
      synth.onvoiceschanged = null;
      run();
    };
    setTimeout(run, 350); // safety net if the event never fires
  } else {
    run();
  }
}

export function pauseSpeak() {
  if (pollyAudio && !pollyAudio.paused) {
    pollyAudio.pause();
    return;
  }
  if (canSpeak()) window.speechSynthesis.pause();
}

export function resumeSpeak() {
  if (pollyAudio && pollyAudio.paused) {
    void pollyAudio.play();
    return;
  }
  if (canSpeak()) window.speechSynthesis.resume();
}

export function isSpeaking() {
  return canSpeak() && window.speechSynthesis.speaking;
}

export function stopSpeak() {
  if (canSpeak()) window.speechSynthesis.cancel();
  if (pollyAudio) {
    const el = pollyAudio;
    pollyAudio = null;
    el.onended = null;
    el.pause();
    el.removeAttribute("src");
    el.load();
  }
}
