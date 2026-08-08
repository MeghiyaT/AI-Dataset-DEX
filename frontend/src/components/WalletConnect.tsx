// WalletConnect.tsx
// Simple, Clean, Non-intrusive Wallet Connection.

import { useState } from 'react';
import type { MidnightHook } from '../hooks/useMidnight';

interface Props {
  hook: MidnightHook;
}

function truncate(addr: string): string {
  if (!addr || addr.length < 16) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

export function WalletConnect({ hook }: Props) {
  const { walletState, connect, disconnect, targetNetwork, isExtensionAvailable, detectedExtensionName } = hook;
  const [showMenu, setShowMenu] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Disconnected State: Clean Button ──────────────────────────────── */}
      {walletState.status === 'idle' && (
        <div>
          <button
            id="btn-connect-wallet"
            className="btn btn-primary btn-sm"
            onClick={() => setShowMenu(!showMenu)}
          >
            Connect Wallet ▾
          </button>

          {/* Clean Dropdown */}
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 320,
                background: '#0d101d',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
                zIndex: 1000,
              }}
            >
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                Choose How to Connect
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
                Use your browser extension, paste your address, or try with a demo account.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {/* 1. Browser Extension */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowMenu(false);
                    connect('extension');
                  }}
                  style={{ justifyContent: 'space-between', padding: '0.6rem 0.85rem' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🦊</span>
                    <span>{detectedExtensionName || 'Midnight Extension (Lace)'}</span>
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                    {isExtensionAvailable ? 'Detected' : 'Auto'}
                  </span>
                </button>

                {/* 2. Instant Demo Wallet */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowMenu(false);
                    connect('1am-web');
                  }}
                  style={{ justifyContent: 'space-between', padding: '0.6rem 0.85rem' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚡</span>
                    <span>Instant Demo Account</span>
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    1-Click
                  </span>
                </button>
              </div>

              {/* 3. Custom Address Input */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.8rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  OR PASTE YOUR OWN WALLET ADDRESS:
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="mn_addr_preview1..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!customInput.trim()}
                    onClick={() => {
                      setShowMenu(false);
                      connect('custom', customInput);
                    }}
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Connecting State ──────────────────────────────────────────────── */}
      {walletState.status === 'connecting' && (
        <button className="btn btn-secondary btn-sm" disabled>
          Connecting…
        </button>
      )}

      {/* ── Connected State: Account Badge ────────────────────────────────── */}
      {walletState.status === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.35rem 0.75rem',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span className="pulse-dot" />
            <span>{walletState.balance}</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMenu(!showMenu)}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
          >
            <span className="mono">{truncate(walletState.address)}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 280,
                background: '#0d101d',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)',
                zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-purple">{walletState.connectorName}</span>
                <span className="badge badge-cyan">{targetNetwork.toUpperCase()}</span>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>YOUR ADDRESS</div>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    wordBreak: 'break-all',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className="mono">{truncate(walletState.address)}</span>
                  <button
                    onClick={() => copy(walletState.address)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '0.72rem' }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                style={{ width: '100%', color: 'var(--rose)', fontSize: '0.78rem' }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
