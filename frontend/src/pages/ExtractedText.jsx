import React, { useState } from 'react';
import { ArrowLeft, Search, Copy, Download } from 'lucide-react';

export default function ExtractedText({ doc, onNavigate }) {
  const [query, setQuery] = useState('');

  if (!doc?.extracted) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <p>No extracted text. Process a document first.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const text = doc.extracted.raw_text || '';

  function highlight(t, q) {
    if (!q.trim()) return t;
    const parts = t.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((p, i) => p.toLowerCase() === q.toLowerCase()
      ? <mark key={i} style={{ background: '#fef08a', color: '#854d0e', borderRadius: 2, padding: '0 1px' }}>{p}</mark>
      : p);
  }

  return (
    <div className="page-content">
      <div style={{ marginBottom: 14 }}>
        <h1 className="page-title">Extracted Text</h1>
        <p className="page-subtitle">Full text extracted from {doc.name}</p>
      </div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => onNavigate('summary-workspace', doc)}>
        <ArrowLeft size={14} /> Back to Document
      </button>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-md)', padding: '0 12px', height: 36 }}>
          <Search size={14} style={{ color: 'var(--text-3)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search in text…" style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontSize: '0.85rem', flex: 1 }} />
        </div>
        <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(text)}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Copy size={14} /> Copy All
        </button>
        <button className="btn btn-secondary" onClick={() => {
          const blob = new Blob([text], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url;
          a.download = `${doc.name}_extracted.txt`; a.click();
          URL.revokeObjectURL(url);
        }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Download size={14} /> Download
        </button>
      </div>

      <div className="card" style={{ padding: 20, maxHeight: '65vh', overflowY: 'auto' }}>
        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.83rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-1)' }}>
          {highlight(text, query)}
        </pre>
      </div>

      <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', gap: 16 }}>
        <span>{doc.extracted.metadata?.word_count?.toLocaleString()} words</span>
        <span>{doc.extracted.metadata?.char_count?.toLocaleString()} characters</span>
        <span>{doc.extracted.metadata?.sentence_count} sentences</span>
        <span>Extraction: {doc.extracted.metadata?.extraction_method}</span>
      </div>
    </div>
  );
}
