# TalonAI — Complete Project Documentation

> This document covers every aspect of the TalonAI Document Intelligence platform.
> Anyone reading this — developer, evaluator, or interviewer — should be able to
> fully understand, run, and extend the project without needing to ask any questions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features — Every Single One](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [How It Works — Full Architecture](#5-how-it-works)
6. [Backend — Detailed Breakdown](#6-backend)
7. [Frontend — Detailed Breakdown](#7-frontend)
8. [API Reference — Every Endpoint](#8-api-reference)
9. [Data Models — Every Field](#9-data-models)
10. [Environment Variables & Configuration](#10-environment-variables)
11. [Local Setup — Step by Step](#11-local-setup)
12. [Cloud Deployment — Render & HF Spaces](#12-cloud-deployment)
13. [How to Keep the Free Server Alive (Cron Job)](#13-cron-job)
14. [File Format Support Matrix](#14-file-format-support)
15. [AI Engine — Gemini vs Offline NLP](#15-ai-engine)
16. [UI Design System](#16-ui-design-system)
17. [Known Limitations](#17-known-limitations)
18. [Approach Write-Up (200 words)](#18-approach-write-up)

---

## 1. Project Overview

**Name:** TalonAI
**Tagline:** Intelligent Document Intelligence — Powered by Precision
**Type:** Full-stack web application
**Purpose:** Upload any document, extract its text, generate smart summaries, score
readability, suggest writing improvements, and ask questions about the document in a chat interface.

**Live Backend:** https://document-summary-assistant-j52y.onrender.com
**GitHub:** https://github.com/Ashutosh-Ojha0807/Document-Summary-Assistant

**Two modes of operation:**
- With a Google Gemini API key → uses Gemini 2.5 Flash for high-quality AI summaries
- Without any API key → falls back to a fully offline TextRank NLP engine built from scratch

---

## 2. Features

### Document Upload
- Drag-and-drop a file onto the upload zone
- Click the upload zone to open a file picker dialog
- Accepted formats: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.csv`, `.txt`, `.md`
- File is read client-side and sent as `multipart/form-data` to the backend

### Text Extraction
- **PDF:** extracted using `pdfplumber` (preserves layout, extracts tables). Falls back to `pypdf` if pdfplumber fails. If the PDF is image-only (scanned), returns a descriptive message
- **Images (PNG, JPG, etc.):** preprocessed with Pillow (grayscale → contrast boost → sharpen), then run through Tesseract OCR
- **Word (.docx):** parsed with `python-docx`, heading styles become section titles, tables extracted as pipe-delimited text
- **Excel / CSV:** read with `pandas` + `openpyxl`, shows column list, numeric statistics, and top 15 rows per sheet
- **Plain text / Markdown:** decoded with UTF-8 → latin-1 → cp1252 fallback chain, `#` headings become sections

### Summary Generation
- **Three lengths:** Short (1–2 paragraphs), Medium (3–4 paragraphs), Long (500+ words)
- **Four styles:** Executive (C-suite tone), Technical (data/methodology focus), Bulleted (key points as bullets), Casual (plain English)
- **Custom instructions:** free-text field to direct the AI (e.g. "focus only on financial data")
- Automatically triggered after upload; can be re-run with new settings via the Re-summarize button

### Key Takeaways
- Numbered list of the most important insights from the document
- Provided by Gemini AI (up to 4) or extracted by the offline engine

### Action Items
- Checkbox list of concrete next steps extracted from the document
- Keyword-matched from imperative sentences (must, should, deadline, etc.)

### Key Metrics & Dates
- Auto-extracted currencies, percentages, and dates shown as info-coloured badges
- Examples: `$42.5M`, `28%`, `Q3 2026`

### Improvement Suggestions
- AI-powered writing quality feedback with category, impact level (HIGH/MEDIUM/LOW), and a code-style example
- Rule-based offline fallback checks: sentence length, filler words, missing structure, missing action items

### Readability Scoring
- **Flesch Reading Ease** (0–100, higher = easier)
- **Flesch-Kincaid Grade Level** (US school grade equivalent)
- **Detected Tone:** Professional/Academic, Casual/Conversational, Action-Oriented/Urgent, or Analytical/Data-Driven

### Document Q&A Chat
- Full chat interface with message history
- Questions answered with reference to the uploaded document text
- Each answer includes source excerpts from the document
- Last 6 messages sent as context for follow-up questions

### Export
- **Export as PDF:** generates a formatted PDF with summary, takeaways, engine info using jsPDF
- **Export as Markdown:** full report including summary, takeaways, action items, readability scores, and suggestions as a `.md` file download

### Text-to-Speech
- Reads the summary aloud using the browser's Web Speech API
- Toggle button to start/stop playback

### Dark / Light Theme
- Toggle button in the header switches between dark and light modes
- CSS custom properties switch the entire palette

### Sample Documents
- Two built-in samples loaded with one click (no file upload needed):
  - Q3 Financial & Operations Strategy (Executive Report)
  - Clinical Research: Targeted Immunotherapy (Scientific Paper)

### Settings Modal
- Enter a Google Gemini API key in the browser
- Key saved to `localStorage` as `docupulse_gemini_key`
- Sent per-request in the JSON body; never stored server-side

---

## 3. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.11 | Runtime |
| FastAPI | 0.115.8 | REST API framework |
| Uvicorn | 0.34.0 | ASGI production server |
| pdfplumber | 0.11.5 | PDF extraction with layout |
| pypdf | 5.3.0 | PDF fallback parser |
| python-docx | 1.1.2 | Word .docx parsing |
| pandas | 2.2.3 | CSV/Excel data processing |
| openpyxl | 3.1.5 | Excel .xlsx reading |
| Pillow | 11.1.0 | Image preprocessing for OCR |
| pytesseract | 0.3.13 | Python wrapper for Tesseract OCR |
| Tesseract OCR | 5.4.0 | OCR engine (system-level binary) |
| google-genai | 1.2.0 | Google Gemini AI SDK |
| pydantic | 2.10.6 | Request/response data validation |
| python-dotenv | 1.0.1 | Load `.env` file for local dev |
| python-multipart | 0.0.20 | File upload support in FastAPI |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.2 | Dev server + production build |
| lucide-react | 1.33 | All icons |
| jsPDF | 4.2 | Client-side PDF export |
| canvas-confetti | 1.9 | Confetti animation on copy |
| Inter (Google Fonts) | — | Primary typeface |
| JetBrains Mono | — | Monospace font for extracted text |

### Infrastructure
| Service | Purpose |
|---|---|
| Render.com | Backend hosting (Docker) |
| GitHub | Source control |
| Docker (python:3.11-slim) | Container for cloud deployment |

---

## 4. Project Structure

```
UnThinkable/                          ← Workspace root
├── .gitignore                        ← Excludes venv, node_modules, .env, dist, __pycache__
├── README.md                         ← Setup guide and feature overview
├── DOCUMENTATION.md                  ← This file — complete project documentation
├── create_sample_files.py            ← Script to generate sample test documents
│
├── sample_docs/                      ← Test documents for manual testing
│   ├── sample_document.pdf           ← Scanned PDF (image-based, tests OCR fallback)
│   ├── sample_invoice_scan.png       ← PNG invoice scan (tests Tesseract OCR)
│   ├── quarterly_strategic_plan.docx ← Word document (tests docx parser)
│   ├── regional_sales_q3.csv         ← CSV file (tests pandas parser)
│   └── regional_sales_q3.xlsx        ← Excel file (tests openpyxl parser)
│
├── backend/                          ← Python FastAPI backend
│   ├── main.py                       ← App entry point, all route definitions
│   ├── models.py                     ← All Pydantic data models
│   ├── requirements.txt              ← All 15 pinned Python dependencies
│   ├── .env.example                  ← Template for environment variables
│   ├── Dockerfile                    ← Production container (Render/HF Spaces)
│   ├── render.yaml                   ← Render.com one-click deploy config
│   ├── README_DEPLOY.md              ← Deployment guide
│   ├── test_pipeline.py              ← End-to-end API tests
│   └── services/
│       ├── extractor.py              ← Multi-format document parser
│       ├── summarizer.py             ← Summary dispatcher (Gemini → NLP)
│       ├── gemini_engine.py          ← Gemini 2.5 Flash integration
│       ├── nlp_engine.py             ← Offline TextRank + Flesch engine
│       └── qa.py                     ← Q&A dispatcher (Gemini → keyword)
│
├── frontend/                         ← React + Vite frontend
│   ├── index.html                    ← HTML shell, Google Fonts, favicon
│   ├── package.json                  ← Node dependencies and scripts
│   ├── vite.config.ts                ← Vite config with /api proxy
│   ├── tsconfig.json                 ← TypeScript config (files are .jsx)
│   ├── .env.production               ← VITE_API_BASE=https://render-url
│   ├── .env.development              ← VITE_API_BASE= (empty → use proxy)
│   ├── .gitignore                    ← Excludes node_modules, dist
│   ├── public/
│   │   ├── logo.svg                  ← Eagle mascot SVG (also used as favicon)
│   │   ├── favicon.svg               ← Alternate favicon
│   │   └── icons.svg                 ← Icon sprite
│   └── src/
│       ├── main.jsx                  ← React entry point (renders <App />)
│       ├── App.jsx                   ← Entire frontend (~700 lines, single component)
│       ├── index.css                 ← Full design system (~500 lines)
│       └── assets/
│           ├── logo.svg              ← Eagle shield mascot logo (custom SVG)
│           ├── logo.png              ← PNG version of logo
│           └── hero.png              ← Hero image asset
│
└── venv/                             ← Python virtual environment (gitignored)
```

---

## 5. How It Works — Full Architecture

```
Browser (React/Vite)
        │
        │  HTTP requests to /api/*
        │  (proxied in dev via vite.config.ts)
        │  (direct URL in production via VITE_API_BASE)
        ▼
FastAPI Backend (Render / local)
        │
        ├── POST /api/extract
        │       └── extractor.py
        │               ├── .pdf  → pdfplumber → pypdf fallback
        │               ├── image → Pillow preprocess → Tesseract OCR
        │               ├── .docx → python-docx
        │               ├── .xlsx/.csv → pandas + openpyxl
        │               └── .txt/.md → UTF-8 decode + heading split
        │
        ├── POST /api/summarize
        │       └── summarizer.py
        │               ├── Try gemini_engine.py (if GEMINI_API_KEY exists)
        │               │       └── Gemini 2.5 Flash → JSON response
        │               └── Fallback: nlp_engine.py
        │                       ├── TextRank sentence scoring (TF-IDF)
        │                       ├── Flesch readability formulas
        │                       ├── Regex metric/date extraction
        │                       └── Rule-based improvement suggestions
        │
        ├── POST /api/qa
        │       └── qa.py
        │               ├── Try gemini_engine.py (grounded Q&A)
        │               └── Fallback: keyword overlap sentence scoring
        │
        ├── GET /api/samples → returns 2 hardcoded markdown sample docs
        ├── GET /api/health  → detailed status (OCR, Gemini, formats)
        └── GET /health      → bare {"status":"ok"} for cron/uptime monitors
```

**Request flow for a file upload:**
1. User drops a file on the dropzone or picks via file dialog
2. Frontend POSTs the file as `multipart/form-data` to `/api/extract`
3. Backend routes by file extension to the appropriate parser
4. Parser returns `ExtractedDocument` (raw text + sections + metadata)
5. Frontend immediately POSTs the extracted text to `/api/summarize`
6. Backend tries Gemini first; falls back to offline NLP if no key
7. `SummaryResponse` returned with summary, takeaways, actions, metrics, suggestions, readability
8. Frontend renders all data across 4 tabs
9. Chat initialized with a greeting message referencing the document

---

## 6. Backend — Detailed Breakdown

### main.py
- Creates the FastAPI app instance with title, description, version
- Loads `.env` via `python-dotenv` on startup
- Configures CORS: reads `ALLOWED_ORIGINS` env var; defaults to `"*"`
- Appends backend root to `sys.path` so `services.*` imports work in Docker
- Defines 6 routes (see API Reference section)
- On startup: reads `PORT` env var (default 7860), binds to `0.0.0.0`

### models.py — All Pydantic Models

**DocumentMetadata**
- `filename` (str), `file_type` (str), `file_size_bytes` (int)
- `char_count` (int), `word_count` (int), `sentence_count` (int)
- `estimated_read_time_minutes` (float) — word_count / 200
- `page_or_sheet_count` (int), `extraction_method` (str)

**ExtractedDocument**
- `metadata` (DocumentMetadata)
- `raw_text` (str) — full extracted text
- `sections` (list of dicts with `title`, `content`, `page`)
- `preview` (str) — first 500 characters

**SummarizeRequest**
- `text` (str) — the extracted document text
- `summary_length` (str) — `"short"` | `"medium"` | `"long"`
- `summary_style` (str) — `"executive"` | `"technical"` | `"bulleted"` | `"casual"`
- `custom_instructions` (str, optional)
- `gemini_api_key` (str, optional) — passed from browser localStorage

**SummaryResponse**
- `summary_text` (str), `summary_length` (str), `summary_style` (str)
- `key_takeaways` (list[str])
- `key_points` (list[KeyPoint]) — each has `category`, `point`, `importance`
- `action_items` (list[str])
- `important_metrics_or_dates` (list[str])
- `improvement_suggestions` (list[ImprovementSuggestion])
- `readability` (ReadabilityScore)
- `engine_used` (str) — which engine generated this

**ReadabilityScore**
- `flesch_reading_ease` (float, 0–100)
- `flesch_kincaid_grade` (float, 1–18)
- `readability_level` (str) — human label
- `avg_words_per_sentence` (float)
- `avg_syllables_per_word` (float)
- `reading_tone` (str)

**ImprovementSuggestion**
- `category` (str), `type` (str), `suggestion` (str)
- `impact` (str) — `"high"` | `"medium"` | `"low"`
- `example` (str, optional)

**QARequest**
- `document_text` (str), `question` (str)
- `chat_history` (list[dict]) — `role` + `content` pairs
- `gemini_api_key` (str, optional)

**QAResponse**
- `answer` (str), `relevant_excerpts` (list[str])
- `confidence` (str), `engine_used` (str)

### services/extractor.py
- `configure_tesseract()` — checks PATH first, then 4 Windows hardcoded paths, sets `pytesseract.pytesseract.tesseract_cmd` if found. Returns bool `HAS_TESSERACT`
- `preprocess_image_for_ocr(image)` — grayscale → contrast ×2 → SHARPEN filter
- `extract_from_image()` — opens image, preprocesses, runs Tesseract, returns `ExtractedDocument`
- `extract_from_pdf()` — tries pdfplumber (layout=True + table extraction), falls back to pypdf, returns `ExtractedDocument`
- `extract_from_docx()` — iterates paragraphs/headings, extracts tables as pipe-delimited text
- `extract_from_excel()` — reads all sheets, shows column info, `describe()` stats, top 15 rows
- `extract_from_plain_text()` — multi-encoding decode, splits on `#` headings for sections
- `extract_document(file_bytes, filename)` — master router, dispatches by file extension

### services/gemini_engine.py
- `get_client(api_key)` — reads key from argument or `GEMINI_API_KEY` env var; returns `None` if missing
- `gemini_summarize()` — sends structured JSON prompt to `gemini-2.5-flash` (temperature 0.3, response_mime_type `application/json`). Text capped at 45,000 characters. Strips markdown fences from response. Returns `SummaryResponse` or `None` on any error
- `gemini_answer_question()` — sends document context + last 6 chat messages + question. Temperature 0.2. Returns `QAResponse` or `None`

### services/nlp_engine.py
- `count_syllables(word)` — regex-based English syllable estimator
- `calculate_readability(text)` — Flesch Reading Ease + Flesch-Kincaid Grade Level formulas, keyword-based tone detection across 4 categories
- `extract_key_metrics_and_dates(text)` — regex finds currencies (`$42.5M`), percentages (`28%`), dates (ISO, Month Day Year, Q1 2026)
- `extract_action_items(text)` — matches sentences containing action keywords
- `generate_improvement_suggestions(text, readability)` — 5 rules: long sentences, filler words, missing structure, missing action items section, short sentence cadence. Falls back to 2 generic suggestions
- `textrank_summarize(text, summary_length, summary_style)` — TF-IDF word frequency scoring on sentences, positional boost (first 15% × 1.35, last 10% × 1.20), numeric value boost (× 1.15), style-specific formatting

### services/summarizer.py
- `generate_summary(req)` — tries Gemini if key present, falls back to `textrank_summarize` + all NLP helpers

### services/qa.py
- `offline_answer_question()` — tokenises question words, scores sentences by keyword overlap, returns top 3 matches
- `answer_document_question(req)` — tries Gemini, falls back to offline

---

## 7. Frontend — Detailed Breakdown

### index.html
- Sets charset UTF-8, viewport meta
- Favicon: `/logo.svg` (the eagle shield SVG)
- Title: `TalonAI • Intelligent Document Intelligence`
- Loads Google Fonts: Inter (300–900 weights) + JetBrains Mono (400, 500)
- Body class `dark-theme` on initial load
- Single `<div id="root">` — React mounts here

### main.jsx
- Imports React, ReactDOM, App component, and `index.css`
- Renders `<App />` into `#root` using `ReactDOM.createRoot`

### App.jsx — Complete State Map

**State variables:**
| Variable | Type | Purpose |
|---|---|---|
| `theme` | string | `'dark'` or `'light'` |
| `selectedFile` | File or null | Currently selected/uploaded file |
| `isDragging` | bool | Drag-over visual state |
| `isLoading` | bool | Shows spinner during processing |
| `loadingStep` | string | Text shown under spinner |
| `extractedDoc` | object or null | ExtractedDocument from backend |
| `summaryData` | object or null | SummaryResponse from backend |
| `activeTab` | string | `'summary'`, `'suggestions'`, `'extracted'`, `'chat'` |
| `summaryLength` | string | `'short'`, `'medium'`, `'long'` |
| `summaryStyle` | string | `'executive'`, `'technical'`, `'bulleted'`, `'casual'` |
| `customInstructions` | string | Free-text instruction for AI |
| `isPlayingAudio` | bool | TTS active state |
| `searchQuery` | string | Live search in extracted text tab |
| `chatMessages` | array | Full conversation history |
| `currentQuestion` | string | Current chat input value |
| `isAnswering` | bool | Q&A request in flight |
| `apiKey` | string | Gemini key from localStorage |
| `showSettings` | bool | Settings modal open state |
| `samples` | array | Loaded from GET /api/samples |
| `copiedToast` | bool | "Copied!" toast state |

**Key functions:**
| Function | What it does |
|---|---|
| `handleDragOver/Leave/Drop` | Drag-and-drop file handling |
| `handleFileUpload(file)` | POSTs to /api/extract, then /api/summarize, sets chat greeting |
| `handleLoadSample(sample)` | Builds mock ExtractedDocument client-side, calls /api/summarize |
| `generateDocumentSummary(text, length, style)` | POSTs to /api/summarize, sets summaryData |
| `handleRegenerate()` | Re-calls summarize with current length/style/instructions |
| `toggleAudio()` | Starts/stops Web Speech API TTS |
| `handleCopySummary()` | Copies summary + takeaways to clipboard, fires confetti |
| `handleExportPDF()` | Generates PDF with jsPDF, handles page overflow |
| `handleExportMarkdown()` | Creates Blob download of full Markdown report |
| `handleSendQuestion(e)` | POSTs to /api/qa with full chat history, appends response |
| `renderHighlightedText(text, query)` | Regex splits text and wraps matches in `<mark>` |
| `handleSaveApiKey(key)` | Saves key to localStorage, closes modal |

**`API_BASE` constant:**
```js
const API_BASE = import.meta.env.VITE_API_BASE || '';
```
- In development: `''` (empty) → Vite proxy adds the backend URL
- In production build: set to `https://document-summary-assistant-j52y.onrender.com`

### index.css — Design System

**CSS Custom Properties (Dark theme defaults):**
| Variable | Value | Purpose |
|---|---|---|
| `--bg-primary` | `#141414` | Page background |
| `--bg-card` | `#1e1e1e` | Card/panel background |
| `--bg-input` | `#242424` | Input/code block background |
| `--bg-elevated` | `#2a2a2a` | Hover elevated surface |
| `--accent-primary` | `#ff5714` | Orange — all CTAs, active states |
| `--accent-gradient` | orange → light orange | Buttons, active elements |
| `--text-primary` | `#f0f0f0` | Main text |
| `--text-secondary` | `#a0a0a0` | Subtitles, labels |
| `--text-muted` | `#5a5a5a` | Placeholders, metadata |
| `--success` | `#22c55e` | Action items border |
| `--info` | `#38bdf8` | Metric badges |
| `--warning` | `#f59e0b` | High impact badges |

**Light theme** overrides all backgrounds to warm off-whites (`#f5f4f2`) while keeping orange accents.

**Key CSS classes:**
- `.glass-panel` — card with dark bg, subtle border, drop shadow
- `.dropzone` / `.dropzone.active` — dashed border, orange glow on hover/drag
- `.option-card.selected` — orange border + background tint
- `.takeaway-item` — left border `3px solid orange`
- `.action-item` — left border `3px solid green`
- `.summary-card` — left border `3px solid orange`
- `.chat-user` — orange gradient bubble (right-aligned)
- `.chat-assistant` — dark input bg bubble (left-aligned)
- `.score-number` — gradient text clip (orange gradient applied to text)
- `.brand-logo-wrapper` — eagle logo with orange drop-shadow glow
- `.empty-state-logo` — pulsing orange glow animation

**Responsive breakpoints:**
- `≤ 1024px` — sidebar stacks above content (single column)
- `≤ 768px` — header wraps, tagline hidden, tabs tighten, 2-col metadata grid
- `≤ 480px` — button labels hidden (icon only), badge hidden, font sizes reduced

### vite.config.ts
- Reads `VITE_API_BASE` env var using `loadEnv`
- In dev: proxies `/api/*` to `VITE_API_BASE` or `http://127.0.0.1:8000`
- Dev server port: `5173`
- Plugin: `@vitejs/plugin-react`

---

## 8. API Reference — Every Endpoint

### GET /health
Simple health check for cron jobs and uptime monitors.
```json
Response: { "status": "ok" }
```

### GET /api/health
Detailed health status.
```json
Response: {
  "status": "healthy",
  "service": "TalonAI Document Summary Assistant",
  "ocr_available": true,
  "gemini_api_configured": false,
  "supported_formats": ["PDF (.pdf)", "Images (.png, .jpg, ...)", ...]
}
```

### POST /api/extract
Upload a document for text extraction.
- **Content-Type:** `multipart/form-data`
- **Body:** `file` — the uploaded file
- **Returns:** `ExtractedDocument`
- **Errors:** 400 if no filename or empty file; 500 if parsing fails

### POST /api/summarize
Generate a summary from text.
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "text": "document text here...",
  "summary_length": "medium",
  "summary_style": "executive",
  "custom_instructions": "focus on risks",
  "gemini_api_key": "AIzaSy..."
}
```
- **Returns:** `SummaryResponse`
- **Errors:** 400 if text is empty; 500 if summarization fails

### POST /api/qa
Answer a question about a document.
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "document_text": "full document text...",
  "question": "What was the revenue?",
  "chat_history": [{"role": "user", "content": "..."}, ...],
  "gemini_api_key": "AIzaSy..."
}
```
- **Returns:** `QAResponse`
- **Errors:** 400 if document_text or question missing

### GET /api/samples
Returns 2 built-in sample documents.
```json
[
  { "id": "quarterly-report", "title": "...", "file_type": "...", "filename": "...", "content": "..." },
  { "id": "medical-research", "title": "...", ... }
]
```

---

## 9. Data Models — Every Field

### ExtractedDocument
```json
{
  "metadata": {
    "filename": "report.pdf",
    "file_type": "PDF Document",
    "file_size_bytes": 204800,
    "char_count": 12500,
    "word_count": 2100,
    "sentence_count": 145,
    "estimated_read_time_minutes": 10.5,
    "page_or_sheet_count": 8,
    "extraction_method": "PDF Parser (pdfplumber/PyPDF)"
  },
  "raw_text": "--- Page 1 ---\nFull extracted text...",
  "sections": [
    { "title": "Page 1", "content": "...", "page": 1 }
  ],
  "preview": "First 500 characters..."
}
```

### SummaryResponse
```json
{
  "summary_text": "## Executive Overview\n\nGlobal Tech...",
  "summary_length": "medium",
  "summary_style": "executive",
  "key_takeaways": ["Revenue grew 28% YoY", "ARR reached $162M", ...],
  "key_points": [
    { "category": "Financial", "point": "...", "importance": "high" }
  ],
  "action_items": ["Complete hiring by January 31", ...],
  "important_metrics_or_dates": ["$42.5M", "28%", "Q3 2026"],
  "improvement_suggestions": [
    {
      "category": "Readability & Syntax",
      "type": "clarity",
      "suggestion": "Found 3 sentences with over 30 words...",
      "impact": "high",
      "example": "Long sentence detected: \"...\""
    }
  ],
  "readability": {
    "flesch_reading_ease": 65.0,
    "flesch_kincaid_grade": 9.2,
    "readability_level": "Standard / Plain English (Grade 7-9)",
    "avg_words_per_sentence": 18.4,
    "avg_syllables_per_word": 1.52,
    "reading_tone": "Analytical / Data-Driven"
  },
  "engine_used": "Google Gemini 2.5 Flash (AI Engine)"
}
```

### QAResponse
```json
{
  "answer": "Based on the document:\n\n• Revenue was $42.5M in Q3 2026",
  "relevant_excerpts": [
    "Global Tech achieved $42.5 million revenue in Q3 2026",
    "Net Operating Profit was $8.9M"
  ],
  "confidence": "high",
  "engine_used": "Google Gemini 2.5 Flash"
}
```

---

## 10. Environment Variables & Configuration

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | No | — | Google Gemini AI key. Get free at https://aistudio.google.com/app/apikey |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins. Set to your frontend URL in production |
| `PORT` | No | `7860` | Port to bind (injected automatically by Render/HF Spaces) |

Create `backend/.env` (copy from `backend/.env.example`):
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (`frontend/.env.production`)
| Variable | Value |
|---|---|
| `VITE_API_BASE` | `https://document-summary-assistant-j52y.onrender.com` |

For local dev, `frontend/.env.development` has `VITE_API_BASE=` (empty) so the Vite proxy handles routing.

### Gemini API Key in Browser
- Users can enter their own key in the Settings modal
- Stored in `localStorage` under key `docupulse_gemini_key`
- Sent per-request in JSON body as `gemini_api_key`
- The server-side key (`GEMINI_API_KEY` env var) takes precedence

---

## 11. Local Setup — Step by Step

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- Tesseract OCR 5.x (for image OCR — optional but recommended)
  - Windows: download from https://github.com/UB-Mannheim/tesseract/wiki
  - Install to `C:\Program Files\Tesseract-OCR\` (auto-detected by the code)
  - Linux/Mac: `apt-get install tesseract-ocr` or `brew install tesseract`

### Backend Setup
```bash
# 1. Navigate to project root
cd C:\Users\ashut\OneDrive\Desktop\UnThinkable

# 2. Activate the virtual environment
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# 3. Install Python dependencies (already done, but if starting fresh)
cd backend
pip install -r requirements.txt

# 4. Create .env file
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional)

# 5. Start the backend
python main.py
```
Backend runs at: http://127.0.0.1:7860
Swagger API docs: http://127.0.0.1:7860/docs

### Frontend Setup
```bash
# In a second terminal
cd frontend

# Install Node dependencies (already done, but if starting fresh)
npm install

# Start the dev server
npm run dev
```
Frontend runs at: http://localhost:5173

### Building for Production
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## 12. Cloud Deployment — Render & HF Spaces

### Option A — Render.com (Current live deployment)

**URL:** https://document-summary-assistant-j52y.onrender.com

**Steps to deploy:**
1. Go to https://render.com → New → Web Service
2. Connect to GitHub repo: `Ashutosh-Ojha0807/Document-Summary-Assistant`
3. Set **Root Directory** to `backend`
4. Render auto-detects the `Dockerfile`
5. Under **Environment Variables** in Render dashboard, add:
   - `GEMINI_API_KEY` = your Gemini key
   - `ALLOWED_ORIGINS` = `*` (or your frontend URL)
6. Click **Deploy** — Docker build takes ~3 minutes

**What the Dockerfile does:**
1. Starts from `python:3.11-slim`
2. `apt-get install` → Tesseract OCR + English pack + poppler-utils + Pillow system libs
3. Copies `requirements.txt`, runs `pip install`
4. Copies all backend files
5. Creates non-root user `appuser` (required for HF Spaces)
6. Exposes port 7860
7. Runs `python main.py`

**Free tier limitations:**
- Service sleeps after 15 minutes of inactivity
- Cold start takes ~30 seconds
- Upgrade to Starter ($7/mo) to keep it always-on

### Option B — Hugging Face Spaces

1. Create a new Space at https://huggingface.co/new-space
2. Select SDK: **Docker**
3. Clone the Space repo
4. Copy contents of `backend/` into the Space repo root
5. Push — HF builds automatically from the `Dockerfile`
6. Add `GEMINI_API_KEY` in Space Settings → Repository Secrets

**HF Spaces notes:**
- Port must be `7860` (already set in Dockerfile and main.py default)
- Non-root user `appuser` already created in Dockerfile (HF requirement)
- Free tier: 2 vCPU, 16GB RAM, no sleep

### Option C — Docker locally
```bash
cd backend
docker build -t talonai-backend .
docker run -p 7860:7860 -e GEMINI_API_KEY=your_key talonai-backend
```
API available at http://localhost:7860

---

## 13. Cron Job — Keep the Free Server Alive

Render free tier sleeps after 15 minutes of inactivity. Set up a cron job to ping the `/health` endpoint every 14 minutes.

**In Render Dashboard:**
1. Go to your service → Cron Jobs tab → Add Cron Job
2. Schedule: `*/14 * * * *`
3. Command: `curl https://document-summary-assistant-j52y.onrender.com/health`

**Alternative — free uptime monitor:**
Use https://uptimerobot.com or https://cron-job.org (both free):
- URL: `https://document-summary-assistant-j52y.onrender.com/health`
- Interval: every 14 minutes
- Expected response: `{"status":"ok"}`

---

## 14. File Format Support Matrix

| Format | Extension | Parser | Tables | OCR | Notes |
|---|---|---|---|---|---|
| PDF (text) | `.pdf` | pdfplumber + pypdf | ✅ | ❌ | Layout preserved |
| PDF (scanned) | `.pdf` | pdfplumber | ❌ | ❌ | Returns message — needs OCR |
| PNG image | `.png` | Tesseract OCR | ❌ | ✅ | Pillow preprocessed |
| JPG/JPEG | `.jpg/.jpeg` | Tesseract OCR | ❌ | ✅ | Same as PNG |
| WEBP | `.webp` | Tesseract OCR | ❌ | ✅ | Same as PNG |
| BMP | `.bmp` | Tesseract OCR | ❌ | ✅ | Same as PNG |
| TIFF | `.tiff` | Tesseract OCR | ❌ | ✅ | Same as PNG |
| Word | `.docx` | python-docx | ✅ | ❌ | Headings → sections |
| Excel | `.xlsx/.xls` | pandas + openpyxl | ✅ | ❌ | Multi-sheet support |
| CSV | `.csv` | pandas | ✅ | ❌ | Single sheet |
| Text | `.txt` | UTF-8 decode | ❌ | ❌ | Multi-encoding fallback |
| Markdown | `.md` | UTF-8 + `#` split | ❌ | ❌ | Headings become sections |

---

## 15. AI Engine — Gemini vs Offline NLP

### When Gemini is Used
- `GEMINI_API_KEY` is set as an environment variable on the server, OR
- User provides their own key in the Settings modal (sent per-request)
- Model: `gemini-2.5-flash`
- Temperature: 0.3 for summarization, 0.2 for Q&A
- Input cap: 45,000 characters for summarization, 40,000 for Q&A
- Response format: `application/json` (structured output)

### Gemini Summary Prompt
Sends the document text + length guide + style guide + custom instructions.
Requests this JSON schema back:
- `summary_text`, `key_takeaways` (array), `key_points` (array with category/importance)
- `action_items` (array), `important_metrics_or_dates` (array), `improvement_suggestions` (array)

### Gemini Q&A Prompt
Sends document context + last 6 messages of chat history + user question.
Requests JSON with `answer`, `relevant_excerpts`, `confidence`.

### Offline NLP Fallback (TextRank)
Used when no Gemini key is available. 100% offline, zero API calls.

**Scoring algorithm:**
1. Split text into sentences (split on `.!?`)
2. Build TF-IDF word frequency table (excluding 100+ stopwords)
3. Score each sentence: `sum(freq[w] / max_freq for w in sentence_words) / sqrt(len(words))`
4. Apply positional boost: first 15% of sentences × 1.35, last 10% × 1.20
5. Apply numeric boost: sentences with numbers × 1.15
6. Select top N sentences (2–3 for short, 3–6 for medium, 5–12 for long)
7. Return in original document order, formatted per style

**Readability formulas:**
- Flesch Reading Ease = `206.835 - (1.015 × ASL) - (84.6 × ASW)`
- Flesch-Kincaid Grade = `(0.39 × ASL) + (11.8 × ASW) - 15.59`
- Where ASL = avg sentence length, ASW = avg syllables per word

---

## 16. UI Design System

### Colour Palette (Dark Theme)
| Role | Hex | Usage |
|---|---|---|
| Background | `#141414` | Page |
| Card | `#1e1e1e` | Panels |
| Input | `#242424` | Input fields, code blocks |
| Elevated | `#2a2a2a` | Hover states |
| Orange (primary) | `#ff5714` | Buttons, active tabs, borders |
| Orange gradient | `#ff5714 → #ff8c42` | Primary buttons, user chat bubbles |
| Text primary | `#f0f0f0` | All body text |
| Text muted | `#5a5a5a` | Labels, placeholders |
| Success | `#22c55e` | Action item borders |
| Info | `#38bdf8` | Metric badges |
| Warning | `#f59e0b` | High-impact suggestion badges |

### Logo
- Custom SVG eagle shield mascot (`frontend/src/assets/logo.svg`)
- Orange shield outline, dark eagle head, orange eyes and beak, white face mask, orange crown feathers
- Used at 52×58px in header with orange drop-shadow glow
- Used at 110×122px on empty state with pulsing glow animation
- Also used as browser favicon via `/public/logo.svg`

### Typography
- Headings/UI: Inter (Google Fonts, weight 300–900)
- Mono/code: JetBrains Mono (400, 500)

### Grid System
- Desktop: `370px sidebar + 1fr content` (2-column)
- Tablet ≤1024px: single column (sidebar on top)
- Mobile ≤768px: tighter padding, 2-col metadata, stacked readability cards
- Phone ≤480px: icon-only buttons, no labels, reduced font sizes

---

## 17. Known Limitations

| Limitation | Detail |
|---|---|
| Scanned PDFs | PDFs with no text layer (image-only) cannot be OCR'd — Tesseract only processes image files directly, not embedded PDF images |
| Free tier sleep | Render free tier sleeps after 15 min — first request after sleep takes ~30s |
| Gemini rate limits | Free Gemini API key has rate limits (15 RPM, 1M tokens/day as of 2026) |
| Large files | Text is capped at 45,000 chars for Gemini; very large documents are truncated |
| OCR accuracy | Tesseract accuracy depends on image quality; low-resolution or skewed scans may extract garbled text |
| Chat history | Only last 6 messages sent to Gemini for context window efficiency |
| No file persistence | Files are processed in memory only; nothing is stored on the server |
| CORS | Currently `ALLOWED_ORIGINS=*` — should be scoped to frontend URL for production |

---

## 18. Approach Write-Up (200 words)

TalonAI follows a clean extract → analyze → present pipeline. The backend is a
FastAPI service that routes uploaded files to format-specific parsers: pdfplumber
for text-based PDFs (preserving tables and layout), Tesseract OCR via Pillow for
scanned images, python-docx for Word documents, and pandas for spreadsheets. Each
parser returns a normalized ExtractedDocument with raw text, structured sections,
and document metadata.

The summarization layer first attempts Google Gemini 2.5 Flash via a structured
JSON prompt requesting summary text, key takeaways, action items, metrics, and
improvement suggestions in a single API call. If no Gemini key is configured, it
falls back to a custom offline TextRank engine using TF-IDF sentence scoring with
positional and numeric boosts. Readability metrics (Flesch Reading Ease,
Flesch-Kincaid Grade Level, tone detection) are always computed locally.

The React frontend is a single-page app with a sidebar for upload and configuration
(length, style, custom instructions) and a tabbed content area showing the summary,
improvement suggestions, raw extracted text with live search, and an interactive Q&A
chat. Every export (PDF, Markdown) and speech output is handled client-side to keep
the backend stateless and simple. The app is deployed on Render via Docker with
Tesseract pre-installed in the container.
