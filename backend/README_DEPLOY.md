# TalonAI Backend — Deployment Guide

## All Requirements

### 1. Google Gemini API Key (Optional but recommended)
- **What it does**: Powers AI summarization and document Q&A via Gemini 2.5 Flash
- **Without it**: App still works using the built-in offline TextRank NLP engine
- **Get it free**: https://aistudio.google.com/app/apikey
- **Set as env var**: `GEMINI_API_KEY=AIzaSy...`

### 2. Tesseract OCR (Handled automatically in Docker)
- **What it does**: Extracts text from image files (PNG, JPG, scanned documents)
- **In Docker/Cloud**: Installed automatically via `apt-get` in the Dockerfile — nothing to do
- **Local Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki
  - Install to default path: `C:\Program Files\Tesseract-OCR\`
  - Code auto-detects it — no config needed

### 3. Python packages (all in requirements.txt)
| Package | Purpose |
|---|---|
| `fastapi` | API framework |
| `uvicorn` | ASGI server |
| `python-multipart` | File upload handling |
| `pypdf` + `pdfplumber` | PDF text extraction |
| `python-docx` | Word .docx parsing |
| `openpyxl` + `pandas` | Excel/CSV parsing |
| `pillow` | Image preprocessing for OCR |
| `pytesseract` | Python wrapper for Tesseract OCR |
| `google-genai` | Google Gemini AI SDK |
| `pydantic` | Data validation |
| `python-dotenv` | Load .env file locally |

---

## Option A — Deploy to Render.com (Recommended)

1. Push this repo to GitHub (already done)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Render auto-detects the `Dockerfile`
6. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your key
   - `ALLOWED_ORIGINS` = your frontend URL (or `*` for open access)
7. Click **Deploy** — takes ~3 minutes to build

**Free tier note**: Service sleeps after 15 min inactivity (cold start ~30s). Upgrade to Starter ($7/mo) to keep it awake.

---

## Option B — Deploy to Hugging Face Spaces

1. Go to https://huggingface.co/new-space
2. Name: `talonai-backend`, SDK: **Docker**
3. Clone the Space repo, copy the contents of `backend/` into it
4. Push — HF builds from the `Dockerfile` automatically
5. Add secrets in Space Settings:
   - `GEMINI_API_KEY` = your key

**HF Spaces note**: Free tier has 2 vCPU / 16GB RAM. No sleep on free tier (ZeroGPU spaces may queue). Perfect for demos.

---

## Option C — Run Locally with Docker

```bash
cd backend

# Build
docker build -t talonai-backend .

# Run
docker run -p 7860:7860 -e GEMINI_API_KEY=your_key talonai-backend
```

API will be at http://localhost:7860

---

## Frontend → Backend Connection

After deploying the backend, update the frontend Vite proxy:

**`frontend/vite.config.ts`** (for local dev pointing to deployed backend):
```ts
proxy: {
  '/api': {
    target: 'https://your-render-app.onrender.com',
    changeOrigin: true,
  }
}
```

Or set `VITE_API_BASE` env var and update fetch calls to use it for production frontend builds.
