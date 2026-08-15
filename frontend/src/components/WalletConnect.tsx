// WalletConnect.tsx
// Midnight Wallet Connection — supports Lace and 1AM extensions with authentic logos,
// non-destructive switching, and direct Preprod faucet integration.

import { useState } from 'react';
import type { MidnightHook } from '../hooks/useMidnight';
import { WALLET_INSTALL_URLS } from '../hooks/useMidnight';
import { WalletIcon, FaucetIcon, MidnightTokenIcon } from './WalletIcons';
import { COPY_FEEDBACK_MS } from '../config';

interface Props {
  hook: MidnightHook;
}

function truncate(addr: string): string {
  if (!addr || addr.length < 16) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

export function WalletConnect({ hook }: Props) {
  const {
    walletState,
    connect,
    disconnect,
    targetNetwork,
    faucetUrl,
    isLaceAvailable,
    is1amAvailable,
    switchNotification,
    clearSwitchNotification,
  } = hook;

  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  const handleSwitch = async (type: '1am' | 'lace') => {
    setIsSwitching(true);
    await connect(type);
    setIsSwitching(false);
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
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
          >
            <MidnightTokenIcon size={16} />
            <span>Connect Wallet</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>▾</span>
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 330,
                background: '#0c0f1d',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 20px rgba(139, 92, 246, 0.15)',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                  Connect to Midnight
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  {targetNetwork.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.45 }}>
                Select your Midnight browser wallet to sign zero-knowledge proofs.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* 1AM Wallet */}
                {is1amAvailable ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowMenu(false);
                      connect('1am');
                    }}
                    style={{
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(6, 182, 212, 0.06)',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <WalletIcon type="1am" iconUrl={hook.oneAmIcon} size={22} />
                      <span style={{ fontWeight: 600 }}>1AM Wallet</span>
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                      ✓ Detected
                    </span>
                  </button>
                ) : (
                  <a
                    href={WALLET_INSTALL_URLS['1am']}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      textDecoration: 'none',
                      opacity: 0.85,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <WalletIcon type="1am" iconUrl={hook.oneAmIcon} size={22} />
                      <span>1AM Wallet</span>
                    </span>
                    <span className="badge badge-subtle" style={{ fontSize: '0.65rem' }}>
                      Install ↗
                    </span>
                  </a>
                )}

                {/* Midnight Lace */}
                {isLaceAvailable ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setShowMenu(false);
                      connect('lace');
                    }}
                    style={{
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(139, 92, 246, 0.06)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <WalletIcon type="lace" iconUrl={hook.laceIcon} size={22} />
                      <span style={{ fontWeight: 600 }}>Midnight Lace</span>
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      ✓ Detected
                    </span>
                  </button>
                ) : (
                  <a
                    href={WALLET_INSTALL_URLS.lace}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      textDecoration: 'none',
                      opacity: 0.85,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <WalletIcon type="lace" iconUrl={hook.laceIcon} size={22} />
                      <span>Midnight Lace</span>
                    </span>
                    <span className="badge badge-subtle" style={{ fontSize: '0.65rem' }}>
                      Install ↗
                    </span>
                  </a>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', marginTop: '0.25rem' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textAlign: 'center', marginBottom: 0 }}>
                    Need test tokens first?{' '}
                    <a
                      href={faucetUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--cyan-light)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Preprod Faucet ↗
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
        <button className="btn btn-secondary btn-sm" disabled style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="pulse-dot" />
          <span>Connecting…</span>
        </button>
      )}

      {/* ── Error State ──────────────────────────────────────────────────── */}
      {walletState.status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            id="btn-reconnect-wallet"
            className="btn btn-sm"
            title={walletState.message}
            onClick={() => {
              hook.clearError();
              setShowMenu(true);
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '0.78rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>⚠️</span>
            <span>Wallet Error — Retry</span>
          </button>
        </div>
      )}

      {/* ── Connected State ──────────────────────────────────────────────── */}
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
              gap: '0.45rem',
            }}
          >
            <MidnightTokenIcon size={14} />
            <span>{walletState.balance}</span>
          </div>

          {/* Connected Address & Wallet Trigger */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <WalletIcon type={walletState.walletType} iconUrl={walletState.iconUrl} size={16} />
            <span className="mono">{truncate(walletState.address)}</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▾</span>
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 320,
                background: '#0c0f1d',
                border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8), 0 0 24px rgba(139, 92, 246, 0.12)',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <WalletIcon type={walletState.walletType} iconUrl={walletState.iconUrl} size={18} />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                    {walletState.connectorName}
                  </span>
                </div>
                <span className={`badge ${walletState.network === 'preview' ? 'badge-cyan' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>
                  {walletState.network.toUpperCase()}
                </span>
              </div>

              {/* Inline Switch / Status Notification */}
              {switchNotification && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.73rem',
                    color: '#fca5a5',
                    marginBottom: '0.75rem',
                    lineHeight: 1.4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <div>{switchNotification}</div>
                  <button
                    onClick={clearSwitchNotification}
                    style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                  >
                    ✕
                  </button>
                </div>
              )}

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
                  ℹ️ Connected to <strong>{walletState.network.toUpperCase()}</strong>. Target network is {targetNetwork.toUpperCase()}.
                </div>
              )}

              {/* Address Box */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.04em', fontWeight: 600 }}>
                  CONNECTED ADDRESS
                </div>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem',
                    color: 'var(--text-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className="mono">{truncate(walletState.address)}</span>
                  <button
                    onClick={() => copy(walletState.address)}
                    style={{
                      background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.15)',
                      border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(139, 92, 246, 0.3)',
                      color: copied ? 'var(--emerald-light)' : 'var(--primary-light)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Switch Wallet Section */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.35rem', letterSpacing: '0.04em', fontWeight: 600 }}>
                  SWITCH EXTENSION
                </div>
                {walletState.walletType === '1am' ? (
                  isLaceAvailable ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={isSwitching}
                      onClick={() => handleSwitch('lace')}
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        padding: '0.55rem 0.75rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <WalletIcon type="lace" iconUrl={hook.laceIcon} size={18} />
                        <span>Switch to Midnight Lace</span>
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>
                        {isSwitching ? '...' : 'Detected ✓'}
                      </span>
                    </button>
                  ) : (
                    <a
                      href={WALLET_INSTALL_URLS.lace}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        padding: '0.55rem 0.75rem',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <WalletIcon type="lace" iconUrl={hook.laceIcon} size={18} />
                        <span>Get Midnight Lace</span>
                      </span>
                      <span className="badge badge-subtle" style={{ fontSize: '0.62rem' }}>
                        Install ↗
                      </span>
                    </a>
                  )
                ) : is1amAvailable ? (
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={isSwitching}
                    onClick={() => handleSwitch('1am')}
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      padding: '0.55rem 0.75rem',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <WalletIcon type="1am" iconUrl={hook.oneAmIcon} size={18} />
                      <span>Switch to 1AM Wallet</span>
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>
                      {isSwitching ? '...' : 'Detected ✓'}
                    </span>
                  </button>
                ) : (
                  <a
                    href={WALLET_INSTALL_URLS['1am']}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      padding: '0.55rem 0.75rem',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <WalletIcon type="1am" iconUrl={hook.oneAmIcon} size={18} />
                      <span>Get 1AM Wallet</span>
                    </span>
                    <span className="badge badge-subtle" style={{ fontSize: '0.62rem' }}>
                      Install ↗
                    </span>
                  </a>
                )}
              </div>

              {/* Redesigned Premium Preprod Faucet Action */}
              <div style={{ marginBottom: '0.85rem' }}>
                <a
                  href={faucetUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.75rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(103, 232, 249, 0.7)';
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(6, 182, 212, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <FaucetIcon size={20} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>Get Free tNIGHT</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--cyan-light)' }}>↗</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--cyan-light)' }}>
                        Preprod Faucet · 1,000 tNIGHT
                      </div>
                    </div>
                  </div>
                  <span
                    className="badge badge-cyan"
                    style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem' }}
                  >
                    Drip 🚰
                  </span>
                </a>
              </div>

              {/* Disconnect Action */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                style={{
                  width: '100%',
                  color: 'var(--rose)',
                  fontSize: '0.78rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.6rem',
                  justifyContent: 'center',
                }}
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
