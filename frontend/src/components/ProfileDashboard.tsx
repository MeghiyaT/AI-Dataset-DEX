// ProfileDashboard.tsx
// Per-wallet account dashboard for Nocturne AI — Profile, Purchased Datasets, My Listings, and Activity.

import { useState } from 'react';
import { COPY_FEEDBACK_MS } from '../config';
import type { RegistryState, DataListing } from '../hooks/useIndexer';
import type { UserProfileHook, PurchaseRecord } from '../hooks/useUserProfile';
import type { NavSection } from '../App';
import { AvatarIcon } from './AvatarIcon';
import { ConfirmModal } from './ConfirmModal';
import {
  Database,
  History,
  Copy,
  Check,
  Edit2,
  Archive,
  Trash2,
  ShieldCheck,
  PlusCircle,
  ShoppingBag,
  Download
} from 'lucide-react';

interface Props {
  walletAddress: string;
  profileHook: UserProfileHook;
  registryState: RegistryState;
  onSelectSection: (sec: NavSection) => void;
  onToggleArchive?: (datasetId: string) => void;
  onRemoveListing?: (datasetId: string) => void;
  onVerifyAcquisition?: (listing: DataListing, payload?: string) => void;
}

type Tab = 'profile' | 'purchases' | 'listings' | 'transactions';

function truncateAddr(addr: string): string {
  if (!addr || addr.length < 20) return addr;
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

export function ProfileDashboard({
  walletAddress,
  profileHook,
  registryState,
  onSelectSection,
  onToggleArchive,
  onRemoveListing,
  onVerifyAcquisition,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('purchases');
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profileHook.profile.nickname);
  const [copied, setCopied] = useState(false);
  const [datasetToRemove, setDatasetToRemove] = useState<DataListing | null>(null);

  const { profile, transactions, purchases, sales, updateProfile } = profileHook;

  // My Listings: Datasets listed by connected wallet
  const myListings = registryState.listings.filter((l) => {
    if (!walletAddress) return false;
    const cleanAddr = walletAddress.trim().toLowerCase();
    const cleanProvider = (l.providerCommit || '').trim().toLowerCase();
    return cleanProvider === cleanAddr || cleanProvider === cleanAddr.replace(/^mn_addr(?:_[a-z0-9]+)?1/, '');
  });

  const totalRevenue = sales.reduce((acc, s) => acc + Number(s.price || 0), 0);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  };

  const saveNickname = () => {
    updateProfile({ nickname: nicknameInput.trim() });
    setEditingNickname(false);
  };

  const handleDownloadPurchase = (p: PurchaseRecord) => {
    const payload = p.downloadPayload || `Dataset: ${p.datasetName}\nID: ${p.datasetId}`;
    const filename = `${p.datasetName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${p.format || 'csv'}`;
    const blob = new Blob([payload], { type: p.format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '2rem 0 4rem 0' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        {/* Profile Card */}
        <div
          className="card"
          style={{
            padding: '1.75rem',
            marginBottom: '1.75rem',
            background: 'var(--bg-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                }}
              >
                <AvatarIcon avatarId={profile.avatarId} size={28} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {editingNickname ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', height: '32px' }}
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        placeholder="Enter nickname..."
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm" onClick={saveNickname}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                        {profile.nickname || 'AI Researcher'}
                      </h2>
                      <button
                        onClick={() => setEditingNickname(true)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.2rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span className="mono">{truncateAddr(walletAddress)}</span>
                  <button
                    onClick={copyAddress}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copied ? 'var(--accent-emerald)' : 'var(--text-subtle)',
                      cursor: 'pointer',
                    }}
                    title="Copy address"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div
                style={{
                  padding: '0.5rem 0.9rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block' }}>ACQUIRED</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{purchases.length}</strong>
              </div>

              <div
                style={{
                  padding: '0.5rem 0.9rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block' }}>LISTINGS</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{myListings.length}</strong>
              </div>

              <div
                style={{
                  padding: '0.5rem 0.9rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block' }}>REVENUE</span>
                <strong style={{ fontSize: '1rem', color: 'var(--accent-amber)' }}>{totalRevenue} tDUST</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeTab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('purchases')}
          >
            Purchases ({purchases.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'listings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('listings')}
          >
            My Listings ({myListings.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('transactions')}
          >
            Activity ({transactions.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('profile')}
          >
            Settings
          </button>
        </div>

        {/* Purchases */}
        {activeTab === 'purchases' && (
          <div>
            {purchases.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                <ShoppingBag size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35 }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>No datasets acquired</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Datasets you purchase on the marketplace will appear here for instant download.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onSelectSection('marketplace')}
                >
                  Explore Marketplace
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {purchases.map((p) => {
                  const matchedListing = registryState.listings.find((l) => l.datasetId === p.datasetId);
                  return (
                    <div
                      key={p.id}
                      className="card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        padding: '1.15rem 1.35rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                          <span className="badge badge-green">Purchased</span>
                          <span className="badge badge-amber">{p.price} {p.currency}</span>
                        </div>
                        <h4 style={{ fontSize: '1rem' }}>{p.datasetName}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                          {new Date(p.purchaseDate).toLocaleDateString()} · Tx:{' '}
                          <code className="mono">{p.receiptHash.slice(0, 8)}…{p.receiptHash.slice(-6)}</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleDownloadPurchase(p)}
                        >
                          <Download size={13} /> Download
                        </button>
                        {onVerifyAcquisition && matchedListing && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onVerifyAcquisition(matchedListing, p.downloadPayload)}
                          >
                            <ShieldCheck size={13} /> Verify
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Listings */}
        {activeTab === 'listings' && (
          <div>
            {myListings.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                <Database size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35 }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>No datasets listed</h3>
                <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  List and monetize your AI datasets with on-chain cryptographic anchors.
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onSelectSection('register')}
                >
                  <PlusCircle size={13} /> List a Dataset
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myListings.map((l) => (
                  <div
                    key={l.datasetId}
                    className="card"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      padding: '1.15rem 1.35rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-amber">
                          {l.price && l.price !== '0' ? `${l.price} tDUST` : 'Free'}
                        </span>
                        <span className={`badge ${l.isActive ? 'badge-green' : 'badge-subtle'}`}>
                          {l.isActive ? 'Active' : 'Archived'}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1rem' }}>{l.datasetName}</h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                        {l.rowCount || 'Custom'} · {l.license}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {onToggleArchive && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onToggleArchive(l.datasetId)}
                        >
                          <Archive size={13} /> {l.isActive ? 'Archive' : 'Activate'}
                        </button>
                      )}
                      {onRemoveListing && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--accent-rose)' }}
                          onClick={() => setDatasetToRemove(l)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity */}
        {activeTab === 'transactions' && (
          <div>
            {transactions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
                <History size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35 }} />
                <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>No activity yet</h3>
                <p style={{ fontSize: '0.85rem' }}>
                  Transactions, listings, and purchases will appear here.
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <strong>{tx.datasetName}</strong>
                        <span style={{ color: 'var(--text-subtle)', display: 'block', fontSize: '0.74rem' }}>
                          {tx.type.toUpperCase()} · {new Date(tx.date).toLocaleDateString()}
                        </span>
                      </div>
                      {tx.price && <span className="badge badge-amber">{tx.price}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'profile' && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Profile Settings</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Display Nickname</label>
              <input
                type="text"
                className="input"
                value={profile.nickname}
                onChange={(e) => updateProfile({ nickname: e.target.value })}
                placeholder="e.g. Satoshi_ML"
              />
            </div>
            <div>
              <label className="form-label">Bio / Research Description</label>
              <textarea
                className="textarea"
                rows={3}
                value={profile.bio}
                onChange={(e) => updateProfile({ bio: e.target.value })}
                placeholder="Describe your research or dataset focus..."
              />
            </div>
          </div>
        )}

        {datasetToRemove && (
          <ConfirmModal
            isOpen={true}
            title="Remove Listing"
            message={`Are you sure you want to remove "${datasetToRemove.datasetName}" from the marketplace?`}
            onConfirm={() => {
              if (onRemoveListing) onRemoveListing(datasetToRemove.datasetId);
              setDatasetToRemove(null);
            }}
            onCancel={() => setDatasetToRemove(null)}
          />
        )}
      </div>
    </div>
  );
}
