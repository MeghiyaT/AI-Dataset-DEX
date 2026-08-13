// WalletConnect.tsx
// Midnight Wallet Connection — supports Lace and 1AM extensions.

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
  const { walletState, connect, disconnect, targetNetwork, isLaceAvailable, is1amAvailable } = hook;
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Disconnected State ────────────────────────────────────────────── */}
      {walletState.status === 'idle' && (
        <div>
          <button
            id="btn-connect-wallet"
            className="btn btn-primary btn-sm"
            onClick={() => setShowMenu(!showMenu)}
          >
            Connect Wallet ▾
          </button>

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
                Connect to Midnight
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
                Select your Midnight wallet to sign transactions.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {/* 1AM Wallet */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowMenu(false);
                    connect('1am');
                  }}
                  style={{ justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🌙</span>
                    <span>1AM Wallet Extension</span>
                  </span>
                  <span className={`badge ${is1amAvailable ? 'badge-cyan' : 'badge-subtle'}`} style={{ fontSize: '0.65rem' }}>
                    {is1amAvailable ? '✓ Detected' : 'Connect'}
                  </span>
                </button>

                {/* Lace Wallet */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowMenu(false);
                    connect('lace');
                  }}
                  style={{ justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🦊</span>
                    <span>Lace Wallet (Midnight)</span>
                  </span>
                  <span className={`badge ${isLaceAvailable ? 'badge-purple' : 'badge-subtle'}`} style={{ fontSize: '0.65rem' }}>
                    {isLaceAvailable ? '✓ Detected' : 'Connect'}
                  </span>
                </button>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textAlign: 'center', marginBottom: 0 }}>
                    Don't have a Midnight wallet?{' '}
                    <a
                      href="https://docs.midnight.network/getting-started/wallet"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--primary-light)' }}
                    >
                      Get Lace ↗
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Connecting State ─────────────────────────────────────────────── */}
      {walletState.status === 'connecting' && (
        <button className="btn btn-secondary btn-sm" disabled>
          Connecting…
        </button>
      )}

      {/* ── Error State: show retry button so the UI never goes blank ─────── */}
      {walletState.status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            id="btn-reconnect-wallet"
            className="btn btn-sm"
            title={walletState.message}
            onClick={() => { hook.clearError(); setShowMenu(true); }}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.78rem',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
            }}
          >
            ⚠ Wallet Error — Retry
          </button>
        </div>
      )}

      {walletState.status === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Balance Pill */}
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
                width: 300,
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
                <span className={`badge ${walletState.network === 'preview' ? 'badge-cyan' : 'badge-emerald'}`}>
                  {walletState.network.toUpperCase()}
                </span>
              </div>

              {/* Notice if wallet network differs from target network */}
              {walletState.network !== targetNetwork && (
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.72rem',
                    color: 'var(--cyan-light)',
                    marginBottom: '0.75rem',
                    lineHeight: 1.4,
                  }}
                >
                  ℹ️ Wallet extension is on <strong>{walletState.network.toUpperCase()}</strong> network. Balance & addresses reflect this network.
                </div>
              )}

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
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Direct Switch Wallet Action */}
              <div style={{ marginBottom: '0.65rem' }}>
                {walletState.walletType === '1am' ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowMenu(false);
                      connect('lace');
                    }}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.76rem', gap: '0.4rem' }}
                  >
                    <span>🦊</span> Switch to Midnight Lace
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowMenu(false);
                      connect('1am');
                    }}
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.76rem', gap: '0.4rem' }}
                  >
                    <span>🌙</span> Switch to 1AM Wallet
                  </button>
                )}
              </div>

              {/* Faucet link for testnet */}
              <div style={{ marginBottom: '0.75rem' }}>
                <a
                  href="https://midnight-tmnight-preview.nethermind.dev/"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.74rem', textDecoration: 'none', color: 'var(--emerald-light)' }}
                >
                  🚰 Get Free Test Tokens (Faucet ↗)
                </a>
              </div>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                style={{ width: '100%', color: 'var(--rose)', fontSize: '0.78rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
