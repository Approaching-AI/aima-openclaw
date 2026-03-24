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

Recommended release note template (copy-paste and fill in):

```markdown
## AIMA Doctor v0.1 (bundle 1.2.1)

### Install

From ClawHub:
\`\`\`bash
clawhub install aima-doctor
\`\`\`

From this release:
\`\`\`bash
openclaw plugins install ./aima-doctor-plugin.zip
openclaw plugins enable aima-doctor
\`\`\`

### What's new

- (describe changes here)

### Artifacts

- `aima-doctor-plugin.zip` — native OpenClaw plugin (primary)
- `aima-doctor-runtime.zip` — standalone helper runtime
- `aima-doctor-skill.zip` — ClawHub compatibility skill
- `SHA256SUMS.txt` — integrity checksums

### Compatibility

- OpenClaw 2026.3.22+
- macOS, Linux, Windows

### ClawHub publish

After downloading, publish the skill to ClawHub with:
\`\`\`bash
unzip aima-doctor-skill.zip -d clawhub-skill
clawhub publish ./clawhub-skill/aima-doctor --slug aima-doctor --name "AIMA Doctor" --version 1.2.1
\`\`\`
```

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
