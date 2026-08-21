import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, UploadCloud, Files, BookOpen, Lightbulb,
  TrendingUp, Eye, FileText, MessageSquare, Settings as SettingsIcon,
  HelpCircle, Search, Sun, Moon, Bell, ChevronDown, Cpu, Star
} from 'lucide-react';
import eagleLogo from './assets/logo.svg';

import Dashboard from './pages/Dashboard.jsx';
import UploadDocument from './pages/UploadDocument.jsx';
import Documents from './pages/Documents.jsx';
import SummaryWorkspace from './pages/SummaryWorkspace.jsx';
import KeyInsights from './pages/KeyInsights.jsx';
import QAChat from './pages/QAChat.jsx';
import ImprovementSuggestions from './pages/ImprovementSuggestions.jsx';
import ReadabilityAnalysis from './pages/ReadabilityAnalysis.jsx';
import ExtractedText from './pages/ExtractedText.jsx';
import SampleDocuments from './pages/SampleDocuments.jsx';
import Settings from './pages/Settings.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const STORAGE_KEY = 'talonai_docs_v2';

function getFileType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map = { pdf: 'pdf', png: 'png', jpg: 'png', jpeg: 'png', webp: 'png', bmp: 'png', tiff: 'png', docx: 'docx', doc: 'docx', xlsx: 'xlsx', xls: 'xlsx', csv: 'csv', txt: 'txt', md: 'txt' };
  return map[ext] || 'txt';
}

function formatBytes(bytes) {
  if (!bytes) return '–';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function loadDocs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveDocs(docs) {
  try {
    // Only persist metadata — not the full extracted text — to keep localStorage small
    const slim = docs.map(d => ({
      ...d,
      extracted: d.extracted ? {
        metadata: d.extracted.metadata,
        sections: d.extracted.sections,
        raw_text: d.extracted.raw_text?.substring(0, 50000) || '',
        preview: d.extracted.preview,
      } : null,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  } catch { /* quota exceeded — skip */ }
}

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [page, setPage] = useState('dashboard');
  const [activeDoc, setActiveDoc] = useState(null);
  const [docs, setDocs] = useState(loadDocs);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('talonai_gemini_key') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(2);
  const [geminiOnline, setGeminiOnline] = useState(false);

  useEffect(() => {
    document.body.style.background = theme === 'dark' ? '#0d0d0d' : '#f4f4f4';
  }, [theme]);

  // Check backend health on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(r => r.json())
      .then(data => setGeminiOnline(data.gemini_api_configured))
      .catch(() => {});
  }, []);

  function navigate(target, doc = null) {
    setPage(target);
    if (doc) setActiveDoc(doc);
  }

  function handleSaveApiKey(key) {
    setApiKey(key);
    localStorage.setItem('talonai_gemini_key', key);
    // Re-check gemini status
    if (key) setGeminiOnline(true);
  }

  // Master upload handler
  const handleUploadFile = useCallback(async (file) => {
    setIsLoading(true);
    setLoadingStep('Extracting text & document structure…');

    const docId = `doc_${Date.now()}`;
    const newDoc = {
      id: docId,
      name: file.name,
      type: getFileType(file.name),
      sizeLabel: formatBytes(file.size),
      uploadedAt: Date.now(),
      status: 'processing',
      extracted: null,
      summary: null,
    };

    setDocs(prev => { const n = [newDoc, ...prev]; saveDocs(n); return n; });
    navigate('summary-workspace', newDoc);

    try {
      // Step 1: Extract
      const formData = new FormData();
      formData.append('file', file);
      const extractRes = await fetch(`${API_BASE}/api/extract`, { method: 'POST', body: formData });
      if (!extractRes.ok) throw new Error((await extractRes.json()).detail || 'Extraction failed');
      const extracted = await extractRes.json();

      // Step 2: Summarize
      setLoadingStep('Generating smart summary…');
      const sumRes = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extracted.raw_text,
          summary_length: 'medium',
          summary_style: 'executive',
          gemini_api_key: apiKey || undefined,
        }),
      });
      const summary = sumRes.ok ? await sumRes.json() : null;

      const updatedDoc = { ...newDoc, status: 'completed', extracted, summary };
      setDocs(prev => { const n = prev.map(d => d.id === docId ? updatedDoc : d); saveDocs(n); return n; });
      setActiveDoc(updatedDoc);
    } catch (err) {
      const failedDoc = { ...newDoc, status: 'failed' };
      setDocs(prev => { const n = prev.map(d => d.id === docId ? failedDoc : d); saveDocs(n); return n; });
      setActiveDoc(failedDoc);
      alert(`Error processing document: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }, [apiKey]);

  // Load a sample document
  const handleLoadSample = useCallback(async (sample) => {
    setIsLoading(true);
    setLoadingStep(`Loading ${sample.title}…`);

    const words = sample.content.match(/\b\w+\b/g) || [];
    const extracted = {
      metadata: {
        filename: sample.filename,
        file_type: sample.file_type,
        file_size_bytes: sample.content.length,
        char_count: sample.content.length,
        word_count: words.length,
        sentence_count: Math.max(1, (sample.content.match(/[.!?]+/g) || []).length),
        estimated_read_time_minutes: parseFloat((words.length / 200).toFixed(1)),
        page_or_sheet_count: 1,
        extraction_method: 'Native Sample Loader',
      },
      raw_text: sample.content,
      sections: [{ title: 'Overview', content: sample.content, page: 1 }],
      preview: sample.content.substring(0, 400) + '…',
    };

    const docId = `sample_${Date.now()}`;
    const sampleDoc = {
      id: docId,
      name: sample.filename,
      type: 'txt',
      sizeLabel: formatBytes(sample.content.length),
      uploadedAt: Date.now(),
      status: 'processing',
      extracted,
      summary: null,
    };

    setDocs(prev => { const n = [sampleDoc, ...prev]; saveDocs(n); return n; });
    navigate('summary-workspace', sampleDoc);

    try {
      setLoadingStep('Generating summary…');
      const sumRes = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extracted.raw_text,
          summary_length: 'medium',
          summary_style: 'executive',
          gemini_api_key: apiKey || undefined,
        }),
      });
      const summary = sumRes.ok ? await sumRes.json() : null;
      const done = { ...sampleDoc, status: 'completed', summary };
      setDocs(prev => { const n = prev.map(d => d.id === docId ? done : d); saveDocs(n); return n; });
      setActiveDoc(done);
    } catch (err) {
      alert(`Failed to load sample: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  }, [apiKey]);

  // Regenerate summary with new settings
  const handleRegenerateSummary = useCallback(async (docId, length, style, custom) => {
    const doc = docs.find(d => d.id === docId);
    if (!doc?.extracted?.raw_text) return;
    try {
      const res = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: doc.extracted.raw_text,
          summary_length: length,
          summary_style: style,
          custom_instructions: custom || undefined,
          gemini_api_key: apiKey || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const summary = await res.json();
      const updated = { ...doc, summary };
      setDocs(prev => { const n = prev.map(d => d.id === docId ? updated : d); saveDocs(n); return n; });
      setActiveDoc(updated);
    } catch (err) {
      alert(`Regeneration failed: ${err.message}`);
    }
  }, [docs, apiKey]);

  function handleDeleteDoc(docId) {
    setDocs(prev => { const n = prev.filter(d => d.id !== docId); saveDocs(n); return n; });
    if (activeDoc?.id === docId) { setActiveDoc(null); setPage('documents'); }
  }

  // Sidebar nav config
  const navMain = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'upload', label: 'Upload Document', icon: <UploadCloud size={16} /> },
    { id: 'documents', label: 'Documents', icon: <Files size={16} /> },
    { id: 'sample-documents', label: 'Sample Documents', icon: <BookOpen size={16} /> },
  ];
  const navAnalysis = [
    { id: 'summary-workspace', label: 'Summary Workspace', icon: <BookOpen size={16} /> },
    { id: 'key-insights', label: 'Key Insights', icon: <TrendingUp size={16} /> },
    { id: 'improvement-suggestions', label: 'Improvement Suggestions', icon: <Lightbulb size={16} /> },
    { id: 'readability', label: 'Readability Analysis', icon: <Eye size={16} /> },
    { id: 'extracted-text', label: 'Extracted Text', icon: <FileText size={16} /> },
    { id: 'qa-chat', label: 'Q&A Chat', icon: <MessageSquare size={16} /> },
  ];
  const navMore = [
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={16} /> },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle size={16} /> },
  ];

  function renderPage() {
    // For analysis pages, use activeDoc (most recent if none selected)
    const docForPage = activeDoc || docs.find(d => d.status === 'completed') || null;

    switch (page) {
      case 'dashboard': return <Dashboard docs={docs} onNavigate={navigate} onUploadFile={handleUploadFile} />;
      case 'upload': return <UploadDocument onUploadFile={handleUploadFile} isLoading={isLoading} loadingStep={loadingStep} />;
      case 'documents': return <Documents docs={docs} onNavigate={navigate} onDeleteDoc={handleDeleteDoc} />;
      case 'sample-documents': return <SampleDocuments onLoadSample={handleLoadSample} isLoading={isLoading} />;
      case 'summary-workspace': return <SummaryWorkspace doc={docForPage} onNavigate={navigate} onRegenerateSummary={handleRegenerateSummary} />;
      case 'key-insights': return <KeyInsights doc={docForPage} onNavigate={navigate} />;
      case 'improvement-suggestions': return <ImprovementSuggestions doc={docForPage} onNavigate={navigate} />;
      case 'readability': return <ReadabilityAnalysis doc={docForPage} onNavigate={navigate} />;
      case 'extracted-text': return <ExtractedText doc={docForPage} onNavigate={navigate} />;
      case 'qa-chat': return <QAChat doc={docForPage} onNavigate={navigate} apiKey={apiKey} />;
      case 'settings': return <Settings apiKey={apiKey} onSaveApiKey={handleSaveApiKey} />;
      case 'help': return (
        <div className="page-content">
          <h1 className="page-title">Help & Support</h1>
          <p className="page-subtitle" style={{ marginTop: 8 }}>
            For help, please refer to the <a href="https://github.com/Ashutosh-Ojha0807/Document-Summary-Assistant" target="_blank" rel="noreferrer" style={{ color: 'var(--orange)' }}>GitHub README</a> or the DOCUMENTATION.md file in the project root.
          </p>
        </div>
      );
      default: return <Dashboard docs={docs} onNavigate={navigate} onUploadFile={handleUploadFile} />;
    }
  }

  return (
    <div className="app-shell" style={{ background: theme === 'dark' ? 'var(--bg-app)' : '#f4f4f4', color: theme === 'dark' ? 'var(--text-1)' : '#111' }}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={eagleLogo} alt="TalonAI" style={{ width: 36, height: 36, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(255,107,34,0.4))' }} />
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-name">
              <span className="t">Talon</span><span className="ai">AI</span>
            </div>
            <div className="sidebar-logo-sub">Document Intelligence</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">MAIN</div>
          {navMain.map(item => (
            <div key={item.id} className={`sidebar-item${page === item.id ? ' active' : ''}`}
              onClick={() => { setPage(item.id); }}>
              {item.icon} {item.label}
            </div>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 12 }}>ANALYSIS</div>
          {navAnalysis.map(item => (
            <div key={item.id} className={`sidebar-item${page === item.id ? ' active' : ''}`}
              onClick={() => { setPage(item.id); }}>
              {item.icon} {item.label}
            </div>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 12 }}>MORE</div>
          {navMore.map(item => (
            <div key={item.id} className={`sidebar-item${page === item.id ? ' active' : ''}`}
              onClick={() => setPage(item.id)}>
              {item.icon} {item.label}
            </div>
          ))}
        </nav>

        {/* AI Status footer */}
        <div className="sidebar-footer">
          <div className="ai-status">
            <div className="ai-status-row">
              <div className="ai-status-dot" />
              <span className="ai-status-label">AI Engine Online</span>
            </div>
            <div className="ai-status-model">
              {apiKey || geminiOnline ? 'Gemini 2.5 Flash' : 'Offline NLP Engine'}
            </div>
            <button className="ai-change-btn" onClick={() => setPage('settings')}>
              Change Engine <ChevronDown size={10} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-wrap">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-search">
            <Search size={14} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents, summaries, insights…"
            />
            <span className="topbar-kbd">Ctrl + K</span>
          </div>

          <div className="topbar-right">
            <button className="topbar-icon-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="topbar-icon-btn" title="Notifications">
              <Bell size={16} />
              {notifications > 0 && <span className="notif-badge">{notifications}</span>}
            </button>
            <div className="topbar-user" onClick={() => setPage('settings')}>
              <div className="topbar-avatar">AO</div>
              <div>
                <div className="topbar-user-name">Ashutosh Ojha</div>
                <div className="topbar-user-role">Free tier</div>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />
            </div>
          </div>
        </header>

        {/* Page content */}
        {isLoading && page === 'upload' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, minHeight: 'calc(100vh - 56px)' }}>
            <div className="spinner" style={{ width: 48, height: 48 }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Processing Document…</div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.88rem' }}>{loadingStep}</div>
          </div>
        ) : renderPage()}
      </div>
    </div>
  );
}
