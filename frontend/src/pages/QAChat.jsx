import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Trash2, Paperclip, Clock, MessageSquare, Copy, ThumbsUp, ThumbsDown, ChevronRight, HelpCircle, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function QAChat({ doc, onNavigate, apiKey }) {
  const [messages, setMessages] = useState(() => {
    if (!doc) return [];
    return [{
      role: 'assistant',
      content: `Hello! I've analyzed **${doc.name}** (${doc.extracted?.metadata?.word_count?.toLocaleString() || 0} words). Ask me anything about this document.`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!doc) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No document selected. Please select a document first.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigate('documents')}>View Documents</button>
        </div>
      </div>
    );
  }

  const suggestedQuestions = [
    'What were the key highlights?',
    'Summarize the main conclusions.',
    'What are the action items?',
    'What data or metrics are mentioned?',
    'What is the overall tone of the document?',
  ];

  async function handleSend(question) {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: q, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: doc.extracted?.raw_text || '',
          question: q,
          chat_history: updatedMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          gemini_api_key: apiKey || undefined,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || 'I could not find a direct answer in the document.',
        excerpts: data.relevant_excerpts,
        confidence: data.confidence,
        engine: data.engine_used,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check the backend connection.',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleClear() {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared. Ask me anything about **${doc.name}**.`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 className="page-title">Q&A Chat</h1>
            <p className="page-subtitle">Ask questions about your document and get precise answers.</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleClear} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Trash2 size={13} /> Clear Chat
          </button>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => onNavigate('summary-workspace', doc)}>
          <ArrowLeft size={14} /> Back to Document
        </button>
      </div>

      <div className="two-col" style={{ flex: 1, overflow: 'hidden', gap: 16 }}>
        {/* Chat column */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Doc info bar */}
          <div className="card" style={{ padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`file-icon ${(doc.type || 'txt').toLowerCase()}`} style={{ width: 30, height: 30, fontSize: '0.62rem' }}>
              {(doc.type || 'FILE').toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{doc.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                {doc.extracted?.metadata?.page_or_sheet_count || 1} pages • {doc.sizeLabel || '–'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, padding: '8px 0', minHeight: 0 }}>
            <div className="chat-area">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`} style={{ maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className={`chat-avatar ${msg.role === 'user' ? 'user' : 'bot'}`}>
                    {msg.role === 'user' ? 'AO' : '🤖'}
                  </div>
                  <div>
                    <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
                      <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>
                      {msg.excerpts?.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', opacity: 0.8 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Sources:</div>
                          {msg.excerpts.map((ex, j) => <div key={j} style={{ fontStyle: 'italic', marginBottom: 2 }}>"{ex}"</div>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span className="chat-time">{msg.time}</span>
                      {msg.role === 'assistant' && (
                        <>
                          <button style={{ background: 'none', color: 'var(--text-4)', padding: '2px 4px', borderRadius: 4 }} onClick={() => navigator.clipboard.writeText(msg.content)}>
                            <Copy size={11} />
                          </button>
                          <button style={{ background: 'none', color: 'var(--text-4)', padding: '2px 4px', borderRadius: 4 }}><ThumbsUp size={11} /></button>
                          <button style={{ background: 'none', color: 'var(--text-4)', padding: '2px 4px', borderRadius: 4 }}><ThumbsDown size={11} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg assistant">
                  <div className="chat-avatar bot">🤖</div>
                  <div className="chat-bubble bot" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggested chips */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0', flexShrink: 0 }}>
            {suggestedQuestions.slice(0, 3).map((q, i) => (
              <button key={i} className="suggest-chip" onClick={() => handleSend(q)}>
                ✦ {q}
              </button>
            ))}
            {suggestedQuestions.length > 3 && (
              <button className="suggest-chip" style={{ color: 'var(--text-4)' }}>›</button>
            )}
          </div>

          {/* Input */}
          <div className="card" style={{ padding: '10px 14px', marginTop: 8, flexShrink: 0 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your document…"
              rows={2}
              style={{
                width: '100%', background: 'none', border: 'none', resize: 'none',
                color: 'var(--text-1)', fontSize: '0.88rem', lineHeight: 1.5,
                fontFamily: 'var(--font-main)'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-icon" title="Attach file"><Paperclip size={15} /></button>
                <button className="btn btn-ghost btn-icon" title="History"><Clock size={15} /></button>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Send size={13} /> Send
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-4)', marginTop: 8 }}>
            AI responses may not always be 100% accurate. Please review the document for confirmation.
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {/* Doc info */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Document Info</div>
            {[
              ['File Name', doc.name],
              ['Pages', doc.extracted?.metadata?.page_or_sheet_count || 1],
              ['File Size', doc.sizeLabel || '–'],
              ['Uploaded', new Date(doc.uploadedAt).toLocaleDateString()],
              ['Language', 'English'],
              ['Status', doc.status],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', fontSize: '0.79rem' }}>
                <span style={{ color: 'var(--text-3)' }}>{k}</span>
                <span style={{ fontWeight: 600, maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>
                  {k === 'Status' ? <span className={`badge ${v === 'completed' ? 'badge-green' : 'badge-amber'}`}>{v}</span> : v}
                </span>
              </div>
            ))}
          </div>

          {/* Suggested questions */}
          <div className="card" style={{ padding: 16 }}>
            <div className="section-label">Suggested Questions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', background: 'none', color: 'var(--text-2)', border: 'none', borderBottom: i < suggestedQuestions.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.79rem', lineHeight: 1.4 }}>
                  <HelpCircle size={13} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 1 }} />
                  {q}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}>
              See more questions <ChevronRight size={12} />
            </button>
          </div>

          {/* Help */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>Need Help?</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
              Still have questions? Our documentation or support team can help you.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ExternalLink size={12} /> View Documentation
              </button>
              <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MessageSquare size={12} /> Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
