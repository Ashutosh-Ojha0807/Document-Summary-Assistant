import React, { useState } from 'react';
import { Key, Cpu, Bell, Shield, Save } from 'lucide-react';

export default function Settings({ apiKey, onSaveApiKey }) {
  const [key, setKey] = useState(apiKey || '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSaveApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your AI engine and application preferences.</p>
      </div>
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* AI Engine */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Cpu size={18} style={{ color: 'var(--orange)' }} />
            <div style={{ fontWeight: 700 }}>AI Engine Configuration</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              Google Gemini API Key <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input type="password" value={key} onChange={e => setKey(e.target.value)}
              placeholder="AIzaSy…" className="input" />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 5, lineHeight: 1.5 }}>
              Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--orange)' }}>aistudio.google.com</a>.
              Saved locally — never sent to our servers. Without a key, the built-in offline NLP engine is used.
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Save size={13} /> {saved ? 'Saved!' : 'Save API Key'}
          </button>
        </div>

        {/* Privacy */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Shield size={18} style={{ color: 'var(--green)' }} />
            <div style={{ fontWeight: 700 }}>Privacy & Security</div>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
            All files are processed in-memory and never stored on our servers. Document text is sent to the AI engine only when explicitly requested. Your API key is stored locally in your browser.
          </p>
        </div>

        {/* About */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Key size={18} style={{ color: 'var(--blue)' }} />
            <div style={{ fontWeight: 700 }}>About TalonAI</div>
          </div>
          {[
            ['Version', '1.0.0'],
            ['Backend', 'FastAPI + Python 3.11'],
            ['AI Engine', 'Google Gemini 2.5 Flash'],
            ['OCR Engine', 'Tesseract 5.4'],
            ['Offline NLP', 'TextRank + Flesch Readability'],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-3)' }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
