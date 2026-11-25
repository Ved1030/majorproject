# Stage 1: Build Oxipng
FROM rust:1-bookworm AS oxipng-builder

RUN cargo install oxipng --locked --root /opt/oxipng

# Stage 2: ZipDrop backend
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    SKIP_PYTHON_SETUP=1 \
    SKIP_LIBREOFFICE_INSTALL=1 \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright \
    PDF_PYTHON_BIN=/app/.venv/bin/python \
    BG_REMOVER_PYTHON_BIN=/app/.venv/bin/python \
    LIBREOFFICE_PATH=/usr/bin/soffice \
    PORT=5000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libglib2.0-0 \
    libgl1 \
    libreoffice \
    ghostscript \
    qpdf \
    fontconfig \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto-core \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Oxipng
COPY --from=oxipng-builder \
    /opt/oxipng/bin/oxipng /usr/local/bin/oxipng

# Install Python dependencies
COPY requirements.txt ./

RUN python3 -m venv /app/.venv \
    && /app/.venv/bin/python -m pip install --upgrade pip setuptools wheel \
    && /app/.venv/bin/python -m pip install -r requirements.txt

ENV PATH="/app/.venv/bin:${PATH}"

# Install Chromium and browser dependencies
RUN /app/.venv/bin/python -m playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
COPY package.json package-lock.json ./
COPY scripts ./scripts

RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy application source code
COPY . .

# Prepare runtime directories
RUN mkdir -p /home/node/.u2net \
    && chown -R node:node /app /home/node/.u2net \
    && chmod -R a+rX /opt/playwright

# Run application as a non-root user
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -fsS http://127.0.0.1:5000/health || exit 1

CMD ["npm", "start"]
