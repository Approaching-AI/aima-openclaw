# AIMA Doctor for OpenClaw

**One-command diagnosis and repair when your OpenClaw agent is stuck.**

AIMA Doctor is an OpenClaw plugin that gives you a deterministic rescue path — diagnose process health, fix config breakage, recover device registration, and run guided repairs driven by the AIMA platform.

## Install

**From ClawHub** (recommended):

```bash
clawhub install aima-doctor
```

**From a release zip**:

```bash
openclaw plugins install ./aima-doctor-plugin.zip
openclaw plugins enable aima-doctor
```

## Usage

In any OpenClaw conversation:

```
/aima my agent keeps failing to install the package
/aima status
/aima cancel
```

When AIMA Doctor asks a follow-up question, reply with `/aima <your answer>`.

## What's in this repo

This repository contains the OpenClaw-facing distribution of AIMA Doctor:

| Directory | Purpose |
|-----------|---------|
| `plugin-package/aima-doctor/` | Native OpenClaw plugin source (primary artifact) |
| `clawhub-skill/aima-doctor/` | ClawHub-publishable skill bundle |
| `runtime/` | Standalone helper runtime for manual installs |
| `scripts/build-release.sh` | Reproducible release packager |
| `dist/<version>/` | Generated release artifacts |

The AIMA platform backend, distribution endpoints, and end-to-end platform tests live in the main [aima-service-new](https://github.com/Approaching-AI/aima-service-new) repository.

## Build a release

```bash
bash scripts/build-release.sh
```

Outputs under `dist/<version>/`:

- `aima-doctor-plugin.zip` — primary install artifact
- `aima-doctor-runtime.zip` — standalone helper runtime
- `aima-doctor-skill.zip` — ClawHub compatibility skill
- `SHA256SUMS.txt` — integrity checksums
- `PUBLISH.md` — release notes

## Publish to ClawHub

```bash
cd dist/1.2.1/clawhub-skill
clawhub publish ./aima-doctor --slug aima-doctor --name "AIMA Doctor" --version 1.2.1
```

For the full release checklist, see [docs/releasing.md](docs/releasing.md).

## Versioning

This repo tracks two version surfaces:

- **Git tags** (e.g., `v0.1`): public repo milestones
- **Bundle version** in `VERSION` (e.g., `1.2.1`): the packaged AIMA Doctor version used by the plugin, runtime, and ClawHub skill

## Compatibility

- **OS**: macOS, Linux, Windows
- **OpenClaw**: 2026.3.22+
- **Default platform API**: https://aimaservice.ai/platform/api/v1
- **Homepage**: https://aimaservice.ai/doctor

## License

Apache-2.0
