// Piano Play Lab voice guide: uses browser-native Web Speech API only.
// No speech recognition, recordings, remote speech API, or model downloads.
const ENGLISH = /^en(?:[-_]|$)/i;
const FEMININE_NAME_HINT = /(?:jenny|aria|zira|samantha|victoria|karen|susan|sophie|serena|ava|hazel|heather|moira|allison|female)/i;

export function englishVoices(voices) {
  return Array.from(voices || []).filter(v => ENGLISH.test(v.lang || ''));
}
export function chooseEnglishVoice(voices, preferredURI = '') {
  const list = englishVoices(voices);
  if (preferredURI) {
    const selected = list.find(v => v.voiceURI === preferredURI);
    if (selected) return selected;
  }
  // Voice metadata has no reliable gender property. These are best-effort hints.
  return list.find(v => FEMININE_NAME_HINT.test(v.name || ''))
      || list.find(v => /^en[-_]CA$/i.test(v.lang || ''))
      || list.find(v => /^en[-_]US$/i.test(v.lang || ''))
      || list[0] || null;
}
export class VoiceGuide {
  constructor({synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance,
               onState = () => {}, onBegin = () => {}, onFinish = () => {}} = {}) {
    this.synth = synth || null;
    this.Utterance = Utterance || null;
    this.onState = onState;
    this.onBegin = onBegin;
    this.onFinish = onFinish;
    this.active = false;
    this.epoch = 0;
    this.speed = 0.88;
    this.preferredURI = '';
    this.voices = [];
    this.utterance = null; // Keep a strong reference for Android/Chrome onend callbacks.
    this.supported = !!(this.synth && this.Utterance);
    this.refreshVoices();
  }
  get isSpeaking() { return this.active; }
  refreshVoices() {
    if (!this.supported) return [];
    try { this.voices = englishVoices(this.synth.getVoices()); } catch { this.voices = []; }
    return this.voices;
  }
  setVoice(uri = '') { this.preferredURI = uri; }
  setSpeed(speed) { this.speed = Number.isFinite(Number(speed)) ? Math.max(0.6, Math.min(1.2, Number(speed))) : 0.88; }
  notify(type, message) { this.onState({type,message}); }
  // Stop/replace any current narration; late events from old speech are ignored.
  stop() {
    const wasActive = this.active;
    this.epoch++;
    this.active = false;
    this.utterance = null;
    if (this.supported) {
      try { this.synth.cancel(); } catch { /* unavailable on this platform */ }
    }
    if (wasActive) this.onFinish('stopped');
    this.notify(this.supported ? 'ready' : 'unsupported', this.supported ? 'Narration stopped. Ready to play.' : 'Speech is unavailable in this browser.');
  }
  speak(text) {
    if (!this.supported) {
      this.notify('unsupported','Text-to-speech is unavailable in this browser. Try Chrome or Edge.');
      return false;
    }
    if (!String(text || '').trim()) return false;
    this.stop();
    const token = ++this.epoch;
    let utterance;
    try {
      utterance = new this.Utterance(String(text));
      utterance.lang = 'en-US';
      utterance.rate = this.speed;
      utterance.pitch = 1.04;
      utterance.volume = 1;
      const selected = chooseEnglishVoice(this.refreshVoices(),this.preferredURI);
      if (selected) { utterance.voice = selected; utterance.lang = selected.lang; }
      // Blocking begins before speak(), not when the asynchronous onstart event fires.
      this.active = true;
      this.utterance = utterance;
      this.onBegin();
      this.notify('speaking','Speaking lesson instructions. Piano scoring is paused.');
      const end = reason => {
        if (token !== this.epoch || !this.active) return;
        this.active = false;
        this.utterance = null;
        this.epoch++;
        this.onFinish(reason);
        this.notify(reason==='finished' ? 'ready':'error',reason==='finished'?'Instructions finished. Play your piano!':'Speech was interrupted. You can try again.');
      };
      utterance.onend = () => end('finished');
      utterance.onerror = event => end(event?.error === 'canceled' ? 'finished':'error');
      this.synth.speak(utterance);
      return true;
    } catch (error) {
      if (this.active && token===this.epoch) {
        this.active = false; this.utterance = null; this.epoch++; this.onFinish('error');
      }
      this.notify('error',`Could not read instructions: ${error.message || error}`);
      return false;
    }
  }
}
