# aima-openclaw

Standalone OpenClaw distribution repo for AIMA Doctor.

This repository contains the OpenClaw-facing parts of AIMA Doctor only:

- `plugin-package/aima-doctor/`: native OpenClaw plugin source
- `clawhub-skill/aima-doctor/`: ClawHub-publishable compatibility skill
- `runtime/`: standalone helper runtime for manual/runtime-only installs
- `scripts/build-release.sh`: reproducible release packager
- `dist/<version>/`: generated release artifacts

## Supported flow

`/aima` is a deterministic rescue entrypoint for OpenClaw when the normal agent path is degraded but the gateway is still alive and able to receive messages.

Supported user commands:

- `/aima <symptom>`
- `/aima status`
- `/aima cancel`

## Build a release

```bash
bash scripts/build-release.sh
```

That command generates:

- `dist/1.2.1/aima-doctor-plugin.zip`
- `dist/1.2.1/aima-doctor-runtime.zip`
- `dist/1.2.1/aima-doctor-skill.zip`
- `dist/1.2.1/PUBLISH.md`
- `dist/1.2.1/SHA256SUMS.txt`

## Install the native plugin

```bash
openclaw plugins install ./dist/1.2.1/aima-doctor-plugin.zip
openclaw plugins enable aima-doctor
```

## Publish to ClawHub

```bash
cd dist/1.2.1/clawhub-skill
clawhub publish ./aima-doctor --slug aima-doctor --name "AIMA Doctor" --version 1.2.1
```

## Runtime defaults

- Homepage: `https://aimaservice.ai/doctor`
- Default platform API: `https://aimaservice.ai/platform/api/v1`
- Native plugin target: OpenClaw `2026.3.22+`

## License

Apache-2.0
