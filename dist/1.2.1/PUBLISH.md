# AIMA Doctor Release 1.2.1

## Artifacts

- `aima-doctor-plugin.zip`: primary native OpenClaw plugin bundle
- `aima-doctor-runtime.zip`: standalone helper runtime bundle
- `aima-doctor-skill.zip`: compatibility skill bundle
- `plugin-package/aima-doctor/`: rendered plugin package directory
- `clawhub-skill/aima-doctor/`: rendered ClawHub-publishable skill directory

## Recommended install

```bash
openclaw plugins install ./aima-doctor-plugin.zip
openclaw plugins enable aima-doctor
```

## ClawHub publish

```bash
cd clawhub-skill && clawhub publish ./aima-doctor --slug aima-doctor --name "AIMA Doctor" --version 1.2.1
```

## Notes

- The native plugin bundle is the primary release artifact.
- The ClawHub skill bundle is compatibility/discoverability oriented and expects the runtime bundle separately.
- Public homepage: https://aimaservice.ai/doctor
