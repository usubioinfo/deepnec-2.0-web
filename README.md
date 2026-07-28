# DeepNEC 2.0 Web Application & API Server

[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](Dockerfile)
[![Node.js](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2018-cyan.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express.js-black.svg)](https://expressjs.com/)

Full-stack web interface and REST API server for **DeepNEC 2.0: Nitrogen Metabolism Enzyme Classifier**.

---

## Architecture Overview

```
deepnec-2.0-web/
├── Dockerfile                  <-- Containerization and production deployment
├── dockerbuild.sh              <-- Docker build helper script
├── download_deepnec_engine.sh  <-- Downloads the pinned DeepNEC 2.0 release from GitHub
├── frontend/                   <-- React 18/Vite UI (development port 3000)
├── backend/                    <-- Express API server (port 3365)
│   └── deepnec-2.0/            <-- Downloaded DeepNEC engine (not version-controlled)
└── s4pred/                     <-- Secondary structure prediction module
```

---

## Production Model Selection & Benchmarks

| Phase & Target Category | Selected Architecture | Deployed Fold (Val Best) | Independent Test MCC | Independent Test Accuracy | Model Format & Size |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Phase 1** (Binary Enzyme Filter) | **Ultimate Hybrid** (ESM2-32 LoRA + Descriptors, 4,248-dim) | **Fold 5** | **0.8718** | **93.62%** | .tflite (17.60 MB) |
| **Phase 2** (Nitrogen Filter) | **ESM-2 650M** | **Fold 1** | **0.9738** | **99.38%** | .tflite (2.76 MB) |
| **Phase 3** (10 Sub-pathways) | **ESM-2 650M** | **Fold 4** | **0.9478** | **95.62%** | .tflite (2.76 MB) |
| **Phase 4** (Anammox ECs) | **ESM-2 650M** | **Fold 1** | **0.9142** | **95.90%** | .tflite (2.76 MB) |
| **Phase 4** (Assimilatory ECs) | **ESM-2 650M** | **Fold 3** | **0.9194** | **93.25%** | .tflite (2.76 MB) |
| **Phase 4** (Denitrification ECs) | **ESM-2 650M** | **Fold 1** | **1.0000** | **100.00%** | .tflite (2.76 MB) |
| **Phase 4** (Dissimilatory ECs) | **ESM-2 650M** | **Fold 1** | **1.0000** | **100.00%** | .tflite (2.76 MB) |
| **Phase 4** (Nitrification ECs) | **ESM-2 650M** | **Fold 2** | **0.9931** | **99.77%** | .tflite (2.76 MB) |
| **Phase 4** (All Sub-pathways / ADDN) | **ESM-2 650M** | **Fold 1** | **1.0000** | **100.00%** | .tflite (2.76 MB) |

---

## Quick Start

### Option 1: Docker Container Deployment (Recommended)

```bash
# Build Docker image
bash dockerbuild.sh

# Run Docker container. Keep the credential file outside the repository.
docker run --rm --env-file /etc/deepnec.env -p 3365:3365 deepnec-2.0-web:latest
```

Open `http://localhost:3365/deepnec-2.0/`. The production image serves the frontend and API from the same container and port. During the image build, DeepNEC CLI `v2.0.2` is downloaded from `usubioinfo/deepnec-2.0`; S4PRED is downloaded from its pinned upstream commit, its official weights are verified against the upstream MD5 checksum, and a real S4PRED inference smoke test is run. Override the pinned sources when needed with Docker build arguments.

For Swiss-Model fallback, create `/etc/deepnec.env` on the server with permissions `600` and the following values. Never commit this file or token:

```dotenv
SWISS_MODEL_TOKEN=replace_with_your_swiss_model_token
MAX_CONCURRENT_JOBS=1
```

### Option 2: Local Development Setup

#### 1. Download DeepNEC 2.0 Engine
```bash
./download_deepnec_engine.sh
```

This downloads the pinned `v2.0.2` release from `usubioinfo/deepnec-2.0`. To test another tag or commit without changing tracked files, set `GITHUB_REF`, for example `GITHUB_REF=<commit-sha> ./download_deepnec_engine.sh`.

#### 2. Start Backend API Server
```bash
cd backend
npm install
npm start
```
*Backend API runs at `http://localhost:3365/api`.*

#### 3. Start React Frontend Web Application
```bash
cd frontend
npm install
npm start
```
*Frontend development server runs at `http://localhost:3000/deepnec-2.0/` and sends local API requests to port 3365.*

Set `VITE_BACKEND_URL` when the API is hosted on a different origin; otherwise production builds use the page origin.

---

## API Endpoints

- **`GET /api/jobs/health`**: Service health check.
- **`POST /api/jobs`**: Submit a FASTA sequence or accession; returns `202 Accepted` and a job ID.
- **`GET /api/jobs/:id/status`**: Poll job status, percentage, and execution stage.
- **`GET /api/jobs/:id/results?phase=Phase4`**: Retrieve structured results.
- **`GET /api/download/:id/:fileName`**: Download an allow-listed result artifact.

Legacy `/api/prediction`, `/api/progress`, and `/api/results` endpoints remain available for compatibility.

## Testing and security checks

```bash
(cd backend && npm ci && npm test && npm audit)
(cd frontend && npm ci && npm test && npm run build && npm audit)
```

Uploaded job identifiers and accession-derived filenames are validated before filesystem access. Prediction endpoints are rate-limited, request bodies are size-limited, generated files are served only through allow-listed download routes, and the server runs as a non-root user in Docker.

---

## License & Citation

- **Lab**: KAABiL (Kaundal Artificial Intelligence & Advanced Bioinformatics Lab)
- **Author**: Naveen Duhan (naveen.duhan@usu.edu)
- **First-party license**: [GNU General Public License v3.0](LICENSE) (`GPL-3.0-only`)
- **Bundled component**: S4PRED is a separate GPL-3.0 component; see [Third-party notices](THIRD_PARTY_NOTICES.md).
