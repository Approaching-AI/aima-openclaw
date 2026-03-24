# aima-openclaw

Standalone OpenClaw distribution repo for AIMA Doctor.

This repository contains the OpenClaw-facing parts of AIMA Doctor only:

- `plugin-package/aima-doctor/`: native OpenClaw plugin source
- `clawhub-skill/aima-doctor/`: ClawHub-publishable compatibility skill
- `runtime/`: standalone helper runtime for manual/runtime-only installs
- `scripts/build-release.sh`: reproducible release packager
- `dist/<version>/`: generated release artifacts

The AIMA platform backend, `/doctor/*.zip` distribution endpoints, invite-code
policy, and end-to-end platform tests remain in the main
`Approaching-AI/aima-service-new` repository. This repo is the public
OpenClaw-facing package source.

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

## Versioning

This repo intentionally tracks two version surfaces:

- Git tags such as `v0.1`: public repo milestones
- Bundle version in `VERSION` such as `1.2.1`: the packaged AIMA Doctor bundle
  version used by the plugin, runtime, and ClawHub skill

That means the GitHub release can be `v0.1` while the shipped OpenClaw package
version is still `1.2.1`.

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

For a full release checklist, see `docs/releasing.md`.

## Runtime defaults

- Homepage: `https://aimaservice.ai/doctor`
- Default platform API: `https://aimaservice.ai/platform/api/v1`
- Native plugin target: OpenClaw `2026.3.22+`

## License

Apache-2.0
