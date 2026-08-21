import React, { useEffect, useState } from 'react';
import { Zap, ArrowRight, FileText } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function SampleDocuments({ onLoadSample, isLoading }) {
  const [samples, setSamples] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE}/api/samples`).then(r => r.json()).then(setSamples).catch(() => {});
  }, []);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Sample Documents</h1>
        <p className="page-subtitle">Try TalonAI with built-in sample documents — no upload needed.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
        {samples.map(s => (
          <div key={s.id} className="card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => !isLoading && onLoadSample(s)}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--orange-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>{s.file_type}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 14 }}>
              {s.content?.substring(0, 140)}…
            </p>
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}
              disabled={isLoading}>
              <Zap size={13} /> Try This Sample <ArrowRight size={13} />
            </button>
          </div>
        ))}
        {samples.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>
            Loading samples…
          </div>
        )}
      </div>
    </div>
  );
}
