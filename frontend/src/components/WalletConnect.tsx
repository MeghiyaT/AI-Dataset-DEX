// WalletConnect.tsx
// Midnight Wallet Connection — supports Lace and 1AM extensions with authentic logos
// and non-destructive switching.

import { useState } from 'react';
import type { MidnightHook } from '../hooks/useMidnight';
import { WALLET_INSTALL_URLS } from '../hooks/useMidnight';
import { WalletIcon, MidnightTokenIcon } from './WalletIcons';
import { COPY_FEEDBACK_MS } from '../config';
import {
  ChevronDown,
  Check,
  Copy,
  Info,
  ExternalLink,
  LogOut,
  X
} from 'lucide-react';

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
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
          >
            <MidnightTokenIcon size={16} />
            <span>Connect Wallet</span>
            <ChevronDown size={14} style={{ opacity: 0.8 }} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 340,
                maxWidth: 'calc(100vw - 2rem)',
                background: 'rgba(10, 43, 74, 0.96)',
                border: '1px solid rgba(250, 240, 202, 0.28)',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem',
                boxShadow: '0 20px 48px rgba(4, 18, 32, 0.85), 0 0 24px rgba(13, 59, 102, 0.6)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Connect Wallet
                </div>
                <span className="badge badge-plum" style={{ fontSize: '0.65rem' }}>
                  {targetNetwork.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.45 }}>
                Choose a wallet to browse, share, or verify datasets securely.
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
                      background: 'rgba(250, 240, 202, 0.08)',
                      border: '1px solid rgba(250, 240, 202, 0.2)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <WalletIcon type="1am" iconUrl={hook.oneAmIcon} size={22} />
                      <span style={{ fontWeight: 600 }}>1AM Wallet</span>
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                      <Check size={11} /> Detected
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
                      Install <ExternalLink size={10} style={{ marginLeft: 2 }} />
                    </span>
                  </a>
                )}

                {/* Lace */}
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
                      background: 'rgba(250, 240, 202, 0.08)',
                      border: '1px solid rgba(250, 240, 202, 0.2)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <WalletIcon type="lace" iconUrl={hook.laceIcon} size={22} />
                      <span style={{ fontWeight: 600 }}>Lace</span>
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      <Check size={11} /> Detected
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
                      <span>Lace</span>
                    </span>
                    <span className="badge badge-subtle" style={{ fontSize: '0.65rem' }}>
                      Install <ExternalLink size={10} style={{ marginLeft: 2 }} />
                    </span>
                  </a>
                )}
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

      {/* ── Error / Unlock Required State ───────────────────────────────── */}
      {walletState.status === 'error' && (
        <div style={{ position: 'relative' }}>
          <button
            id="btn-reconnect-wallet"
            className="btn btn-sm"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'rgba(250, 240, 202, 0.12)',
              border: '1px solid rgba(250, 240, 202, 0.35)',
              color: '#FAF0CA',
              fontSize: '0.78rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Info size={13} color="#FAF0CA" />
            <span>{walletState.message.toLowerCase().includes('unlock') ? 'Unlock Wallet to Connect' : 'Connection Notice — Click for Help'}</span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 340,
                maxWidth: 'calc(100vw - 2rem)',
                background: 'rgba(10, 43, 74, 0.98)',
                border: '1px solid rgba(250, 240, 202, 0.28)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                boxShadow: '0 20px 48px rgba(4, 18, 32, 0.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                zIndex: 1000,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#FAF0CA', fontSize: '0.92rem' }}>
                  <Info size={16} />
                  <span>Wallet Unlock Required</span>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.45 }}>
                Your browser wallet extension is currently locked to protect your keys. Follow these 2 steps to connect:
              </p>

              <div style={{ background: 'rgba(6, 25, 44, 0.65)', border: '1px solid rgba(250, 240, 202, 0.15)', borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.65rem', alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(250, 240, 202, 0.15)', color: '#FAF0CA', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>1</span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                    Click the <strong>Lace</strong> or <strong>1AM</strong> icon in your browser toolbar.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(250, 240, 202, 0.15)', color: '#FAF0CA', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>2</span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                    Enter your password to unlock the wallet.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    hook.clearError();
                    setShowMenu(false);
                  }}
                >
                  Dismiss
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    hook.clearError();
                    connect(isLaceAvailable ? 'lace' : '1am');
                  }}
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Connected State ──────────────────────────────────────────────── */}
      {walletState.status === 'connected' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Balance Pill */}
          <div
            style={{
              padding: '0.35rem 0.75rem',
              background: 'rgba(250, 240, 202, 0.12)',
              border: '1px solid rgba(250, 240, 202, 0.28)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#FAF0CA',
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
              background: 'rgba(13, 59, 102, 0.55)',
              border: '1px solid rgba(250, 240, 202, 0.28)',
            }}
          >
            <WalletIcon type={walletState.walletType} iconUrl={walletState.iconUrl} size={16} />
            <span className="mono">{truncate(walletState.address)}</span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: 330,
                maxWidth: 'calc(100vw - 2rem)',
                background: 'rgba(10, 43, 74, 0.96)',
                border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                boxShadow: '0 20px 48px rgba(4, 18, 32, 0.85), 0 0 24px rgba(13, 59, 102, 0.6)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                zIndex: 1000,
              }}
            >
              {/* Header Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <WalletIcon type={walletState.walletType} iconUrl={walletState.iconUrl} size={18} />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FAF0CA' }}>
                    {walletState.connectorName}
                  </span>
                </div>
                <span className="badge badge-plum" style={{ fontSize: '0.65rem' }}>
                  {walletState.network.toUpperCase()}
                </span>
              </div>

              {/* Inline Switch / Status Notification */}
              {switchNotification && (
                <div
                  style={{
                    background: 'rgba(250, 240, 202, 0.12)',
                    border: '1px solid rgba(250, 240, 202, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.75rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#FAF0CA', fontWeight: 700, fontSize: '0.78rem' }}>
                      <Info size={13} color="#FAF0CA" />
                      <span>{switchNotification.toLowerCase().includes('unlock') ? 'Wallet Unlock Required' : 'Switch Notice'}</span>
                    </div>
                    <button
                      onClick={clearSwitchNotification}
                      style={{ background: 'none', border: 'none', color: '#FAF0CA', opacity: 0.7, cursor: 'pointer', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                    {switchNotification}
                  </div>
                </div>
              )}

              {/* Notice if wallet network differs from target network */}
              {walletState.network !== targetNetwork && (
                <div
                  style={{
                    background: 'rgba(255, 243, 230, 0.08)',
                    border: '1px solid rgba(255, 243, 230, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.72rem',
                    color: '#FFF3E6',
                    marginBottom: '0.75rem',
                    lineHeight: 1.4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Info size={14} style={{ flexShrink: 0 }} />
                  <span>
                    Connected to <strong>{walletState.network.toUpperCase()}</strong>. Target network is {targetNetwork.toUpperCase()}.
                  </span>
                </div>
              )}

              {/* Address Box */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.04em', fontWeight: 600 }}>
                  CONNECTED ADDRESS
                </div>
                <div
                  style={{
                    background: 'rgba(20, 7, 18, 0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
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
                      background: copied ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 243, 230, 0.1)',
                      border: copied ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 243, 230, 0.2)',
                      color: copied ? '#6ee7b7' : '#FFF3E6',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
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
                        <span>Switch to Lace</span>
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>
                        {isSwitching ? '...' : 'Detected'}
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
                        <span>Get Lace</span>
                      </span>
                      <span className="badge badge-subtle" style={{ fontSize: '0.62rem' }}>
                        Install <ExternalLink size={9} style={{ marginLeft: 2 }} />
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
                      {isSwitching ? '...' : 'Detected'}
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
                      Install <ExternalLink size={9} style={{ marginLeft: 2 }} />
                    </span>
                  </a>
                )}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <LogOut size={13} />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
