// ProfileDashboard.tsx
// Per-wallet account dashboard — 3 tabs: Profile, My Datasets, Transactions.
//
// All data is real: profile from useUserProfile, datasets from registryState,
// transactions from actual wallet ZK calls. Zero mock or pre-seeded data.

import { useState } from 'react';
import type { RegistryState, DataListing } from '../hooks/useIndexer';
import type { UserProfileHook } from '../hooks/useUserProfile';
import type { NavSection } from '../App';

interface Props {
  walletAddress: string;
  profileHook: UserProfileHook;
  registryState: RegistryState;
  onSelectSection: (sec: NavSection) => void;
  onToggleArchive?: (datasetId: string) => void;
  onRemoveListing?: (datasetId: string) => void;
}

type Tab = 'profile' | 'datasets' | 'transactions';

const EMOJI_OPTIONS = [
  '🛡️', '🌙', '🔬', '🧬', '🤖', '📊', '🔐', '💎',
  '🦉', '🚀', '🌿', '⚡', '🦊', '🐉', '🌊', '🎯',
  '🧠', '🔮', '🌟', '💡', '🏆', '🎲', '🦋', '🌸',
];

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 20) return addr;
  return `${addr.slice(0, 14)}…${addr.slice(-8)}`;
}

function reputationBadge(myDatasets: DataListing[], transactions: unknown[]): { icon: string; label: string; color: string } {
  const registeredCount = myDatasets.length;
  const verifiedCount = transactions.length;
  if (registeredCount >= 3 || verifiedCount >= 5) {
    return { icon: '⭐', label: 'Active Provider', color: 'var(--primary-light)' };
  }
  if (registeredCount >= 1) {
    return { icon: '🛡️', label: 'Verified Provider', color: 'var(--emerald-light)' };
  }
  if (verifiedCount >= 1) {
    return { icon: '🔍', label: 'Explorer', color: 'var(--cyan-light)' };
  }
  return { icon: '🌱', label: 'New Member', color: 'var(--text-muted)' };
}

export function ProfileDashboard({
  walletAddress,
  profileHook,
  registryState,
  onSelectSection,
  onToggleArchive,
  onRemoveListing,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profileHook.profile.nickname);
  const [copied, setCopied] = useState(false);

  const { profile, transactions, updateProfile } = profileHook;

  // "My Datasets" = all listings where providerCommit can be correlated with
  // the wallet address. Since providerCommit is a hash of the provider secret
  // (not the raw address), we do a best-effort match by address substring.
  // In a future version this will use a signed nonce from the wallet.
  const myDatasets = registryState.listings.filter((l) => {
    const addrShort = walletAddress.replace('mn_addr_preview1', '').slice(0, 20);
    return l.providerCommit.includes(addrShort) || l.datasetId.slice(0, 8) === walletAddress.slice(-8);
  });

  const badge = reputationBadge(myDatasets, transactions);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveNickname = () => {
    updateProfile({ nickname: nicknameInput.trim() });
    setEditingNickname(false);
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'profile', label: 'My Profile', emoji: '👤' },
    { id: 'datasets', label: 'My Datasets', emoji: '📊' },
    { id: 'transactions', label: 'Transactions', emoji: '📋' },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.35rem' }}>
          {profile.avatarEmoji} {profile.nickname || 'Your Profile'}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
          Wallet-linked account · all data stored locally in your browser
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="tab-switcher" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-surface)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-switcher-item btn btn-sm${activeTab === tab.id ? ' active' : ''}`}
            style={{
              flex: 1,
              background: activeTab === tab.id ? 'var(--gradient-main)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontWeight: activeTab === tab.id ? 700 : 400,
              padding: '0.55rem 0.5rem',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Profile ──────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', minWidth: 120 }}>
              <div
                className="avatar-circle"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '2px solid var(--border-active)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: showEmojiPicker ? '0 0 20px rgba(139,92,246,0.4)' : 'none',
                }}
                title="Click to change avatar"
              >
                {profile.avatarEmoji}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>click to change</span>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div
                  className="avatar-picker-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '0.3rem',
                    background: '#0e111d',
                    border: '1px solid var(--border-hover)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem',
                    boxShadow: 'var(--shadow-md)',
                    position: 'absolute',
                    zIndex: 50,
                  }}
                >
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        updateProfile({ avatarEmoji: emoji });
                        setShowEmojiPicker(false);
                      }}
                      style={{
                        background: profile.avatarEmoji === emoji ? 'rgba(139,92,246,0.2)' : 'transparent',
                        border: profile.avatarEmoji === emoji ? '1px solid var(--border-active)' : '1px solid transparent',
                        borderRadius: 6,
                        fontSize: '1.3rem',
                        padding: '0.25rem',
                        cursor: 'pointer',
                        lineHeight: 1,
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Reputation Badge */}
              <div
                className="reputation-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.7rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: badge.color,
                  whiteSpace: 'nowrap',
                }}
              >
                {badge.icon} {badge.label}
              </div>
            </div>

            {/* Info Column */}
            <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Nickname */}
              <div>
                <div className="form-label">DISPLAY NAME</div>
                {editingNickname ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      className="input"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') setEditingNickname(false); }}
                      placeholder="Your display name"
                      autoFocus
                      maxLength={32}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={saveNickname}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingNickname(false)}>✕</button>
                  </div>
                ) : (
                  <div
                    className="inline-edit"
                    onClick={() => { setNicknameInput(profile.nickname); setEditingNickname(true); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.55rem 0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.92rem',
                      color: profile.nickname ? '#fff' : 'var(--text-subtle)',
                    }}
                  >
                    <span style={{ flex: 1 }}>{profile.nickname || 'Add a display name…'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✎</span>
                  </div>
                )}
              </div>

              {/* Wallet Address */}
              <div>
                <div className="form-label">WALLET ADDRESS</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                  }}
                >
                  <span className="mono" style={{ flex: 1, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>
                    {truncateAddr(walletAddress)}
                  </span>
                  <button
                    onClick={copyAddress}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="form-label">BIO / TAGLINE</div>
                <textarea
                  className="textarea"
                  value={profile.bio}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="Tell the marketplace about yourself or your datasets…"
                  rows={3}
                  maxLength={200}
                  style={{ resize: 'vertical' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textAlign: 'right', marginTop: '0.2rem' }}>
                  {profile.bio.length}/200
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Datasets listed', value: myDatasets.length },
                  { label: 'Transactions', value: transactions.length },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: My Datasets ──────────────────────────────────────────────── */}
      {activeTab === 'datasets' && (
        <div>
          {myDatasets.length === 0 ? (
            <div
              className="card"
              style={{ textAlign: 'center', padding: '3rem 2rem' }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No datasets registered yet</h3>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                When you register a dataset from this wallet, it will appear here.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => onSelectSection('register')}
              >
                📝 Register a Dataset
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myDatasets.map((listing) => (
                <div
                  key={listing.datasetId}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    opacity: listing.isActive ? 1 : 0.7,
                    border: listing.isActive ? '1px solid var(--border-subtle)' : '1px dashed rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{listing.datasetName}</span>
                      <span
                        className={`badge ${listing.isActive ? 'badge-green' : 'badge-purple'}`}
                        style={{ fontSize: '0.68rem' }}
                      >
                        {listing.isActive ? '● Active' : '📦 Archived'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span>{listing.license}</span>
                      <span>·</span>
                      <span>{Number(listing.rowCount).toLocaleString()} rows</span>
                      <span>·</span>
                      <span>{(Number(listing.datasetSize) / 1_000_000).toFixed(1)} MB</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {onToggleArchive && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onToggleArchive(listing.datasetId)}
                        title={listing.isActive ? 'Archive dataset from marketplace' : 'Restore dataset to marketplace'}
                        style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
                      >
                        {listing.isActive ? '📦 Archive' : '🔄 Restore'}
                      </button>
                    )}
                    {onRemoveListing && (
                      <button
                        className="btn btn-sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently remove "${listing.datasetName}" from the marketplace?`)) {
                            onRemoveListing(listing.datasetId);
                          }
                        }}
                        title="Permanently remove dataset"
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#f87171',
                          fontSize: '0.76rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Transactions ─────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div>
          {transactions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
              <h3 style={{ marginBottom: '0.5rem' }}>No transactions yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                When you register or verify a dataset, the transaction will appear here.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="tx-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {['Date', 'Dataset', 'Action', 'Status', 'Tx ID'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.85rem 1rem',
                          textAlign: 'left',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: i < transactions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        background: 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                        {tx.datasetName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${tx.type === 'registered' ? 'badge-purple' : 'badge-cyan'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {tx.type === 'registered' ? '📝 Registered' : '🔍 Verified'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${tx.status === 'completed' ? 'badge-green' : 'badge-purple'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {tx.status === 'completed' ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {tx.txId ? (
                          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {tx.txId.slice(0, 12)}…
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Future escrow notice */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1rem',
              background: 'rgba(6, 182, 212, 0.06)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
            }}
          >
            <span>🔒</span>
            <span>
              <strong style={{ color: 'var(--cyan-light)' }}>Coming in v2:</strong>{' '}
              Payments and data delivery will be handled by Midnight escrow — meaning money is only released when data is provably delivered. No trust required.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
