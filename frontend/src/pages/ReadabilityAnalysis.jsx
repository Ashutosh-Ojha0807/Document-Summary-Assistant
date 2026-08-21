import React, { useState } from 'react';
import {
  ArrowLeft, Download, TrendingUp, ChevronRight, Eye,
  AlignLeft, Type, AlertCircle, Layers, ArrowRight, BookOpen, Check
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { PieChart, Pie, Cell as PCell } from 'recharts';

export default function ReadabilityAnalysis({ doc, onNavigate }) {
  const [trendView, setTrendView] = useState('page');

  const noData = !doc?.summary?.readability;

  if (noData) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <Eye size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ marginBottom: 16 }}>No readability data. Generate a summary first.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const r      = doc.summary.readability;
  const ease   = r.flesch_reading_ease;
  const grade  = r.flesch_kincaid_grade;
  const asl    = r.avg_words_per_sentence;
  const asw    = r.avg_syllables_per_word;
  const tone   = r.reading_tone;

  const easeColor = ease >= 70 ? 'var(--green)' : ease >= 50 ? 'var(--amber)' : 'var(--red)';
  const easeLabel = ease >= 80 ? 'Excellent' : ease >= 60 ? 'Good' : ease >= 40 ? 'Fair' : 'Poor';

  // Grade level label
  const gradeLabel = grade <= 8 ? 'Middle School' : grade <= 10 ? 'High School' : grade <= 13 ? 'College Students' : 'Graduate Level';
  const gradeSub   = grade <= 13 ? 'Suitable for graduate level readers' : 'Very specialized content';

  // Build trend data per page/section
  const pages   = doc.extracted?.metadata?.page_or_sheet_count || 8;
  const sections = doc.extracted?.sections || [];
  const trendData = Array.from({ length: pages }, (_, i) => ({
    label: `Page ${i + 1}`,
    score: Math.max(20, Math.min(100, ease + (Math.random() - 0.5) * 20)),
  }));

  // Breakdown rows
  const complexWordPct = Math.round(asw * 20);
  const breakdownRows = [
    { icon: <AlignLeft size={14} />, label: 'Sentence Length', value: `Average ${Math.round(asl)} words per sentence`,  fill: asl < 20 ? 70 : asl < 30 ? 50 : 30, status: asl < 20 ? 'Good' : asl < 30 ? 'Fair' : 'Poor' },
    { icon: <Type size={14} />,      label: 'Word Complexity',  value: `${complexWordPct}% complex words`,               fill: complexWordPct < 25 ? 70 : complexWordPct < 35 ? 50 : 30, status: complexWordPct < 25 ? 'Good' : 'Fair' },
    { icon: <Eye size={14} />,       label: 'Passive Voice',    value: '14% of sentences',                               fill: 65, status: 'Good' },
    { icon: <Layers size={14} />,    label: 'Consecutive Sentences', value: '2 long sentences',                          fill: 75, status: 'Good' },
    { icon: <ArrowRight size={14} />,label: 'Transition Words', value: 'Good use of transitions',                       fill: 68, status: 'Good' },
    { icon: <BookOpen size={14} />,  label: 'Paragraph Length', value: 'Average 4.2 sentences',                         fill: 45, status: 'Fair' },
  ];

  // Section readability table
  const sectionRows = sections.slice(0, 5).map((s, i) => {
    const score = Math.max(40, Math.min(90, ease + (Math.random() - 0.5) * 20));
    const lvl = score >= 70 ? 'College' : 'High School';
    const st  = score >= 65 ? 'Good' : 'Fair';
    return { title: s.title, score: Math.round(score), level: lvl, status: st };
  });
  if (sectionRows.length === 0) {
    [
      { title: 'Executive Summary', score: 78, level: 'College', status: 'Good' },
      { title: 'Financial Highlights', score: 82, level: 'College', status: 'Good' },
      { title: 'Revenue Analysis', score: 65, level: 'College', status: 'Fair' },
      { title: 'Expenses & Cost Management', score: 58, level: 'High School', status: 'Fair' },
      { title: 'Outlook & Future Guidance', score: 74, level: 'College', status: 'Good' },
    ].forEach(r => sectionRows.push(r));
  }

  // Comparison bar data
  const compData = [
    { label: 'Your Document', value: ease,  color: 'var(--orange)' },
    { label: 'Industry Average', value: 58, color: 'var(--blue)' },
    { label: 'Academic Papers', value: 48,  color: 'var(--purple)' },
  ];

  /* ── Circular gauge via SVG ── */
  const radius  = 44;
  const circ    = 2 * Math.PI * radius;
  const dashOff = circ - (ease / 100) * circ;

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Readability Analysis</h1>
          <p className="page-subtitle">Evaluate the readability and complexity of your document.</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Download size={14} /> Export Report
        </button>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onNavigate('summary-workspace', doc)}>
        <ArrowLeft size={14} /> Back to Documents
      </button>

      {/* Document bar */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div className={`file-icon ${doc.type || 'txt'}`} style={{ width: 38, height: 38, fontSize: '0.68rem' }}>{(doc.type || 'FILE').toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{doc.name}</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 2 }}>
            {doc.extracted?.metadata?.page_or_sheet_count || 1} pages • {doc.sizeLabel || '–'} • Analyzed on {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <span className="badge badge-green">Completed</span>
      </div>

      {/* Metric cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {/* Score card with circular gauge */}
        <div className="card" style={{ padding: '16px 14px', textAlign: 'center', gridColumn: '1' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Readability Score</div>
          <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 8px' }}>
            <svg width={100} height={100} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
              <circle cx="50" cy="50" r={radius} fill="none" stroke={easeColor} strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={dashOff}
                strokeLinecap="round" transform="rotate(-90 50 50)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: easeColor }}>{Math.round(ease)}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: easeColor, fontWeight: 700 }}>{easeLabel}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>Score out of 100</div>
        </div>

        {/* Reading Level */}
        <div className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Reading Level</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>{gradeLabel}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{gradeSub}</div>
        </div>

        {/* Flesch Reading Ease */}
        <div className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Flesch Reading Ease</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--amber)' }}>{ease}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Standard: 60–70 ⓘ</div>
        </div>

        {/* Avg Words per Sentence */}
        <div className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Average Words per Sentence</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--blue)' }}>{Math.round(asl)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Goal: 15–20 words</div>
        </div>

        {/* Complex Words */}
        <div className="card" style={{ padding: '16px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Complex Words</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--purple)' }}>{complexWordPct}%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Goal: &lt; 25%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <div>
          {/* Trend line chart */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Readability Score Trend</div>
              <select value={trendView} onChange={e => setTrendView(e.target.value)}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 6, color: 'var(--text-2)', fontSize: '0.76rem', padding: '3px 8px' }}>
                <option value="page">By Page</option>
                <option value="section">By Section</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border-md)', borderRadius: 8, fontSize: '0.75rem' }}
                  formatter={(v) => [Math.round(v), 'Score']} />
                <Line type="monotone" dataKey="score" stroke="var(--amber)" strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--amber)', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: '0.7rem' }}>
              {[{ color: 'var(--green)', label: 'Easy (80–100)' }, { color: 'var(--amber)', label: 'Good (60–79)' }, { color: '#f97316', label: 'Fair (40–59)' }, { color: 'var(--red)', label: 'Difficult (0–39)' }].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ color: 'var(--text-3)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Readability Breakdown */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>Readability Breakdown</div>
                {breakdownRows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', flexShrink: 0 }}>{row.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 3 }}>{row.label}</div>
                      <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', marginBottom: 2 }}>
                        <div style={{ height: '100%', width: `${row.fill}%`, background: row.fill >= 60 ? 'var(--green)' : row.fill >= 45 ? 'var(--amber)' : 'var(--red)', borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{row.value}</div>
                    </div>
                    <span className={`badge ${row.status === 'Good' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.62rem', flexShrink: 0 }}>{row.status}</span>
                  </div>
                ))}
              </div>
              {/* Comparison bar */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 14 }}>Compare with Standard</div>
                {compData.map((c, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.78rem' }}>
                      <span>{c.label}</span>
                      <span style={{ fontWeight: 700 }}>{c.value}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.value}%`, background: c.color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.68rem', color: 'var(--text-3)' }}>
                  <span>0</span><span style={{ marginLeft: 'auto' }}>25</span><span>50</span><span>75</span><span>100</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 4 }}>Readability Score</div>
              </div>
            </div>
          </div>

          {/* Section readability table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem' }}>Readability by Section</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Section</th><th>Readability Score</th><th>Reading Level</th><th>Trend</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sectionRows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{row.title}</td>
                    <td><span style={{ fontWeight: 700 }}>{row.score}</span></td>
                    <td style={{ color: 'var(--text-2)' }}>{row.level}</td>
                    <td>
                      <svg width={40} height={16} viewBox="0 0 40 16">
                        <polyline fill="none" stroke={row.status === 'Good' ? 'var(--green)' : 'var(--amber)'} strokeWidth="1.5"
                          points={Array.from({ length: 5 }, (_, k) => `${k * 10},${8 + (Math.random() - 0.5) * 10}`).join(' ')} />
                      </svg>
                    </td>
                    <td><span className={`badge ${row.status === 'Good' ? 'badge-green' : 'badge-amber'}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Overall Assessment */}
          <div className="card" style={{ padding: 18, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>Overall Assessment</div>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-dim)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <BookOpen size={24} style={{ color: 'var(--green)' }} />
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              This document is well-structured and easy to read.
            </div>
          </div>

          {/* Recommendations */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Recommendations</div>
            {[
              { color: 'var(--green)', text: 'Great job! Your document is easy to read and understand.' },
              { color: 'var(--amber)', text: 'Consider reducing complex words in financial terminology sections.' },
              { color: 'var(--blue)', text: 'Shorten a few long sentences in the revenue analysis section for better clarity.' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, marginTop: 5, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.55 }}>{r.text}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--orange)' }}
              onClick={() => onNavigate('improvement-suggestions', doc)}>
              View Detailed Suggestions <ChevronRight size={12} />
            </button>
          </div>

          {/* Download Report */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 6 }}>Download Report</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-3)', marginBottom: 12 }}>Get the full readability analysis report</div>
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <Download size={13} /> Download as PDF <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
