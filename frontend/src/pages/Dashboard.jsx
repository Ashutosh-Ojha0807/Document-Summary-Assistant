import React, { useRef } from 'react';
import {
  UploadCloud, FileText, Sparkles, Clock, Eye, TrendingUp,
  Zap, MessageSquare, MoreVertical, ArrowRight, Upload,
  ChevronRight, Star, Cpu
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

function FileIcon({ type }) {
  const t = (type || '').toLowerCase();
  const cls = ['pdf', 'docx', 'xlsx', 'png', 'txt', 'csv'].find(x => t.includes(x)) || 'txt';
  const labels = { pdf: 'PDF', docx: 'DOC', xlsx: 'XLS', png: 'IMG', txt: 'TXT', csv: 'CSV' };
  return <div className={`file-icon ${cls}`}>{labels[cls] || 'DOC'}</div>;
}

export default function Dashboard({ docs, onNavigate, onUploadFile }) {
  const fileRef = useRef(null);

  const completed = docs.filter(d => d.status === 'completed');
  const summaryCount = completed.filter(d => d.summary).length;
  const avgReadability = completed.length > 0
    ? Math.round(completed.reduce((a, d) => a + (d.summary?.readability?.flesch_reading_ease || 70), 0) / completed.length)
    : 72;

  const recentDocs = [...docs].sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, 4);

  const activity = [...docs]
    .sort((a, b) => b.uploadedAt - a.uploadedAt)
    .slice(0, 3)
    .map(d => ({
      icon: d.summary ? <Sparkles size={14} /> : <Upload size={14} />,
      color: d.summary ? 'var(--orange)' : 'var(--blue)',
      bg: d.summary ? 'var(--orange-dim)' : 'var(--blue-dim)',
      label: d.summary ? 'Summary generated' : 'Document uploaded',
      file: d.name,
      time: formatAge(d.uploadedAt),
    }));

  function formatAge(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m || 1}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onUploadFile(file);
  }

  return (
    <div className="page-content">
      {/* Hero banner */}
      <div className="card" style={{
        padding: '28px 32px', marginBottom: 20,
        background: 'var(--bg-hero)',
        borderColor: 'rgba(255,107,34,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden', position: 'relative'
      }}>
        <div style={{ position: 'absolute', right: 120, top: -20, opacity: 0.07 }}>
          <FileText size={180} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 6 }}>
            Welcome, User! 👋
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>
            Turn your documents into clear summaries, insights and smart answers.
          </p>
        </div>
        <button className="btn btn-primary" style={{ flexShrink: 0 }}
          onClick={() => onNavigate('upload')}>
          <UploadCloud size={16} /> + Upload Document
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Documents Processed', value: docs.length, icon: <FileText size={18} />, bg: 'var(--orange-dim)', color: 'var(--orange)', change: '+12% vs last week' },
          { label: 'Summaries Generated', value: summaryCount, icon: <Sparkles size={18} />, bg: 'rgba(34,197,94,0.12)', color: 'var(--green)', change: '+18% vs last week' },
          { label: 'Time Saved', value: `${(docs.length * 0.24).toFixed(1)} hrs`, icon: <Clock size={18} />, bg: 'var(--amber-dim)', color: 'var(--amber)', change: '+14% vs last week' },
          { label: 'Avg. Readability', value: `${avgReadability} / 100`, icon: <Eye size={18} />, bg: 'var(--blue-dim)', color: 'var(--blue)', change: '+6% vs last week' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-card-header">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <button style={{ background: 'none', color: 'var(--text-3)' }}><MoreVertical size={14} /></button>
            </div>
            <div className="stat-label" style={{ marginTop: 8 }}>{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-change up"><TrendingUp size={11} />{s.change}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 16, marginBottom: 20 }}>
        {/* Upload dropzone */}
        <div className="card dropzone" style={{ padding: 28 }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" style={{ display: 'none' }}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.docx,.xlsx,.csv,.txt,.md"
            onChange={e => e.target.files?.[0] && onUploadFile(e.target.files[0])} />
          <div className="dropzone-icon"><UploadCloud size={28} /></div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Drag & drop your document here</div>
          <div style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginBottom: 12 }}>or</div>
          <button className="btn btn-primary" style={{ margin: '0 auto', display: 'flex' }}>Browse Files</button>
          <div style={{ marginTop: 12, color: 'var(--text-3)', fontSize: '0.72rem' }}>
            Supported: PDF, DOCX, PNG, JPG, JPEG, TXT, MD, CSV, XLSX… &nbsp;|&nbsp; Max size: 50MB
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ padding: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <FileText size={22} />, label: 'Summarize', color: 'var(--orange)', bg: 'var(--orange-dim)', action: 'upload' },
              { icon: <Zap size={22} />, label: 'Extract Text', color: 'var(--blue)', bg: 'var(--blue-dim)', action: 'upload' },
              { icon: <MessageSquare size={22} />, label: 'Ask Questions', color: 'var(--green)', bg: 'var(--green-dim)', action: 'qa-chat' },
              { icon: <TrendingUp size={22} />, label: 'View Insights', color: 'var(--purple)', bg: 'var(--purple-dim)', action: 'key-insights' },
            ].map((qa, i) => (
              <button key={i} onClick={() => onNavigate(qa.action)}
                style={{
                  background: qa.bg, border: `1px solid ${qa.color}30`,
                  borderRadius: 'var(--r-lg)', padding: '14px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer', transition: 'all 0.15s', color: qa.color,
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = ''}>
                {qa.icon}
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)' }}>{qa.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Mode */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="section-title">AI Mode</div>
            <div className="toggle on"><div className="toggle-thumb" /></div>
          </div>
          {[
            { icon: <Star size={14} />, bg: 'var(--orange-dim)', color: 'var(--orange)', title: 'Google Gemini (Online)', sub: 'High-quality AI summarization' },
            { icon: <Cpu size={14} />, bg: 'var(--blue-dim)', color: 'var(--blue)', title: 'Offline NLP (TextRank)', sub: 'Works without API key' },
          ].map((m, i) => (
            <div key={i}>
              {i === 1 && <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-3)', margin: '10px 0' }}>OR</div>}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--r-md)',
                background: i === 0 ? m.bg : 'transparent',
                border: `1px solid ${i === 0 ? m.color + '30' : 'var(--border)'}`,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>{m.icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{m.title}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{m.sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Recent Documents */}
        <div className="card">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title"><FileText size={16} /> Recent Documents</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('documents')}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={13} />
            </button>
          </div>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th><th>Type</th><th>Uploaded</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>No documents yet. Upload your first document!</td></tr>
              ) : recentDocs.map(d => (
                <tr key={d.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileIcon type={d.type} />{d.name}
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: '0.78rem' }}>{d.type?.toUpperCase()}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{new Date(d.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  <td>
                    <span className={`badge ${d.status === 'completed' ? 'badge-green' : d.status === 'processing' ? 'badge-amber' : 'badge-red'}`}>
                      {d.status === 'completed' ? 'Completed' : d.status === 'processing' ? 'Processing' : 'Failed'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--orange)' }}
                      onClick={() => onNavigate('summary-workspace', d)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity */}
        <div className="card">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title">Activity</div>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--orange)' }}>View All</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {activity.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)', fontSize: '0.82rem' }}>No activity yet</div>
            ) : activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 16px', borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--r-md)', background: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.icon}</div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{a.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>{a.file}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
