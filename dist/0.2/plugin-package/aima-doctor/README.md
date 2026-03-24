# AIMA Doctor Plugin

This archive is the primary OpenClaw `2026.3.22+` install artifact for AIMA Doctor.

## What this contains

- `openclaw.plugin.json`: native OpenClaw plugin manifest
- `index.js`: gateway plugin entrypoint
- `skills/aima-doctor/SKILL.md`: bundled reference skill
- `runtime/run.sh`: packaged doctor helper for macOS/Linux
- `runtime/run.ps1`: packaged doctor helper for Windows
- `runtime/config.json`: default AIMA platform URL

## Install

```bash
openclaw plugins install ./aima-doctor-plugin.zip
openclaw plugins enable aima-doctor
```

Then use these IM commands:

- `/aima [symptom]`
- `/aima status`
- `/aima cancel`

When the helper asks a question, answer with `/aima <your reply>`.

## Notes

- The plugin package owns execution.
- The bundled skill is for discovery/documentation and does not replace the native `/aima` command family.
- Legacy `/askforhelp*` and `/doctor*` aliases remain available for compatibility.
- Homepage: `https://aimaservice.ai/doctor`
