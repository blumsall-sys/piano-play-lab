// A pure, dependency-free rhythmic timeline. One entry = one key press.
// The v1.8 lesson engine still scores pitches in sequence, not performance timing.
export function buildMelodyTimeline(notes, melodyBeats, bpm, leadInSeconds = 0.12) {
  if (!Array.isArray(notes) || !notes.length || !Array.isArray(melodyBeats) || melodyBeats.length !== notes.length)
    throw new Error('A preview needs one duration per note.');
  if (!Number.isFinite(bpm) || bpm <= 0) throw new Error('Invalid beats per minute.');
  const beatSeconds = 60 / bpm;
  let cursor = leadInSeconds;
  const events = notes.map((midi, i) => {
    const beats = melodyBeats[i];
    if (!Number.isInteger(midi) || !Number.isFinite(beats) || beats <= 0) throw new Error('Invalid note or duration.');
    const event = {midi, start: cursor, duration: beats * beatSeconds};
    cursor += event.duration;
    return event;
  });
  return {events, totalSeconds: cursor};
}
