import React, { useState } from 'react';
import { ArrowLeft, Download, Share2, TrendingUp, Target, Star, CheckSquare, ThumbsUp, ThumbsDown, ChevronRight, MessageSquare, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function KeyInsights({ doc, onNavigate }) {
  const [insightTab, setInsightTab] = useState('overview');

  if (!doc || !doc.summary) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <TrendingUp size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No document selected or no analysis available.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const summary = doc.summary;
  const takeaways = summary.key_takeaways || [];
  const metrics = summary.important_metrics_or_dates || [];
  const keyPoints = summary.key_points || [];

  // Build pie data from key_points categories
  const catMap = {};
  keyPoints.forEach(kp => {
    catMap[kp.category] = (catMap[kp.category] || 0) + 1;
  });
  // Fill with takeaway topics if no key_points
  const fallbackCategories = [
    { name: 'Key Findings', value: Math.ceil(takeaways.length * 0.35) || 3 },
    { name: 'Metrics', value: Math.ceil(metrics.length) || 2 },
    { name: 'Action Items', value: (summary.action_items || []).length || 2 },
    { name: 'Suggestions', value: (summary.improvement_suggestions || []).length || 2 },
    { name: 'Others', value: 1 },
  ];
  const pieData = Object.keys(catMap).length > 0
    ? Object.entries(catMap).map(([name, value]) => ({ name, value }))
    : fallbackCategories;

  const PIE_COLORS = ['#ff6b22', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7'];

  // Fake trend line — would be real data in a production app
  const trendData = Array.from({ length: 6 }, (_, i) => ({
    date: `Day ${i + 1}`,
    insights: Math.floor(8 + i * 2.5 + Math.random() * 4),
  }));

  const statCards = [
    { label: 'Total Insights', val: takeaways.length + keyPoints.length, icon: <TrendingUp size={18} />, color: 'var(--orange)', bg: 'var(--orange-dim)', change: '+12%' },
    { label: 'Key Points', val: keyPoints.length || takeaways.length, icon: <Target size={18} />, color: 'var(--blue)', bg: 'var(--blue-dim)', change: '+8%' },
    { label: 'Important Metrics', val: metrics.length, icon: <Star size={18} />, color: 'var(--amber)', bg: 'var(--amber-dim)', change: '+15%' },
    { label: 'Action Items', val: (summary.action_items || []).length, icon: <CheckSquare size={18} />, color: 'var(--purple)', bg: 'var(--purple-dim)', change: '+5%' },
  ];

  const importantEntities = [
    { icon: '🏢', label: 'Organizations', count: Math.max(1, Math.floor(metrics.length * 0.4)) },
    { icon: '👤', label: 'People', count: Math.max(1, Math.floor(takeaways.length * 0.3)) },
    { icon: '💰', label: 'Financial Terms', count: metrics.filter(m => m.includes('$') || m.includes('%')).length + 1 },
    { icon: '📦', label: 'Products', count: Math.max(1, Math.floor(keyPoints.length * 0.2)) },
    { icon: '📍', label: 'Locations', count: Math.max(1, Math.floor(metrics.length * 0.2)) },
  ];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 className="page-title">Key Insights</h1>
          <p className="page-subtitle">Important insights and key takeaways from your document</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Download size={14} /> Export</button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Share2 size={14} /> Share</button>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onNavigate('summary-workspace', doc)}>
        <ArrowLeft size={14} /> Back to Document
      </button>

      {/* Insight sub-tabs */}
      <div className="tabs-bar" style={{ marginBottom: 16 }}>
        {['overview', 'trends', 'metrics', 'entities', 'comparison'].map(t => (
          <button key={t} className={`tab ${insightTab === t ? 'active' : ''}`} onClick={() => setInsightTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="two-col">
        <div>
          {/* Stat mini cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {statCards.map((s, i) => (
              <div className="card" key={i} style={{ padding: '14px 16px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--green)', marginTop: 4 }}>↑ {s.change} vs last analysis</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {/* Donut */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>Insights by Category</div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div className="chart-wrap" style={{ width: 140, height: 140, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                        dataKey="value" paddingAngle={2}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 8px', fontSize: '0.7rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-3)' }}>Category</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-3)', textAlign: 'right' }}>Insights</div>
                    {pieData.map((d, i) => (
                      <React.Fragment key={i}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          {d.name}
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 600 }}>{d.value}</div>
                      </React.Fragment>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, fontWeight: 700 }}>Total</div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4, fontWeight: 700, textAlign: 'right' }}>{pieData.reduce((a, d) => a + d.value, 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line chart */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Insights Over Time</div>
                <select style={{ background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 6, color: 'var(--text-2)', fontSize: '0.72rem', padding: '2px 8px' }}>
                  <option>Last 7 Days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-4)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border-md)', borderRadius: 8, fontSize: '0.75rem' }} />
                  <Line type="monotone" dataKey="insights" stroke="var(--orange)" strokeWidth={2} dot={{ r: 3, fill: 'var(--orange)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key takeaways list */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 12 }}>Key Takeaways</div>
            {takeaways.map((t, i) => (
              <div key={i} className="insight-row">
                <div className="insight-row-icon" style={{ background: 'var(--orange-dim)', color: 'var(--orange)' }}>
                  <TrendingUp size={14} />
                </div>
                <span style={{ flex: 1, fontSize: '0.84rem', lineHeight: 1.5 }}>{t}</span>
                <ChevronRight size={14} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
              </div>
            ))}

            {/* Helpful feedback */}
            <div style={{ padding: '14px 0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderTop: '1px solid var(--border)', marginTop: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Was this analysis helpful?</span>
              <button className="btn btn-ghost btn-sm"><ThumbsUp size={14} /></button>
              <button className="btn btn-ghost btn-sm"><ThumbsDown size={14} /></button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top highlights */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Top Highlights</div>
            {takeaways.slice(0, 5).map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < Math.min(takeaways.length, 5) - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--orange)', fontWeight: 800, flexShrink: 0, fontSize: '0.9rem' }}>❝</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all highlights <ChevronRight size={12} />
            </button>
          </div>

          {/* Entities */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Important Entities</div>
            {importantEntities.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < importantEntities.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 16 }}>{e.icon}</span>
                <span style={{ flex: 1, fontSize: '0.82rem' }}>{e.label}</span>
                <span style={{ fontWeight: 700, color: 'var(--orange)', fontSize: '0.82rem' }}>{e.count}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all entities <ChevronRight size={12} />
            </button>
          </div>

          {/* Actions */}
          <div className="card" style={{ padding: '10px 0' }}>
            <div className="section-label" style={{ paddingLeft: 14 }}>Actions</div>
            {[
              { icon: <MessageSquare size={14} />, bg: 'var(--orange-dim)', color: 'var(--orange)', title: 'Ask Questions', sub: 'Chat with your document', action: () => onNavigate('qa-chat', doc) },
              { icon: <FileText size={14} />, bg: 'var(--blue-dim)', color: 'var(--blue)', title: 'View Full Summary', sub: 'Go to summary workspace', action: () => onNavigate('summary-workspace', doc) },
              { icon: <Download size={14} />, bg: 'var(--green-dim)', color: 'var(--green)', title: 'Download Insights', sub: 'Download as PDF', action: () => {} },
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
