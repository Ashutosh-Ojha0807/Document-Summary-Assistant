from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DocumentMetadata(BaseModel):
    filename: str
    file_type: str
    file_size_bytes: int
    char_count: int
    word_count: int
    sentence_count: int
    estimated_read_time_minutes: float
    page_or_sheet_count: Optional[int] = 1
    extraction_method: str

class ExtractedDocument(BaseModel):
    metadata: DocumentMetadata
    raw_text: str
    sections: List[Dict[str, Any]] = Field(default_factory=list)
    preview: str

class SummarizeRequest(BaseModel):
    text: str
    summary_length: str = Field(default="medium", description="short, medium, long")
    summary_style: str = Field(default="executive", description="executive, technical, bulleted, casual")
    custom_instructions: Optional[str] = None
    gemini_api_key: Optional[str] = None

class KeyPoint(BaseModel):
    category: str
    point: str
    importance: str = "high"

class ImprovementSuggestion(BaseModel):
    category: str
    type: str # 'clarity', 'structure', 'conciseness', 'tone', 'detail'
    suggestion: str
    impact: str = "medium" # 'high', 'medium', 'low'
    example: Optional[str] = None

class ReadabilityScore(BaseModel):
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    readability_level: str
    avg_words_per_sentence: float
    avg_syllables_per_word: float
    reading_tone: str

class SummaryResponse(BaseModel):
    summary_text: str
    summary_length: str
    summary_style: str
    key_takeaways: List[str] = Field(default_factory=list)
    key_points: List[KeyPoint] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    important_metrics_or_dates: List[str] = Field(default_factory=list)
    improvement_suggestions: List[ImprovementSuggestion] = Field(default_factory=list)
    readability: ReadabilityScore
    engine_used: str

class QARequest(BaseModel):
    document_text: str
    question: str
    chat_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    gemini_api_key: Optional[str] = None

class QAResponse(BaseModel):
    answer: str
    relevant_excerpts: List[str] = Field(default_factory=list)
    confidence: str = "high"
    engine_used: str
