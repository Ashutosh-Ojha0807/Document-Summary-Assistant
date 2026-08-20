import os
import sys
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("[PASS] Health check passed:", data)

def test_sample_documents_endpoint():
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    print(f"[PASS] Samples endpoint returned {len(data)} sample documents")

def test_docx_extraction():
    path = os.path.join(os.path.dirname(__file__), "..", "sample_docs", "quarterly_strategic_plan.docx")
    with open(path, "rb") as f:
        response = client.post("/api/extract", files={"file": ("quarterly_strategic_plan.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    assert response.status_code == 200
    data = response.json()
    assert "Quarterly Strategic Business Plan" in data["raw_text"]
    assert data["metadata"]["word_count"] > 0
    print(f"[PASS] DOCX extraction passed ({data['metadata']['word_count']} words)")

def test_csv_extraction():
    path = os.path.join(os.path.dirname(__file__), "..", "sample_docs", "regional_sales_q3.csv")
    with open(path, "rb") as f:
        response = client.post("/api/extract", files={"file": ("regional_sales_q3.csv", f, "text/csv")})
    assert response.status_code == 200
    data = response.json()
    assert "North America" in data["raw_text"]
    assert "Revenue_USD" in data["raw_text"]
    print(f"[PASS] CSV extraction passed: found columns and rows")

def test_xlsx_extraction():
    path = os.path.join(os.path.dirname(__file__), "..", "sample_docs", "regional_sales_q3.xlsx")
    with open(path, "rb") as f:
        response = client.post("/api/extract", files={"file": ("regional_sales_q3.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert response.status_code == 200
    data = response.json()
    assert "North America" in data["raw_text"]
    print(f"[PASS] XLSX spreadsheet extraction passed")

def test_image_extraction():
    path = os.path.join(os.path.dirname(__file__), "..", "sample_docs", "sample_invoice_scan.png")
    with open(path, "rb") as f:
        response = client.post("/api/extract", files={"file": ("sample_invoice_scan.png", f, "image/png")})
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["file_type"] == "Image / Scanned Document"
    print(f"[PASS] Image OCR / metadata extraction passed")

def test_summarization_pipeline():
    sample_text = """
    In Q3 2026, Global Tech Solutions achieved total revenue of $42.5 million, representing a 28% year-over-year increase compared to Q3 2025.
    Gross Margin expanded to 73.1% due to automated cloud infrastructure optimizations.
    Operating profit stood at $8.9 million. Annual Recurring Revenue reached $162.0 million with a net retention rate of 118%.
    The engineering team shipped Version 4.2 of the core machine learning inference pipeline on August 15, reducing latency to 42ms.
    Next steps: Accelerate international expansion into APAC with a Tokyo office in Q1 2027, and hire 12 senior engineers.
    """
    
    # Test Short Executive Summary
    res_short = client.post("/api/summarize", json={
        "text": sample_text,
        "summary_length": "short",
        "summary_style": "executive"
    })
    assert res_short.status_code == 200
    data_short = res_short.json()
    assert len(data_short["summary_text"]) > 0
    assert len(data_short["key_takeaways"]) > 0
    assert len(data_short["improvement_suggestions"]) > 0
    assert data_short["readability"]["flesch_reading_ease"] >= 0
    print(f"[PASS] Short Executive Summarization passed (readability: {data_short['readability']['readability_level']})")

    # Test Long Technical Summary
    res_long = client.post("/api/summarize", json={
        "text": sample_text,
        "summary_length": "long",
        "summary_style": "technical"
    })
    assert res_long.status_code == 200
    data_long = res_long.json()
    assert len(data_long["summary_text"]) > 0
    print(f"[PASS] Long Technical Summarization passed")

def test_qa_endpoint():
    sample_text = "Global Tech Solutions reached $42.5 million revenue in Q3 2026. The new Tokyo office will open in Q1 2027."
    response = client.post("/api/qa", json={
        "document_text": sample_text,
        "question": "When will the Tokyo office open?"
    })
    assert response.status_code == 200
    data = response.json()
    assert "Tokyo" in data["answer"] or "2027" in data["answer"]
    print(f"[PASS] Q&A grounded response passed: {data['answer']}")

if __name__ == "__main__":
    print("=== Running Document Summary Assistant Backend Test Suite ===")
    test_health()
    test_sample_documents_endpoint()
    test_docx_extraction()
    test_csv_extraction()
    test_xlsx_extraction()
    test_image_extraction()
    test_summarization_pipeline()
    test_qa_endpoint()
    print("=== ALL BACKEND TESTS PASSED SUCCESSFULLY! ===")
