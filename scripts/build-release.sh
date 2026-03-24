#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(tr -d '[:space:]' < "${ROOT_DIR}/VERSION")"
DIST_DIR="${ROOT_DIR}/dist/${VERSION}"

sha256_cmd() {
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$@"
        return
    fi
    shasum -a 256 "$@"
}

rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}/clawhub-skill" "${DIST_DIR}/plugin-package"

cp -R "${ROOT_DIR}/clawhub-skill/aima-doctor" "${DIST_DIR}/clawhub-skill/"
cp -R "${ROOT_DIR}/plugin-package/aima-doctor" "${DIST_DIR}/plugin-package/"

(
    cd "${ROOT_DIR}/plugin-package"
    zip -qry "${DIST_DIR}/aima-doctor-plugin.zip" aima-doctor
)

(
    cd "${ROOT_DIR}/runtime"
    zip -qry "${DIST_DIR}/aima-doctor-runtime.zip" run.sh run.ps1 config.json README.txt
)

(
    cd "${ROOT_DIR}/clawhub-skill"
    zip -qry "${DIST_DIR}/aima-doctor-skill.zip" aima-doctor
)

cat > "${DIST_DIR}/PUBLISH.md" <<EOF
# AIMA Doctor Release ${VERSION}

## Artifacts

- \`aima-doctor-plugin.zip\`: primary native OpenClaw plugin bundle
- \`aima-doctor-runtime.zip\`: standalone helper runtime bundle
- \`aima-doctor-skill.zip\`: compatibility skill bundle
- \`plugin-package/aima-doctor/\`: rendered plugin package directory
- \`clawhub-skill/aima-doctor/\`: rendered ClawHub-publishable skill directory

## Recommended install

\`\`\`bash
openclaw plugins install ./aima-doctor-plugin.zip
openclaw plugins enable aima-doctor
\`\`\`

## ClawHub publish

\`\`\`bash
cd clawhub-skill && clawhub publish ./aima-doctor --slug aima-doctor --name "AIMA Doctor" --version ${VERSION}
\`\`\`

## Notes

- The native plugin bundle is the primary release artifact.
- The ClawHub skill bundle is compatibility/discoverability oriented and expects the runtime bundle separately.
- Public homepage: https://aimaservice.ai/doctor
EOF

(
    cd "${DIST_DIR}"
    sha256_cmd \
        aima-doctor-plugin.zip \
        aima-doctor-runtime.zip \
        aima-doctor-skill.zip \
        > SHA256SUMS.txt
)

printf 'built %s\n' "${DIST_DIR}"
