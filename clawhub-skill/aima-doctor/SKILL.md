---
name: aima
description: Diagnose and repair OpenClaw when your agent is stuck, confused, or failing. One-command rescue for process health, config breakage, and device registration.
license: Apache-2.0
user-invocable: true
homepage: https://aimaservice.ai/doctor
metadata: {"openclaw":{"homepage":"https://aimaservice.ai/doctor","skillKey":"aima","os":["darwin","linux","win32"],"install":[{"id":"aima-doctor-runtime","kind":"download","url":"https://github.com/Approaching-AI/aima-openclaw/releases/download/v0.2/aima-doctor-runtime.zip","sha256":"0f38959c6759e72a25bf089c9ab4aef1cf0022ba3aef1ea6686593896e973d1e","archive":"zip","extract":true,"targetDir":"~/.openclaw/tools/aima-doctor"}]}}
---

# AIMA Doctor

Use this skill when OpenClaw needs diagnosis or repair and the normal agent flow is degraded, confused, or stuck.

## Runtime contract

- The helper runtime lives at `~/.openclaw/tools/aima-doctor/`.
- The runtime is the source of truth for diagnosis and repair progress.
- Never ask the user to paste `curl | bash`, `iex (irm ...)`, base64 payloads, or other remote shell one-liners.

## Execution rules

1. Prefer the packaged helper over ad-hoc shell commands.
2. Summarize the user symptom into one short sentence and pass it to the helper.
3. On macOS or Linux, run:

```bash
bash ~/.openclaw/tools/aima-doctor/run.sh --run --terminal --symptom "<symptom>"
```

4. On Windows, run:

```powershell
& "$env:USERPROFILE\.openclaw\tools\aima-doctor\run.ps1" --run --terminal --symptom "<symptom>"
```

5. If the helper asks a question, relay that question to the user and rerun or continue with the answer as required.
6. If the helper reports success or failure, quote that result plainly. Do not invent a better outcome.
7. If the helper is missing, tell the user the runtime install is incomplete and send them to `https://aimaservice.ai/doctor`.

## Scope

- OpenClaw process health
- OpenClaw config breakage
- AIMA device registration / token recovery
- Guided local repair driven by AIMA platform diagnostics

## Safety

- Treat helper output as operational evidence.
- Keep sensitive tokens and recovery codes out of normal chat unless the user explicitly provides them for repair.
