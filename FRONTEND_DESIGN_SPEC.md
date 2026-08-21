# TalonAI — Frontend Design Specification
### For AI-assisted frontend design & development

> This document is a complete reference for designing or regenerating the TalonAI
> frontend. Every layout, component, color, spacing, behavior, and API connection
> is described here. A designer or AI can use this alone to produce a frontend
> that is pixel-consistent with the current implementation.

---

## 1. Design Identity

| Property | Value |
|---|---|
| App name | **TalonAI** |
| Tagline | Intelligent Document Intelligence — Powered by Precision |
| Theme | Dark charcoal + orange accent (default). Light warm-white + orange (toggle) |
| Logo | Eagle shield SVG mascot. "**Talon**" in white + "**AI**" in orange (`#ff5714`) |
| Favicon | Same eagle shield SVG |
| Font — UI | Inter (Google Fonts), weights 300–900 |
| Font — Mono | JetBrains Mono, weights 400–500 |
| Vibe | Dense, sharp, data-heavy. Like a pro analytics dashboard. Not playful. |

---

## 2. Color Tokens — Use These Exact Values

### Dark Theme (default — body class `dark-theme`)

```css
--bg-primary:      #141414   /* page background */
--bg-secondary:    #1c1c1c   /* secondary surfaces */
--bg-card:         #1e1e1e   /* all panels / cards */
--bg-card-hover:   #252525   /* card hover state */
--bg-input:        #242424   /* inputs, code blocks, summary cards */
--bg-elevated:     #2a2a2a   /* hover elevated surfaces */

--border-subtle:   rgba(255,255,255,0.07)   /* default card border */
--border-default:  rgba(255,255,255,0.11)   /* input border */
--border-focus:    rgba(255,87,20,0.7)      /* orange on focus */
--border-glow:     rgba(255,87,20,0.18)     /* focus ring glow */

--text-primary:    #f0f0f0   /* all body text */
--text-secondary:  #a0a0a0   /* labels, subtitles */
--text-muted:      #5a5a5a   /* placeholders, metadata */
--text-inverse:    #141414   /* text on orange backgrounds */

--accent-primary:       #ff5714
--accent-dark:          #cc4510
--accent-light:         #ff7a45
--accent-gradient:      linear-gradient(135deg, #ff5714 0%, #ff8c42 100%)
--accent-glow:          0 0 24px rgba(255,87,20,0.4)
--accent-glow-sm:       0 0 12px rgba(255,87,20,0.25)

--success:   #22c55e    /* green — action item borders */
--warning:   #f59e0b    /* amber — high-impact badges */
--danger:    #ef4444
--info:      #38bdf8    /* blue — metric badges */

--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--radius-xl: 18px

--shadow-sm:   0 1px 4px rgba(0,0,0,0.4)
--shadow-md:   0 4px 20px rgba(0,0,0,0.5)
--shadow-lg:   0 12px 40px rgba(0,0,0,0.65)
--shadow-glow: 0 0 30px rgba(255,87,20,0.15)
```

### Light Theme (body class `light-theme`)

```css
--bg-primary:    #f5f4f2
--bg-secondary:  #edece9
--bg-card:       #ffffff
--bg-card-hover: #fafaf9
--bg-input:      #f0ede9
--bg-elevated:   #e8e4df
--text-primary:  #1a1a1a
--text-secondary:#555555
--text-muted:    #999999
/* All accent/orange tokens stay the same as dark theme */
```

### Ambient Background Effect
Two blurred radial gradients fixed behind all content (z-index 0):
- Top-left: `rgba(255,87,20,0.10)` → transparent, 520×520px, `filter: blur(60px)`, animates slowly
- Bottom-right: `rgba(255,120,50,0.07)` → transparent, 400×400px, `filter: blur(60px)`, animates in reverse
- Animation: `floatOrb` — gentle translate ±30px over 20–26s, infinite alternate

---

## 3. Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (full width, .app-header.glass-panel)                   │
├──────────────────────────┬──────────────────────────────────────┤
│                          │                                      │
│  SIDEBAR                 │  MAIN CONTENT                        │
│  370px fixed             │  1fr (fills remaining width)         │
│  (.sidebar-column)       │  (.main-content-column)              │
│                          │                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

- Max page width: **1360px**, centered with `margin: 0 auto`
- Page padding: `20px 20px 60px`
- Gap between sidebar and content: **24px**
- Layout CSS class: `.main-layout` → `grid-template-columns: 370px 1fr`

**Responsive breakpoints:**
- `≤ 1024px` → single column, sidebar stacks above content
- `≤ 768px` → tighter padding, tagline hidden, 2-col metadata, smaller tabs
- `≤ 480px` → icon-only header buttons, no labels, 2-col option grid

---

## 4. Header

**Structure (left → right):**
```
[Eagle Logo] [TalonAI PRO]           [☀/🌙 toggle] [Settings button]
             [tagline text]
```

**Logo wrapper** (`.brand-logo-wrapper`):
- Size: 52×58px (taller to match shield proportions)
- Background: transparent
- `filter: drop-shadow(0 0 8px rgba(255,87,20,0.4))`
- On hover: `filter` intensifies to `drop-shadow(0 0 14px rgba(255,87,20,0.75))` + `scale(1.05)`

**Brand text:**
- `TalonAI` = `<span class="brand-name-talon">Talon</span><span class="brand-name-ai">AI</span>`
- "Talon" → `color: #f0f0f0`, weight 900, `letter-spacing: -0.04em`
- "AI" → `color: #ff5714`, weight 900, `letter-spacing: -0.04em`
- `PRO` badge → tiny pill, orange gradient bg, white text, `font-size: 0.62rem`, uppercase
- Tagline → `font-size: 0.78rem`, `color: #5a5a5a`

**Header actions (right side):**
- Theme toggle button: 38×38px icon-only, `.btn.btn-secondary.btn-icon`
  - Shows `<Sun>` icon in dark mode, `<Moon>` icon in light mode
- Settings button: `.btn.btn-secondary` with `<Settings>` icon + "Settings" text label

**Header container:**
- `padding: 14px 24px`
- `margin-bottom: 28px`
- `border-radius: var(--radius-xl)` = 18px
- Background: `var(--bg-card)` = `#1e1e1e`
- Border: `1px solid var(--border-subtle)`
- `box-shadow: var(--shadow-sm)`

---

## 5. Sidebar (Left Panel — 370px)

Container: `.glass-panel.upload-card` — `padding: 22px`

### 5a. Section Header
```
[UploadCloud icon in #ff5714]  Document Upload
```
- Font size: `1rem`, flex row, gap 8px, `margin-bottom: 14px`

### 5b. Dropzone
CSS class: `.dropzone` (`.dropzone.active` when dragging)

**Normal state:**
- Border: `2px dashed rgba(255,255,255,0.11)`
- Background: `#242424`
- Border-radius: `var(--radius-lg)` = 14px
- Padding: `32px 18px`
- Text-align: center
- Cursor: pointer

**Hover / active (file dragging over):**
- Border-color: `#ff5714`
- Background: `rgba(255,87,20,0.05)`
- Box-shadow: `0 0 0 4px rgba(255,87,20,0.07)` — outer orange ring

**Inside the dropzone (top → bottom):**
1. **Icon wrapper** — 56×56px, `border-radius: var(--radius-md)`, `background: rgba(255,87,20,0.12)`, `border: 1px solid rgba(255,87,20,0.2)`, centers `<UploadCloud size={28} color="#ff5714">`
   - On hover: `scale(1.1) rotate(4deg)`, background darkens to `rgba(255,87,20,0.18)`
2. **Heading** — `font-size: 0.95rem` — shows filename if file selected, else "Choose or drag a document here"
3. **Subtext** — `font-size: 0.78rem`, `color: #5a5a5a` — "PDF, OCR Scans, Images, Word, Excel, CSV, Text"
4. **Format badges row** — `flex-wrap: wrap`, `justify-content: center`, `gap: 5px`, `margin-top: 16px`
   - PDF badge → `.badge.badge-accent` (orange tint)
   - OCR Image badge → `.badge.badge-info` (blue tint)
   - Word .docx badge → `.badge.badge-success` (green tint)
   - Excel/CSV badge → `.badge.badge-warning` (amber tint)

**Badge anatomy** (`.badge`):
- `font-size: 0.70rem`, weight 600
- `padding: 3px 8px`, `border-radius: 4px`
- Icon + text, `gap: 4px`

### 5c. Sample Documents Section
Separated by `border-top: 1px solid var(--border-subtle)`, `padding-top: 18px`, `margin-top: 22px`

**Section label** (`.samples-title`):
- `font-size: 0.72rem`, uppercase, `letter-spacing: 0.08em`, `color: #5a5a5a`
- `<Zap size={14} color="#ff5714">` icon + "TRY SAMPLE DOCUMENT"

**Sample buttons** (`.sample-btn`):
- Full-width, flex row, space-between
- `padding: 9px 12px`, `border-radius: 6px`
- Background: `#242424`, border: subtle
- On hover: `background: #2a2a2a`, border-color orange tint, text `color: #ff7a45`, `translateX(2px)`
- Right side: `<ArrowRight size={14} color="#5a5a5a">`
- Two buttons loaded from `GET /api/samples`

### 5d. Summary Length Selector
Label: "SUMMARY LENGTH" (config-label style — uppercase, 0.72rem, muted)

Three option cards in a 3-column grid:
| Card | Title | Desc |
|---|---|---|
| short | Short | 1-2 paras |
| medium | Medium | Standard |
| long | Long | Deep dive |

**Option card** (`.option-card`):
- `padding: 9px 6px`, text-center
- Background: `#242424`, border: subtle, `border-radius: 6px`
- Title: `font-size: 0.82rem`, weight 600
- Desc: `font-size: 0.66rem`, `color: #5a5a5a`

**Selected state** (`.option-card.selected`):
- `background: rgba(255,87,20,0.12)`
- `border-color: #ff5714`
- `box-shadow: 0 0 0 1px rgba(255,87,20,0.2)`
- Title text: `color: #ff7a45`

### 5e. Summary Style Selector
Label: "SUMMARY STYLE & TONE"

Four option cards in a 4-column grid (`.option-grid.option-grid-4`):
| Card | Title | Desc |
|---|---|---|
| executive | Executive | High-level |
| technical | Technical | In-depth |
| bulleted | Bulleted | Key points |
| casual | Casual | Plain English |

Same card styling as length selector above.

### 5f. Custom Instructions Textarea
Label: "CUSTOM INSTRUCTIONS (OPTIONAL)"

**Textarea** (`.custom-instructions-input`):
- Width: 100%, `min-height: 70px`, `resize: vertical`
- Background: `#242424`, border: subtle, `border-radius: var(--radius-md)`
- `padding: 10px 13px`, `font-size: 0.84rem`
- Placeholder: `"e.g. Focus on financial figures. Highlight risks. Summarize in 3 bullets."`
- Focus: `border-color: #ff5714`, `box-shadow: 0 0 0 3px rgba(255,87,20,0.10)`

### 5g. Re-summarize Button
Only visible when a document has been processed.

`.btn.btn-primary`, full width, `margin-top: 20px`:
- `background: linear-gradient(135deg, #ff5714 0%, #ff8c42 100%)`
- `color: #ffffff`, weight 600
- `box-shadow: 0 3px 12px rgba(255,87,20,0.45)`
- On hover: `translateY(-1px)`, stronger shadow, `brightness(1.08)`
- Left: `<RefreshCw size={16}>` (spinning if loading) + "Re-summarize Document"
- Disabled state: `opacity: 0.5`, `cursor: not-allowed`

---

## 6. Main Content Area (Right Panel)

### 6a. Loading State
Shown while `isLoading === true`. Replaces the entire content area.

**Card:** `.glass-panel`, `padding: 60px 40px`, `text-align: center`

**Spinner:**
- 56×56px circle
- `background: var(--accent-gradient)` (orange)
- Centers `<Sparkles size={28} color="#fff">`
- `animation: spin 1.5s linear infinite`

**Text below spinner:**
- Heading: "Processing Document", `font-size: 1.2rem`
- Sub: dynamic step text (e.g. "Extracting text & document structure..."), `color: #a0a0a0`, `font-size: 0.9rem`

### 6b. Empty State (no document loaded)
Shown when `extractedDoc === null` and not loading.

**Card:** `.glass-panel`, `padding: 80px 40px`, `text-align: center`

**Eagle logo:**
- 110×122px, centered
- `filter: drop-shadow(0 0 20px rgba(255,87,20,0.35))`
- `animation: pulseGlow 3s ease-in-out infinite`
  - 0%/100%: `drop-shadow(0 0 14px rgba(255,87,20,0.30))`
  - 50%: `drop-shadow(0 0 32px rgba(255,87,20,0.65))`

**Heading:** `<span class="brand-name-talon">Talon</span><span class="brand-name-ai">AI</span> — Ready to Analyze`, `font-size: 1.6rem`, `letter-spacing: -0.03em`

**Paragraph:** `color: #a0a0a0`, max-width 460px, centered, `font-size: 0.92rem`, `line-height: 1.65`

**CTA button:** `.btn.btn-primary`, `padding: 12px 24px`, `font-size: 0.95rem`
- `<Zap size={17}>` + "Try a Sample Document"

### 6c. Document Panel (after upload)
`.glass-panel` containing the metadata header + tabs + tab content.

---

## 7. Document Metadata Header

Inside the panel, `padding: 20px 24px 16px`, `border-bottom: 1px solid var(--border-subtle)`

**Top row (flex, space-between, flex-wrap):**

LEFT side:
- Filename heading: `<FileCheck size={22} color="#22c55e">` + filename text, `font-size: 1.3rem`
- Below: two badges — file type (`.badge.badge-accent`) and extraction method (`.badge`)

RIGHT side — Action toolbar (`.btn.btn-secondary.btn-sm` buttons, gap 8px, flex-wrap):
| Button | Icon | Label |
|---|---|---|
| Read Aloud | `<Volume2>` / `<VolumeX>` | "Read Aloud" / "Stop Audio" |
| Copy | `<Copy>` | "Copy" / "Copied!" |
| PDF Export | `<Download>` | "PDF" |
| Markdown Export | `<Download>` | "Markdown" |

**Metadata stats grid** (`.meta-grid`, `margin-top: 16px`):
`grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))`, gap 10px

Four boxes (`.meta-box`):
- Background: `#242424`, border: subtle, `border-radius: var(--radius-md)`, `padding: 11px 13px`
- Label row: tiny uppercase text with icon
- Value: `font-size: 1.1rem`, weight 700

| Box | Icon | Label | Value source |
|---|---|---|---|
| 1 | `<Hash>` | WORD COUNT | `metadata.word_count` (formatted with commas) |
| 2 | `<Clock>` | READ TIME | `metadata.estimated_read_time_minutes` + " min" |
| 3 | `<Layers>` | PAGES / SECTIONS | `metadata.page_or_sheet_count` |
| 4 | `<Award>` | READABILITY | "Grade " + `readability.flesch_kincaid_grade`, `color: #22c55e` |

---

## 8. Tab Navigation

`.tabs-nav` — flex row, `border-bottom: 1px solid var(--border-subtle)`, `padding: 0 20px`, `margin-bottom: 22px`, `overflow-x: auto`

Four tabs (`.tab-btn`):
| Tab key | Icon | Label |
|---|---|---|
| `summary` | `<Sparkles>` | Smart Summary |
| `suggestions` | `<AlertCircle>` | Improvement Suggestions & Metrics |
| `extracted` | `<FileText>` | Extracted Document Text |
| `chat` | `<MessageSquare>` | Document Q&A Chat |

**Tab button styles:**
- Default: `color: #5a5a5a`, `border-bottom: 2px solid transparent`, `padding: 13px 16px`, `font-size: 0.86rem`, weight 600
- Hover: `color: #a0a0a0`
- Active: `color: #ff5714`, `border-bottom-color: #ff5714`
- Gap between icon and text: 7px

---

## 9. Tab 1 — Smart Summary

Content wrapper: `.summary-content` — `padding: 0 22px 26px`

### Summary Card (`.summary-card`)
- `background: #242424`
- `border: 1px solid var(--border-subtle)`
- `border-radius: var(--radius-lg)` = 14px
- `border-left: 3px solid #ff5714` ← orange left stripe
- `padding: 22px`, `margin-bottom: 22px`, `line-height: 1.75`

**Header inside card:**
- `<BookOpen size={18} color="#ff5714">` + "Executive Summary (MEDIUM • EXECUTIVE)"
- `font-size: 1.1rem`, `margin-bottom: 12px`

**Body:** `white-space: pre-line`, `font-size: 0.95rem` — renders `summary_text` from API

### Key Takeaways Section (`.section-block`)
- Title: `<CheckCircle2 size={18} color="#ff5714">` + "Key Highlights & Core Takeaways"
- List: `.takeaway-list` — flex column, gap 8px

Each takeaway (`.takeaway-item`):
- `background: #242424`, `border-radius: var(--radius-md)`, `padding: 11px 15px`
- `border-left: 3px solid #ff5714`
- Left: bold numbered label `01`, `02`... in `color: #ff5714`, `min-width: 20px`
- Right: takeaway text, `font-size: 0.88rem`

### Action Items Section
- Title: `<CheckCircle2 size={18} color="#22c55e">` + "Action Items & Recommendations"
- List: `.action-checklist` — flex column, gap 8px

Each action item (`.action-item`):
- Same layout as takeaway but `border-left: 3px solid #22c55e`
- Left: `<input type="checkbox">` with `accentColor: #ff5714`
- Right: action text

### Key Metrics & Dates
- Title: `<Hash size={18} color="#38bdf8">` + "Key Data Points, Metrics & Milestones"
- Flex-wrap row of `.badge.badge-info` pills, `font-size: 0.85rem`, `padding: 6px 12px`

### Engine Attribution
- Bottom-right, `font-size: 0.75rem`, `color: #5a5a5a` — "Engine: Google Gemini 2.5 Flash" or "Built-in Smart NLP Engine"

---

## 10. Tab 2 — Improvement Suggestions & Metrics

### Readability Score Cards (`.readability-meter-grid`)
`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`, gap 14px, `margin-bottom: 22px`

Three cards (`.score-card`):
- `background: #242424`, border: subtle, `border-radius: var(--radius-md)`, `padding: 18px`, text-center

| Card 1 | Card 2 | Card 3 |
|---|---|---|
| Flesch Reading Ease | Grade Level | Detected Tone |
| Large number in orange gradient text | "Grade X.X" in `color: #38bdf8` | Tone string in `color: #f59e0b` |
| "0–100 (Higher is easier)" | readability_level string | "Avg X words/sentence" |

**Score number** (`.score-number`):
- `font-size: 2rem`, weight 800
- `background: var(--accent-gradient)`, `-webkit-background-clip: text`, `-webkit-text-fill-color: transparent`

### Improvement Suggestions List
Section title: `<Sparkles size={18} color="#ff5714">` + "Actionable Improvement Suggestions"

Each suggestion card (`.suggestion-card`):
- `background: #242424`, border: subtle, `border-radius: var(--radius-md)`, `padding: 14px 16px`, `margin-bottom: 10px`
- On hover: border-color orange tint, `translateY(-1px)`, background `#2a2a2a`

**Inside each card:**
- Header row (flex, space-between):
  - Left: category name, `font-size: 0.88rem`, weight 700
  - Right: impact badge
    - HIGH → `.badge.badge-warning` (amber)
    - MEDIUM/LOW → `.badge.badge-accent` (orange tint)
    - Text: "HIGH IMPACT" / "MEDIUM IMPACT"
- Description: `.suggestion-desc` — `font-size: 0.90rem`, `line-height: 1.55`
- Example block (`.suggestion-example`) — only if example exists:
  - `background: rgba(0,0,0,0.3)`, `border-left: 2px solid #ff5714`
  - `padding: 8px 12px`, `border-radius: 5px`
  - `font-family: JetBrains Mono`, `font-size: 0.80rem`, `color: #a0a0a0`

---

## 11. Tab 3 — Extracted Document Text

### Search Toolbar
Flex row, gap 10px, `margin-bottom: 16px`

- **Search input** (flex 1): relative positioned, `<Search size={16}>` icon at `left: 12px, top: 12px`
  - Input class: `.chat-input`, `padding-left: 36px`
  - Placeholder: "Search keywords within extracted document..."
- **Copy Full Text button**: `.btn.btn-secondary` with `<Copy size={16}>` + "Copy Full Text"
  - On click: copies `extractedDoc.raw_text` to clipboard

### Text Container
- `background: #242424`
- `border: 1px solid var(--border-subtle)`
- `border-radius: var(--radius-md)`
- `padding: 20px`
- `max-height: 520px`, `overflow-y: auto`
- `white-space: pre-wrap`
- `font-family: JetBrains Mono`
- `font-size: 0.86rem`, `line-height: 1.65`

**Search highlighting:** matched text wrapped in `<mark>`:
- `background-color: #fef08a`, `color: #854d0e`, `padding: 0 2px`, `border-radius: 3px`

---

## 12. Tab 4 — Document Q&A Chat

Container: `.chat-container` — flex column, `height: 520px`

### Messages Area (`.chat-messages`)
- `flex: 1`, `overflow-y: auto`, `padding: 16px`, flex column, `gap: 14px`

**User bubble** (`.chat-bubble.chat-user`):
- `align-self: flex-end`
- `background: linear-gradient(135deg, #ff5714 0%, #ff8c42 100%)`
- `color: #fff`
- `border-bottom-right-radius: 4px`
- `box-shadow: 0 2px 10px rgba(255,87,20,0.30)`
- `max-width: 80%`, `padding: 12px 16px`, `border-radius: var(--radius-lg)`

**Assistant bubble** (`.chat-bubble.chat-assistant`):
- `align-self: flex-start`
- `background: #242424`, `border: 1px solid rgba(255,255,255,0.11)`
- `border-bottom-left-radius: 4px`
- Below answer, if `excerpts.length > 0`:
  - Separator: `border-top: 1px solid var(--border-subtle)`, `margin-top: 8px`
  - "Sources:" label in weight 600, `font-size: 0.78rem`
  - Each excerpt in italic, `font-size: 0.78rem`

**Typing indicator** (while `isAnswering === true`):
- Assistant bubble with italic text "Thinking and searching document context...", `color: #5a5a5a`

### Chat Input Row (`.chat-input-row`)
- Flex row, `gap: 10px`, `padding: 14px 16px`
- `border-top: 1px solid var(--border-subtle)`
- `background: #1e1e1e`

**Input field** (`.chat-input`):
- `flex: 1`, `background: #242424`, `border: 1px solid rgba(255,255,255,0.11)`
- `border-radius: var(--radius-md)`, `padding: 11px 15px`
- Placeholder: "Ask a question about {filename}..."
- Focus: `border-color: #ff5714`, orange glow ring

**Send button**: `.btn.btn-primary.btn-icon` — 38×38px, `<Send size={16}>`
- Disabled when input is empty or `isAnswering === true`

---

## 13. Settings Modal

**Overlay** (`.modal-overlay`):
- `position: fixed`, `inset: 0`
- `background: rgba(0,0,0,0.75)`, `backdrop-filter: blur(6px)`
- `display: flex`, centered
- Click outside → closes modal

**Card** (`.modal-card`):
- `max-width: 500px`, `width: 100%`
- `background: #1c1c1c`, `border: 1px solid rgba(255,255,255,0.11)`
- `border-radius: var(--radius-xl)` = 18px
- `padding: 26px`, `box-shadow: var(--shadow-lg)`

**Header row:**
- Left: `<Settings size={20} color="#ff5714">` + "AI Engine Settings"
- Right: `✕` close button (`.btn.btn-secondary.btn-icon.btn-sm`)

**Description text:** `font-size: 0.85rem`, `color: #a0a0a0`

**API Key input:**
- Label: "Google Gemini API Key (Optional)"
- Input: `type="password"`, placeholder `"AIzaSy..."`, class `.chat-input`, full width
- Helper: "Saved locally in your browser session.", `font-size: 0.72rem`, muted

**Footer buttons (right-aligned):**
- "Cancel" → `.btn.btn-secondary`
- "Save Configuration" → `.btn.btn-primary`

---

## 14. Button System Reference

| Class | Background | Text | Use case |
|---|---|---|---|
| `.btn.btn-primary` | Orange gradient | White | Main CTAs |
| `.btn.btn-secondary` | `#2a2a2a` | `#f0f0f0` | Secondary actions |
| `.btn.btn-icon` | Same as above | — | Square icon-only, 38×38px |
| `.btn.btn-sm` | Same as above | — | Smaller, `padding: 5px 11px` |

All buttons:
- `display: inline-flex`, `align-items: center`, `gap: 7px`
- `border-radius: var(--radius-md)` = 10px
- `font-size: 0.86rem`, weight 600, `font-family: Inter`
- Transition: `all 0.18s ease`

---

## 15. API Connections (What each UI action calls)

| User Action | HTTP | Endpoint | Payload |
|---|---|---|---|
| Page load | GET | `/api/samples` | — |
| File upload / drag-drop | POST | `/api/extract` | `multipart/form-data` with `file` |
| After extract (auto) | POST | `/api/summarize` | `{text, summary_length, summary_style, custom_instructions, gemini_api_key}` |
| Re-summarize button | POST | `/api/summarize` | Same as above with current settings |
| Send chat question | POST | `/api/qa` | `{document_text, question, chat_history, gemini_api_key}` |
| Health check (cron) | GET | `/health` | — |

**API Base URL:**
```js
const API_BASE = import.meta.env.VITE_API_BASE || '';
// Dev: empty string → Vite proxy to localhost:8000
// Prod: 'https://document-summary-assistant-j52y.onrender.com'
```

All fetch calls use:
```js
fetch(`${API_BASE}/api/endpoint`, { method, headers, body })
```

---

## 16. Animations & Transitions

| Name | Where used | Definition |
|---|---|---|
| `spin` | Loading spinner, Re-summarize icon | `0° → 360°`, linear |
| `floatOrb` | Ambient bg blobs | `translate(0,0) → translate(-30px,25px) → translate(20px,-15px)`, 20–26s |
| `pulseGlow` | Empty state eagle logo | `drop-shadow` intensity oscillates over 3s |
| Tab underline | Active tab indicator | `border-bottom-color` transition, 0.18s |
| Card hover | All `.glass-panel`, `.suggestion-card` | `border-color`, `transform: translateY(-1px)`, 0.18s–0.2s |
| Dropzone hover | Upload zone | Border-color + background + outer ring, 0.22s |
| Sample btn hover | Sample document buttons | `translateX(2px)`, color change, 0.18s |
| Eagle logo hover | Header logo | `scale(1.05)` + glow intensify, 0.2s |
| Primary btn hover | All `.btn-primary` | `translateY(-1px)` + shadow intensify + `brightness(1.08)` |
| Confetti | Copy summary button | `canvas-confetti`: 50 particles, spread 60, origin y=0.8 |
| Scrollbar | All scrollable areas | Orange thumb: `rgba(255,87,20,0.25)` → `rgba(255,87,20,0.45)` on hover |

---

## 17. Icon Reference (all from `lucide-react`)

| Location | Icon | Size |
|---|---|---|
| Header theme toggle (dark) | `Sun` | 18 |
| Header theme toggle (light) | `Moon` | 18 |
| Header settings button | `Settings` | 18 |
| Sidebar upload section title | `UploadCloud` | 18 |
| Dropzone center | `UploadCloud` | 28 |
| Format badge — PDF | `FileText` | 12 |
| Format badge — Image | `Image` | 12 |
| Format badge — Word | `FileText` | 12 |
| Format badge — Spreadsheet | `FileSpreadsheet` | 12 |
| Sample section | `Zap` | 14 |
| Sample button arrows | `ArrowRight` | 14 |
| Re-summarize button | `RefreshCw` | 16 |
| Loading state | `Sparkles` | 28 |
| Document filename (after upload) | `FileCheck` | 22 |
| Read aloud (off) | `Volume2` | 15 |
| Read aloud (on) | `VolumeX` | 15 |
| Copy button | `Copy` | 15 |
| Export PDF / Markdown | `Download` | 15 |
| Word count meta box | `Hash` | 12 |
| Read time meta box | `Clock` | 12 |
| Pages meta box | `Layers` | 12 |
| Readability meta box | `Award` | 12 |
| Tab — Smart Summary | `Sparkles` | 16 |
| Tab — Suggestions | `AlertCircle` | 16 |
| Tab — Extracted Text | `FileText` | 16 |
| Tab — Q&A Chat | `MessageSquare` | 16 |
| Summary card title | `BookOpen` | 18 |
| Takeaways section | `CheckCircle2` | 18 |
| Action items section | `CheckCircle2` | 18 |
| Metrics section | `Hash` | 18 |
| Suggestions section | `Sparkles` | 18 |
| Extracted text search | `Search` | 16 |
| Extracted text copy | `Copy` | 16 |
| Q&A send button | `Send` | 16 |
| Settings modal title | `Settings` | 20 |
| Empty state CTA | `Zap` | 17 |

---

## 18. State-Driven UI Rules

| Condition | What renders |
|---|---|
| `isLoading === true` | Spinner panel replaces entire content area |
| `extractedDoc === null && !isLoading` | Empty state (eagle logo + CTA) |
| `extractedDoc !== null && !isLoading` | Document panel (metadata + tabs) |
| `activeTab === 'summary' && summaryData` | Summary card + takeaways + actions + metrics |
| `activeTab === 'summary' && !summaryData` | Nothing (summary not yet loaded) |
| `activeTab === 'suggestions' && summaryData` | Readability cards + suggestion cards |
| `activeTab === 'extracted'` | Search bar + mono text container |
| `activeTab === 'chat'` | Chat messages + input row |
| `isAnswering === true` | Typing indicator bubble in chat |
| `isPlayingAudio === true` | VolumeX icon + "Stop Audio" label on audio button |
| `copiedToast === true` | "Copied!" text on copy button (resets after 2.5s) |
| `isDragging === true` | `.dropzone.active` — orange border + glow |
| `showSettings === true` | Modal overlay with settings card |
| `selectedFile !== null` | Dropzone shows filename instead of placeholder text |
| `extractedDoc !== null` | Re-summarize button appears at bottom of sidebar |

---

## 19. Responsive Behavior

### ≤ 1024px (Tablet landscape / small laptop)
- Layout switches from 2-column to 1-column
- Sidebar stacks above main content
- Gap between sections: 16px

### ≤ 768px (Tablet portrait)
- `app-container` padding reduces to `14px 12px 48px`
- Header padding: `12px 16px`, allows wrapping
- Brand tagline: `display: none`
- Tab buttons: `padding: 11px 11px`, `font-size: 0.80rem`
- Metadata grid: `grid-template-columns: repeat(2, 1fr)`
- Readability card grid: collapses to 1-column
- Chat height: 460px

### ≤ 480px (Phone)
- Page padding: `10px 8px 36px`
- Eagle logo wrapper: 40×40px
- PRO badge: `display: none`
- Header action buttons: `width: 36px, height: 36px, padding: 0` (icon only, no text labels)
- Action toolbar buttons (`.btn-sm`): same — icon only
- Upload card padding: `14px`
- Length option grid: `repeat(3, 1fr)` (unchanged)
- Style option grid: collapses to `repeat(2, 1fr)`
- Metadata grid: `repeat(2, 1fr)`, `gap: 7px`
- Meta values: `font-size: 0.95rem`
- Tab buttons: `padding: 9px 7px`, `font-size: 0.75rem`, icons 13×13px
- Takeaway / action items: `padding: 9px 11px`, `font-size: 0.84rem`
- Chat height: 390px
- Chat bubbles: `max-width: 92%`, `font-size: 0.85rem`
- Score number: `font-size: 1.7rem`
- Modal padding: `18px 14px`
