#!/usr/bin/env python3
"""Fieldwork OS narration via the upstream OpenMontage PiperTTS provider.
No production API tokens and no user research data are required.
"""
import json, os, sys, wave
from pathlib import Path

sys.path.insert(0, "/tmp/OpenMontage")
from tools.audio.piper_tts import PiperTTS

root = Path(__file__).resolve().parents[1]
doc = json.loads((root / "public/tour/openmontage_narration.json").read_text())
out = root / "tour-voice"
out.mkdir(exist_ok=True)
provider = PiperTTS()
voice = root / "voices/en_GB-alan-medium.onnx"
if not voice.exists():
    raise RuntimeError(f"Piper voice model missing: {voice}")
manifest = {"provider": "OpenMontage PiperTTS", "voice": "en_GB-alan-medium", "scenes": []}
for i, scene in enumerate(doc["scenes"]):
    filename = f"{i:02d}_{scene['id']}.wav"
    result = provider.execute({
        "text": scene["voice"], "model": str(voice),
        "sentence_silence": 0.25, "length_scale": 0.98,
        "output_path": str(out / filename)
    })
    if not result.success:
        raise RuntimeError(f"{filename}: {result.error}")
    with wave.open(str(out / filename), "rb") as f:
        duration = f.getnframes() / f.getframerate()
    manifest["scenes"].append({**scene, "wav": filename, "seconds": round(duration, 3)})
    print(f"{i+1:02d}/{len(doc['scenes'])}: {scene['id']} {duration:.1f}s", flush=True)
(out / "manifest.json").write_text(json.dumps(manifest, indent=2))
print("Total generated voice", round(sum(s["seconds"] for s in manifest["scenes"]), 1), "seconds")
