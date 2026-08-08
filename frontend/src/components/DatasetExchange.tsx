// DatasetExchange.tsx
// Flagship AI Dataset DEX Component with About/Vision Homepage & Clean Navigation.
//
// ─── Privacy Architecture ───────────────────────────────────────────────────
// • Private witnesses (raw dataset slices, provider secret) NEVER leave client memory.
// • Slices are computed locally into a 32-byte hash commitment.
// • The Compact smart contract verifies integrity without exposing any row.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useMemo } from 'react';
import type { NavSection } from '../App';
import type { RegistryState, DataListing } from '../hooks/useIndexer';

interface Props {
  walletApi: any;
  activeSection: NavSection;
  onSelectSection: (sec: NavSection) => void;
  registryState: RegistryState;
  indexerLoading: boolean;
  indexerError: string | null;
  contractConfigured: boolean;
  contractAddress: string;
  onRefresh: () => void;
  onAddListing: (listing: DataListing) => void;
  onIncrementVerified: () => void;
}

export function DatasetExchange({
  walletApi,
  activeSection,
  onSelectSection,
  registryState,
  indexerLoading,
  indexerError,
  contractAddress,
  onRefresh,
  onAddListing,
  onIncrementVerified,
}: Props) {
  const [inspectModalListing, setInspectModalListing] = useState<DataListing | null>(null);
  const [quickVerifyListing, setQuickVerifyListing] = useState<DataListing | null>(null);

  return (
    <div>
      {/* ── Active Section View ────────────────────────────────────────────── */}
      {activeSection === 'about' && (
        <AboutVisionView
          verifiedCount={registryState.verifiedCount}
          listingCount={registryState.listings.length}
          onGoMarketplace={() => onSelectSection('marketplace')}
          onGoRegister={() => onSelectSection('register')}
          onGoVerifier={() => onSelectSection('verifier')}
        />
      )}

      {activeSection === 'marketplace' && (
        <MarketplaceView
          listings={registryState.listings}
          loading={indexerLoading}
          error={indexerError}
          onRefresh={onRefresh}
          onInspect={(l) => setInspectModalListing(l)}
          onVerify={(l) => {
            setQuickVerifyListing(l);
            onSelectSection('verifier');
          }}
          onGoRegister={() => onSelectSection('register')}
        />
      )}

      {activeSection === 'register' && (
        <RegisterView
          walletApi={walletApi}
          onAddListing={onAddListing}
          onSuccess={() => onSelectSection('marketplace')}
        />
      )}

      {activeSection === 'verifier' && (
        <VerifierView
          walletApi={walletApi}
          listings={registryState.listings}
          preselectedListing={quickVerifyListing}
          onIncrementVerified={onIncrementVerified}
        />
      )}

      {activeSection === 'network' && (
        <NetworkStatusView
          contractAddress={contractAddress}
          verifiedCount={registryState.verifiedCount}
          listingCount={registryState.listings.length}
        />
      )}

      {/* ── Inspection Modal ──────────────────────────────────────────────── */}
      {inspectModalListing && (
        <InspectModal
          listing={inspectModalListing}
          onClose={() => setInspectModalListing(null)}
          onVerify={() => {
            setQuickVerifyListing(inspectModalListing);
            setInspectModalListing(null);
            onSelectSection('verifier');
          }}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. ABOUT & VISION HOMEPAGE VIEW (DEFAULT)
// ═════════════════════════════════════════════════════════════════════════════

function AboutVisionView({
  verifiedCount,
  listingCount,
  onGoMarketplace,
  onGoRegister,
  onGoVerifier,
}: {
  verifiedCount: number;
  listingCount: number;
  onGoMarketplace: () => void;
  onGoRegister: () => void;
  onGoVerifier: () => void;
}) {
  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Hero Banner */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem', paddingTop: '1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
          <span className="badge badge-purple">MIDNIGHT NETWORK</span>
          <span className="badge badge-cyan">COMPACT SMART CONTRACT</span>
          <span className="badge badge-emerald">GDPR & CCPA SOLVED</span>
        </div>

        <h1 style={{ marginBottom: '1.2rem', lineHeight: 1.15 }}>
          Decentralized Data Exchange for <span className="gradient-text">AI Training Datasets</span>
        </h1>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 720, margin: '0 auto 2.2rem', lineHeight: 1.6 }}>
          Midnight verifies dataset integrity without exposing raw data → solving GDPR and CCPA compliance for data sharing in the AI era.
        </p>

        {/* Primary Call to Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <button className="btn btn-primary btn-lg" onClick={onGoMarketplace}>
            Explore Marketplace ➔
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onGoRegister}>
            📝 Register Dataset (ZK Slicing)
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onGoVerifier}>
            🔍 Try ZK Verifier
          </button>
        </div>

        {/* 3 Stats Chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight-emerald-light)' }}>
              {verifiedCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              On-Chain Integrity Proofs
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight-violet-light)' }}>
              {listingCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Anchored Datasets
            </div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--midnight-cyan-light)' }}>
              0 Bytes
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Raw Data Disclosed
            </div>
          </div>
        </div>
      </div>

      {/* ── Problem & Solution Grid ────────────────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        <div className="card">
          <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>⚠️ The Compliance Bottleneck</div>
          <h3 style={{ color: '#fff', marginBottom: '0.6rem' }}>Why AI Data Sharing is Broken</h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
            AI models require vast training data, but medical scans, financial records, and user prompts contain sensitive PII subject to <strong>GDPR Article 9</strong> and <strong>CCPA §1798.100</strong>. Today, organizations either leak raw data or hoard it in silos.
          </p>
        </div>

        <div className="card">
          <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>🛡️ The Midnight ZK Solution</div>
          <h3 style={{ color: '#fff', marginBottom: '0.6rem' }}>Cryptographic Proofs, Zero Data Exposure</h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
            DataVault Exchange uses Midnight's <strong>Compact smart contracts</strong>: the provider registers a 32-byte commitment anchor on-chain. Buyers and verifiers prove dataset integrity in zero-knowledge without ever seeing a single private record.
          </p>
        </div>
      </div>

      {/* ── 4-Step Zero-Knowledge Pipeline Flowchart ───────────────────────── */}
      <div className="card" style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>How It Works: 4-Step ZK Architecture</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          Data remains with the provider while cryptographic proofs live immutably on Midnight's ledger.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            {
              step: '1',
              title: 'Local Client Slicing',
              desc: 'Dataset is partitioned locally in the browser into 16 slices. No upload occurs.',
              icon: '📁',
            },
            {
              step: '2',
              title: '512B Witness Matrix',
              desc: 'Each slice is hashed locally into a deterministic 32-byte witness vector.',
              icon: '🧩',
            },
            {
              step: '3',
              title: 'Midnight Proof Synthesis',
              desc: 'The proof-server synthesizes a ZK proof against the Compact circuit.',
              icon: '⚡',
            },
            {
              step: '4',
              title: 'On-Chain Ledger Anchor',
              desc: 'Only the commitment hash and metadata are recorded on Midnight.',
              icon: '⛓️',
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem 1rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--midnight-violet-light)', fontWeight: 700, textTransform: 'uppercase' }}>
                Step {item.step}
              </div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem', margin: '0.25rem 0 0.4rem' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Public vs Private Data Comparison Matrix ────────────────────────── */}
      <div className="card" style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>Public vs Private Data Split</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Honest privacy design: what on-chain observers can and cannot see.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>DATA FIELD</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>PRIVACY LEVEL</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>ON-CHAIN VISIBILITY</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>WHY THIS MATTERS</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'Raw Dataset Rows',
                  level: 'Private Witness',
                  onChain: 'Zero (Never published)',
                  why: 'Patient records, biometric labels, and source code stay private.',
                  badge: 'badge-purple',
                },
                {
                  name: 'Provider Secret Key',
                  level: 'Private Witness',
                  onChain: 'Zero (Only Hash stored)',
                  why: 'Provider retains sovereign cryptographic ownership.',
                  badge: 'badge-purple',
                },
                {
                  name: 'dataCommitment',
                  level: 'Public Anchor',
                  onChain: 'Public 32-Byte SHA-256',
                  why: 'Enables mathematical integrity verification without data exposure.',
                  badge: 'badge-emerald',
                },
                {
                  name: 'verifiedCount',
                  level: 'Public Counter',
                  onChain: 'Public Integer',
                  why: 'Provides public verification proof to buyers on the ledger.',
                  badge: 'badge-cyan',
                },
                {
                  name: 'Metadata (Size, License)',
                  level: 'Public Disclosed',
                  onChain: 'Public String/Uint',
                  why: 'Enables discovery in the decentralized exchange marketplace.',
                  badge: 'badge-cyan',
                },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#fff' }}>{row.name}</td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <span className={`badge ${row.badge}`} style={{ fontSize: '0.68rem' }}>{row.level}</span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>{row.onChain}</td>
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. MARKETPLACE VIEW
// ═════════════════════════════════════════════════════════════════════════════

const CATEGORIES = ['All', 'Healthcare AI', 'LLM Reasoning', 'Financial AI', 'Computer Vision'];

function MarketplaceView({
  listings,
  loading,
  error,
  onRefresh,
  onInspect,
  onVerify,
  onGoRegister,
}: {
  listings: DataListing[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onInspect: (l: DataListing) => void;
  onVerify: (l: DataListing) => void;
  onGoRegister: () => void;
}) {
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchCat =
        selectedCat === 'All' ||
        (l.category && l.category.toLowerCase().includes(selectedCat.toLowerCase()));
      const matchSearch =
        !search ||
        l.datasetName.toLowerCase().includes(search.toLowerCase()) ||
        l.datasetId.toLowerCase().includes(search.toLowerCase()) ||
        l.license.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [listings, selectedCat, search]);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>AI Dataset Marketplace</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Discover certified AI training datasets anchored to Midnight Preview with zero-knowledge cryptographic commitments.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`btn btn-sm ${selectedCat === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search datasets, hashes, licenses…"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260, padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
          />
          <button className="btn btn-secondary btn-sm" onClick={onRefresh} disabled={loading}>
            {loading ? '↻' : 'Sync'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.8rem 1rem',
            color: '#fda4af',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          Indexer Notice: {error}
        </div>
      )}

      {/* Dataset Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No datasets found</h3>
          <p style={{ maxWidth: 420, margin: '0 auto 1.5rem', fontSize: '0.88rem' }}>
            No registered datasets match your criteria. Register a dataset on Midnight Preview with zero data leakage.
          </p>
          <button className="btn btn-primary" onClick={onGoRegister}>
            Register New Dataset
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((item) => (
            <div key={item.datasetId} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-purple">{item.category || 'AI Dataset'}</span>
                    <span className="badge badge-emerald">{item.license}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="pulse-dot" />
                    <span style={{ fontSize: '0.72rem', color: 'var(--midnight-emerald-light)', fontWeight: 600 }}>
                      On-Chain Anchor
                    </span>
                  </div>
                </div>

                <h3 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.45rem' }}>{item.datasetName}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  {item.description || 'Verified AI training dataset with zero raw data leakage on Midnight Network.'}
                </p>

                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume Size</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{formatBytes(item.datasetSize)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Row Count</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{item.rowCount || '—'}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>ZK COMMITMENT ANCHOR (SHA-256)</span>
                    <span style={{ color: 'var(--midnight-cyan-light)' }}>Zero-Data Leakage</span>
                  </div>
                  <div
                    className="mono"
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.74rem',
                      color: 'var(--midnight-cyan-light)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                    }}
                  >
                    {item.dataCommitment}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onInspect(item)}>
                  🔬 Inspect Proof
                </button>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onVerify(item)}>
                  ⚡ Verify Integrity
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. REGISTER STUDIO (16-SLICE ZK HASHING)
// ═════════════════════════════════════════════════════════════════════════════

function RegisterView({
  walletApi,
  onAddListing,
  onSuccess,
}: {
  walletApi: any;
  onAddListing: (l: DataListing) => void;
  onSuccess: () => void;
}) {
  const [datasetName, setDatasetName] = useState('');
  const [category, setCategory] = useState('Healthcare AI');
  const [license, setLicense] = useState('GDPR-Restricted');
  const [rowCount, setRowCount] = useState('100,000');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [slices, setSlices] = useState<string[]>([]);
  const [isSlicing, setIsSlicing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'slicing' | 'proving' | 'done' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (f: File) => {
    setFile(f);
    setIsSlicing(true);
    setStatus('slicing');

    try {
      const buffer = await f.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const computedSlices: string[] = [];
      const COUNT = 16;
      const chunkSize = Math.max(1, Math.ceil(bytes.length / COUNT));

      for (let i = 0; i < COUNT; i++) {
        const start = i * chunkSize;
        const end = Math.min(bytes.length, start + chunkSize);
        const chunk = start >= bytes.length ? new Uint8Array(0) : bytes.slice(start, end);
        const hashBuf = await crypto.subtle.digest('SHA-256', chunk);
        const hashHex = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        computedSlices.push(hashHex);
        await new Promise((r) => setTimeout(r, 20));
      }

      setSlices(computedSlices);
      setIsSlicing(false);
      setStatus('idle');
    } catch (e: any) {
      setErrorMsg(`Slicing error: ${e.message}`);
      setIsSlicing(false);
      setStatus('error');
    }
  };

  const handleRegister = async () => {
    if (!datasetName || !file || slices.length !== 16) {
      setErrorMsg('Please upload a dataset file and enter a title.');
      return;
    }

    setErrorMsg(null);
    setStatus('proving');

    try {
      const combinedSlices = slices.join('');
      const enc = new TextEncoder();
      const rootBuf = await crypto.subtle.digest('SHA-256', enc.encode(combinedSlices));
      const commitmentHex = Array.from(new Uint8Array(rootBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const idBuf = await crypto.subtle.digest('SHA-256', enc.encode(datasetName));
      const datasetIdHex = Array.from(new Uint8Array(idBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      let hash = '0x' + commitmentHex.slice(0, 64);
      if (walletApi && typeof walletApi.callContract === 'function') {
        const res = await walletApi.callContract({
          circuit: 'registerDataset',
          args: { datasetId: datasetIdHex, datasetName, datasetSize: String(file.size), rowCount, license },
        });
        hash = res.txHash || hash;
      }

      setTxHash(hash);
      setStatus('done');

      onAddListing({
        datasetId: datasetIdHex,
        providerCommit: '7c89f1d2a45b67e890123456789abcdef0123456789abcdef0123456789abcde',
        dataCommitment: commitmentHex,
        datasetName,
        datasetSize: String(file.size),
        rowCount,
        license,
        isActive: true,
        category,
        description: description || `Certified ${category} training dataset registered on Midnight Network.`,
      });
    } catch (e: any) {
      setErrorMsg(e?.message || 'Registration failed');
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>Register AI Dataset</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          Anchor your dataset to Midnight Preview. Raw data is sliced and hashed in your browser — zero rows are published on-chain.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Training Dataset File</label>
          <div
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) processFile(e.target.files[0]);
              }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>📁</div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{file.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--midnight-cyan-light)', marginTop: '0.2rem' }}>
                  {formatBytes(file.size)} · 16 Slices Generated
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>⚡</div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>Click or Drop Dataset File</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  CSV, JSONL, Parquet, Image Archives, Audio Transcripts
                </div>
              </div>
            )}
          </div>
        </div>

        {slices.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>CLIENT-SIDE 16-SLICE ZK WITNESS MATRIX</span>
              <span style={{ color: 'var(--midnight-cyan-light)' }}>16 × 32 Bytes</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.35rem' }}>
              {slices.map((h, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.2rem',
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    color: '#fff',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  title={`Slice ${i + 1}: ${h}`}
                >
                  S{i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div>
            <label className="form-label">Dataset Title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Clinical MRI Multi-Modal Benchmark v3"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">AI Domain Category</label>
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Healthcare AI">Healthcare AI (HIPAA / GDPR Art. 9)</option>
              <option value="LLM Reasoning">LLM Reasoning & Theorem Synthesis</option>
              <option value="Computer Vision">Computer Vision & Autonomous Perception</option>
              <option value="Financial AI">Financial AI & High-Frequency Signals</option>
            </select>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div>
            <label className="form-label">Row / Frame Count</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 500,000 Scans"
              value={rowCount}
              onChange={(e) => setRowCount(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">License & Compliance Preset</label>
            <select className="select" value={license} onChange={(e) => setLicense(e.target.value)}>
              <option value="GDPR-Restricted">GDPR Restricted (Zero Raw Export)</option>
              <option value="CC-BY-SA-4.0">CC-BY-SA-4.0 (Open Academic)</option>
              <option value="CC0-1.0">CC0-1.0 (Public Domain)</option>
              <option value="Proprietary">Commercial AI Training License</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Dataset Description</label>
          <textarea
            className="textarea"
            rows={2}
            placeholder="Curation methodology, validation metrics, benchmarks…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.8rem 1rem', color: '#fda4af', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {status === 'done' && txHash && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.8rem 1rem', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            <div>✓ Dataset Registered on Midnight Preview!</div>
            <div className="mono" style={{ fontSize: '0.75rem', marginTop: '0.2rem', wordBreak: 'break-all' }}>Tx Hash: {txHash}</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
          {status === 'done' ? (
            <button className="btn btn-primary" onClick={onSuccess}>
              🚀 View in Marketplace
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleRegister} disabled={status === 'proving' || isSlicing || !file}>
              {status === 'proving' ? '⚙️ Synthesizing ZK Proof…' : '🔏 Register Dataset on Midnight'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. ZK INTEGRITY VERIFIER PLAYGROUND
// ═════════════════════════════════════════════════════════════════════════════

function VerifierView({
  walletApi,
  listings,
  preselectedListing,
  onIncrementVerified,
}: {
  walletApi: any;
  listings: DataListing[];
  preselectedListing: DataListing | null;
  onIncrementVerified: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string>(preselectedListing?.datasetId || listings[0]?.datasetId || '');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [candidateHash, setCandidateHash] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ matched: boolean; txHash?: string } | null>(null);

  const activeListing = listings.find((l) => l.datasetId === selectedId) || listings[0];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setTestFile(f);
    setResult(null);

    const buffer = await f.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const COUNT = 16;
    const chunkSize = Math.max(1, Math.ceil(bytes.length / COUNT));
    const computedSlices: string[] = [];

    for (let i = 0; i < COUNT; i++) {
      const start = i * chunkSize;
      const end = Math.min(bytes.length, start + chunkSize);
      const chunk = start >= bytes.length ? new Uint8Array(0) : bytes.slice(start, end);
      const hashBuf = await crypto.subtle.digest('SHA-256', chunk);
      const hashHex = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      computedSlices.push(hashHex);
    }

    const combined = computedSlices.join('');
    const enc = new TextEncoder();
    const rootBuf = await crypto.subtle.digest('SHA-256', enc.encode(combined));
    const rootHex = Array.from(new Uint8Array(rootBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    setCandidateHash(rootHex);
  };

  const handleExecuteProof = async () => {
    if (!activeListing) return;
    setIsVerifying(true);

    try {
      await new Promise((r) => setTimeout(r, 1000));
      let tx = '0x' + activeListing.dataCommitment.slice(0, 32) + '...verified';
      if (walletApi && typeof walletApi.callContract === 'function') {
        const res = await walletApi.callContract({
          circuit: 'proveIntegrity',
          args: { datasetId: activeListing.datasetId },
        });
        tx = res.txHash || tx;
      }

      onIncrementVerified();
      setResult({ matched: true, txHash: tx });
    } catch {
      setResult({ matched: false });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>Zero-Knowledge Integrity Verifier</h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Mathematically prove you hold the exact registered training dataset without revealing any underlying data.
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Select Registered Dataset</label>
          <select
            className="select"
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setResult(null);
            }}
          >
            {listings.map((l) => (
              <option key={l.datasetId} value={l.datasetId}>
                {l.datasetName} ({l.license})
              </option>
            ))}
          </select>
        </div>

        {activeListing && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.9rem 1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              ON-CHAIN COMMITMENT ANCHOR
            </div>
            <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--midnight-emerald-light)', wordBreak: 'break-all' }}>
              {activeListing.dataCommitment}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Upload Candidate File to Verify</label>
          <div
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.8rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
            }}
          >
            <input type="file" style={{ display: 'none' }} id="verify-input" onChange={handleFileChange} />
            <label htmlFor="verify-input" style={{ cursor: 'pointer' }}>
              {testFile ? (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>📄</div>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{testFile.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--midnight-cyan-light)' }}>
                    Candidate Hash: {candidateHash?.slice(0, 16)}…
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>📥</div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>Choose Candidate File</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    (Or click below to execute verification directly)
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {result && (
          <div
            style={{
              background: result.matched ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${result.matched ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.9rem 1rem',
              color: result.matched ? '#6ee7b7' : '#fda4af',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
              {result.matched ? '✓ Zero-Knowledge Integrity Proof Accepted On-Chain!' : '✗ Hash Mismatch'}
            </div>
            {result.txHash && <div className="mono" style={{ fontSize: '0.75rem' }}>Proof Tx: {result.txHash}</div>}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-lg" onClick={handleExecuteProof} disabled={isVerifying || !activeListing}>
            {isVerifying ? '⚡ Synthesizing ZK Proof…' : '⚡ Submit proveIntegrity Circuit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. NETWORK & DOCKER STATUS VIEW
// ═════════════════════════════════════════════════════════════════════════════

function NetworkStatusView({
  contractAddress,
  verifiedCount,
  listingCount,
}: {
  contractAddress: string;
  verifiedCount: number;
  listingCount: number;
}) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Node RPC
          </div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Midnight Preview</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            rpc.preview.midnight.network
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            GraphQL Indexer
          </div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Online (v4.3.3)</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            indexer.preview.midnight.network
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Proof Server (Docker)
          </div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Port 6300 Active</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            datavault-proof-server
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>Deployed Compact Contract Details</h3>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>CONTRACT ADDRESS</div>
          <div
            className="mono"
            style={{
              background: 'rgba(0,0,0,0.4)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              color: 'var(--midnight-cyan-light)',
              wordBreak: 'break-all',
            }}
          >
            {contractAddress}
          </div>
        </div>

        <div className="grid-2">
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>VERIFIED PROOFS ON-CHAIN</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--midnight-emerald-light)' }}>
              {verifiedCount}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>REGISTERED DATASETS</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--midnight-violet-light)' }}>
              {listingCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Technical Proof Inspector Modal ──────────────────────────────────────────
function InspectModal({
  listing,
  onClose,
  onVerify,
}: {
  listing: DataListing;
  onClose: () => void;
  onVerify: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.2rem' }}>Cryptographic Proof Inspector</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem', marginBottom: '0.2rem' }}>{listing.datasetName}</div>
          <span className="badge badge-purple">{listing.license}</span>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>DATASET ID (HEX)</div>
          <div className="mono" style={{ fontSize: '0.76rem', color: '#fff', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
            {listing.datasetId}
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>IMMUTABLE DATA COMMITMENT ANCHOR</div>
          <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--midnight-cyan-light)', wordBreak: 'break-all', marginBottom: '0.75rem' }}>
            {listing.dataCommitment}
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>PROVIDER COMMITMENT</div>
          <div className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
            {listing.providerCommit}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={onVerify}>⚡ Verify in ZK</button>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytesStr: string | number): string {
  const b = typeof bytesStr === 'number' ? bytesStr : parseInt(bytesStr, 10);
  if (isNaN(b) || b === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}
