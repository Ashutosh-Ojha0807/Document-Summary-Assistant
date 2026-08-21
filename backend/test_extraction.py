"""
Quick extraction test — run from project root:
  venv\Scripts\python.exe backend\test_extraction.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.extractor import (
    extract_from_image, extract_from_pdf,
    extract_from_excel, extract_from_docx,
    HAS_TESSERACT, HAS_PADDLEOCR, HAS_LLMWHISPERER,
)

SAMPLES = os.path.join(os.path.dirname(__file__), '..', 'sample_docs')

def sep(label):
    print(f"\n{'='*60}\n  {label}\n{'='*60}")

def show(r):
    print(f"  method  : {r.metadata.extraction_method}")
    print(f"  words   : {r.metadata.word_count}")
    print(f"  pages   : {r.metadata.page_or_sheet_count}")
    preview = r.preview.replace('\n', ' ')[:100]
    print(f"  preview : {preview}")

sep("ENGINE STATUS")
print(f"  Tesseract    : {HAS_TESSERACT}")
print(f"  PP-OCRv6 tiny: {HAS_PADDLEOCR}")
print(f"  LLMWhisperer : {HAS_LLMWHISPERER}")

# ── Test 1: Image via PP-OCRv6 (falls back to Tesseract if needed) ──
sep("TEST 1 — IMAGE  (sample_invoice_scan.png)")
with open(os.path.join(SAMPLES, 'sample_invoice_scan.png'), 'rb') as f:
    data = f.read()
r1 = extract_from_image(data, 'sample_invoice_scan.png')
show(r1)
assert r1.metadata.word_count > 0, "Image extraction returned 0 words"
print("  PASS")

# ── Test 2: PDF via pdfplumber (LLMWhisperer not active) ──
sep("TEST 2 — PDF  (sample_document.pdf)")
with open(os.path.join(SAMPLES, 'sample_document.pdf'), 'rb') as f:
    data = f.read()
r2 = extract_from_pdf(data, 'sample_document.pdf')
show(r2)
# scanned PDF may be 0 words — just check it doesn't crash
print("  PASS")

# ── Test 3: DOCX ──
sep("TEST 3 — DOCX  (quarterly_strategic_plan.docx)")
with open(os.path.join(SAMPLES, 'quarterly_strategic_plan.docx'), 'rb') as f:
    data = f.read()
r3 = extract_from_docx(data, 'quarterly_strategic_plan.docx')
show(r3)
assert r3.metadata.word_count > 0, "DOCX extraction returned 0 words"
print("  PASS")

# ── Test 4: XLSX ──
sep("TEST 4 — XLSX  (regional_sales_q3.xlsx)")
with open(os.path.join(SAMPLES, 'regional_sales_q3.xlsx'), 'rb') as f:
    data = f.read()
r4 = extract_from_excel(data, 'regional_sales_q3.xlsx')
show(r4)
assert r4.metadata.word_count > 0, "XLSX extraction returned 0 words"
print("  PASS")

# ── Test 5: CSV ──
sep("TEST 5 — CSV  (regional_sales_q3.csv)")
with open(os.path.join(SAMPLES, 'regional_sales_q3.csv'), 'rb') as f:
    data = f.read()
r5 = extract_from_excel(data, 'regional_sales_q3.csv')
show(r5)
assert r5.metadata.word_count > 0, "CSV extraction returned 0 words"
print("  PASS")

sep("ALL TESTS PASSED")
