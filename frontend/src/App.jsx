import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, UploadCloud, Sparkles, BookOpen, CheckCircle2, AlertCircle,
  Copy, Download, Volume2, VolumeX, Moon, Sun, Settings, MessageSquare,
  Search, FileCheck, Layers, Award, Clock, Hash, ArrowRight, RefreshCw,
  Send, HelpCircle, Shield, FileSpreadsheet, Image as ImageIcon, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import eagleLogo from './assets/logo.svg';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState('dark');
  
  // Document state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [extractedDoc, setExtractedDoc] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'suggestions' | 'extracted' | 'chat'
  
  // Controls state
  const [summaryLength, setSummaryLength] = useState('medium'); // 'short' | 'medium' | 'long'
  const [summaryStyle, setSummaryStyle] = useState('executive'); // 'executive' | 'technical' | 'bulleted' | 'casual'
  const [customInstructions, setCustomInstructions] = useState('');
  
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState(null);
  
  // Search in extracted text
  const [searchQuery, setSearchQuery] = useState('');
  
  // Q&A / Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  
  // Settings & Samples
  const [apiKey, setApiKey] = useState(localStorage.getItem('docupulse_gemini_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [samples, setSamples] = useState([]);
  const [copiedToast, setCopiedToast] = useState(false);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

  // Load samples
  useEffect(() => {
    fetch('/api/samples')
      .then(res => res.json())
      .then(data => setSamples(data))
      .catch(() => {});
  }, []);

  // Save API key
  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('docupulse_gemini_key', key);
    setShowSettings(false);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Upload and process document
  const handleFileUpload = async (file) => {
    setSelectedFile(file);
    setIsLoading(true);
    setLoadingStep('Extracting text & document structure...');
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 1. Text Extraction
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      });

      if (!extractRes.ok) {
        const errData = await extractRes.json();
        throw new Error(errData.detail || 'Extraction failed');
      }

      const extracted = await extractRes.json();
      setExtractedDoc(extracted);

      // 2. Auto-trigger Summarization
      setLoadingStep('Generating smart summary & quality metrics...');
      await generateDocumentSummary(extracted.raw_text, summaryLength, summaryStyle);

      // Initialize Document Chat greeting
      setChatMessages([
        {
          role: 'assistant',
          content: `Hello! I have analyzed **${file.name}** (${extracted.metadata.word_count.toLocaleString()} words). You can ask me any question about the contents, data points, or conclusions of this document.`
        }
      ]);

    } catch (err) {
      alert(`Error processing document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load a built-in sample document
  const handleLoadSample = async (sample) => {
    setIsLoading(true);
    setLoadingStep(`Loading ${sample.title}...`);
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);

    try {
      const mockFile = new File([sample.content], sample.filename, { type: 'text/plain' });
      setSelectedFile(mockFile);

      const words = sample.content.match(/\b\w+\b/g) || [];
      const extracted = {
        metadata: {
          filename: sample.filename,
          file_type: sample.file_type,
          file_size_bytes: sample.content.length,
          char_count: sample.content.length,
          word_count: words.length,
          sentence_count: Math.max(1, (sample.content.match(/[.!?]+/g) || []).length),
          estimated_read_time_minutes: (words.length / 200).toFixed(1),
          page_or_sheet_count: 1,
          extraction_method: 'Native Sample Loader'
        },
        raw_text: sample.content,
        sections: [{ title: 'Overview', content: sample.content, page: 1 }],
        preview: sample.content.substring(0, 400) + '...'
      };
      setExtractedDoc(extracted);

      setLoadingStep('Generating smart summary & suggestions...');
      await generateDocumentSummary(extracted.raw_text, summaryLength, summaryStyle);

      setChatMessages([
        {
          role: 'assistant',
          content: `I've loaded **${sample.title}**. What would you like to know or analyze?`
        }
      ]);
    } catch (err) {
      alert(`Failed to load sample: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Request summary from backend
  const generateDocumentSummary = async (text, length, style) => {
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          summary_length: length,
          summary_style: style,
          custom_instructions: customInstructions,
          gemini_api_key: apiKey || undefined
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate summary');
      }

      const summary = await res.json();
      setSummaryData(summary);
    } catch (err) {
      alert(`Summarization error: ${err.message}`);
    }
  };

  // Re-run summarization when settings change
  const handleRegenerate = () => {
    if (!extractedDoc) return;
    setIsLoading(true);
    setLoadingStep('Regenerating summary with updated parameters...');
    generateDocumentSummary(extractedDoc.raw_text, summaryLength, summaryStyle)
      .finally(() => setIsLoading(false));
  };

  // Text-To-Speech
  const toggleAudio = () => {
    if (!summaryData) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const plainText = summaryData.summary_text.replace(/[#*•_]/g, '');
      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setSpeechUtterance(utterance);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  // Copy Summary with Confetti
  const handleCopySummary = () => {
    if (!summaryData) return;
    const fullContent = `# Summary: ${extractedDoc?.metadata.filename || 'Document'}\n\n${summaryData.summary_text}\n\n## Key Takeaways:\n${summaryData.key_takeaways.map(t => `- ${t}`).join('\n')}`;
    navigator.clipboard.writeText(fullContent);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!summaryData) return;
    const doc = new jsPDF();
    const filename = extractedDoc?.metadata.filename || 'Document';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Document Summary Report', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Source File: ${filename}`, 14, 28);
    doc.text(`Engine: ${summaryData.engine_used}`, 14, 34);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 44, 196, 44);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Executive Summary', 14, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(summaryData.summary_text.replace(/[#*_]/g, ''), 180);
    doc.text(splitSummary, 14, 62);

    let yOffset = 62 + (splitSummary.length * 5) + 10;

    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Key Takeaways:', 14, yOffset);
    yOffset += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summaryData.key_takeaways.forEach((t) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
      const splitT = doc.splitTextToSize(`• ${t}`, 175);
      doc.text(splitT, 14, yOffset);
      yOffset += (splitT.length * 5) + 2;
    });

    doc.save(`${filename.replace(/\.[^/.]+$/, "")}_Summary.pdf`);
  };

  // Export to Markdown
  const handleExportMarkdown = () => {
    if (!summaryData) return;
    const filename = extractedDoc?.metadata.filename || 'Document';
    const content = `# Document Summary: ${filename}
Generated via DocuPulse AI Assistant on ${new Date().toLocaleString()}

## Summary (${summaryData.summary_length.toUpperCase()} • ${summaryData.summary_style.toUpperCase()})
${summaryData.summary_text}

## Key Takeaways
${summaryData.key_takeaways.map(t => `- ${t}`).join('\n')}

## Action Items & Recommendations
${summaryData.action_items.map(a => `- [ ] ${a}`).join('\n')}

## Readability & Tone Metrics
- **Flesch Reading Ease**: ${summaryData.readability.flesch_reading_ease} / 100
- **Grade Level**: Grade ${summaryData.readability.flesch_kincaid_grade} (${summaryData.readability.readability_level})
- **Detected Tone**: ${summaryData.readability.reading_tone}

## Improvement Suggestions
${summaryData.improvement_suggestions.map(s => `### [${s.impact.toUpperCase()}] ${s.category}: ${s.suggestion}\n${s.example ? `> Example: ${s.example}` : ''}`).join('\n\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, "")}_Summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Send Question to Document Q&A
  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !extractedDoc || isAnswering) return;

    const q = currentQuestion.trim();
    setCurrentQuestion('');
    
    // Add user message
    const updatedMessages = [...chatMessages, { role: 'user', content: q }];
    setChatMessages(updatedMessages);
    setIsAnswering(true);

    try {
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: extractedDoc.raw_text,
          question: q,
          chat_history: updatedMessages,
          gemini_api_key: apiKey || undefined
        })
      });

      if (!res.ok) throw new Error('Q&A request failed');
      const data = await res.json();

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          excerpts: data.relevant_excerpts
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an issue: ${err.message}` }
      ]);
    } finally {
      setIsAnswering(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Render Highlighted Search Text
  const renderHighlightedText = (text, query) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '3px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass-panel">
        <div className="brand">
          <div className="brand-logo-wrapper">
            <img src={eagleLogo} alt="TalonAI Eagle Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <h1>
              <span className="brand-name-talon">Talon</span><span className="brand-name-ai">AI</span>
              <span className="brand-badge">PRO</span>
            </h1>
            <p className="brand-tagline">Intelligent Document Intelligence — Powered by Precision</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowSettings(true)}
            title="AI Engine Settings"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="main-layout">
        {/* Left Sidebar: Upload & Controls */}
        <div className="sidebar-column">
          {/* Upload Dropzone */}
          <div className="glass-panel upload-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={18} color="var(--accent-primary)" />
              Document Upload
            </h3>

            <div
              className={`dropzone ${isDragging ? 'active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.docx,.doc,.xlsx,.xls,.csv,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="dropzone-icon">
                <UploadCloud size={28} />
              </div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                {selectedFile ? selectedFile.name : 'Choose or drag a document here'}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                PDF, OCR Scans, Images, Word, Excel, CSV, Text
              </p>

              <div className="format-badges">
                <span className="badge badge-accent"><FileText size={12} /> PDF</span>
                <span className="badge badge-info"><ImageIcon size={12} /> OCR Image</span>
                <span className="badge badge-success"><FileText size={12} /> Word .docx</span>
                <span className="badge badge-warning"><FileSpreadsheet size={12} /> Excel/CSV</span>
              </div>
            </div>

            {/* Quick Samples Section */}
            <div className="samples-container">
              <div className="samples-title">
                <Zap size={14} color="var(--accent-primary)" />
                Try Sample Document
              </div>
              <div className="sample-buttons">
                {samples.map((sample) => (
                  <button
                    key={sample.id}
                    className="sample-btn"
                    onClick={() => handleLoadSample(sample)}
                  >
                    <span>{sample.title}</span>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </div>

            {/* Summarization Controls */}
            <div className="config-group">
              <label className="config-label">Summary Length</label>
              <div className="option-grid">
                {[
                  { id: 'short', name: 'Short', desc: '1-2 paras' },
                  { id: 'medium', name: 'Medium', desc: 'Standard' },
                  { id: 'long', name: 'Long', desc: 'Deep dive' }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    className={`option-card ${summaryLength === opt.id ? 'selected' : ''}`}
                    onClick={() => setSummaryLength(opt.id)}
                  >
                    <span className="option-card-title">{opt.name}</span>
                    <span className="option-card-desc">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="config-group">
              <label className="config-label">Summary Style & Tone</label>
              <div className="option-grid option-grid-4">
                {[
                  { id: 'executive', name: 'Executive', desc: 'High-level' },
                  { id: 'technical', name: 'Technical', desc: 'In-depth' },
                  { id: 'bulleted', name: 'Bulleted', desc: 'Key points' },
                  { id: 'casual', name: 'Casual', desc: 'Plain English' }
                ].map((opt) => (
                  <div
                    key={opt.id}
                    className={`option-card ${summaryStyle === opt.id ? 'selected' : ''}`}
                    onClick={() => setSummaryStyle(opt.id)}
                  >
                    <span className="option-card-title">{opt.name}</span>
                    <span className="option-card-desc">{opt.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="config-group">
              <label className="config-label">Custom Instructions (Optional)</label>
              <textarea
                className="custom-instructions-input"
                placeholder="e.g. Focus on financial figures. Highlight risks. Summarize in 3 bullets."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
              />
            </div>

            {extractedDoc && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '20px' }}
                onClick={handleRegenerate}
                disabled={isLoading}
              >
                <RefreshCw size={16} style={isLoading ? { animation: 'spin 1s linear infinite' } : {}} />
                <span>Re-summarize Document</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Content Area: Results & Analysis Tabs */}
        <div className="main-content-column">
          {isLoading ? (
            <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 20px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', animation: 'spin 1.5s linear infinite' }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Processing Document</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{loadingStep}</p>
            </div>
          ) : extractedDoc ? (
            <div className="glass-panel">
              {/* Document Quick Metadata Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileCheck size={22} color="var(--success)" />
                      {extractedDoc.metadata.filename}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span className="badge badge-accent">{extractedDoc.metadata.file_type}</span>
                      <span className="badge">{extractedDoc.metadata.extraction_method}</span>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={toggleAudio}
                      title="Read aloud"
                    >
                      {isPlayingAudio ? <VolumeX size={15} color="var(--accent-primary)" /> : <Volume2 size={15} />}
                      <span>{isPlayingAudio ? 'Stop Audio' : 'Read Aloud'}</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleCopySummary}
                      title="Copy Summary"
                    >
                      <Copy size={15} />
                      <span>{copiedToast ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleExportPDF}
                      title="Export as PDF"
                    >
                      <Download size={15} />
                      <span>PDF</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleExportMarkdown}
                      title="Export as Markdown"
                    >
                      <Download size={15} />
                      <span>Markdown</span>
                    </button>
                  </div>
                </div>

                {/* Metadata Stats Grid */}
                <div className="meta-grid" style={{ marginTop: '16px', marginBottom: 0 }}>
                  <div className="meta-box">
                    <span className="meta-label"><Hash size={12} style={{ display: 'inline', marginRight: '4px' }} />Word Count</span>
                    <span className="meta-val">{extractedDoc.metadata.word_count.toLocaleString()}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />Read Time</span>
                    <span className="meta-val">{extractedDoc.metadata.estimated_read_time_minutes} min</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label"><Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />Pages / Sections</span>
                    <span className="meta-val">{extractedDoc.metadata.page_or_sheet_count}</span>
                  </div>
                  <div className="meta-box">
                    <span className="meta-label"><Award size={12} style={{ display: 'inline', marginRight: '4px' }} />Readability</span>
                    <span className="meta-val" style={{ color: 'var(--success)' }}>
                      Grade {summaryData?.readability.flesch_kincaid_grade || '9.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="tabs-nav">
                <button
                  className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('summary')}
                >
                  <Sparkles size={16} />
                  Smart Summary
                </button>
                <button
                  className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('suggestions')}
                >
                  <AlertCircle size={16} />
                  Improvement Suggestions & Metrics
                </button>
                <button
                  className={`tab-btn ${activeTab === 'extracted' ? 'active' : ''}`}
                  onClick={() => setActiveTab('extracted')}
                >
                  <FileText size={16} />
                  Extracted Document Text
                </button>
                <button
                  className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare size={16} />
                  Document Q&A Chat
                </button>
              </div>

              {/* TAB 1: SMART SUMMARY */}
              {activeTab === 'summary' && summaryData && (
                <div className="summary-content">
                  <div className="summary-card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="var(--accent-primary)" />
                      Executive Summary ({summaryData.summary_length.toUpperCase()} • {summaryData.summary_style.toUpperCase()})
                    </h3>
                    <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {summaryData.summary_text}
                    </div>
                  </div>

                  {/* Key Takeaways */}
                  {summaryData.key_takeaways && summaryData.key_takeaways.length > 0 && (
                    <div className="section-block">
                      <h4 className="section-title">
                        <CheckCircle2 size={18} color="var(--accent-primary)" />
                        Key Highlights & Core Takeaways
                      </h4>
                      <div className="takeaway-list">
                        {summaryData.key_takeaways.map((takeaway, idx) => (
                          <div key={idx} className="takeaway-item">
                            <span style={{ fontWeight: '700', color: 'var(--accent-primary)', minWidth: '20px' }}>0{idx + 1}</span>
                            <span>{takeaway}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items & Next Steps */}
                  {summaryData.action_items && summaryData.action_items.length > 0 && (
                    <div className="section-block">
                      <h4 className="section-title">
                        <CheckCircle2 size={18} color="var(--success)" />
                        Action Items & Recommendations
                      </h4>
                      <div className="action-checklist">
                        {summaryData.action_items.map((action, idx) => (
                          <div key={idx} className="action-item">
                            <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Important Metrics & Dates */}
                  {summaryData.important_metrics_or_dates && summaryData.important_metrics_or_dates.length > 0 && (
                    <div className="section-block">
                      <h4 className="section-title">
                        <Hash size={18} color="var(--info)" />
                        Key Data Points, Metrics & Milestones
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {summaryData.important_metrics_or_dates.map((metric, idx) => (
                          <span key={idx} className="badge badge-info" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Engine: {summaryData.engine_used}
                  </div>
                </div>
              )}

              {/* TAB 2: IMPROVEMENT SUGGESTIONS & READABILITY */}
              {activeTab === 'suggestions' && summaryData && (
                <div className="summary-content">
                  {/* Readability Meter Cards */}
                  <div className="readability-meter-grid">
                    <div className="score-card">
                      <div className="score-number">{summaryData.readability.flesch_reading_ease}</div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '4px' }}>Flesch Reading Ease</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0-100 (Higher is easier)</div>
                    </div>
                    <div className="score-card">
                      <div className="score-number" style={{ color: 'var(--info)' }}>Grade {summaryData.readability.flesch_kincaid_grade}</div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '4px' }}>Grade Level</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{summaryData.readability.readability_level}</div>
                    </div>
                    <div className="score-card">
                      <div className="score-number" style={{ fontSize: '1.4rem', color: 'var(--warning)', marginTop: '8px' }}>
                        {summaryData.readability.reading_tone}
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem', marginTop: '4px' }}>Detected Tone</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg {summaryData.readability.avg_words_per_sentence} words/sentence</div>
                    </div>
                  </div>

                  {/* Actionable Writing Suggestions */}
                  <h4 className="section-title" style={{ marginTop: '20px' }}>
                    <Sparkles size={18} color="var(--accent-primary)" />
                    Actionable Improvement Suggestions
                  </h4>
                  {summaryData.improvement_suggestions.map((sug, idx) => (
                    <div key={idx} className="suggestion-card">
                      <div className="suggestion-header">
                        <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>{sug.category}</span>
                        <span className={`badge ${sug.impact === 'high' ? 'badge-warning' : 'badge-accent'}`}>
                          {sug.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                      <p className="suggestion-desc">{sug.suggestion}</p>
                      {sug.example && (
                        <div className="suggestion-example">{sug.example}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: EXTRACTED TEXT INSPECTOR */}
              {activeTab === 'extracted' && (
                <div className="summary-content">
                  {/* Search Toolbar */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search keywords within extracted document..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="chat-input"
                        style={{ paddingLeft: '36px' }}
                      />
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(extractedDoc.raw_text);
                        alert('Full extracted document text copied to clipboard!');
                      }}
                    >
                      <Copy size={16} />
                      <span>Copy Full Text</span>
                    </button>
                  </div>

                  {/* Text Container */}
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      maxHeight: '520px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.86rem',
                      lineHeight: '1.65',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {renderHighlightedText(extractedDoc.raw_text, searchQuery)}
                  </div>
                </div>
              )}

              {/* TAB 4: DOCUMENT Q&A CHAT */}
              {activeTab === 'chat' && (
                <div className="chat-container">
                  <div className="chat-messages">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-bubble ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                        <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
                        {msg.excerpts && msg.excerpts.length > 0 && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span style={{ fontWeight: '600' }}>Sources:</span>
                            {msg.excerpts.map((ex, exIdx) => (
                              <div key={exIdx} style={{ fontStyle: 'italic', marginTop: '2px' }}>"{ex}"</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {isAnswering && (
                      <div className="chat-bubble chat-assistant" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        Thinking and searching document context...
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  <form className="chat-input-row" onSubmit={handleSendQuestion}>
                    <input
                      type="text"
                      placeholder={`Ask a question about ${extractedDoc.metadata.filename}...`}
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      className="chat-input"
                    />
                    <button type="submit" className="btn btn-primary btn-icon" disabled={!currentQuestion.trim() || isAnswering}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-panel" style={{ padding: '80px 40px', textAlign: 'center' }}>
              <div className="empty-state-logo">
                <img src={eagleLogo} alt="TalonAI" className="empty-state-logo-img" />
              </div>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', letterSpacing: '-0.03em' }}>
                <span className="brand-name-talon">Talon</span><span className="brand-name-ai">AI</span> — Ready to Analyze
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 28px', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Upload any document — PDF, scanned image (OCR), Word, Excel, or text — and TalonAI will generate smart summaries, key takeaways, and improvement suggestions instantly.
              </p>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.95rem', padding: '12px 24px' }}
                onClick={() => handleLoadSample(samples[0] || { id: 'sample', title: 'Q3 Review', filename: 'Q3_Review.md', content: 'Global Tech achieved $42.5M revenue in Q3 2026.' })}
              >
                <Zap size={17} />
                <span>Try a Sample Document</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} color="var(--accent-primary)" />
                AI Engine Settings
              </h3>
              <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowSettings(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              TalonAI includes a <strong>Built-in Offline NLP Engine</strong> that runs without any API keys. Connect your <strong>Google Gemini API Key</strong> for enhanced AI summarization and grounded Q&amp;A.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                Google Gemini API Key (Optional)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="chat-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Saved locally in your browser session.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSaveApiKey(apiKey)}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
