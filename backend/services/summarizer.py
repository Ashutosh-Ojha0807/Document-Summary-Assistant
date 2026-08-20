from models import SummarizeRequest, SummaryResponse
from services.gemini_engine import gemini_summarize
from services.nlp_engine import (
    textrank_summarize,
    calculate_readability,
    generate_improvement_suggestions,
    extract_key_metrics_and_dates,
    extract_action_items
)

def generate_summary(req: SummarizeRequest) -> SummaryResponse:
    """Master summarizer dispatcher."""
    # 1. Try Gemini AI if API key is configured or available
    if req.gemini_api_key or "GEMINI_API_KEY" in __import__("os").environ:
        gemini_result = gemini_summarize(
            text=req.text,
            summary_length=req.summary_length,
            summary_style=req.summary_style,
            custom_instructions=req.custom_instructions,
            api_key=req.gemini_api_key
        )
        if gemini_result is not None:
            return gemini_result

    # 2. Offline Built-in High Precision NLP Engine Fallback
    summary_text, key_takeaways, key_points = textrank_summarize(
        text=req.text,
        summary_length=req.summary_length,
        summary_style=req.summary_style
    )
    
    readability = calculate_readability(req.text)
    suggestions = generate_improvement_suggestions(req.text, readability)
    metrics_or_dates = extract_key_metrics_and_dates(req.text)
    action_items = extract_action_items(req.text)

    return SummaryResponse(
        summary_text=summary_text,
        summary_length=req.summary_length,
        summary_style=req.summary_style,
        key_takeaways=key_takeaways,
        key_points=key_points,
        action_items=action_items,
        important_metrics_or_dates=metrics_or_dates,
        improvement_suggestions=suggestions,
        readability=readability,
        engine_used="Built-in Smart NLP Engine (TextRank & Linguistic Heuristics)"
    )
