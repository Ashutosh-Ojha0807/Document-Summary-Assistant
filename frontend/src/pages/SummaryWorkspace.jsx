import React, { useState } from 'react';
import { ArrowLeft, Download, Share2, RefreshCw, Sparkles, CheckCircle2, Hash, MessageSquare, FileText, TrendingUp, ChevronRight, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import jsPDF from 'jspdf';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function SummaryWorkspace({ doc, onNavigate, onRegenerateSummary }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryLength, setSummaryLength] = useState(doc?.summary?.summary_length || 'medium');
  const [summaryStyle, setSummaryStyle] = useState(doc?.summary?.summary_style || 'executive');
  const [regenerating, setRegenerating] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [rawTextOpen, setRawTextOpen] = useState(false);
  const [rawTextCopied, setRawTextCopied] = useState(false);
  const [rawSearchQuery, setRawSearchQuery] = useState('');

  if (!doc) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No document selected. Go to Documents to pick one.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const summary = doc.summary;

  async function handleRegenerate() {
    setRegenerating(true);
    await onRegenerateSummary(doc.id, summaryLength, summaryStyle, customInstructions);
    setRegenerating(false);
  }

  function handleExportPDF() {
    if (!summary) return;
    const pdf = new jsPDF();
    pdf.setFontSize(16); pdf.text(`Summary: ${doc.name}`, 14, 20);
    pdf.setFontSize(9);
    pdf.text(`Engine: ${summary.engine_used}`, 14, 30);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36);
    pdf.line(14, 40, 196, 40);
    pdf.setFontSize(12); pdf.text('Executive Summary', 14, 48);
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize((summary.summary_text || '').replace(/[#*_]/g, ''), 180);
    pdf.text(lines, 14, 56);
    let y = 56 + lines.length * 5 + 8;
    if (y > 260) { pdf.addPage(); y = 20; }
    pdf.setFontSize(11); pdf.text('Key Takeaways:', 14, y); y += 7;
    pdf.setFontSize(9);
    (summary.key_takeaways || []).forEach(t => {
      if (y > 270) { pdf.addPage(); y = 20; }
      const tl = pdf.splitTextToSize(`• ${t}`, 175);
      pdf.text(tl, 14, y); y += tl.length * 5 + 2;
    });
    pdf.save(`${doc.name}_Summary.pdf`);
  }

  const sections = doc.extracted?.sections || [];
  const keyInsights = summary?.key_takeaways?.slice(0, 4) || [];
  const rawText = doc.extracted?.raw_text || '';
  const extractionMethod = doc.extracted?.metadata?.extraction_method || '–';
  const wordCount = doc.extracted?.metadata?.word_count || 0;
  const charCount = doc.extracted?.metadata?.char_count || 0;

  function handleCopyRaw() {
    navigator.clipboard.writeText(rawText);
    setRawTextCopied(true);
    setTimeout(() => setRawTextCopied(false), 2000);
  }

  function highlightSearch(text, query) {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} style={{ background: '#fbbf24', color: '#1a1a1a', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
        : part
    );
  }

  const tabs = [
    { id: 'summary', label: 'Summary', icon: <Sparkles size={14} /> },
    { id: 'keypoints', label: 'Key Points', icon: <Hash size={14} /> },
    { id: 'insights', label: 'Insights', icon: <TrendingUp size={14} /> },
    { id: 'qa', label: 'Q&A', icon: <MessageSquare size={14} /> },
  ];

  return (
    <div className="page-content">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Summary Workspace</h1>
          <p className="page-subtitle">AI-generated summary and analysis of your document</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Download size={14} /> Export
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onNavigate('documents')}>
        <ArrowLeft size={14} /> Back to Documents
      </button>

      <div className="two-col">
        <div>
          {/* Document info bar */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div className={`file-icon ${(doc.type || 'txt').toLowerCase()}`} style={{ width: 40, height: 40, fontSize: '0.7rem' }}>
              {(doc.type || 'FILE').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{doc.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                {(doc.type || '').toUpperCase()} • {doc.sizeLabel || '–'} • {doc.extracted?.metadata?.page_or_sheet_count || 1} pages
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Uploaded on</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(doc.uploadedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <span className={`badge ${doc.status === 'completed' ? 'badge-green' : 'badge-amber'}`}>
              {doc.status === 'completed' ? 'Completed' : 'Processing'}
            </span>
          </div>

          {/* Tabs */}
          <div className="tabs-bar">
            {tabs.map(t => (
              <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Summary */}
          {activeTab === 'summary' && (
            <div>
              {/* Controls */}
              <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['short', 'medium', 'long'].map(l => (
                    <button key={l} onClick={() => setSummaryLength(l)}
                      className={`btn btn-sm ${summaryLength === l ? 'btn-primary' : 'btn-ghost'}`}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['executive', 'technical', 'bulleted', 'casual'].map(s => (
                    <button key={s} onClick={() => setSummaryStyle(s)}
                      className={`btn btn-sm ${summaryStyle === s ? 'btn-primary' : 'btn-ghost'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <input value={customInstructions} onChange={e => setCustomInstructions(e.target.value)}
                  placeholder="Custom instructions…" className="input" style={{ flex: 1, height: 32, padding: '4px 10px', fontSize: '0.8rem' }} />
                <button className="btn btn-secondary btn-sm" onClick={handleRegenerate} disabled={regenerating}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <RefreshCw size={13} style={regenerating ? { animation: 'spin 1s linear infinite' } : {}} />
                  {regenerating ? 'Regenerating…' : 'Regenerate Summary'}
                </button>
              </div>

              {!summary ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                  <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>No summary yet. Click "Regenerate Summary" to generate one.</p>
                </div>
              ) : (
                <>
                  {/* Executive summary card */}
                  <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '3px solid var(--orange)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                        <Sparkles size={16} style={{ color: 'var(--orange)' }} /> Executive Summary
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={handleRegenerate}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <RefreshCw size={12} /> Regenerate Summary
                      </button>
                    </div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.75, whiteSpace: 'pre-line', color: 'var(--text-1)' }}>
                      {summary.summary_text}
                    </div>
                  </div>

                  {/* Sections from document */}
                  {sections.length > 0 && (
                    <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>Main Topics Covered</div>
                      {sections.slice(0, 6).map((sec, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '12px 0', borderBottom: i < Math.min(sections.length, 6) - 1 ? '1px solid var(--border)' : 'none'
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'var(--orange-dim)', color: 'var(--orange)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.78rem', flexShrink: 0
                          }}>{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{sec.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
                              {sec.content?.substring(0, 80)}…
                            </div>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', flexShrink: 0 }}>
                            {sec.page ? `Page${sec.page}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Raw OCR / Extracted Text panel ── */}
                  {rawText && (
                    <div className="card" style={{ marginBottom: 8, overflow: 'hidden' }}>
                      {/* Collapsible header */}
                      <button
                        onClick={() => setRawTextOpen(o => !o)}
                        style={{
                          width: '100%', padding: '13px 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'none', border: 'none', cursor: 'pointer',
                          borderBottom: rawTextOpen ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileText size={15} style={{ color: 'var(--orange)' }} />
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-1)' }}>
                            Original Extracted Text
                          </span>
                          <span style={{ fontSize: '0.7rem', background: 'var(--orange-dim)', color: 'var(--orange)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                            {extractionMethod}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                            {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
                          </span>
                          {rawTextOpen
                            ? <ChevronUp size={15} style={{ color: 'var(--text-3)' }} />
                            : <ChevronDown size={15} style={{ color: 'var(--text-3)' }} />}
                        </div>
                      </button>

                      {rawTextOpen && (
                        <>
                          {/* Search + Copy toolbar */}
                          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-md)', padding: '0 10px', height: 32 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                              <input
                                value={rawSearchQuery}
                                onChange={e => setRawSearchQuery(e.target.value)}
                                placeholder="Search in extracted text…"
                                style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontSize: '0.82rem', flex: 1, outline: 'none' }}
                              />
                            </div>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={handleCopyRaw}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                            >
                              {rawTextCopied ? <Check size={13} style={{ color: 'var(--green)' }} /> : <Copy size={13} />}
                              {rawTextCopied ? 'Copied!' : 'Copy All'}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onNavigate('extracted-text', doc)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                            >
                              <FileText size={13} /> Full View
                            </button>
                          </div>

                          {/* Line-numbered text */}
                          <div style={{ maxHeight: 340, overflowY: 'auto', background: 'var(--bg-input)' }}>
                            {rawText.split('\n').map((line, idx) => (
                              <div key={idx} style={{ display: 'flex' }}>
                                <span style={{
                                  width: 38, flexShrink: 0, textAlign: 'right',
                                  paddingRight: 12, color: 'var(--text-4)',
                                  fontSize: '0.7rem', userSelect: 'none',
                                  lineHeight: '1.8em',
                                  borderRight: '1px solid var(--border)',
                                  background: 'var(--bg-card)',
                                }}>
                                  {idx + 1}
                                </span>
                                <span style={{
                                  flex: 1, paddingLeft: 12, paddingRight: 16,
                                  fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                                  lineHeight: '1.8em', color: 'var(--text-1)',
                                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                }}>
                                  {highlightSearch(line, rawSearchQuery)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Footer */}
                          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-3)' }}>
                            <span>{rawText.split('\n').length} lines · {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars</span>
                            <button
                              onClick={() => onNavigate('extracted-text', doc)}
                              style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Open in full viewer →
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab: Key Points */}
          {activeTab === 'keypoints' && summary && (
            <div>
              <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Key Takeaways</div>
                {(summary.key_takeaways || []).map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < summary.key_takeaways.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--orange-dim)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>0{i + 1}</div>
                    <span style={{ fontSize: '0.86rem', lineHeight: 1.6 }}>{t}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: '16px 18px' }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Action Items</div>
                {(summary.action_items || []).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < summary.action_items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Insights */}
          {activeTab === 'insights' && summary && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}>
                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, background: 'var(--grad-orange)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {summary.readability?.flesch_reading_ease || 0}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: 4 }}>Reading Ease</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>0–100 scale</div>
                </div>
                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--blue)' }}>
                    Grade {summary.readability?.flesch_kincaid_grade || '–'}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: 4 }}>Grade Level</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{summary.readability?.readability_level?.split('(')[0]}</div>
                </div>
                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--amber)', marginTop: 8 }}>
                    {summary.readability?.reading_tone || '–'}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: 4 }}>Detected Tone</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Avg {summary.readability?.avg_words_per_sentence} w/s</div>
                </div>
              </div>
              <div className="card" style={{ padding: '16px 18px' }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Improvement Suggestions</div>
                {(summary.improvement_suggestions || []).map((s, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < summary.improvement_suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.83rem' }}>{s.category}</span>
                      <span className={`badge ${s.impact === 'high' ? 'badge-amber' : 'badge-orange'}`}>{s.impact?.toUpperCase()} IMPACT</span>
                    </div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: s.example ? 6 : 0 }}>{s.suggestion}</p>
                    {s.example && <div style={{ fontSize: '0.76rem', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 6, borderLeft: '2px solid var(--orange)', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{s.example}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Q&A */}
          {activeTab === 'qa' && (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 12px', color: 'var(--orange)' }} />
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Document Q&A Chat</div>
              <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: 16 }}>Ask any question about this document and get precise answers with source references.</p>
              <button className="btn btn-primary" onClick={() => onNavigate('qa-chat', doc)}>
                Open Q&A Chat <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Document Info */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Document Info</div>
            {[
              ['File Name', doc.name],
              ['Pages', doc.extracted?.metadata?.page_or_sheet_count || 1],
              ['File Size', doc.sizeLabel || '–'],
              ['Language', 'English'],
              ['Uploaded', new Date(doc.uploadedAt).toLocaleDateString()],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-3)' }}>{k}</span>
                <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Key Insights quick view */}
          {keyInsights.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div className="section-label">Key Insights</div>
              {keyInsights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: i < keyInsights.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <TrendingUp size={14} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{ins}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="card" style={{ padding: '10px 0' }}>
            <div className="section-label" style={{ paddingLeft: 14 }}>Actions</div>
            {[
              { icon: <MessageSquare size={14} />, bg: 'var(--orange-dim)', color: 'var(--orange)', title: 'Ask Questions', sub: 'Chat with your document', action: () => onNavigate('qa-chat', doc) },
              { icon: <Download size={14} />, bg: 'var(--blue-dim)', color: 'var(--blue)', title: 'Download Summary', sub: 'Save summary as PDF', action: handleExportPDF },
              { icon: <FileText size={14} />, bg: 'var(--green-dim)', color: 'var(--green)', title: 'View Full Text', sub: 'See extracted text', action: () => onNavigate('extracted-text', doc) },
            ].map((a, i) => (
              <button key={i} onClick={a.action} className="action-row" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
                <div className="action-row-icon" style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                <div className="action-row-text">
                  <div className="action-row-title">{a.title}</div>
                  <div className="action-row-sub">{a.sub}</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-4)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
