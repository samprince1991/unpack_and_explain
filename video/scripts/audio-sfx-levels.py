"""Fails if a sound effect comes within MARGIN_DB of the voice where the two overlap.

Usage (run by `npm run qa:audio`):
  python scripts/audio-sfx-levels.py out/qa/vo16.wav out/qa/sfx16.wav out/qa/cues.json
  python scripts/audio-sfx-levels.py --selftest

Both wavs are 16 kHz mono 16-bit. cues.json is [{"sound", "start", "end"}], in seconds.
"""
import array
import json
import math
import sys
import wave

RATE = 16000
FRAME = 160  # 10 ms
THRESHOLD = 60  # same "is sound" level as audio-bursts.py
MARGIN_DB = 8


def read(path):
    w = wave.open(path)
    if w.getframerate() != RATE or w.getnchannels() != 1:
        sys.exit("Expected 16 kHz mono 16-bit wav.")
    return array.array("h", w.readframes(w.getnframes()))


def envelope(x):
    return [math.sqrt(sum(v * v for v in x[i : i + FRAME]) / FRAME) for i in range(0, len(x) - FRAME + 1, FRAME)]


def db(power):
    return 10 * math.log10(power)


# Voice and effect levels (dB) over the frames where both sound, or None if they never overlap.
def cue_levels(vo, sfx, start, end):
    a, b = int(start * 100), int(end * 100)
    both = [(v, s) for v, s in zip(vo[a:b], sfx[a:b]) if v >= THRESHOLD and s >= THRESHOLD]
    if not both:
        return None
    return (
        db(sum(v * v for v, _ in both) / len(both)),
        db(sum(s * s for _, s in both) / len(both)),
    )


def failures(vo, sfx, cues):
    out = []
    for cue in cues:
        levels = cue_levels(vo, sfx, cue["start"], cue["end"])
        if levels and levels[1] > levels[0] - MARGIN_DB:
            out.append(f'{cue["sound"]} at {cue["start"]:.2f} s is only {levels[0] - levels[1]:.1f} dB under the voice')
    return out


def selftest():
    second = lambda amp: envelope(array.array("h", [amp] * RATE))
    cue = [{"sound": "x", "start": 0.1, "end": 0.9}]
    assert failures(second(3000), second(2000), cue), "a loud effect must fail"
    assert not failures(second(3000), second(500), cue), "a quiet effect must pass"
    assert not failures(second(0), second(3000), cue), "an effect clear of the voice must pass"
    print("Selftest passed.")


if __name__ == "__main__":
    if sys.argv[1] == "--selftest":
        selftest()
        sys.exit(0)
    vo_env, sfx_env = envelope(read(sys.argv[1])), envelope(read(sys.argv[2]))
    with open(sys.argv[3], encoding="utf-8") as f:
        problems = failures(vo_env, sfx_env, json.load(f))
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    print("SFX levels OK.")
