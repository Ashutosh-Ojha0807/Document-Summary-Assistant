import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, Paperclip, MessageSquare, Copy, ThumbsUp, ThumbsDown,
  ChevronRight, ChevronDown, Sparkles, Check, RefreshCw, FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function QAChat({ doc, onNavigate, apiKey, docs }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);   // sidebar conversation history
  const [showMoreQ, setShowMoreQ] = useState(false);
  const [activeDoc, setActiveDoc] = useState(doc);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Initialize greeting when doc changes
  useEffect(() => {
    if (!activeDoc) return;
    setMessages([{
      role: 'assistant',
      content: `Hello! I've analyzed **${activeDoc.name}** (${activeDoc.extracted?.metadata?.word_count?.toLocaleString() || 0} words). Ask me anything about this document.`,
      time: now(),
      sources: [],
    }]);
    setHistory([]);
  }, [activeDoc?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function now() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  if (!activeDoc) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ marginBottom: 16 }}>No document selected. Please upload or select a document.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const suggestedQuestions = [
    'What are the key financial highlights?',
    'How did operating margin change?',
    'What is the cash flow from operations?',
    'Which region generated the most revenue?',
    'What were the key risk factors?',
    'What were the main growth drivers?',
    'How did expenses change compared to last year?',
    'What is the outlook for the next quarter?',
  ];

  async function handleSend(q) {
    const question = (q || input).trim();
    if (!question || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: question, time: now() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    // Add to history
    setHistory(prev => [{ question, time: now(), id: Date.now() }, ...prev.slice(0, 9)]);

    try {
      const res = await fetch(`${API_BASE}/api/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: activeDoc.extracted?.raw_text || '',
          question,
          chat_history: updated.slice(-6).map(m => ({ role: m.role, content: m.content })),
          gemini_api_key: apiKey || undefined,
        }),
      });
      const data = await res.json();

      // Extract page numbers from excerpts
      const sources = (data.relevant_excerpts || []).slice(0, 2).map((ex, i) => `Page ${i + 2}`);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || 'I could not find a direct answer in the document.',
        time: now(),
        sources,
        excerpts: data.relevant_excerpts,
        engine: data.engine_used,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, an error occurred. Please check the backend connection.',
        time: now(),
        sources: [],
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleClearHistory() {
    setHistory([]);
    setMessages([{
      role: 'assistant',
      content: `Chat cleared. Ask me anything about **${activeDoc.name}**.`,
      time: now(),
      sources: [],
    }]);
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 48px)' }}>
      {/* Title */}
      <div style={{ marginBottom: 10 }}>
        <h1 className="page-title">Q&A Chat</h1>
        <p className="page-subtitle">Ask anything about your documents. Get instant answers with AI.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, flex: 1, overflow: 'hidden' }}>
        {/* ── Chat column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Doc info bar */}
          <div className="card" style={{ padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div className={`file-icon ${activeDoc.type || 'txt'}`} style={{ width: 32, height: 32, fontSize: '0.62rem' }}>
              {(activeDoc.type || 'FILE').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.83rem' }}>{activeDoc.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                {activeDoc.extracted?.metadata?.page_or_sheet_count || 1} pages • {activeDoc.sizeLabel || '–'} • Extracted on {new Date(activeDoc.uploadedAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => setShowDocPicker(!showDocPicker)}>
                <RefreshCw size={12} /> Change Document
              </button>
              {showDocPicker && docs?.length > 0 && (
                <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 50, background: 'var(--bg-card2)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-md)', padding: 4, minWidth: 200, boxShadow: 'var(--shadow-md)' }}>
                  {docs.filter(d => d.status === 'completed' && d.id !== activeDoc.id).map(d => (
                    <button key={d.id} onClick={() => { setActiveDoc(d); setShowDocPicker(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', color: 'var(--text-1)', fontSize: '0.78rem', borderRadius: 6 }}>
                      <div className={`file-icon ${d.type || 'txt'}`} style={{ width: 22, height: 22, fontSize: '0.5rem' }}>{(d.type || '').toUpperCase().slice(0, 3)}</div>
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0', minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'user' ? (
                    <div style={{ maxWidth: '75%' }}>
                      <div style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-md)',
                        borderRadius: '16px 16px 4px 16px',
                        padding: '10px 14px', fontSize: '0.86rem', color: 'var(--text-1)',
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>{msg.time}</span>
                        <Check size={11} style={{ color: 'var(--text-4)' }} />
                        <Check size={11} style={{ color: 'var(--green)', marginLeft: -6 }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ maxWidth: '80%' }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {/* Bot avatar */}
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <Sparkles size={14} style={{ color: '#fff' }} />
                        </div>
                        <div>
                          <div style={{
                            background: 'var(--bg-card2)', border: '1px solid var(--border-md)',
                            borderRadius: '4px 16px 16px 16px',
                            padding: '10px 14px', fontSize: '0.86rem', lineHeight: 1.6,
                          }}>
                            <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
                            {/* Source pills */}
                            {msg.sources?.length > 0 && (
                              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Sources:</span>
                                {msg.sources.map((s, j) => (
                                  <span key={j} style={{ padding: '2px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-md)', borderRadius: 10, fontSize: '0.68rem', color: 'var(--blue)', fontWeight: 600 }}>{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>{msg.time}</span>
                            <button style={{ background: 'none', color: 'var(--text-4)', padding: '2px 4px', border: 'none', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(msg.content)}><Copy size={11} /></button>
                            <button style={{ background: 'none', color: 'var(--text-4)', padding: '2px 4px', border: 'none', cursor: 'pointer' }}><ThumbsUp size={11} /></button>
                            <button style={{ background: 'none', color: 'var(--text-4)', padding: '2px 4px', border: 'none', cursor: 'pointer' }}><ThumbsDown size={11} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={14} style={{ color: '#fff' }} />
                  </div>
                  <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border-md)', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 5 }}>
                    {[0, 1, 2].map(d => (
                      <div key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)', animation: `pulse 1s ${d * 0.2}s ease-in-out infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggested chips row */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0', flexShrink: 0 }}>
            {suggestedQuestions.slice(0, 3).map((q, i) => (
              <button key={i} className="suggest-chip" onClick={() => handleSend(q)}>
                <Sparkles size={10} /> {q}
              </button>
            ))}
            <button className="suggest-chip" style={{ color: 'var(--text-4)' }}>›</button>
          </div>

          {/* Input area */}
          <div className="card" style={{ padding: '12px 14px', marginTop: 6, flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the document..."
              style={{
                width: '100%', background: 'none', border: 'none',
                color: 'var(--text-1)', fontSize: '0.88rem',
                fontFamily: 'var(--font-main)', outline: 'none',
                marginBottom: 10,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button className="btn btn-ghost btn-icon" title="Attach"><Paperclip size={15} /></button>
              <button className="btn btn-primary btn-sm" onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px' }}>
                <Send size={13} /> Send
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.67rem', color: 'var(--text-4)', marginTop: 6 }}>
            Tips: Be specific for better answers • You can ask about figures, tables, trends, and more.
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {/* Suggested Questions */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Sparkles size={14} style={{ color: 'var(--amber)' }} />
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Suggested Questions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(showMoreQ ? suggestedQuestions : suggestedQuestions.slice(0, 5)).map((q, i) => (
                <button key={i} onClick={() => handleSend(q)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', textAlign: 'left', cursor: 'pointer', fontSize: '0.79rem', lineHeight: 1.4, gap: 8 }}>
                  <span>{q}</span>
                  <ChevronRight size={13} style={{ color: 'var(--text-4)', flexShrink: 0 }} />
                </button>
              ))}
              {suggestedQuestions.length > 5 && (
                <button onClick={() => setShowMoreQ(!showMoreQ)}
                  className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {showMoreQ ? 'Show Less' : 'Show More Questions'}
                  <ChevronDown size={12} style={{ transform: showMoreQ ? 'rotate(180deg)' : '' }} />
                </button>
              )}
            </div>
          </div>

          {/* Conversation History */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.88rem' }}>
                🕐 Conversation History
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--orange)', fontSize: '0.72rem' }}>View All</button>
            </div>
            {history.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>No history yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {history.slice(0, 5).map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => handleSend(h.question)}>
                    <FileText size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.76rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.question}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-4)', flexShrink: 0 }}>{h.time}</span>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', padding: '2px 4px' }}
                      onClick={e => { e.stopPropagation(); setHistory(prev => prev.filter(x => x.id !== h.id)); }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {history.length > 0 && (
              <button onClick={handleClearHistory} className="btn btn-ghost btn-sm"
                style={{ marginTop: 8, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 5, width: '100%', justifyContent: 'center' }}>
                🗑 Clear History
              </button>
            )}
          </div>

          {/* AI Engine panel */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.88rem' }}>
                <Sparkles size={14} style={{ color: 'var(--orange)' }} /> AI Engine
              </div>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--orange)', fontSize: '0.72rem' }}
                onClick={() => onNavigate('settings')}>Manage</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-md)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={14} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Gemini 2.5 Flash</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>Fast, accurate, and optimized for document Q&A.</div>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>Active</span>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Learn more about our AI engines <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
