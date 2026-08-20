import re
from typing import List
from models import QARequest, QAResponse
from services.gemini_engine import gemini_answer_question

def offline_answer_question(document_text: str, question: str) -> QAResponse:
    """Extract answers and relevant excerpts using keyword matching and sentence scoring."""
    # Tokenize question
    q_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', question.lower()))
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', document_text) if len(s.strip()) > 15]
    
    if not sentences:
        return QAResponse(
            answer="The document text is too brief to extract an answer.",
            relevant_excerpts=[],
            confidence="low",
            engine_used="Offline Excerpt Matcher"
        )
        
    scored = []
    for s in sentences:
        s_lower = s.lower()
        s_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', s_lower))
        overlap = len(q_words.intersection(s_words))
        if overlap > 0:
            scored.append((overlap, s))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    top_matches = [s for _, s in scored[:3]]
    
    if top_matches:
        answer = "Based on the document:\n\n" + "\n\n".join(f"• {m}" for m in top_matches)
        confidence = "medium" if len(top_matches) >= 2 else "low"
    else:
        answer = f"I couldn't find a direct mention of key terms in the document. Please verify the question or consult the full extracted text."
        confidence = "low"
        
    return QAResponse(
        answer=answer,
        relevant_excerpts=top_matches,
        confidence=confidence,
        engine_used="Built-in Offline Context Matcher"
    )

def answer_document_question(req: QARequest) -> QAResponse:
    """Master Q&A dispatcher."""
    if req.gemini_api_key or "GEMINI_API_KEY" in __import__("os").environ:
        gemini_ans = gemini_answer_question(
            document_text=req.document_text,
            question=req.question,
            chat_history=req.chat_history,
            api_key=req.gemini_api_key
        )
        if gemini_ans:
            return gemini_ans
            
    return offline_answer_question(req.document_text, req.question)
