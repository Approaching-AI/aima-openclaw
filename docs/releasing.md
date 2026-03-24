# Releasing `aima-openclaw`

This repo ships OpenClaw-facing artifacts only. A normal public release should
produce and publish three bundles:

- `aima-doctor-plugin.zip`
- `aima-doctor-runtime.zip`
- `aima-doctor-skill.zip`

## 1. Update the bundle version

Edit `VERSION` when the packaged AIMA Doctor bundle changes.

Current value:

```text
1.2.1
```

The `VERSION` file controls:

- generated `dist/<version>/`
- `PUBLISH.md`
- ClawHub publish examples

## 2. Build release artifacts

```bash
bash scripts/build-release.sh
```

Verify these outputs exist:

- `dist/<version>/aima-doctor-plugin.zip`
- `dist/<version>/aima-doctor-runtime.zip`
- `dist/<version>/aima-doctor-skill.zip`
- `dist/<version>/SHA256SUMS.txt`
- `dist/<version>/PUBLISH.md`

## 3. Commit and push

```bash
git add .
git commit -m "release: prepare <version>"
git push origin main
```

## 4. Create a Git tag

Repo tags mark public milestones and do not have to match the bundle version.

Example:

```bash
git tag v0.1
git push origin v0.1
```

## 5. Create the GitHub Release

Attach the generated bundles:

```bash
gh release create v0.1 \
  dist/<version>/aima-doctor-plugin.zip \
  dist/<version>/aima-doctor-runtime.zip \
  dist/<version>/aima-doctor-skill.zip \
  dist/<version>/SHA256SUMS.txt \
  dist/<version>/PUBLISH.md
```

Recommended release note shape:

- public milestone tag, for example `v0.1`
- packaged bundle version, for example `1.2.1`
- attached plugin/runtime/skill bundle list
- note that ClawHub publish should use the unpacked `dist/<version>/clawhub-skill/aima-doctor/`

## 6. Publish to ClawHub

Use the rendered skill directory, not the zip file:

```bash
cd dist/<version>/clawhub-skill
clawhub publish ./aima-doctor --slug aima-doctor --name "AIMA Doctor" --version <version>
```

## Repo boundary

Keep these concerns out of this repo:

- AIMA platform backend code
- `/doctor/plugin.zip`, `/doctor/runtime.zip`, `/doctor/skill.zip` HTTP routes
- invite-code seeding and platform config
- platform integration tests

Those stay in `Approaching-AI/aima-service-new`.
