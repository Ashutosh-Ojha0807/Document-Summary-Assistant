import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image, Table, File, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function UploadDocument({ onUploadFile, isLoading, loadingStep }) {
  const [isDrag, setIsDrag] = useState(false);
  const fileRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault(); setIsDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUploadFile(file);
  }

  const formats = [
    { icon: <FileText size={18} style={{ color: 'var(--blue)' }} />, label: 'Documents', exts: 'PDF, DOCX, DOC, TXT, MD', bg: 'var(--blue-dim)' },
    { icon: <Image size={18} style={{ color: 'var(--purple)' }} />, label: 'Images', exts: 'PNG, JPG, JPEG, WEBP, BMP, TIFF', bg: 'var(--purple-dim)' },
    { icon: <Table size={18} style={{ color: 'var(--green)' }} />, label: 'Spreadsheets', exts: 'XLSX, XLS, CSV', bg: 'var(--green-dim)' },
    { icon: <File size={18} style={{ color: 'var(--amber)' }} />, label: 'Others', exts: 'ODT, RTF', bg: 'var(--amber-dim)' },
  ];

  const steps = [
    { num: 1, icon: '📄', title: 'Extract Text', desc: 'We extract text from your document using OCR and parsing technology.', color: 'var(--blue)', bg: 'var(--blue-dim)' },
    { num: 2, icon: '🧠', title: 'Analyze Content', desc: 'AI analyzes the content to identify key points, metrics, and important insights.', color: 'var(--purple)', bg: 'var(--purple-dim)' },
    { num: 3, icon: '📝', title: 'Generate Summary', desc: 'Smart summaries, takeaways and suggestions are generated for you.', color: 'var(--green)', bg: 'var(--green-dim)' },
    { num: 4, icon: '💬', title: 'Ask Questions', desc: 'Chat with your document and get answers with source references.', color: 'var(--orange)', bg: 'var(--orange-dim)' },
  ];

  return (
    <div className="page-content">
      <div className="two-col">
        <div>
          {/* Header */}
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 className="page-title">Upload Document</h1>
              <p className="page-subtitle">Upload any document to extract text, generate summaries and get AI-powered insights.</p>
            </div>
          </div>

          {/* Dropzone */}
          <div className={`dropzone${isDrag ? ' drag' : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileRef.current?.click()}
            style={{ marginBottom: 28 }}>
            <input ref={fileRef} type="file" style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.docx,.doc,.xlsx,.xls,.csv,.txt,.md,.rtf"
              onChange={e => e.target.files?.[0] && onUploadFile(e.target.files[0])} />

            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div className="spinner" />
                <div style={{ fontWeight: 600 }}>Processing Document…</div>
                <div style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>{loadingStep}</div>
              </div>
            ) : (
              <>
                <div className="dropzone-icon"><UploadCloud size={30} /></div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Drag & drop your document here</div>
                <div style={{ color: 'var(--text-3)', marginBottom: 16, fontSize: '0.85rem' }}>or</div>
                <button className="btn btn-primary" style={{ margin: '0 auto', display: 'inline-flex', pointerEvents: 'none' }}>
                  📁 Browse Files
                </button>
                <div style={{ marginTop: 16, color: 'var(--text-3)', fontSize: '0.76rem' }}>Maximum file size: 50MB</div>
                <div style={{ marginTop: 10, color: 'var(--text-3)', fontSize: '0.76rem' }}>Supported formats:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                  {['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT'].map(f => (
                    <span key={f} style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                      border: '1px solid var(--border-md)', background: 'var(--bg-card2)', color: 'var(--text-2)'
                    }}>{f}</span>
                  ))}
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, color: 'var(--orange)' }}>+ 8 more</span>
                </div>
              </>
            )}
          </div>

          {/* What happens next */}
          <div style={{ marginBottom: 8, fontWeight: 700, fontSize: '1rem' }}>What happens next?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="card" style={{ padding: '16px 14px', textAlign: 'center', borderColor: `${s.color}25` }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.bg, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.num}. {s.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>
                    <ArrowRight size={14} style={{ position: 'absolute', marginLeft: 0 }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', fontSize: '0.75rem' }}>
            <ShieldCheck size={14} /> Your documents are processed securely and are not stored on our servers.
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Security note */}
          <div className="card" style={{ padding: '14px 16px', borderColor: 'rgba(34,197,94,0.2)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <ShieldCheck size={18} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>Your data is secure</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-2)', lineHeight: 1.5 }}>Files are processed securely and never stored on our servers.</div>
              </div>
            </div>
          </div>

          {/* Supported formats */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Supported File Formats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {formats.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-3)' }}>{f.exts}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View full format support <ArrowRight size={12} />
            </button>
          </div>

          {/* Tips */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Tips for best results</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Upload clear and high-quality files',
                'For images, ensure good lighting',
                'Scanned documents work best with OCR',
                'Large documents may take longer to process',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckCircle size={14} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
