# AIMA Doctor Plugin

**One-command diagnosis and repair for OpenClaw.** This is the primary native plugin for OpenClaw 2026.3.22+.

## Install

```bash
openclaw plugins install ./aima-doctor-plugin.zip
openclaw plugins enable aima-doctor
```

## Commands

| Command | What it does |
|---------|-------------|
| `/aima <symptom>` | Start a diagnosis with a description of the problem |
| `/aima status` | Check progress of a running diagnosis |
| `/aima cancel` | Cancel the current diagnosis |

When the helper asks a follow-up question, reply with `/aima <your answer>`.

Legacy `/askforhelp*` and `/doctor*` aliases remain available for compatibility.

## What's inside

- `openclaw.plugin.json` — native OpenClaw plugin manifest
- `index.js` — gateway plugin entrypoint
- `skills/aima-doctor/SKILL.md` — bundled reference skill
- `runtime/run.sh` — helper for macOS/Linux
- `runtime/run.ps1` — helper for Windows
- `runtime/config.json` — default AIMA platform URL

## Notes

- The plugin package owns execution; the bundled skill is for discovery/documentation only.
- Homepage: https://aimaservice.ai/doctor
