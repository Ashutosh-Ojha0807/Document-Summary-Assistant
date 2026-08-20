import os
import json
import re
from typing import Optional, Dict, Any, List, Tuple
from google import genai
from google.genai import types
from models import KeyPoint, ImprovementSuggestion, ReadabilityScore, SummaryResponse, QAResponse
from services.nlp_engine import calculate_readability, generate_improvement_suggestions, extract_key_metrics_and_dates

def get_client(api_key: Optional[str] = None) -> Optional[genai.Client]:
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key or key.strip() == "":
        return None
    try:
        return genai.Client(api_key=key.strip())
    except Exception:
        return None

def gemini_summarize(
    text: str,
    summary_length: str = "medium",
    summary_style: str = "executive",
    custom_instructions: Optional[str] = None,
    api_key: Optional[str] = None
) -> Optional[SummaryResponse]:
    """Generate high-quality structured summary using Gemini Flash."""
    client = get_client(api_key)
    if not client:
        return None

    length_guide = {
        "short": "Provide a concise executive tl;dr of 1-2 focused paragraphs (under 150 words).",
        "medium": "Provide a well-structured summary of 3-4 paragraphs (approx 300 words) with clear thematic flow.",
        "long": "Provide a comprehensive, detailed deep-dive summary covering all sections, methodologies, and findings (500+ words)."
    }.get(summary_length, "Provide a balanced, structured summary.")

    style_guide = {
        "executive": "Adopt a polished, high-level executive tone suitable for C-suite decision makers.",
        "technical": "Adopt an analytical, precise, and technical tone focusing on data, methodology, and technical architecture.",
        "bulleted": "Present the summary primarily in crisp, formatted bullet points with bold keywords.",
        "casual": "Use plain, conversational English (explain-like-I'm-5 style) with easy analogies and clear language."
    }.get(summary_style, "Professional and informative.")

    prompt = f"""
You are an expert Document Analysis AI Assistant. Analyze the following document text and return a structured JSON response with a comprehensive summary, key takeaways, action items, important metrics, and actionable writing improvement suggestions.

DOCUMENT TEXT:
\"\"\"
{text[:45000]}
\"\"\"

SUMMARY REQUIREMENTS:
- Length: {length_guide}
- Style: {style_guide}
- Custom Instructions: {custom_instructions or "None"}

Please return STRICT VALID JSON (without markdown code fence if possible, or inside ```json block) matching this schema:
{{
  "summary_text": "Detailed summary markdown text matching length and style guidelines...",
  "key_takeaways": [
    "High impact takeaway 1",
    "High impact takeaway 2",
    "High impact takeaway 3",
    "High impact takeaway 4"
  ],
  "key_points": [
    {{"category": "Strategic", "point": "Description of key point...", "importance": "high"}},
    {{"category": "Operational", "point": "Description of key point...", "importance": "medium"}},
    {{"category": "Financial/Metric", "point": "Description of key point...", "importance": "high"}}
  ],
  "action_items": [
    "Specific concrete next step or recommendation 1",
    "Specific concrete next step or recommendation 2"
  ],
  "important_metrics_or_dates": [
    "Key figure/metric 1",
    "Important deadline/date 2"
  ],
  "improvement_suggestions": [
    {{
      "category": "Structure/Clarity/Conciseness/Tone",
      "type": "clarity",
      "suggestion": "Actionable suggestion to improve the document's writing, formatting, or clarity...",
      "impact": "high",
      "example": "Concrete example or revision"
    }}
  ]
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json"
            )
        )
        
        raw_output = response.text.strip()
        # Clean JSON if wrapped in markdown block
        raw_output = re.sub(r'^```(?:json)?\s*', '', raw_output)
        raw_output = re.sub(r'\s*```$', '', raw_output)
        
        data = json.loads(raw_output)
        
        readability = calculate_readability(text)
        
        key_points = [
            KeyPoint(
                category=kp.get("category", "General"),
                point=kp.get("point", ""),
                importance=kp.get("importance", "medium")
            )
            for kp in data.get("key_points", [])
        ]
        
        suggestions = [
            ImprovementSuggestion(
                category=s.get("category", "General"),
                type=s.get("type", "clarity"),
                suggestion=s.get("suggestion", ""),
                impact=s.get("impact", "medium"),
                example=s.get("example")
            )
            for s in data.get("improvement_suggestions", [])
        ]
        
        if not suggestions:
            suggestions = generate_improvement_suggestions(text, readability)

        metrics = data.get("important_metrics_or_dates", [])
        if not metrics:
            metrics = extract_key_metrics_and_dates(text)

        return SummaryResponse(
            summary_text=data.get("summary_text", ""),
            summary_length=summary_length,
            summary_style=summary_style,
            key_takeaways=data.get("key_takeaways", []),
            key_points=key_points,
            action_items=data.get("action_items", []),
            important_metrics_or_dates=metrics,
            improvement_suggestions=suggestions,
            readability=readability,
            engine_used="Google Gemini 2.5 Flash (AI Engine)"
        )
    except Exception as e:
        print(f"Gemini API error (fallback to offline NLP): {e}")
        return None

def gemini_answer_question(
    document_text: str,
    question: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
    api_key: Optional[str] = None
) -> Optional[QAResponse]:
    """Answer questions grounded in the uploaded document."""
    client = get_client(api_key)
    if not client:
        return None

    history_context = ""
    if chat_history:
        for msg in chat_history[-6:]:
            role = "User" if msg.get("role") == "user" else "Assistant"
            history_context += f"{role}: {msg.get('content')}\n"

    prompt = f"""
You are an intelligent Document Q&A Assistant. Answer the user's question based strictly on the provided document context.

DOCUMENT CONTEXT:
\"\"\"
{document_text[:40000]}
\"\"\"

CHAT HISTORY:
{history_context if history_context else "None"}

USER QUESTION:
{question}

Return a valid JSON object:
{{
  "answer": "Clear, direct, and well-formatted markdown answer referencing specific information from the document.",
  "relevant_excerpts": [
    "Exact sentence or excerpt 1 from document supporting this answer",
    "Exact sentence or excerpt 2 from document supporting this answer"
  ],
  "confidence": "high"
}}
"""
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
        )
        raw_output = response.text.strip()
        raw_output = re.sub(r'^```(?:json)?\s*', '', raw_output)
        raw_output = re.sub(r'\s*```$', '', raw_output)
        
        data = json.loads(raw_output)
        return QAResponse(
            answer=data.get("answer", "I could not locate an answer in the document."),
            relevant_excerpts=data.get("relevant_excerpts", []),
            confidence=data.get("confidence", "high"),
            engine_used="Google Gemini 2.5 Flash"
        )
    except Exception as e:
        print(f"Gemini Q&A error: {e}")
        return None
