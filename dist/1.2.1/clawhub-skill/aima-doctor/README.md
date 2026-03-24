# AIMA Doctor

**One-command diagnosis and repair for OpenClaw.**

When your OpenClaw agent is stuck, confused, or unable to complete a task, AIMA Doctor gives you a deterministic rescue path — no guessing, no manual debugging.

## Quick Start

Install from ClawHub:

```bash
clawhub install aima-doctor
```

Then in any OpenClaw conversation:

```
/aima my agent keeps failing to install the package
```

AIMA Doctor will diagnose the issue, walk you through any needed fixes, and report back with clear results.

## Commands

| Command | What it does |
|---------|-------------|
| `/aima <symptom>` | Start a diagnosis with a description of the problem |
| `/aima status` | Check the progress of a running diagnosis |
| `/aima cancel` | Cancel the current diagnosis |

When AIMA Doctor asks a follow-up question, reply with `/aima <your answer>`.

## What it can fix

- OpenClaw process health (hung, crashed, or unresponsive agents)
- Configuration breakage (corrupted settings, missing config files)
- AIMA device registration and token recovery
- Guided local repair driven by AIMA platform diagnostics

## How it works

AIMA Doctor ships a packaged helper runtime that runs locally on your machine. It connects to the AIMA platform API to fetch diagnostics, then executes deterministic repair steps. No remote shell commands, no opaque scripts — everything runs from a versioned, auditable helper.

## Compatibility

- **OS**: macOS, Linux, Windows
- **OpenClaw**: 2026.3.22+
- **Runtime**: downloaded automatically on first use from `https://aimaservice.ai/doctor`

## Links

- Homepage: https://aimaservice.ai/doctor
- Source: https://github.com/Approaching-AI/aima-openclaw
- License: Apache-2.0
