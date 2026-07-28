#!/bin/bash
# Author: Naveen Duhan
# Download and setup DeepNEC 2.0 CLI engine inside backend
set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${SCRIPT_DIR}/backend/deepnec-2.0"

GITHUB_REPO="${GITHUB_REPO:-usubioinfo/deepnec-2.0}"
GITHUB_REF="${GITHUB_REF:-v2.0.2}"
TAR_URL="https://github.com/${GITHUB_REPO}/archive/${GITHUB_REF}.tar.gz"

if [[ -d "${TARGET_DIR}/deepNEC" ]]; then
    echo "DeepNEC engine already exists at ${TARGET_DIR}; nothing to download."
    exit 0
fi

echo "=================================================="
echo " Downloading DeepNEC 2.0 Engine from GitHub..."
echo "=================================================="

mkdir -p "${TARGET_DIR}"
curl -fsSL "${TAR_URL}" | tar -xz -C "${TARGET_DIR}" --strip-components=1

echo "DeepNEC 2.0 ${GITHUB_REF} downloaded to backend/deepnec-2.0/."
