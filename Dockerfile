# Author: Naveen Duhan
# --- STAGE 1: Frontend Build ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- STAGE 2: Backend Dependencies ---
FROM node:20-slim AS backend-builder
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# --- STAGE 3: Final Hardened Runtime Container ---
FROM python:3.11-slim

# Install system utilities and curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt-get/lists/*

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt-get/lists/*

# Create dedicated non-root application user
RUN groupadd -r deepnec && useradd -r -g deepnec -d /app -s /bin/bash deepnec

WORKDIR /app

# Fetch a versioned DeepNEC CLI release rather than duplicating it in this repo.
ARG DEEPNEC_REPO=navduhan/deepnec-2.0
ARG DEEPNEC_REF=v2.0.0
RUN mkdir -p /app/backend/deepnec-2.0 && \
    curl -fsSL "https://github.com/${DEEPNEC_REPO}/archive/${DEEPNEC_REF}.tar.gz" \
      | tar -xz -C /app/backend/deepnec-2.0 --strip-components=1 && \
    pip install --no-cache-dir -e /app/backend/deepnec-2.0

# Install the separately licensed S4PRED component and its checksum-pinned weights.
ARG S4PRED_WEIGHTS_URL=https://bioinf.cs.ucl.ac.uk/downloads/s4pred/weights.tar.gz
COPY s4pred /s4pred
RUN curl -fsSL "$S4PRED_WEIGHTS_URL" -o /tmp/s4pred-weights.tar.gz && \
    echo "e04ad7d10b61551f7e07a86b65bb88dc  /tmp/s4pred-weights.tar.gz" | md5sum -c - && \
    tar -xzf /tmp/s4pred-weights.tar.gz -C /s4pred && \
    rm -f /tmp/s4pred-weights.tar.gz

# Copy built frontend assets and backend
COPY --from=frontend-builder /app/frontend/build /app/backend/frontend/build
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules
COPY backend /app/backend

# Set up temporary directories with correct ownership
RUN mkdir -p /app/backend/src/prediction/tmp && \
    chown -R deepnec:deepnec /app

USER deepnec

WORKDIR /app/backend
ENV PORT=3365
ENV NODE_ENV=production

EXPOSE 3365

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3365/api/jobs/health || exit 1

CMD ["node", "index.js"]
