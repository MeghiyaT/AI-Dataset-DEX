// ProfileDashboard.tsx
// Per-wallet account dashboard — 3 tabs: Profile, My Datasets, Transactions.
//
// All data is real: profile from useUserProfile, datasets from registryState,
// transactions from actual wallet ZK calls. Zero mock or pre-seeded data.

import React, { useState } from 'react';
import { COPY_FEEDBACK_MS } from '../config';
import type { RegistryState, DataListing } from '../hooks/useIndexer';
import type { UserProfileHook } from '../hooks/useUserProfile';
import type { NavSection } from '../App';
import { AvatarIcon, AVATAR_OPTIONS } from './AvatarIcon';
import { ConfirmModal } from './ConfirmModal';
import {
  User,
  Database,
  History,
  Copy,
  Check,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Lock,
  ShieldCheck,
  Award,
  Star,
  Compass,
  PlusCircle,
  X
} from 'lucide-react';

interface Props {
  walletAddress: string;
  profileHook: UserProfileHook;
  registryState: RegistryState;
  onSelectSection: (sec: NavSection) => void;
  onToggleArchive?: (datasetId: string) => void;
  onRemoveListing?: (datasetId: string) => void;
}

type Tab = 'profile' | 'datasets' | 'transactions';

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 20) return addr;
  return `${addr.slice(0, 14)}…${addr.slice(-8)}`;
}

function reputationBadge(myDatasets: DataListing[], transactions: unknown[]): { icon: React.ReactNode; label: string; color: string } {
  const registeredCount = myDatasets.length;
  const verifiedCount = transactions.length;
  if (registeredCount >= 3 || verifiedCount >= 5) {
    return { icon: <Star size={13} />, label: 'Active Contributor', color: '#f5d3a4' };
  }
  if (registeredCount >= 1) {
    return { icon: <ShieldCheck size={13} />, label: 'Verified Contributor', color: '#6ee7b7' };
  }
  if (verifiedCount >= 1) {
    return { icon: <Compass size={13} />, label: 'Data Explorer', color: '#7dd3fc' };
  }
  return { icon: <Award size={13} />, label: 'New Member', color: 'var(--text-muted)' };
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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profileHook.profile.nickname);
  const [copied, setCopied] = useState(false);
  const [datasetToRemove, setDatasetToRemove] = useState<DataListing | null>(null);

  const { profile, transactions, updateProfile } = profileHook;

  // "My Datasets" = all listings registered by or associated with the connected wallet address
  const myDatasets = registryState.listings.filter((l) => {
    if (!walletAddress) return false;
    const cleanAddr = walletAddress.trim().toLowerCase();
    const cleanProvider = (l.providerCommit || '').trim().toLowerCase();
    return cleanProvider === cleanAddr || cleanProvider === cleanAddr.replace(/^mn_addr(?:_[a-z0-9]+)?1/, '');
  });

  const badge = reputationBadge(myDatasets, transactions);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  const saveNickname = () => {
    updateProfile({ nickname: nicknameInput.trim() });
    setEditingNickname(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'My Profile', icon: <User size={15} /> },
    { id: 'datasets', label: 'My Datasets', icon: <Database size={15} /> },
    { id: 'transactions', label: 'Activity History', icon: <History size={15} /> },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(250, 240, 202, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FAF0CA',
              border: '1px solid rgba(250, 240, 202, 0.3)',
            }}
          >
            <AvatarIcon id={profile.avatarId} size={20} />
          </div>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>
            {profile.nickname || 'Your Account Dashboard'}
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', margin: 0 }}>
          Your private creator & researcher account
        </p>
      </div>

      {/* Tab Switcher */}
      <div
        className="tab-switcher"
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: 'rgba(10, 43, 74, 0.75)',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-switcher-item btn btn-sm${isActive ? ' active' : ''}`}
              style={{
                flex: 1,
                background: isActive ? '#FAF0CA' : 'transparent',
                color: isActive ? '#0D3B66' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: isActive ? 700 : 500,
                padding: '0.55rem 0.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Profile ──────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', minWidth: 120 }}>
              <div
                className="avatar-circle"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: '50%',
                  background: 'rgba(250, 240, 202, 0.1)',
                  border: '2px solid rgba(250, 240, 202, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FAF0CA',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: showAvatarPicker ? '0 0 24px rgba(250,240,202,0.4)' : 'none',
                }}
                title="Click to customize avatar"
              >
                <AvatarIcon id={profile.avatarId} size={38} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Change Icon</span>

              {/* Vector Icon Avatar Picker */}
              {showAvatarPicker && (
                <div
                  className="avatar-picker-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.4rem',
                    background: 'rgba(10, 43, 74, 0.98)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    boxShadow: 'var(--shadow-md)',
                    position: 'absolute',
                    zIndex: 50,
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {AVATAR_OPTIONS.map((item) => {
                    const isSelected = profile.avatarId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          updateProfile({ avatarId: item.id });
                          setShowAvatarPicker(false);
                        }}
                        title={item.label}
                        style={{
                          background: isSelected ? 'rgba(250, 240, 202, 0.25)' : 'rgba(250, 240, 202, 0.06)',
                          border: isSelected ? '1px solid #FAF0CA' : '1px solid transparent',
                          borderRadius: 8,
                          padding: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FAF0CA',
                        }}
                      >
                        <AvatarIcon id={item.id} size={20} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Reputation Badge */}
              <div
                className="reputation-badge"
                title="Activity score based on datasets published and verified."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(250, 240, 202, 0.08)',
                  border: '1px solid rgba(250, 240, 202, 0.2)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: badge.color,
                  whiteSpace: 'nowrap',
                }}
              >
                {badge.icon}
                <span>{badge.label}</span>
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
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingNickname(false)}>
                      <X size={14} />
                    </button>
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
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.92rem',
                      color: profile.nickname ? 'var(--text-main)' : 'var(--text-subtle)',
                    }}
                  >
                    <span style={{ flex: 1 }}>{profile.nickname || 'Add a display name…'}</span>
                    <Edit2 size={13} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>

              {/* Wallet Address */}
              <div>
                <div className="form-label">CONNECTED WALLET</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 0.75rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                  }}
                >
                  <span className="mono" style={{ flex: 1, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>
                    {truncateAddr(walletAddress)}
                  </span>
                  <button
                    onClick={copyAddress}
                    style={{
                      background: copied ? 'rgba(52, 211, 153, 0.2)' : 'rgba(250, 240, 202, 0.1)',
                      border: copied ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(250, 240, 202, 0.2)',
                      color: copied ? '#6ee7b7' : '#FAF0CA',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      flexShrink: 0,
                    }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="form-label">ABOUT / BIO</div>
                <textarea
                  className="textarea"
                  value={profile.bio}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  placeholder="Tell others about your datasets, team, or AI research…"
                  rows={3}
                  maxLength={200}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', textAlign: 'right', marginTop: '0.2rem' }}>
                  {profile.bio.length}/200
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Datasets Shared', value: myDatasets.length },
                  { label: 'Verifications Completed', value: transactions.length },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FAF0CA' }}>{s.value}</div>
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
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(250, 240, 202, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#FAF0CA',
                }}
              >
                <Database size={24} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No Datasets Shared Yet</h3>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                When you share a dataset with this wallet, its digital certificate will appear here.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => onSelectSection('register')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <PlusCircle size={15} />
                <span>Share a Dataset</span>
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
                    border: listing.isActive ? '1px solid var(--border-glass)' : '1px dashed rgba(250, 240, 202, 0.4)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FAF0CA' }}>{listing.datasetName}</span>
                      <span
                        className={`badge ${listing.isActive ? 'badge-green' : 'badge-plum'}`}
                        style={{ fontSize: '0.68rem' }}
                      >
                        {listing.isActive ? 'Active on Marketplace' : 'Archived'}
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
                        style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        {listing.isActive ? <Archive size={13} /> : <RotateCcw size={13} />}
                        <span>{listing.isActive ? 'Archive' : 'Restore'}</span>
                      </button>
                    )}
                    {onRemoveListing && (
                      <button
                        className="btn btn-sm"
                        onClick={() => setDatasetToRemove(listing)}
                        title="Remove dataset"
                        style={{
                          background: 'rgba(251, 113, 133, 0.12)',
                          border: '1px solid rgba(251, 113, 133, 0.35)',
                          color: '#fda4af',
                          fontSize: '0.76rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
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
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(250, 240, 202, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: '#FAF0CA',
                }}
              >
                <History size={24} />
              </div>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No Activity Recorded</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                When you share or verify a dataset, your verified actions will appear here.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="tx-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(10, 43, 74, 0.6)' }}>
                    {['Date', 'Dataset', 'Action', 'Status', 'Record ID'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '0.85rem 1rem',
                          textAlign: 'left',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
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
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FAF0CA' }}>
                        {tx.datasetName}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${tx.type === 'registered' ? 'badge-purple' : 'badge-cyan'}`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {tx.type === 'registered' ? 'Shared' : 'Verified'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${tx.status === 'completed' ? 'badge-green' : 'badge-plum'}`}
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

          {/* Escrow & Security Notice */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.1rem',
              background: 'rgba(13, 59, 102, 0.45)',
              border: '1px solid rgba(250, 240, 202, 0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
            }}
          >
            <Lock size={16} color="#FAF0CA" style={{ marginTop: 2, flexShrink: 0 }} />
            <span>
              <strong style={{ color: '#FAF0CA' }}>Privacy & Security Guarantee:</strong>{' '}
              All dataset fingerprints and authenticity verifications are permanent and mathematically verifiable without ever revealing confidential data files.
            </span>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(datasetToRemove)}
        title="Remove Dataset"
        itemName={datasetToRemove?.datasetName}
        confirmText="Remove Dataset"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (datasetToRemove && onRemoveListing) {
            onRemoveListing(datasetToRemove.datasetId);
          }
          setDatasetToRemove(null);
        }}
        onCancel={() => setDatasetToRemove(null)}
      />
    </div>
  );
}
