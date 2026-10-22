import sys, json
from faster_whisper import WhisperModel
audio, out, model_name, cache = sys.argv[1:5]
m = WhisperModel(model_name, device="cpu", compute_type="int8", download_root=cache)
import wave, numpy as np
wf = wave.open(audio); a = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32)/32768.0
segs, info = m.transcribe(a, language="pt", word_timestamps=True, vad_filter=False)
words = []
for s in segs:
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}", flush=True)
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
json.dump(words, open(out, "w"), ensure_ascii=False, indent=0)
