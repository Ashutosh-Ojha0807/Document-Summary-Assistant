# DocuPulse AI — Document Summary Assistant
(https://document-summary-assistant-hazel.vercel.app/)

An intelligent, multi-format document analysis application that extracts text from PDFs and images, generates smart summaries with configurable length and style, highlights key points and action items, scores document readability, and provides an interactive Q&A chat — all with a built-in offline fallback engine that requires zero API keys.

---

## Features

| Feature | Details |
|---|---|
| **Document Upload** | Drag-and-drop or file picker. Supports PDF, PNG, JPG, WEBP, BMP, TIFF, DOCX, XLSX, CSV, TXT, MD |
| **PDF Extraction** | pdfplumber (layout + tables) with PyPDF fallback |
| **OCR for Images** | Tesseract OCR with Pillow preprocessing (grayscale → contrast → sharpen) |
| **Summary Generation** | Short / Medium / Long lengths × Executive / Technical / Bulleted / Casual styles |
| **Custom Instructions** | Free-text field to focus the summary (e.g. "highlight financial risks") |
| **Key Takeaways** | Numbered, high-impact bullet points extracted from document |
| **Action Items** | Checkbox list of concrete next steps and recommendations |
| **Key Metrics & Dates** | Regex-extracted currencies, percentages, and important dates |
| **Improvement Suggestions** | AI + rule-based writing quality feedback with impact ratings |
| **Readability Scoring** | Flesch Reading Ease, Flesch-Kincaid Grade Level, tone detection |
| **Document Q&A Chat** | Ask any question; answers grounded in document text with source excerpts |
| **Export** | Download summary as PDF or Markdown |
| **Text-to-Speech** | Read summary aloud via Web Speech API |
| **Dark / Light Theme** | Full CSS custom property theme system |
| **Offline Fallback** | TextRank extractive NLP engine — works without any API key |
| **Mobile Responsive** | Responsive at 1024px, 768px, and 480px breakpoints |

---

## Tech Stack

**Backend** — Python 3.11+ / FastAPI
- `pdfplumber` + `pypdf` — PDF text extraction
- `pytesseract` + `Pillow` — OCR image processing  
- `python-docx` — Word document parsing
- `pandas` + `openpyxl` — Excel/CSV processing
- `google-genai` — Gemini 2.5 Flash AI summarization
- `fastapi` + `uvicorn` — API server

**Frontend** — React 19 / Vite
- `lucide-react` — icons
- `jsPDF` — PDF export
- `canvas-confetti` — copy celebration

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) *(optional — only needed for image OCR)*

---

## Setup & Running

### 1. Clone and set up the backend

```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
cd backend
pip install -r requirements.txt

# Configure environment (Gemini key is optional)
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY if desired
```

### 2. Start the backend server

```bash
# From the backend/ directory
python main.py
```

The API will be available at `http://127.0.0.1:8000`.  
Swagger docs: `http://127.0.0.1:8000/docs`

### 3. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | No | Google Gemini API key for AI summarization. Get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |

Without `GEMINI_API_KEY`, the app uses the built-in offline TextRank NLP engine — all features still work.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check — reports OCR and Gemini availability |
| `POST` | `/api/extract` | Upload a file; returns extracted text, sections, and metadata |
| `POST` | `/api/summarize` | Generate summary from text with length/style options |
| `POST` | `/api/qa` | Answer a question grounded in document text |
| `GET` | `/api/samples` | Returns built-in sample documents for quick demos |

---

## Project Structure

```
UnThinkable/
├── backend/
│   ├── main.py               # FastAPI app + route handlers
│   ├── models.py             # Pydantic data models
│   ├── requirements.txt      # Pinned Python dependencies
│   ├── .env.example          # Environment variable template
│   ├── test_pipeline.py      # End-to-end API tests
│   └── services/
│       ├── extractor.py      # Multi-format document parser (PDF, OCR, DOCX, CSV)
│       ├── summarizer.py     # Summary dispatcher (Gemini → offline fallback)
│       ├── gemini_engine.py  # Google Gemini 2.5 Flash integration
│       ├── nlp_engine.py     # Offline TextRank + Flesch readability engine
│       └── qa.py             # Q&A dispatcher (Gemini → keyword fallback)
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component (UI, state, API calls)
│   │   ├── index.css         # Design system, glass morphism, responsive CSS
│   │   └── main.jsx          # React entry point
│   ├── index.html            # HTML shell with Google Fonts
│   ├── vite.config.ts        # Vite config with /api proxy to backend
│   └── package.json
└── sample_docs/              # Sample files for manual testing
```

---

## Approach (200-word summary)

DocuPulse AI follows a clean extract → analyze → present pipeline. The backend is a FastAPI service that routes uploaded files to format-specific parsers: pdfplumber for text-based PDFs (preserving tables and layout), Tesseract OCR via Pillow for scanned images and image-heavy PDFs, python-docx for Word documents, and pandas for spreadsheets. Each parser returns a normalized `ExtractedDocument` with raw text, structured sections, and document metadata.

The summarization layer first attempts Google Gemini 2.5 Flash via a structured JSON prompt that requests summary text, key takeaways, action items, metrics, and improvement suggestions in a single API call. If no Gemini key is configured, it falls back to a custom offline TextRank engine that uses TF-IDF sentence scoring with positional and numeric boosts — no external dependencies required. Readability metrics (Flesch Reading Ease, Flesch-Kincaid Grade Level, tone) are always computed locally.

The React frontend is a single-page app with a sidebar for upload and configuration (length, style, custom instructions) and a tabbed content area showing the summary, improvement suggestions, raw extracted text with live search, and an interactive Q&A chat. Every export (PDF, Markdown) and speech output is handled client-side to keep the backend stateless and simple.
