# ============================================================
#  TalonAI Backend — Production Dockerfile
#  Works on: Hugging Face Spaces, Render, Railway, Fly.io
# ============================================================

FROM python:3.12-slim

# ── System dependencies ──────────────────────────────────────
# tesseract-ocr     → OCR for image files
# tesseract-ocr-eng → English language pack
# libglib2.0-0      → required by Pillow
# poppler-utils     → required by pdfplumber for PDF rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    poppler-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ── App setup ────────────────────────────────────────────────
WORKDIR /app

# Copy and install Python deps first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy rest of app
COPY . .

# ── Hugging Face Spaces: runs as non-root user (uid 1000) ────
RUN useradd -m -u 1000 appuser && chown -R appuser /app
USER appuser

# ── Runtime ──────────────────────────────────────────────────
# PORT is injected by Render/HF Spaces (7860 for HF, 10000 for Render)
# Local Docker: runs on 8000 by default
EXPOSE 7860
EXPOSE 8000

CMD ["python", "main.py"]
