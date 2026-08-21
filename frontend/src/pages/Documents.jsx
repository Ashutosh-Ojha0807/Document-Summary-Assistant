import React, { useState } from 'react';
import { Search, Filter, Eye, Download, MoreVertical, RefreshCw, Trash2, HardDrive, HelpCircle, ExternalLink, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';

function FileIcon({ type }) {
  const t = (type || '').toLowerCase();
  const cls = ['pdf', 'docx', 'xlsx', 'png', 'txt', 'csv'].find(x => t.includes(x)) || 'txt';
  const labels = { pdf: 'PDF', docx: 'DOC', xlsx: 'XLS', png: 'IMG', txt: 'TXT', csv: 'CSV' };
  return <div className={`file-icon ${cls}`}>{labels[cls]}</div>;
}

export default function Documents({ docs, onNavigate, onDeleteDoc }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [menuOpen, setMenuOpen] = useState(null);

  const filtered = docs
    .filter(d => filter === 'all' || d.status === filter)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const statusCounts = {
    all: docs.length,
    completed: docs.filter(d => d.status === 'completed').length,
    processing: docs.filter(d => d.status === 'processing').length,
    failed: docs.filter(d => d.status === 'failed').length,
  };

  function handleExport(doc) {
    if (!doc.summary) return alert('No summary available for this document.');
    const pdf = new jsPDF();
    pdf.setFontSize(14); pdf.text(`Summary: ${doc.name}`, 14, 20);
    pdf.setFontSize(9);
    const lines = pdf.splitTextToSize(doc.summary.summary_text?.replace(/[#*_]/g, '') || '', 180);
    pdf.text(lines, 14, 30);
    pdf.save(`${doc.name}_summary.pdf`);
  }

  return (
    <div className="page-content">
      <div className="two-col">
        <div>
          <div className="page-header">
            <h1 className="page-title">Documents</h1>
            <p className="page-subtitle">View, manage and analyze all your documents in one place.</p>
          </div>

          {/* Filters + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card2)', borderRadius: 'var(--r-lg)', padding: 3 }}>
              {['all', 'completed', 'processing', 'failed'].map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 'var(--r-md)', textTransform: 'capitalize', border: 'none' }}>
                  {f === 'all' ? 'All Documents' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-input)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-md)', padding: '0 10px', height: 34 }}>
              <Search size={14} style={{ color: 'var(--text-3)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search documents..." style={{ background: 'none', border: 'none', color: 'var(--text-1)', fontSize: '0.82rem', flex: 1 }} />
            </div>
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Filter size={13} /> Filters
            </button>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 14 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}><input type="checkbox" /></th>
                  <th>Document Name</th><th>Type</th><th>Summary Length</th>
                  <th>Uploaded At</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                    {docs.length === 0 ? 'No documents yet — upload your first document!' : 'No results match your filter.'}
                  </td></tr>
                ) : paginated.map(d => (
                  <tr key={d.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileIcon type={d.type} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.83rem' }}>{d.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{d.sizeLabel || '–'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-2)' }}>{(d.type || 'FILE').toUpperCase()}</span></td>
                    <td><div style={{ fontSize: '0.78rem' }}>{d.summary?.summary_length ? d.summary.summary_length.charAt(0).toUpperCase() + d.summary.summary_length.slice(1) : '–'}</div></td>
                    <td><div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                      {new Date(d.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div></td>
                    <td>
                      <span className={`badge ${d.status === 'completed' ? 'badge-green' : d.status === 'processing' ? 'badge-amber' : 'badge-red'}`}>
                        {d.status === 'completed' ? '✓ Completed' : d.status === 'processing' ? '⏳ Processing' : '✕ Failed'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="btn btn-ghost btn-icon" title="View" onClick={() => onNavigate('summary-workspace', d)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Export" onClick={() => handleExport(d)}>
                          <Download size={14} />
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => setMenuOpen(menuOpen === d.id ? null : d.id)}>
                            <MoreVertical size={14} />
                          </button>
                          {menuOpen === d.id && (
                            <div style={{
                              position: 'absolute', right: 0, top: 34, zIndex: 50,
                              background: 'var(--bg-card2)', border: '1px solid var(--border-md)',
                              borderRadius: 'var(--r-md)', padding: 4, minWidth: 130,
                              boxShadow: 'var(--shadow-md)'
                            }}>
                              <button onClick={() => { onNavigate('summary-workspace', d); setMenuOpen(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', color: 'var(--text-1)', fontSize: '0.78rem', borderRadius: 6 }}>
                                <Eye size={13} /> View Summary
                              </button>
                              <button onClick={() => { onNavigate('qa-chat', d); setMenuOpen(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', color: 'var(--text-1)', fontSize: '0.78rem', borderRadius: 6 }}>
                                <TrendingUp size={13} /> Ask Questions
                              </button>
                              <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
                              <button onClick={() => { onDeleteDoc(d.id); setMenuOpen(null); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', color: 'var(--red)', fontSize: '0.78rem', borderRadius: 6 }}>
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} documents
              </div>
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`page-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                {totalPages > 5 && <span style={{ color: 'var(--text-3)', padding: '0 4px' }}>…</span>}
                <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Overview */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Documents Overview</div>
            {[
              { label: 'Total Documents', val: statusCounts.all, icon: '📄', color: 'var(--orange)' },
              { label: 'Completed', val: statusCounts.completed, icon: '✓', color: 'var(--green)' },
              { label: 'Processing', val: statusCounts.processing, icon: '⏳', color: 'var(--amber)' },
              { label: 'Failed', val: statusCounts.failed, icon: '✕', color: 'var(--red)' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: row.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: row.color, fontWeight: 700, flexShrink: 0 }}>{row.icon}</div>
                <div style={{ flex: 1, fontSize: '0.82rem' }}>{row.label}</div>
                <div style={{ fontWeight: 700, color: row.color, fontSize: '0.95rem' }}>{row.val}</div>
              </div>
            ))}
          </div>

          {/* Storage */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Storage Usage</div>
            <div style={{ marginBottom: 8 }}>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(docs.length * 2, 100)}%` }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 12 }}>
              <span>{(docs.length * 0.05).toFixed(2)} GB of 10 GB used</span>
              <span>{Math.min(docs.length * 2, 100)}%</span>
            </div>
          </div>

          {/* Recent uploads */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Recent Uploads</div>
              <button style={{ background: 'none', color: 'var(--orange)', fontSize: '0.72rem', fontWeight: 600 }}>View All</button>
            </div>
            {[...docs].sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, 3).map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <FileIcon type={d.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>
                    {Math.round((Date.now() - d.uploadedAt) / 60000)} min ago
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <HelpCircle size={16} style={{ color: 'var(--orange)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Need Help?</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>Check our documentation or contact support for assistance.</div>
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ExternalLink size={12} /> View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
