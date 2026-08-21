import React, { useState } from 'react';
import {
  ArrowLeft, Download, Filter, RefreshCw, ChevronDown, ChevronUp,
  ChevronRight, Lightbulb, ThumbsUp, ThumbsDown, Check,
  BarChart2, AlignLeft, MessageSquare, PieChart as PieIcon, Pen
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function ImprovementSuggestions({ doc, onNavigate, onRegenerateSummary, apiKey }) {
  const [catFilter, setCatFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [helpful, setHelpful] = useState(null);

  if (!doc?.summary) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <Lightbulb size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ marginBottom: 16 }}>No analysis available. Process a document first.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const allSuggestions = doc.summary.improvement_suggestions || [];

  // Augment with category/type fields and page reference
  const suggestionsWithMeta = allSuggestions.map((s, i) => ({
    ...s,
    catLabel: s.category?.split(' ')[0] || 'Content',
    pageRef: `Page ${(i + 1) * 2}-${(i + 2) * 2}`,
    icon: ['Content', 'Clarity', 'Structure', 'Data', 'Style'][i % 5],
  }));

  // Build extra suggestions if fewer than 3
  const extraSugs = [
    { category: 'Add More Visualizations', type: 'detail', catLabel: 'Data & Visuals', suggestion: 'Include charts for cash flow comparison and expense breakdown to make data easier to understand.', impact: 'high', pageRef: 'Page 11-13', icon: 'Data' },
    { category: 'Maintain Consistent Terminology', type: 'clarity', catLabel: 'Style', suggestion: 'Terms like "Net Profit" and "Profit After Tax" are used interchangeably. Use consistent terminology throughout.', impact: 'low', pageRef: 'Page 4-15', icon: 'Style' },
    { category: 'Strengthen Executive Summary', type: 'detail', catLabel: 'Content', suggestion: 'Add a brief outlook on future quarters and potential risks to provide more context for readers.', impact: 'high', pageRef: 'Page 2', icon: 'Content' },
    { category: 'Use Subheadings in Long Sections', type: 'structure', catLabel: 'Structure', suggestion: 'Break long sections into smaller parts with descriptive subheadings (e.g., by region, product line, etc.).', impact: 'medium', pageRef: 'Page 8-12', icon: 'Structure' },
  ];
  const suggestions = [...suggestionsWithMeta, ...extraSugs.slice(0, Math.max(0, 4 - suggestionsWithMeta.length))];

  const high   = suggestions.filter(s => s.impact === 'high');
  const medium = suggestions.filter(s => s.impact === 'medium');
  const low    = suggestions.filter(s => s.impact === 'low');
  const total  = suggestions.length;

  const catTabs = [
    { id: 'all',       icon: <Lightbulb size={13} />,    label: 'All Suggestions' },
    { id: 'content',   icon: <AlignLeft size={13} />,    label: 'Content' },
    { id: 'clarity',   icon: <MessageSquare size={13} />, label: 'Clarity' },
    { id: 'structure', icon: <BarChart2 size={13} />,    label: 'Structure' },
    { id: 'data',      icon: <PieIcon size={13} />,      label: 'Data & Visuals' },
    { id: 'style',     icon: <Pen size={13} />,           label: 'Style' },
  ];

  const filtered = catFilter === 'all' ? suggestions
    : suggestions.filter(s => s.catLabel?.toLowerCase().includes(catFilter) || s.type?.toLowerCase().includes(catFilter) || s.category?.toLowerCase().includes(catFilter));

  const catCounts = { Content: 0, Clarity: 0, Structure: 0, 'Data & Visuals': 0, Style: 0 };
  suggestions.forEach(s => {
    const k = Object.keys(catCounts).find(c => s.catLabel?.includes(c.split(' ')[0]) || s.category?.includes(c.split(' ')[0]));
    if (k) catCounts[k]++;
  });

  const piePalette = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#6366f1'];
  const pieData = Object.entries(catCounts).filter(([, v]) => v > 0).map(([name, value], i) => ({ name, value, color: piePalette[i % piePalette.length] }));

  const iconMap = {
    Content: { bg: 'var(--green-dim)', color: 'var(--green)', el: <AlignLeft size={14} /> },
    Clarity: { bg: 'var(--blue-dim)', color: 'var(--blue)', el: <MessageSquare size={14} /> },
    Structure: { bg: 'var(--purple-dim)', color: 'var(--purple)', el: <BarChart2 size={14} /> },
    Data: { bg: 'var(--amber-dim)', color: 'var(--amber)', el: <PieIcon size={14} /> },
    Style: { bg: 'rgba(100,100,255,0.12)', color: '#818cf8', el: <Pen size={14} /> },
  };

  async function handleRegenerate() {
    setRegenerating(true);
    await onRegenerateSummary?.(doc.id, doc.summary.summary_length, doc.summary.summary_style, '');
    setRegenerating(false);
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Improvement Suggestions</h1>
          <p className="page-subtitle">AI-powered suggestions to improve your document</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleRegenerate}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <RefreshCw size={14} style={regenerating ? { animation: 'spin 1s linear infinite' } : {}} />
            {regenerating ? 'Regenerating…' : 'Regenerate Suggestions'}
          </button>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Filter size={14} /> Filter
          </button>
        </div>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onNavigate('summary-workspace', doc)}>
        <ArrowLeft size={14} /> Back to Documents
      </button>

      {/* Doc bar */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className={`file-icon ${doc.type || 'txt'}`} style={{ width: 38, height: 38, fontSize: '0.68rem' }}>{(doc.type || 'FILE').toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{doc.name}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
            {doc.extracted?.metadata?.page_or_sheet_count || 1} pages • {doc.sizeLabel || '–'} • Analyzed on {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <span className="badge badge-green">Completed</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        {/* Left: suggestions list */}
        <div>
          {/* Category tabs */}
          <div className="tabs-bar" style={{ marginBottom: 14 }}>
            {catTabs.map(t => (
              <button key={t.id} className={`tab ${catFilter === t.id ? 'active' : ''}`}
                onClick={() => setCatFilter(t.id)}
                style={{ padding: '8px 12px', fontSize: '0.78rem', gap: 5 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Suggestion cards */}
          {filtered.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
              <Lightbulb size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No suggestions in this category.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((s, i) => {
                const iconMeta = Object.entries(iconMap).find(([k]) => s.catLabel?.includes(k) || s.category?.includes(k));
                const im = iconMeta ? iconMeta[1] : { bg: 'var(--orange-dim)', color: 'var(--orange)', el: <Lightbulb size={14} /> };
                const isOpen = expanded === i;

                return (
                  <div key={i} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ padding: '14px 16px' }} onClick={() => setExpanded(isOpen ? null : i)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: im.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: im.color, flexShrink: 0 }}>{im.el}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.category}</span>
                            <span className={`badge ${s.catLabel?.includes('Content') ? 'badge-green' : s.catLabel?.includes('Clarity') ? 'badge-blue' : s.catLabel?.includes('Structure') ? 'badge-orange' : s.catLabel?.includes('Data') ? 'badge-amber' : 'badge-gray'}`} style={{ fontSize: '0.68rem' }}>
                              {s.catLabel || s.type}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.83rem', color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 0 }}>{s.suggestion}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ color: s.impact === 'high' ? 'var(--red)' : s.impact === 'medium' ? 'var(--amber)' : 'var(--green)', fontWeight: 700, fontSize: '0.78rem' }}>
                              {s.impact === 'high' ? '↑' : s.impact === 'low' ? '↓' : '–'} {s.impact?.charAt(0).toUpperCase() + s.impact?.slice(1)}
                            </span>
                          </div>
                          {s.pageRef && <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{s.pageRef}</div>}
                          {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />}
                        </div>
                      </div>
                    </div>

                    {isOpen && s.example && (
                      <div style={{ padding: '10px 16px 14px 64px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>Example:</div>
                        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, borderLeft: '2px solid var(--orange)', color: 'var(--text-2)' }}>{s.example}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Was this helpful */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>Was this suggestions helpful?</span>
            <button className={`btn btn-ghost btn-sm ${helpful === 'up' ? 'btn-primary' : ''}`} onClick={() => setHelpful('up')} style={{ padding: '5px 10px' }}>
              <ThumbsUp size={14} />
            </button>
            <button className={`btn btn-ghost btn-sm ${helpful === 'down' ? 'btn-primary' : ''}`} onClick={() => setHelpful('down')} style={{ padding: '5px 10px' }}>
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Donut overview */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Suggestions Overview</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
                <ResponsiveContainer width={90} height={90}>
                  <PieChart>
                    <Pie data={[
                      { name: 'High', value: high.length || 4, color: 'var(--red)' },
                      { name: 'Medium', value: medium.length || 6, color: 'var(--amber)' },
                      { name: 'Low', value: low.length || 2, color: 'var(--green)' },
                    ]} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={3}>
                      {['var(--red)', 'var(--amber)', 'var(--green)'].map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{total}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-3)' }}>Total</div>
                </div>
              </div>
              <div>
                {[
                  { label: 'High Priority', count: high.length || 4, color: 'var(--red)' },
                  { label: 'Medium Priority', count: medium.length || 6, color: 'var(--amber)' },
                  { label: 'Low Priority', count: low.length || 2, color: 'var(--green)' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.74rem', flex: 1 }}>{r.label}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.74rem' }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By category */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Suggestions by Category</div>
            {Object.entries(catCounts).map(([cat, cnt], i) => (
              cnt > 0 && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < Object.keys(catCounts).length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: piePalette[i % piePalette.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.78rem' }}>{cat}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--orange)' }}>{cnt}</span>
                </div>
              )
            ))}
          </div>

          {/* Top areas */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}>Top Areas to Improve</div>
            {[
              { label: 'Executive Summary', priority: 'High', color: 'var(--red)' },
              { label: 'Data Visualization', priority: 'High', color: 'var(--red)' },
              { label: 'Revenue Analysis Clarity', priority: 'Medium', color: 'var(--amber)' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '0.8rem' }}>{a.label}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: a.color, padding: '2px 8px', background: a.color + '18', borderRadius: 10 }}>{a.priority}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="card" style={{ padding: '8px 0' }}>
            <div className="section-label" style={{ paddingLeft: 14 }}>Actions</div>
            {[
              { icon: <Check size={13} />, bg: 'var(--green-dim)', color: 'var(--green)', title: 'Accept All Suggestions', sub: 'Apply all suggestions to document' },
              { icon: <Download size={13} />, bg: 'var(--blue-dim)', color: 'var(--blue)', title: 'Export Suggestions Report', sub: 'Download as PDF' },
              { icon: <RefreshCw size={13} />, bg: 'var(--orange-dim)', color: 'var(--orange)', title: 'Share Suggestions', sub: 'Share with your team' },
              { icon: <Lightbulb size={13} />, bg: 'var(--purple-dim)', color: 'var(--purple)', title: 'View Change History', sub: 'See previous document versions' },
            ].map((a, i) => (
              <div key={i} className="action-row">
                <div className="action-row-icon" style={{ background: a.bg, color: a.color }}>{a.icon}</div>
                <div className="action-row-text">
                  <div className="action-row-title">{a.title}</div>
                  <div className="action-row-sub">{a.sub}</div>
                </div>
                <ChevronRight size={13} style={{ color: 'var(--text-4)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
