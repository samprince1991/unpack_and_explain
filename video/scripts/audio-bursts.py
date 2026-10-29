"""Finds stray audio blips in a rendered reel: short sounds (< 300 ms) with silence on
both sides. That's how ElevenLabs stitching bleed sounds (the first sound of the next
section leaking onto the end of the previous file, heard as a stutter before it).

Usage (from video/):
  npx remotion render PostNN-Slug out/qa/mix.wav --codec=wav
  npx remotion ffmpeg -y -i out/qa/mix.wav -ac 1 -ar 16000 -c:a pcm_s16le out/qa/mix16.wav
  python scripts/audio-bursts.py out/qa/mix16.wav

Exits 1 and lists the times if it finds any. Listen to each one before calling it a false positive.
"""
import array
import math
import sys
import wave

FRAME = 160  # 10 ms at 16 kHz
THRESHOLD = 60
MAX_BURST = 30  # frames (300 ms)
QUIET = 15  # frames (150 ms) of silence required on both sides

w = wave.open(sys.argv[1])
if w.getframerate() != 16000 or w.getnchannels() != 1:
    sys.exit("Expected 16 kHz mono 16-bit wav (see usage).")
x = array.array("h", w.readframes(w.getnframes()))
env = [math.sqrt(sum(v * v for v in x[i : i + FRAME]) / FRAME) for i in range(0, len(x) - FRAME, FRAME)]
loud = [e >= THRESHOLD for e in env]

bursts = []
i = 0
while i < len(loud):
    if not loud[i]:
        i += 1
        continue
    j = i
    while j < len(loud) and loud[j]:
        j += 1
    quiet_before = not any(loud[max(0, i - QUIET) : i])
    quiet_after = not any(loud[j : j + QUIET])
    if j - i < MAX_BURST and quiet_before and quiet_after:
        bursts.append((i / 100, (j - i) * 10))
    i = j

if bursts:
    for t, ms in bursts:
        print(f"blip at {t:.2f} s ({ms} ms)")
    sys.exit(1)
print("No stray blips.")
