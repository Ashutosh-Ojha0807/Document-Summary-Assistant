import os
import io
import re
import shutil
from typing import Dict, Any, List, Tuple
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
from pypdf import PdfReader
import pdfplumber
from docx import Document as DocxDocument
import pandas as pd

from models import DocumentMetadata, ExtractedDocument

# Auto-detect Tesseract OCR binary on Windows if not in PATH
def configure_tesseract():
    if shutil.which("tesseract"):
        return True
    
    common_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        os.path.expandvars(r"%USERPROFILE%\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
    ]
    for path in common_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            return True
    return False

HAS_TESSERACT = configure_tesseract()

def count_words_and_sentences(text: str) -> Tuple[int, int, int]:
    char_count = len(text)
    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
    sentence_count = max(1, len(sentences))
    return char_count, word_count, sentence_count

def calculate_reading_time(word_count: int) -> float:
    # Standard average reading speed: 200 words per minute
    return round(word_count / 200.0, 1)

def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """Preprocess image to boost OCR accuracy."""
    try:
        # Convert to grayscale
        gray = image.convert('L')
        # Boost contrast
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(2.0)
        # Apply sharpness
        sharp = enhanced.filter(ImageFilter.SHARPEN)
        return sharp
    except Exception:
        return image

def extract_from_image(file_bytes: bytes, filename: str) -> ExtractedDocument:
    image = Image.open(io.BytesIO(file_bytes))
    processed = preprocess_image_for_ocr(image)
    
    raw_text = ""
    extraction_method = "Tesseract OCR"
    
    try:
        raw_text = pytesseract.image_to_string(processed)
    except Exception as e:
        # Fallback if tesseract binary is missing
        raw_text = (
            f"[OCR Note: Optical Character Recognition engine attempted on {filename}. "
            f"Image dimensions: {image.width}x{image.height} px, format: {image.format}].\n"
            f"If Tesseract is not installed locally on the system, install Tesseract OCR for direct pixel text parsing."
        )
        extraction_method = "Image Metadata / OCR Fallback"

    raw_text = raw_text.strip()
    if not raw_text:
        raw_text = f"[Image File: {filename} ({image.width}x{image.height} px). No readable text was detected via OCR.]"

    char_c, word_c, sent_c = count_words_and_sentences(raw_text)
    
    metadata = DocumentMetadata(
        filename=filename,
        file_type="Image / Scanned Document",
        file_size_bytes=len(file_bytes),
        char_count=char_c,
        word_count=word_c,
        sentence_count=sent_c,
        estimated_read_time_minutes=calculate_reading_time(word_c),
        page_or_sheet_count=1,
        extraction_method=extraction_method
    )
    
    return ExtractedDocument(
        metadata=metadata,
        raw_text=raw_text,
        sections=[{"title": "Image OCR Text", "content": raw_text, "page": 1}],
        preview=raw_text[:500] + ("..." if len(raw_text) > 500 else "")
    )

def extract_from_pdf(file_bytes: bytes, filename: str) -> ExtractedDocument:
    sections = []
    full_text_list = []
    page_count = 0
    
    # First attempt: pdfplumber for layout & formatting retention
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            page_count = len(pdf.pages)
            for idx, page in enumerate(pdf.pages, start=1):
                p_text = page.extract_text(layout=True) or ""
                # Also check tables
                tables = page.extract_tables()
                if tables:
                    table_str_list = []
                    for t in tables:
                        table_lines = [" | ".join(str(cell or "").strip() for cell in row) for row in t if any(row)]
                        if table_lines:
                            table_str_list.append("\n" + "\n".join(table_lines) + "\n")
                    if table_str_list:
                        p_text += "\n\n[Extracted Tables]:\n" + "\n".join(table_str_list)
                
                p_text = p_text.strip()
                if p_text:
                    sections.append({
                        "title": f"Page {idx}",
                        "content": p_text,
                        "page": idx
                    })
                    full_text_list.append(f"--- Page {idx} ---\n{p_text}")
    except Exception:
        # Secondary fallback: pypdf
        pass

    if not full_text_list:
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            page_count = len(reader.pages)
            for idx, page in enumerate(reader.pages, start=1):
                p_text = page.extract_text() or ""
                p_text = p_text.strip()
                if p_text:
                    sections.append({
                        "title": f"Page {idx}",
                        "content": p_text,
                        "page": idx
                    })
                    full_text_list.append(f"--- Page {idx} ---\n{p_text}")
        except Exception:
            pass

    raw_text = "\n\n".join(full_text_list).strip()
    
    # If text is still empty (scanned image-only PDF), check if OCR can be applied
    extraction_method = "PDF Parser (pdfplumber/PyPDF)"
    if not raw_text:
        raw_text = f"[Scanned PDF File: {filename} with {page_count} pages. The document contains embedded raster images without an embedded text layer.]"
        extraction_method = "PDF Structure (Scanned / Image-based)"

    char_c, word_c, sent_c = count_words_and_sentences(raw_text)
    
    metadata = DocumentMetadata(
        filename=filename,
        file_type="PDF Document",
        file_size_bytes=len(file_bytes),
        char_count=char_c,
        word_count=word_c,
        sentence_count=sent_c,
        estimated_read_time_minutes=calculate_reading_time(word_c),
        page_or_sheet_count=max(1, page_count),
        extraction_method=extraction_method
    )
    
    return ExtractedDocument(
        metadata=metadata,
        raw_text=raw_text,
        sections=sections if sections else [{"title": "Document Content", "content": raw_text, "page": 1}],
        preview=raw_text[:500] + ("..." if len(raw_text) > 500 else "")
    )

def extract_from_docx(file_bytes: bytes, filename: str) -> ExtractedDocument:
    doc = DocxDocument(io.BytesIO(file_bytes))
    sections = []
    full_text_list = []
    
    current_heading = "Document Beginning"
    current_content = []
    
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
        
        # Check if paragraph is a heading
        if paragraph.style and paragraph.style.name.startswith("Heading"):
            if current_content:
                sections.append({
                    "title": current_heading,
                    "content": "\n".join(current_content),
                    "page": len(sections) + 1
                })
                current_content = []
            current_heading = text
            full_text_list.append(f"\n## {text}\n")
        else:
            current_content.append(text)
            full_text_list.append(text)
            
    if current_content:
        sections.append({
            "title": current_heading,
            "content": "\n".join(current_content),
            "page": len(sections) + 1
        })
        
    # Extract tables
    for table_idx, table in enumerate(doc.tables, start=1):
        table_rows = []
        for row in table.rows:
            row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
            if any(row_cells):
                table_rows.append(" | ".join(row_cells))
        if table_rows:
            table_content = f"\n[Table {table_idx}]:\n" + "\n".join(table_rows)
            full_text_list.append(table_content)
            sections.append({
                "title": f"Table {table_idx}",
                "content": table_content,
                "page": len(sections) + 1
            })

    raw_text = "\n".join(full_text_list).strip()
    if not raw_text:
        raw_text = f"[Word Document: {filename} is empty or contains unsupported content.]"

    char_c, word_c, sent_c = count_words_and_sentences(raw_text)
    
    metadata = DocumentMetadata(
        filename=filename,
        file_type="Microsoft Word (.docx)",
        file_size_bytes=len(file_bytes),
        char_count=char_c,
        word_count=word_c,
        sentence_count=sent_c,
        estimated_read_time_minutes=calculate_reading_time(word_c),
        page_or_sheet_count=max(1, len(sections)),
        extraction_method="python-docx Parser"
    )
    
    return ExtractedDocument(
        metadata=metadata,
        raw_text=raw_text,
        sections=sections if sections else [{"title": "Document Content", "content": raw_text, "page": 1}],
        preview=raw_text[:500] + ("..." if len(raw_text) > 500 else "")
    )

def extract_from_excel(file_bytes: bytes, filename: str) -> ExtractedDocument:
    sections = []
    full_text_list = []
    sheet_count = 1
    
    try:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
            sheet_dict = {"CSV Data": df}
        else:
            sheet_dict = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
            sheet_count = len(sheet_dict)
            
        for sheet_name, df in sheet_dict.items():
            sheet_header = f"=== Sheet: {sheet_name} (Rows: {len(df)}, Columns: {len(df.columns)}) ==="
            full_text_list.append(sheet_header)
            
            # Overview info
            cols = ", ".join(str(c) for c in df.columns)
            summary_info = f"Columns ({len(df.columns)}): {cols}\n"
            
            # Numeric summaries
            numeric_cols = df.select_dtypes(include=['number'])
            stats_str = ""
            if not numeric_cols.empty:
                desc = numeric_cols.describe().round(2)
                stats_str = "\n[Key Numeric Statistics]:\n" + desc.to_string()
                
            # Sample top rows
            top_rows = df.head(15).to_string(index=False)
            sheet_body = f"{summary_info}\n[Sample Data Preview]:\n{top_rows}\n{stats_str}"
            
            full_text_list.append(sheet_body)
            sections.append({
                "title": f"Sheet: {sheet_name}",
                "content": f"{sheet_header}\n\n{sheet_body}",
                "page": len(sections) + 1
            })
    except Exception as e:
        full_text_list.append(f"[Error parsing spreadsheet {filename}: {str(e)}]")
        
    raw_text = "\n\n".join(full_text_list).strip()
    char_c, word_c, sent_c = count_words_and_sentences(raw_text)
    
    metadata = DocumentMetadata(
        filename=filename,
        file_type="Spreadsheet (Excel/CSV)",
        file_size_bytes=len(file_bytes),
        char_count=char_c,
        word_count=word_c,
        sentence_count=sent_c,
        estimated_read_time_minutes=calculate_reading_time(word_c),
        page_or_sheet_count=sheet_count,
        extraction_method="Pandas & OpenPyXL Engine"
    )
    
    return ExtractedDocument(
        metadata=metadata,
        raw_text=raw_text,
        sections=sections if sections else [{"title": "Spreadsheet Content", "content": raw_text, "page": 1}],
        preview=raw_text[:500] + ("..." if len(raw_text) > 500 else "")
    )

def extract_from_plain_text(file_bytes: bytes, filename: str) -> ExtractedDocument:
    raw_text = ""
    for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
        try:
            raw_text = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
            
    if not raw_text:
        raw_text = file_bytes.decode('utf-8', errors='replace')
        
    raw_text = raw_text.strip()
    char_c, word_c, sent_c = count_words_and_sentences(raw_text)
    
    # Split sections by markdown headings or double line breaks
    sections = []
    lines = raw_text.splitlines()
    curr_title = "Introduction"
    curr_lines = []
    
    for line in lines:
        if line.startswith("#"):
            if curr_lines:
                sections.append({
                    "title": curr_title,
                    "content": "\n".join(curr_lines).strip(),
                    "page": len(sections) + 1
                })
                curr_lines = []
            curr_title = line.lstrip("#").strip() or f"Section {len(sections)+1}"
        else:
            curr_lines.append(line)
            
    if curr_lines:
        sections.append({
            "title": curr_title,
            "content": "\n".join(curr_lines).strip(),
            "page": len(sections) + 1
        })
        
    metadata = DocumentMetadata(
        filename=filename,
        file_type="Text / Markdown Document",
        file_size_bytes=len(file_bytes),
        char_count=char_c,
        word_count=word_c,
        sentence_count=sent_c,
        estimated_read_time_minutes=calculate_reading_time(word_c),
        page_or_sheet_count=max(1, len(sections)),
        extraction_method="Native UTF-8 Text Stream"
    )
    
    return ExtractedDocument(
        metadata=metadata,
        raw_text=raw_text,
        sections=sections if sections else [{"title": "Text Document", "content": raw_text, "page": 1}],
        preview=raw_text[:500] + ("..." if len(raw_text) > 500 else "")
    )

def extract_document(file_bytes: bytes, filename: str) -> ExtractedDocument:
    """Master routing function based on file extension and MIME."""
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == ".pdf":
        return extract_from_pdf(file_bytes, filename)
    elif ext in [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"]:
        return extract_from_image(file_bytes, filename)
    elif ext in [".docx", ".doc"]:
        return extract_from_docx(file_bytes, filename)
    elif ext in [".xlsx", ".xls", ".csv", ".tsv"]:
        return extract_from_excel(file_bytes, filename)
    elif ext in [".txt", ".md", ".rtf", ".json", ".log", ".xml", ".html", ".py", ".js", ".css"]:
        return extract_from_plain_text(file_bytes, filename)
    else:
        # Default fallback to plain text attempt
        try:
            return extract_from_plain_text(file_bytes, filename)
        except Exception:
            raise ValueError(f"Unsupported file format: {ext}")
