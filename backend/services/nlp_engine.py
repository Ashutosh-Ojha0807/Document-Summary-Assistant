import re
import math
from collections import Counter
from typing import List, Dict, Any, Tuple
from models import KeyPoint, ImprovementSuggestion, ReadabilityScore

# Common English stopwords
STOPWORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
    'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
    'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
    'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
    'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
    'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
    'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
    'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
    'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
    'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
    'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d',
    'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
}

def count_syllables(word: str) -> int:
    """Estimate syllable count of an English word."""
    word = word.lower().strip()
    if not word:
        return 1
    if len(word) <= 3:
        return 1
    word = re.sub(r'(?:[^laeiouy]|ed|es|e)$', '', word)
    word = re.sub(r'^y', '', word)
    matches = re.findall(r'[aeiouy]{1,2}', word)
    return max(1, len(matches))

def calculate_readability(text: str) -> ReadabilityScore:
    """Calculate Flesch Reading Ease and Flesch-Kincaid Grade Level."""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    if not sentences:
        sentences = [text] if text else ["Empty"]

    words = re.findall(r'\b[A-Za-z0-9\'-]+\b', text)
    if not words:
        words = ["document"]

    total_words = len(words)
    total_sentences = len(sentences)
    total_syllables = sum(count_syllables(w) for w in words)

    asl = total_words / max(1, total_sentences)  # Average Sentence Length
    asw = total_syllables / max(1, total_words)  # Average Syllables per Word

    # Flesch Reading Ease: 206.835 - 1.015*(total_words/total_sentences) - 84.6*(total_syllables/total_words)
    reading_ease = 206.835 - (1.015 * asl) - (84.6 * asw)
    reading_ease = max(0.0, min(100.0, round(reading_ease, 1)))

    # Flesch-Kincaid Grade Level: 0.39*(total_words/total_sentences) + 11.8*(total_syllables/total_words) - 15.59
    grade_level = (0.39 * asl) + (11.8 * asw) - 15.59
    grade_level = max(1.0, min(18.0, round(grade_level, 1)))

    if reading_ease >= 80:
        level = "Very Easy (Grade 5-6 standard)"
    elif reading_ease >= 60:
        level = "Standard / Plain English (Grade 7-9)"
    elif reading_ease >= 40:
        level = "Moderate / Professional (High School to College)"
    elif reading_ease >= 20:
        level = "Complex / Academic (College Level)"
    else:
        level = "Very Dense / Specialized (Graduate & Post-Doc)"

    # Detect tone
    lower_t = text.lower()
    formal_indicators = ['furthermore', 'consequently', 'pursuant', 'hereby', 'therein', 'aforementioned', 'methodology', 'demonstrates']
    casual_indicators = ['hey', 'cool', 'awesome', 'super', 'anyway', 'stuff', 'things', 'tbh', 'imo', 'gonna', 'wanna']
    urgent_indicators = ['immediately', 'urgent', 'asap', 'critical', 'deadline', 'must', 'action required', 'imperative']
    data_indicators = ['percent', '%', 'increase', 'decrease', 'revenue', 'metric', 'average', 'total', 'growth', 'benchmark']

    tone_scores = {
        'Professional / Academic': sum(lower_t.count(w) for w in formal_indicators),
        'Casual / Conversational': sum(lower_t.count(w) for w in casual_indicators),
        'Action-Oriented / Urgent': sum(lower_t.count(w) for w in urgent_indicators),
        'Analytical / Data-Driven': sum(lower_t.count(w) for w in data_indicators)
    }
    primary_tone = max(tone_scores, key=tone_scores.get)
    if tone_scores[primary_tone] == 0:
        primary_tone = "Informative & Objective"

    return ReadabilityScore(
        flesch_reading_ease=reading_ease,
        flesch_kincaid_grade=grade_level,
        readability_level=level,
        avg_words_per_sentence=round(asl, 1),
        avg_syllables_per_word=round(asw, 2),
        reading_tone=primary_tone
    )

def extract_key_metrics_and_dates(text: str) -> List[str]:
    """Extract notable numerical statistics, percentages, dates, and currency."""
    findings = []
    
    # Financial / numbers with units ($5M, 25%, 1,200 users)
    currencies = re.findall(r'(?:[\$\€\£\₹]\s?\d+(?:,\d{3})*(?:\.\d+)?(?:\s?(?:million|billion|trillion|k|m|b))?)', text, re.IGNORECASE)
    percentages = re.findall(r'\b\d+(?:\.\d+)?%\b', text)
    dates = re.findall(r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\bQ[1-4]\s+\d{4}\b', text, re.IGNORECASE)
    
    seen = set()
    for item in currencies[:4] + percentages[:4] + dates[:4]:
        clean = item.strip()
        if clean and clean.lower() not in seen:
            seen.add(clean.lower())
            findings.append(clean)
            
    if not findings:
        # Generic numbers
        large_numbers = re.findall(r'\b\d{1,3}(?:,\d{3})+\b', text)
        for num in large_numbers[:3]:
            findings.append(f"Volume metric: {num}")
            
    return findings[:6]

def extract_action_items(text: str) -> List[str]:
    """Extract action items, recommendations, or imperatives."""
    sentences = re.split(r'[.!?\n]+', text)
    action_keywords = [
        'must', 'should', 'need to', 'recommended', 'action:', 'todo:', 'next steps',
        'require', 'will implement', 'ensure', 'follow up', 'priority', 'deliverable', 'assign', 'deadline'
    ]
    actions = []
    
    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 15 or len(s_clean) > 200:
            continue
        lower_s = s_clean.lower()
        if any(kw in lower_s for kw in action_keywords) or lower_s.startswith(('implement', 'review', 'create', 'update', 'conduct', 'verify', 'deploy')):
            # Clean leading bullet chars
            cleaned = re.sub(r'^[-*•\d\.\s]+', '', s_clean)
            if cleaned and cleaned not in actions:
                actions.append(cleaned)
                if len(actions) >= 5:
                    break
                    
    if not actions:
        actions = [
            "Review key findings and circulate with the responsible stakeholders.",
            "Verify data points and align on next development or implementation milestones."
        ]
    return actions

def generate_improvement_suggestions(text: str, readability: ReadabilityScore) -> List[ImprovementSuggestion]:
    """Generate high-utility suggestions for clarity, structure, tone, and conciseness."""
    suggestions = []
    
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    long_sentences = [s for s in sentences if len(s.split()) > 30]
    
    # 1. Readability & Sentence Length
    if len(long_sentences) > 0:
        suggestions.append(ImprovementSuggestion(
            category="Readability & Syntax",
            type="clarity",
            suggestion=f"Found {len(long_sentences)} sentences with over 30 words. Splitting them into shorter, punchier clauses will improve audience comprehension.",
            impact="high",
            example=f"Long sentence detected: \"{long_sentences[0][:90]}...\""
        ))
    elif readability.flesch_reading_ease < 45:
        suggestions.append(ImprovementSuggestion(
            category="Readability",
            type="clarity",
            suggestion="The document has a high density of polysyllabic terminology. Consider simplifying technical jargon for broader accessibility.",
            impact="medium",
            example=None
        ))
        
    # 2. Passive Voice & Filler Detection
    filler_words = ['very', 'really', 'in order to', 'basically', 'actually', 'as a matter of fact', 'utilize']
    found_fillers = [fw for fw in filler_words if re.search(r'\b' + re.escape(fw) + r'\b', text, re.I)]
    if found_fillers:
        filler_list = ", ".join('"' + f + '"' for f in found_fillers[:3])
        suggestions.append(ImprovementSuggestion(
            category="Conciseness",
            type="conciseness",
            suggestion=f"Remove unnecessary filler phrases such as {filler_list} to tighten prose and sharpen the core message.",
            impact="medium",
            example="Use 'to' instead of 'in order to'; use 'use' instead of 'utilize'."
        ))

    # 3. Structure & Formatting
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    if len(paragraphs) <= 2 and len(text.split()) > 250:
        suggestions.append(ImprovementSuggestion(
            category="Document Structure",
            type="structure",
            suggestion="Break large wall-of-text blocks into distinct titled subheadings and bullet points to enable quick scanning.",
            impact="high",
            example="Use '### Overview', '### Key Metrics', '### Next Steps' headers."
        ))

    # 4. Actionability & Next Steps
    if not re.search(r'\b(next steps|action items|recommendations|conclusion|deadline)\b', text, re.I):
        suggestions.append(ImprovementSuggestion(
            category="Completeness",
            type="detail",
            suggestion="Include an explicit 'Action Items' or 'Next Steps' section at the conclusion to clearly assign ownership and timelines.",
            impact="medium",
            example="E.g., '1. Finalize draft by Friday; 2. Schedule cross-team review.'"
        ))

    # 5. Tone Consistency
    if readability.avg_words_per_sentence < 12 and len(text.split()) > 100:
        suggestions.append(ImprovementSuggestion(
            category="Flow & Cadence",
            type="tone",
            suggestion="Sentence structure is very short. Combine related ideas using transitional conjunctions (e.g., 'however', 'moreover', 'consequently') for smoother narrative flow.",
            impact="low",
            example=None
        ))

    # Baseline suggestions fallback
    if not suggestions:
        suggestions = [
            ImprovementSuggestion(
                category="Executive Clarity",
                type="clarity",
                suggestion="Add an upfront 'Executive Summary' block with 2-3 bullet points to summarize core outcomes for time-constrained readers.",
                impact="medium",
                example="E.g., '• Objective: ... • Outcome: ... • Action: ...'"
            ),
            ImprovementSuggestion(
                category="Formatting & Visual Hierarchy",
                type="structure",
                suggestion="Use bold emphasis on key figures, financial targets, and critical dates to improve visual scannability.",
                impact="low",
                example="E.g., 'Revenue reached **$42.5M** (+28% YoY)'"
            )
        ]

    return suggestions

def textrank_summarize(
    text: str,
    summary_length: str = "medium",
    summary_style: str = "executive"
) -> Tuple[str, List[str], List[KeyPoint]]:
    """
    Extractive TextRank + TF-IDF graph summarizer.
    Works 100% offline with zero external API calls.
    """
    # Clean and split into sentences
    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 15]
    if not raw_sentences:
        return text, ["No sufficient text to summarize."], []

    # Target sentence count based on length
    if summary_length == "short":
        target_count = max(2, min(3, len(raw_sentences)))
    elif summary_length == "long":
        target_count = max(5, min(12, len(raw_sentences)))
    else:  # medium
        target_count = max(3, min(6, len(raw_sentences)))

    # Compute word frequency table (TF)
    words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', text) if w.lower() not in STOPWORDS]
    word_freq = Counter(words)
    max_freq = max(word_freq.values()) if word_freq else 1

    # Score sentences
    sentence_scores = {}
    for idx, sent in enumerate(raw_sentences):
        sent_words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{3,}\b', sent) if w.lower() not in STOPWORDS]
        if not sent_words:
            continue
        
        # Word frequency score
        score = sum(word_freq[w] / max_freq for w in sent_words) / math.sqrt(len(sent_words))
        
        # Positional boost (first 20% and last 10% sentences often contain executive summary/conclusion)
        pos = idx / len(raw_sentences)
        if pos < 0.15:
            score *= 1.35
        elif pos > 0.85:
            score *= 1.20
            
        # Header/number boost
        if re.search(r'\b\d+(?:\.\d+)?%?\b', sent):
            score *= 1.15

        sentence_scores[idx] = score

    # Select top sentences preserving original document order
    top_indices = sorted(sorted(sentence_scores.keys(), key=lambda i: sentence_scores[i], reverse=True)[:target_count])
    selected_sentences = [raw_sentences[i] for i in top_indices]

    # Format summary according to style
    if summary_style == "bulleted":
        summary_text = "\n\n".join(f"• {s}" for s in selected_sentences)
    elif summary_style == "technical":
        summary_text = f"**Technical Assessment & Core Findings**:\n\n" + " ".join(selected_sentences)
    elif summary_style == "casual":
        summary_text = f"**Here is the quick breakdown**:\n\n" + " ".join(selected_sentences)
    else:  # executive
        summary_text = f"**Executive Overview**\n\n" + " ".join(selected_sentences)

    # Key takeaways
    takeaways = selected_sentences[:4]

    # Key points with categories
    key_points = []
    categories = ["Core Insight", "Key Finding", "Operational Detail", "Conclusion"]
    for i, s in enumerate(selected_sentences[:4]):
        cat = categories[i % len(categories)]
        key_points.append(KeyPoint(category=cat, point=s, importance="high" if i < 2 else "medium"))

    return summary_text, takeaways, key_points
