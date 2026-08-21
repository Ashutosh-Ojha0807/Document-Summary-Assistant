import os
import sys
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Ensure backend root is on Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from models import ExtractedDocument, SummarizeRequest, SummaryResponse, QARequest, QAResponse
from services.extractor import extract_document, HAS_TESSERACT
from services.summarizer import generate_summary
from services.qa import answer_document_question

app = FastAPI(
    title="Document Summary Assistant API",
    description="Enterprise document text extraction, smart summarization, readability scoring, and interactive Q&A.",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (usually port 5173 / localhost)
# CORS — allow all origins in dev; scope to frontend URL in prod via ALLOWED_ORIGINS env var
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
_allow_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_simple():
    """Bare /health route for Render cron jobs and uptime monitors."""
    return {"status": "ok"}

@app.get("/api/health")
def health_check():
    has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
    return {
        "status": "healthy",
        "service": "TalonAI Document Summary Assistant",
        "ocr_available": HAS_TESSERACT,
        "gemini_api_configured": has_gemini,
        "supported_formats": ["PDF (.pdf)", "Images (.png, .jpg, .jpeg, .webp, .bmp)", "Word (.docx)", "Spreadsheets (.xlsx, .csv)", "Plain Text (.txt, .md, .rtf)"]
    }

@app.post("/api/extract", response_model=ExtractedDocument)
async def extract_file_endpoint(file: UploadFile = File(...)):
    """Accepts uploaded file and returns extracted text, structure, and metadata."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")
        
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")
            
        extracted = extract_document(content, file.filename)
        return extracted
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process and extract document: {str(e)}")

@app.post("/api/summarize", response_model=SummaryResponse)
async def summarize_endpoint(req: SummarizeRequest):
    """Generates structured summary, key points, readability score, and improvement suggestions."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")
        
    try:
        return generate_summary(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/api/qa", response_model=QAResponse)
async def qa_endpoint(req: QARequest):
    """Answers user questions grounded in document text."""
    if not req.document_text or not req.question:
        raise HTTPException(status_code=400, detail="Both document_text and question are required.")
        
    try:
        return answer_document_question(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Q&A processing failed: {str(e)}")

@app.get("/api/samples")
def get_sample_documents():
    """Returns sample documents for quick evaluation."""
    return [
        {
            "id": "quarterly-report",
            "title": "Q3 Financial & Operations Strategy",
            "file_type": "Executive Report",
            "filename": "Q3_Strategic_Review.md",
            "content": """# Q3 Strategic Financial & Operational Review
**Company**: Global Tech Solutions Inc.
**Date**: November 14, 2026
**Author**: Chief Executive Officer & VP Finance

## 1. Executive Summary
In Q3 2026, Global Tech Solutions achieved total revenue of $42.5 million, representing a 28% year-over-year increase compared to Q3 2025 ($33.2 million). This growth was driven primarily by rapid adoption of our Enterprise AI Analytics platform, which added 145 new Fortune 500 clients. Our Gross Margin expanded from 68.4% to 73.1% due to automated cloud infrastructure optimizations.

## 2. Key Financial Highlights
- **Total Revenue**: $42.5M (+28% YoY)
- **Net Operating Profit**: $8.9M (20.9% operating margin)
- **Customer Acquisition Cost (CAC)**: Decreased by 14% to $1,850 per enterprise seat.
- **Annual Recurring Revenue (ARR)**: Reached $162.0 million with a net retention rate of 118%.
- **Cash and Liquid Reserves**: $54.2 million as of September 30, 2026.

## 3. Operational Milestones & Product Delivery
Our engineering division successfully shipped Version 4.2 of the core machine learning inference pipeline on August 15, reducing API latency from 180ms to 42ms. Security compliance audits for SOC2 Type II and ISO 27001 were completed with zero critical findings.

## 4. Challenges and Risk Management
Cloud server expenditures increased by 11% due to unpredicted spikes in model fine-tuning jobs during July. To mitigate this risk, the DevOps team will implement reserved GPU instance clusters by December 15, 2026, which is projected to save $250,000 monthly.

## 5. Strategic Recommendations & Action Items
1. Accelerate international expansion into the APAC region with a dedicated Tokyo office opening in Q1 2027.
2. Complete hiring for 12 Senior Cloud Infrastructure Engineers by January 31, 2027.
3. Finalize enterprise data protection terms with tier-1 enterprise partners before fiscal year close.
4. Schedule executive strategy briefing for December 5 to review the 2027 product roadmap."""
        },
        {
            "id": "medical-research",
            "title": "Clinical Research: Targeted Immunotherapy",
            "file_type": "Medical / Scientific Paper",
            "filename": "Clinical_Trial_Phase2_Results.md",
            "content": """# Phase II Clinical Trial: Efficacy of Dual-Target Kinase Inhibitor VX-482 in Refractory Solid Tumors
**Journal**: International Oncology Journal
**Publication Date**: August 2026

## Abstract
**Background**: Patients with refractory metastatic solid tumors frequently demonstrate acquired resistance to conventional single-agent kinase inhibitors. We investigated the clinical efficacy, pharmacokinetics, and safety profile of VX-482, a novel dual-target kinase inhibitor.

**Methods**: A multi-center, randomized phase II clinical trial was conducted across 18 medical centers between January 2025 and June 2026. A total of 320 eligible patients (median age: 58 years; 54% female) were randomized 1:1 to receive either VX-482 (150 mg orally once daily) or standard-of-care chemotherapy.

**Results**: The primary endpoint of Objective Response Rate (ORR) was significantly higher in the VX-482 cohort (44.2% vs 18.5%, p < 0.001). Median Progression-Free Survival (PFS) was 9.8 months for VX-482 compared to 4.3 months in the control group (Hazard Ratio = 0.52; 95% CI: 0.41–0.66). Overall survival at 12 months was 71.4% versus 51.2%.

**Safety & Adverse Events**: Treatment-related adverse events of grade 3 or higher occurred in 22% of patients receiving VX-482 (predominantly transient transaminase elevations and mild fatigue) compared to 41% in the chemotherapy arm. No treatment-related mortality was observed.

## Conclusions & Next Steps
VX-482 demonstrates robust anti-tumor activity and a manageable toxicity profile in patients with refractory tumors. We recommend initiating an international Phase III registration trial in Q1 2027 to validate overall survival benefits."""
        }
    ]

if __name__ == "__main__":
    import uvicorn
    # Cloud hosts inject PORT env var:
    #   Render   → usually 10000
    #   HF Spaces → 7860
    # Falls back to 8000 for local development
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
