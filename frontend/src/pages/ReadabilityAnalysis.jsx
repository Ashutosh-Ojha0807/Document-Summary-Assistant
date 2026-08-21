import React from 'react';
import { ArrowLeft, Eye, TrendingUp, ChevronRight } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

export default function ReadabilityAnalysis({ doc, onNavigate }) {
  if (!doc?.summary?.readability) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <Eye size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No readability data available. Generate a summary first.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const r = doc.summary.readability;
  const ease = r.flesch_reading_ease;
  const grade = r.flesch_kincaid_grade;

  const easeColor = ease >= 70 ? 'var(--green)' : ease >= 50 ? 'var(--amber)' : 'var(--red)';

  const gaugeData = [{ value: ease, fill: easeColor }];

  return (
    <div className="page-content">
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Readability Analysis</h1>
        <p className="page-subtitle">Detailed readability metrics and linguistic analysis</p>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onNavigate('summary-workspace', doc)}>
        <ArrowLeft size={14} /> Back to Document
      </button>

      <div className="two-col">
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {/* Reading Ease Gauge */}
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Flesch Reading Ease</div>
              <div style={{ height: 140, position: 'relative' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <RadialBarChart cx="50%" cy="70%" innerRadius="60%" outerRadius="100%"
                    startAngle={180} endAngle={0} data={gaugeData}>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'var(--bg-elevated)' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', fontSize: '2rem', fontWeight: 800, color: easeColor }}>{ease}</div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: 8 }}>{r.readability_level}</div>
            </div>

            {/* Grade Level */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 14 }}>Grade Level & Metrics</div>
              {[
                { label: 'Flesch-Kincaid Grade', val: `Grade ${grade}`, color: 'var(--blue)' },
                { label: 'Avg Words / Sentence', val: r.avg_words_per_sentence, color: 'var(--text-1)' },
                { label: 'Avg Syllables / Word', val: r.avg_syllables_per_word, color: 'var(--text-1)' },
                { label: 'Detected Tone', val: r.reading_tone, color: 'var(--amber)' },
              ].map(({ label, val, color }, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-3)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Readability scale */}
          <div className="card" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Reading Ease Scale</div>
            {[
              { range: '90–100', label: 'Very Easy', desc: '5th grade', color: 'var(--green)' },
              { range: '70–90', label: 'Easy', desc: '6th grade', color: 'var(--green)' },
              { range: '60–70', label: 'Standard', desc: '7th grade', color: 'var(--blue)' },
              { range: '50–60', label: 'Fairly Difficult', desc: '10th–12th grade', color: 'var(--amber)' },
              { range: '30–50', label: 'Difficult', desc: 'College level', color: 'var(--amber)' },
              { range: '0–30', label: 'Very Difficult', desc: 'Graduate level', color: 'var(--red)' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0',
                borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
                background: ease >= parseInt(row.range) && ease <= parseInt(row.range.split('–')[1]) ? 'rgba(255,107,34,0.05)' : 'transparent',
                borderRadius: 6, paddingLeft: 6 }}>
                <span style={{ width: 60, fontSize: '0.75rem', color: 'var(--text-3)', flexShrink: 0 }}>{row.range}</span>
                <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: row.color }}>{row.label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{row.desc}</span>
                {ease >= parseInt(row.range) && ease <= parseInt(row.range.split('–')[1]) && (
                  <span style={{ fontSize: '0.68rem', background: 'var(--orange-dim)', color: 'var(--orange)', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>YOU</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">What This Means</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
              A reading ease of <strong style={{ color: easeColor }}>{ease}</strong> means this document is at the <strong>{r.readability_level?.toLowerCase()}</strong> level.
              {ease < 50 && ' Consider simplifying complex sentences and replacing jargon with plain language.'}
              {ease >= 60 && ' This is a healthy readability score for professional documents.'}
            </p>
          </div>
          <div className="card" style={{ padding: '10px 0' }}>
            <div className="section-label" style={{ paddingLeft: 14 }}>Quick Actions</div>
            {[
              { icon: <TrendingUp size={14} />, title: 'Key Insights', sub: 'Explore document data', action: () => onNavigate('key-insights', doc) },
              { icon: <Eye size={14} />, title: 'Improvement Tips', sub: 'See writing suggestions', action: () => onNavigate('improvement-suggestions', doc) },
            ].map((a, i) => (
              <button key={i} onClick={a.action} className="action-row" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}>
                <div className="action-row-icon" style={{ background: 'var(--orange-dim)', color: 'var(--orange)' }}>{a.icon}</div>
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
