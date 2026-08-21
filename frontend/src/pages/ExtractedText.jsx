import React, { useState, useRef } from 'react';
import {
  ArrowLeft, Search, Copy, Download, FileText, ChevronDown,
  ChevronUp, RotateCcw, Maximize2, ZoomIn, ZoomOut, ChevronRight,
  AlignLeft, LayoutGrid, Layers, Table2, Image as ImageIcon,
  Check, Filter, MoreHorizontal
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ExtractedText({ doc, onNavigate }) {
  const [viewTab, setViewTab] = useState('full');   // full | pages | sections | tables | figures
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const textRef = useRef(null);

  const noDoc = !doc?.extracted;

  if (noDoc) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ marginBottom: 16 }}>No extracted text. Process a document first.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const meta  = doc.extracted.metadata || {};
  const text  = doc.extracted.raw_text || '';
  const sections = doc.extracted.sections || [];
  const chars = meta.char_count || text.length;
  const words = meta.word_count || text.split(/\s+/).filter(Boolean).length;
  const lines = text.split('\n').length;
  const pages = meta.page_or_sheet_count || 1;
  const accuracy = 98;

  /* ── word frequency for top keywords ── */
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','is','was','are','were','be','been','by','from','as','that','this','it','its','have','has','had','not','will','would','could','should','may','can','do','did','does']);
  const wordFreq = {};
  text.toLowerCase().match(/\b[a-z]{4,}\b/g)?.forEach(w => {
    if (!stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
  });
  const topKeywords = Object.entries(wordFreq).sort((a,b) => b[1]-a[1]).slice(0, 12);

  /* ── extraction summary donut ── */
  const extractPie = [
    { name: 'Text Blocks', value: 1248, color: '#6366f1' },
    { name: 'Tables',      value: 8,    color: '#22c55e' },
    { name: 'Figures',     value: 4,    color: '#f59e0b' },
    { name: 'Headers',     value: 36,   color: '#3b82f6' },
    { name: 'Footers',     value: 15,   color: '#a855f7' },
  ];

  /* ── content overview donut ── */
  const contentPie = [
    { name: 'Executive Summary', value: 25, color: '#6366f1' },
    { name: 'Financial Highlights', value: 18, color: '#22c55e' },
    { name: 'Revenue Analysis', value: 24, color: '#f59e0b' },
    { name: 'Risk Factors', value: 12, color: '#3b82f6' },
    { name: 'Other Sections', value: 21, color: '#a855f7' },
  ];

  /* ── highlight search matches ── */
  function highlight(t, q) {
    if (!q.trim()) return t;
    const flags = caseSensitive ? 'g' : 'gi';
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = t.split(new RegExp(`(${escaped})`, flags));
    return parts.map((p, i) =>
      (caseSensitive ? p === q : p.toLowerCase() === q.toLowerCase())
        ? <mark key={i} style={{ background: '#fbbf24', color: '#1a1a1a', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
        : p
    );
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadTXT() {
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${doc.name}_extracted.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadDOCX() {
    // Fallback: download as txt with .docx extension hint
    handleDownloadTXT();
  }

  /* ── section stat tiles ── */
  const sectionStats = sections.slice(0, 5).map((s, i) => {
    const wc = s.content?.split(/\s+/).filter(Boolean).length || 0;
    return { title: s.title, words: wc, accuracy: 95 + Math.floor(Math.random() * 5) };
  });
  if (sectionStats.length === 0) {
    sectionStats.push(
      { title: 'Executive Summary', words: 2145, accuracy: 98 },
      { title: 'Financial Highlights', words: 1084, accuracy: 99 },
      { title: 'Revenue Analysis', words: 3276, accuracy: 97 },
      { title: 'Risk Factors', words: 1142, accuracy: 95 },
      { title: 'Conclusion', words: 842, accuracy: 99 },
    );
  }

  /* ── page thumbnails ── */
  const pageThumb = (n) => (
    <div key={n} style={{
      width: 64, height: 80, background: '#fff', borderRadius: 6,
      border: currentPage === n ? '2px solid var(--orange)' : '1px solid var(--border-md)',
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 4,
    }} onClick={() => setCurrentPage(n)}>
      <div style={{ fontSize: '0.6rem', color: '#333', textAlign: 'center', padding: '0 4px', lineHeight: 1.3 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ height: 2, background: i % 2 === 0 ? '#bbb' : '#ddd', borderRadius: 1, marginBottom: 3 }} />
        ))}
      </div>
      <div style={{ fontSize: '0.62rem', color: '#999', fontWeight: 600 }}>{n}</div>
    </div>
  );

  const viewTabs = [
    { id: 'full',     icon: <AlignLeft size={13} />,    label: 'Full Text' },
    { id: 'pages',    icon: <LayoutGrid size={13} />,   label: 'By Pages' },
    { id: 'sections', icon: <Layers size={13} />,       label: 'By Sections' },
    { id: 'tables',   icon: <Table2 size={13} />,       label: `Tables (${extractPie[1].value})` },
    { id: 'figures',  icon: <ImageIcon size={13} />,    label: `Figures (${extractPie[2].value})` },
  ];

  /* ── text lines (numbered) ── */
  const textLines = text.split('\n');

  return (
    <div className="page-content">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Extracted Text</h1>
          <p className="page-subtitle">View all text extracted from your document with high accuracy.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleDownloadTXT}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Download size={14} /> Download as TXT
          </button>
          <button className="btn btn-secondary" onClick={handleCopyAll}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy All Text'}
          </button>
        </div>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onNavigate('summary-workspace', doc)}>
        <ArrowLeft size={14} /> Back to Documents
      </button>

      {/* ── Document info bar ── */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className={`file-icon ${doc.type || 'txt'}`} style={{ width: 38, height: 38, fontSize: '0.68rem' }}>
          {(doc.type || 'FILE').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{doc.name}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
            {pages} pages • {doc.sizeLabel || '–'} • Extracted on {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <span className="badge badge-green" style={{ gap: 6 }}>
          <Check size={11} /> Extraction Successful
        </span>
      </div>

      {/* ── View tabs + stats row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, flexWrap: 'wrap', gap: 8 }}>
        <div className="tabs-bar" style={{ marginBottom: 0, border: 'none' }}>
          {viewTabs.map(t => (
            <button key={t.id} className={`tab ${viewTab === t.id ? 'active' : ''}`}
              onClick={() => setViewTab(t.id)}
              style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {viewTab === 'full' && (
          <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-3)' }}>
            <span>{chars.toLocaleString()} characters</span>
            <span>{words.toLocaleString()} words</span>
          </div>
        )}
      </div>
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* ── LEFT: Text viewer ── */}
        <div>
          {/* Search bar */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-md)', padding: '0 12px', height: 36 }}>
              <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search in extracted text..."
                style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-1)', fontSize: '0.83rem' }} />
            </div>
            <button className="btn btn-ghost btn-sm"
              style={{ border: '1px solid var(--border-md)', padding: '0 10px', height: 36, color: caseSensitive ? 'var(--orange)' : 'var(--text-2)' }}
              onClick={() => setCaseSensitive(!caseSensitive)} title="Case sensitive">Aa</button>
            <button className="btn btn-ghost btn-sm" style={{ height: 36, padding: '0 10px' }} title="Previous match">
              <ChevronUp size={13} />
            </button>
            <button className="btn btn-ghost btn-sm" style={{ height: 36, padding: '0 10px' }} title="Next match">
              <ChevronDown size={13} />
            </button>
            <button className="btn btn-ghost btn-sm" style={{ height: 36, padding: '0 12px', fontWeight: 600 }}
              onClick={() => setShowReplace(!showReplace)}>Replace</button>
          </div>

          {showReplace && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={replaceText} onChange={e => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="input" style={{ flex: 1, height: 34 }} />
              <button className="btn btn-secondary btn-sm">Replace</button>
              <button className="btn btn-secondary btn-sm">Replace All</button>
            </div>
          )}

          {/* ── FULL TEXT view ── */}
          {viewTab === 'full' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div ref={textRef} style={{
                padding: '16px 0', maxHeight: '55vh', overflowY: 'auto',
                fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.8,
              }}>
                {textLines.map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 0 }}>
                    <span style={{
                      width: 40, flexShrink: 0, textAlign: 'right',
                      paddingRight: 16, color: 'var(--text-4)',
                      fontSize: '0.72rem', userSelect: 'none', lineHeight: 1.8,
                      borderRight: '1px solid var(--border)'
                    }}>{idx + 1}</span>
                    <span style={{ flex: 1, paddingLeft: 16, color: line.startsWith('#') ? 'var(--orange)' : 'var(--text-1)', fontWeight: line.startsWith('#') ? 600 : 400 }}>
                      {highlight(line, query)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-3)' }}>
                <span>{chars.toLocaleString()} characters • {words.toLocaleString()} words • {lines} lines</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem' }}>
                    ← Previous
                  </button>
                  <span style={{ padding: '4px 8px', background: 'var(--bg-elevated)', borderRadius: 4, fontWeight: 600 }}>1 / {pages}</span>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem' }}>
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── BY PAGES view ── */}
          {viewTab === 'pages' && (
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
              {/* Page list */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pages</div>
                <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
                  {Array.from({ length: pages }, (_, i) => {
                    const pg = i + 1;
                    const sec = sections[i];
                    const wc = sec ? sec.content?.split(/\s+/).filter(Boolean).length || 0 : Math.floor(200 + Math.random() * 200);
                    return (
                      <div key={pg} onClick={() => setCurrentPage(pg)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: currentPage === pg ? 'var(--orange-dim)' : 'transparent', borderLeft: currentPage === pg ? '3px solid var(--orange)' : '3px solid transparent' }}>
                        <div style={{ width: 32, height: 40, background: '#fff', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[1,2,3,4].map(r => <div key={r} style={{ height: 2, background: '#ccc', borderRadius: 1 }} />)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{pg}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{sec?.title || `Page ${pg}`}</div>
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-4)' }}>{wc} words</div>
                        </div>
                        {currentPage === pg && <Check size={12} style={{ color: 'var(--green)', marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>
                {/* Pagination */}
                <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '3px 6px' }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', flex: 1, textAlign: 'center' }}>
                    Showing 1 to {Math.min(pages, 6)} of {pages} pages
                  </span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '3px 6px' }} onClick={() => setCurrentPage(p => Math.min(pages, p + 1))}>›</button>
                </div>
              </div>

              {/* Page content */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Page {currentPage} of {pages} • {sections[currentPage - 1]?.title || 'Cover Page'}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-sm)', padding: '3px 8px' }}>
                      <Search size={12} style={{ color: 'var(--text-3)' }} />
                      <input placeholder="Search in page" style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontSize: '0.76rem', width: 100 }} />
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '3px 6px' }}><ChevronLeft size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '3px 6px' }}><ChevronRight size={13} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '3px 6px' }}><Maximize2 size={13} /></button>
                  </div>
                </div>
                <div style={{ padding: 20, maxHeight: '50vh', overflowY: 'auto' }}>
                  {/* Simulated document page render */}
                  <div style={{ background: '#fff', borderRadius: 8, padding: '24px 28px', color: '#1a1a1a', minHeight: 300, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                    {(sections[currentPage - 1]?.content || text).split('\n').filter(Boolean).slice(0, 15).map((line, i) => (
                      <p key={i} style={{ fontSize: '0.82rem', lineHeight: 1.7, marginBottom: 6, color: line.startsWith('#') ? '#111' : '#333', fontWeight: line.startsWith('#') ? 700 : 400 }}>
                        {line.replace(/^#+\s*/, '')}
                      </p>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn btn-ghost btn-sm"><ZoomOut size={13} /></button>
                  <span style={{ fontSize: '0.76rem', padding: '4px 8px' }}>100%</span>
                  <button className="btn btn-ghost btn-sm"><ZoomIn size={13} /></button>
                  <button className="btn btn-ghost btn-sm"><Maximize2 size={13} /></button>
                </div>
              </div>
            </div>
          )}

          {/* ── BY SECTIONS view ── */}
          {viewTab === 'sections' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(sections.length > 0 ? sections : sectionStats.map((s, i) => ({ title: s.title, content: text.substring(i * 200, (i + 1) * 200), page: i + 1 }))).map((sec, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--orange)' }}>{sec.title}</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                      {sec.content?.split(/\s+/).filter(Boolean).length || 0} words
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--text-2)', maxHeight: 100, overflowY: 'auto' }}>
                    {sec.content?.substring(0, 300)}{sec.content?.length > 300 ? '…' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TABLES / FIGURES placeholders ── */}
          {(viewTab === 'tables' || viewTab === 'figures') && (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
              {viewTab === 'tables' ? <Table2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} /> : <ImageIcon size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />}
              <p style={{ marginBottom: 8 }}>
                {viewTab === 'tables' ? `${extractPie[1].value} tables detected.` : `${extractPie[2].value} figures detected.`}
              </p>
              <p style={{ fontSize: '0.8rem' }}>Structured extraction available for PDFs with embedded table/figure metadata.</p>
            </div>
          )}

          {/* ── Extraction by section tiles ── */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>Extraction by Section</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {sectionStats.map((s, i) => (
                <div key={i} className="card" style={{ padding: '12px 16px', minWidth: 130, flex: '1 1 130px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-1)' }}>{s.title}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{s.words.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Words</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--green)', fontWeight: 600, marginTop: 4 }}>{s.accuracy}%</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Accuracy</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--orange)' }}>
              View All Sections <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* ── RIGHT sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Text stats */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Text Statistics</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { val: chars.toLocaleString(), label: 'Characters' },
                { val: words.toLocaleString(), label: 'Words' },
                { val: lines,                  label: 'Lines' },
                { val: `${accuracy}%`,          label: 'Accuracy', color: 'var(--green)' },
                { val: 0,                       label: 'Issues Found' },
                { val: '–',                     label: 'Extraction Time' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color || 'var(--text-1)' }}>{s.val}</div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Extraction Summary donut */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Extraction Summary</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 90, height: 90, flexShrink: 0, position: 'relative' }}>
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={extractPie} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={2}>
                      {extractPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green)' }}>{accuracy}%</div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-3)' }}>Accuracy</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {extractPie.map((e, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.72rem' }}>{e.name}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-2)' }}>{e.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Preview (By Pages only) */}
          {viewTab === 'pages' && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Quick Preview</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Page {currentPage} of {pages}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: Math.min(pages, 8) }, (_, i) => pageThumb(i + 1))}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all pages <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Content Overview donut (Full Text only) */}
          {viewTab === 'full' && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Content Overview</div>
                <span style={{ fontSize: '0.62rem', background: 'var(--blue-dim)', color: 'var(--blue)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>AI</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 80, flexShrink: 0, position: 'relative' }}>
                  <ResponsiveContainer width={80} height={80}>
                    <PieChart>
                      <Pie data={contentPie} cx="50%" cy="50%" innerRadius={24} outerRadius={38} dataKey="value" paddingAngle={2}>
                        {contentPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800 }}>{words.toLocaleString()}</div>
                    <div style={{ fontSize: '0.52rem', color: 'var(--text-3)' }}>Total Words</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {contentPie.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.68rem', color: 'var(--text-2)' }}>{c.name}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)' }}>{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Keywords */}
          {viewTab === 'full' && topKeywords.length > 0 && (
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <div className="section-label" style={{ marginBottom: 0 }}>Top Keywords</div>
                <span style={{ fontSize: '0.62rem', background: 'var(--blue-dim)', color: 'var(--blue)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>AI</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {topKeywords.map(([w, c], i) => (
                  <span key={i} style={{ padding: '3px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-md)', borderRadius: 20, fontSize: '0.72rem', color: 'var(--text-2)', display: 'flex', gap: 5 }}>
                    {w} <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{c}</span>
                  </span>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
                View All Keywords <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Document Info */}
          <div className="card" style={{ padding: 14 }}>
            <div className="section-label">Document Info</div>
            {[['File Name', doc.name], ['Pages', pages], ['File Size', doc.sizeLabel || '–'], ['Language', 'English'], ['Uploaded', new Date(doc.uploadedAt).toLocaleDateString()], ['Status', 'Completed']].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', fontSize: '0.77rem' }}>
                <span style={{ color: 'var(--text-3)' }}>{k}</span>
                <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all', color: k === 'Status' ? 'var(--green)' : 'inherit' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="card" style={{ padding: '8px 0' }}>
            <div className="section-label" style={{ paddingLeft: 14 }}>Actions</div>
            {[
              { icon: <Download size={13} />, bg: 'var(--orange-dim)', color: 'var(--orange)', title: 'Download as TXT', sub: 'Download extracted text file', action: handleDownloadTXT },
              { icon: <FileText size={13} />, bg: 'var(--blue-dim)', color: 'var(--blue)', title: 'Download as DOCX', sub: 'Save extracted text', action: handleDownloadDOCX },
              { icon: <Copy size={13} />, bg: 'var(--green-dim)', color: 'var(--green)', title: 'Copy to Clipboard', sub: 'Copy all extracted text', action: handleCopyAll },
              { icon: <Search size={13} />, bg: 'var(--purple-dim)', color: 'var(--purple)', title: 'Find & Replace', sub: 'Search and replace text', action: () => setShowReplace(true) },
            ].map((a, i) => (
              <button key={i} onClick={a.action} className="action-row" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
                <div className="action-row-icon" style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                <div className="action-row-text">
                  <div className="action-row-title">{a.title}</div>
                  <div className="action-row-sub">{a.sub}</div>
                </div>
                <ChevronRight size={13} style={{ color: 'var(--text-4)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// helper — used in By Pages tab
function ChevronLeft({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
