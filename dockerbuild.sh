#!/bin/bash
# Author: Naveen Duhan
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_TAG="${1:-deepnec-2.0-web:latest}"

docker build -t "${IMAGE_TAG}" "${SCRIPT_DIR}"

echo "Built ${IMAGE_TAG}. Start it with:"
echo "docker run --rm -p 3365:3365 ${IMAGE_TAG}"
