---
name: aima-doctor
description: Reference skill for the native AIMA Doctor gateway plugin.
user-invocable: false
disable-model-invocation: true
homepage: https://aimaservice.ai/doctor
metadata: {"openclaw":{"homepage":"https://aimaservice.ai/doctor","skillKey":"aima-doctor","os":["darwin","linux","win32"],"requires":{"config":["plugins.entries.aima-doctor.enabled"]}}}
---

# AIMA Doctor

This capability is provided by the native `aima-doctor` gateway plugin.

## Primary commands

- `/aima [symptom]`
- `/aima status`
- `/aima cancel`

## Runtime behavior

- The plugin launches the packaged helper runtime from `runtime/`.
- Diagnosis and repair progress is reported back into the current IM conversation.
- If AIMA asks a follow-up question, answer with `/aima <your reply>`.
- Legacy `/askforhelp*` and `/doctor*` aliases still work for compatibility.

## Safety

- Use the packaged helper, not ad-hoc remote shell one-liners.
- Keep tokens and recovery codes out of normal chat unless repair explicitly requires them.
