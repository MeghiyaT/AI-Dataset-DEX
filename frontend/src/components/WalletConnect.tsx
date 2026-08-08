// WalletConnect.tsx
// Universal Midnight Wallet Connector with Extension, Custom Address, and 1AM Web Wallet.

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
  const [showModal, setShowModal] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Disconnected State: Clean Connect Button ───────────────────────── */}
      {walletState.status === 'idle' && (
        <button
          id="btn-open-wallet-modal"
          className="btn btn-primary btn-sm"
          onClick={() => setShowModal(true)}
          style={{ fontSize: '0.86rem', padding: '0.5rem 1.1rem' }}
        >
          ⚡ Connect Wallet
        </button>
      )}

      {/* ── Connecting State ──────────────────────────────────────────────── */}
      {walletState.status === 'connecting' && (
        <button className="btn btn-secondary btn-sm" disabled>
          <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Connecting…
        </button>
      )}

      {/* ── Connected State: Balance & Account Dropdown ────────────────────── */}
      {walletState.status === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Balance Pill */}
          <div
            style={{
              padding: '0.35rem 0.75rem',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--midnight-violet-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span className="pulse-dot" />
            <span>{walletState.balance}</span>
          </div>

          {/* Account Pill */}
          <button
            id="btn-connected-account"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="mono">{truncate(walletState.address)}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>▼</span>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 300,
                background: '#0d101a',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem',
                boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                zIndex: 500,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="badge badge-purple">{walletState.connectorName}</span>
                <span className="badge badge-cyan">{targetNetwork.toUpperCase()}</span>
              </div>

              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>CONNECTED ADDRESS</div>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                    wordBreak: 'break-all',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span className="mono">{truncate(walletState.address)}</span>
                  <button
                    onClick={() => copy(walletState.address)}
                    style={{ background: 'none', border: 'none', color: 'var(--midnight-violet-light)', cursor: 'pointer', fontSize: '0.72rem' }}
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <a
                href="https://midnight-tmnight-preview.nethermind.dev"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.45rem',
                  fontSize: '0.78rem',
                  color: 'var(--midnight-cyan-light)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '0.75rem',
                }}
              >
                Request Test tNIGHT Faucet ↗
              </a>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowDropdown(false);
                    setShowModal(true);
                  }}
                  style={{ flex: 1, fontSize: '0.78rem' }}
                >
                  Switch Wallet
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    disconnect();
                    setShowDropdown(false);
                  }}
                  style={{ color: 'var(--midnight-rose)', fontSize: '0.78rem' }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Universal Wallet Connect Modal ────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Connect to Midnight Network</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Select your preferred Midnight wallet to interact with zero-knowledge dataset contracts on Preview.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {/* Option 1: Browser Extension (Lace) */}
              <div
                onClick={() => {
                  setShowModal(false);
                  connect('extension');
                }}
                className="card"
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isExtensionAvailable ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isExtensionAvailable ? 'rgba(139, 92, 246, 0.4)' : 'var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>🦊</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                      {detectedExtensionName || 'Midnight Extension (Lace)'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {isExtensionAvailable ? 'Detected in browser' : 'Auto-discover window.midnight'}
                    </div>
                  </div>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                  {isExtensionAvailable ? 'Active' : 'Connect'}
                </span>
              </div>

              {/* Option 2: 1AM In-Browser Wallet */}
              <div
                onClick={() => {
                  setShowModal(false);
                  connect('1am-web');
                }}
                className="card"
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(6, 182, 212, 0.08)',
                  borderColor: 'rgba(6, 182, 212, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>⚡</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                      1AM Web Wallet
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Instant client-side Midnight prover key
                    </div>
                  </div>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                  1-Click
                </span>
              </div>

              {/* Option 3: Custom Address Input */}
              <div
                className="card"
                style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem' }}>✍️</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                      Custom Address / Seed
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Paste your Lace or funded Preview address
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="mn_addr_preview1..."
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!customAddress.trim()}
                    onClick={() => {
                      setShowModal(false);
                      connect('custom', customAddress);
                    }}
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
