// useIndexer.ts
// Live GraphQL indexer queries for Midnight Preview on-chain ledger state.
//
// ─── Privacy Architecture ───────────────────────────────────────────────────
// • Reads exclusively PUBLIC ledger state: verifiedCount, registry listings,
//   commitment hashes (providerCommit, dataCommitment), and metadata.
// • Raw data vectors & provider secrets are NEVER stored or transmitted.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

const INDEXER_URL =
  (import.meta.env.VITE_INDEXER_URL as string) ||
  'https://indexer.preview.midnight.network/api/v4/graphql';

const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS as string) || '';

export interface DataListing {
  datasetId: string;         // 32-byte hex ID
  providerCommit: string;    // hash of provider secret key
  dataCommitment: string;    // 32-byte SHA256 integrity anchor
  datasetName: string;       // public descriptive title
  datasetSize: string;       // byte size string
  rowCount: string;          // row count representation
  license: string;           // license identifier
  isActive: boolean;         // listing availability
  category?: string;         // taxonomy tag
  description?: string;      // metadata description
  complianceTag?: string;    // GDPR / HIPAA compliance standard
  isLocalDemo?: boolean;     // flag for seed items
}

export interface RegistryState {
  verifiedCount: number;
  listings: DataListing[];
  lastSyncedAt: Date;
}

// Initial Curated Datasets on Midnight Preview for immediate testing & exploration
const SEED_DATASETS: DataListing[] = [
  {
    datasetId: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    providerCommit: '7c89f1d2a45b67e890123456789abcdef0123456789abcdef0123456789abcde',
    dataCommitment: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    datasetName: 'Multi-Organ Oncology CT Scans (HIPAA Clean)',
    datasetSize: '10737418240', // 10 GB
    rowCount: '150,000 Scans',
    license: 'GDPR-Restricted',
    isActive: true,
    category: 'Healthcare AI',
    description: 'De-identified high-resolution 3D axial CT volumes with expert multi-organ radiologist segmentations.',
    complianceTag: 'HIPAA & GDPR Art. 9',
    isLocalDemo: true,
  },
  {
    datasetId: 'f4c1d2e3b4a59687786950413223140596877869504132231405968778695041',
    providerCommit: '8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e',
    dataCommitment: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    datasetName: 'UltraChain Code Reasoning & Theorem Proving v2',
    datasetSize: '4294967296', // 4 GB
    rowCount: '2,400,000 Chains',
    license: 'CC-BY-SA-4.0',
    isActive: true,
    category: 'LLM Reasoning',
    description: 'Step-by-step verified Lean4, Coq and Rust synthesis traces for LLM mathematical reasoning benchmark training.',
    complianceTag: 'Open Academic CC-BY-SA',
    isLocalDemo: true,
  },
  {
    datasetId: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    providerCommit: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    dataCommitment: '8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e',
    datasetName: 'Global Microstructure Order Book Depth (L3 Alpha)',
    datasetSize: '17179869184', // 16 GB
    rowCount: '88,000,000 Ticks',
    license: 'Proprietary',
    isActive: true,
    category: 'Financial AI',
    description: 'Nanosecond-stamped L3 order book dynamics across major derivatives venues for reinforcement learning market making.',
    complianceTag: 'MiFID II Cleaned',
    isLocalDemo: true,
  },
  {
    datasetId: 'd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8',
    providerCommit: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    dataCommitment: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    datasetName: 'Urban Autonomous LiDAR Point Clouds & Bounding Boxes',
    datasetSize: '21474836480', // 20 GB
    rowCount: '450,000 Frames',
    license: 'CC-BY-4.0',
    isActive: true,
    category: 'Computer Vision',
    description: 'Calibrated 128-beam 3D LiDAR point clouds annotated with 3D 8-degree-of-freedom bounding boxes in dense rain and night conditions.',
    complianceTag: 'CCPA Facial Obfuscated',
    isLocalDemo: true,
  },
];

const STATE_QUERY = `
  query ContractState($address: String!) {
    contract(address: $address) {
      state {
        ledger {
          verifiedCount
          registry {
            entries {
              key
              value {
                providerCommit
                dataCommitment
                datasetName
                datasetSize
                rowCount
                license
                isActive
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchRegistryState(): Promise<{ verifiedCount: number; listings: DataListing[] } | null> {
  if (!CONTRACT_ADDRESS) return null;

  try {
    const resp = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: STATE_QUERY, variables: { address: CONTRACT_ADDRESS } }),
      signal: AbortSignal.timeout(6_000),
    });

    if (!resp.ok) return null;
    const json: any = await resp.json();

    const ledger = json?.data?.contract?.state?.ledger;
    if (!ledger) return null;

    const entries: any[] = ledger?.registry?.entries ?? [];
    const listings: DataListing[] = entries.map((e: any) => ({
      datasetId: e.key ?? '',
      providerCommit: e.value?.providerCommit ?? '',
      dataCommitment: e.value?.dataCommitment ?? '',
      datasetName: e.value?.datasetName ?? 'Registered Dataset',
      datasetSize: e.value?.datasetSize ?? '0',
      rowCount: e.value?.rowCount ?? '0',
      license: e.value?.license ?? 'CC-BY-4.0',
      isActive: e.value?.isActive ?? true,
      category: 'General AI',
      complianceTag: 'Zero-Knowledge Verified',
    }));

    return {
      verifiedCount: Number(ledger?.verifiedCount ?? 0),
      listings: listings.filter((l) => l.isActive),
    };
  } catch {
    return null;
  }
}

export interface IndexerHook {
  state: RegistryState;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  contractConfigured: boolean;
  contractAddress: string;
  addOptimisticListing: (listing: DataListing) => void;
  incrementVerifiedCount: () => void;
}

export function useIndexer(): IndexerHook {
  const [state, setState] = useState<RegistryState>({
    verifiedCount: 42,
    listings: SEED_DATASETS,
    lastSyncedAt: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contractConfigured = !!CONTRACT_ADDRESS;

  const refresh = useCallback(() => {
    if (!CONTRACT_ADDRESS) return;
    setLoading(true);

    fetchRegistryState()
      .then((res) => {
        if (res && res.listings.length > 0) {
          // Merge on-chain with seeds
          const onChainIds = new Set(res.listings.map((l) => l.datasetId));
          const filteredSeeds = SEED_DATASETS.filter((s) => !onChainIds.has(s.datasetId));
          setState({
            verifiedCount: res.verifiedCount,
            listings: [...res.listings, ...filteredSeeds],
            lastSyncedAt: new Date(),
          });
          setError(null);
        } else if (res) {
          setState((prev) => ({
            ...prev,
            verifiedCount: Math.max(prev.verifiedCount, res.verifiedCount),
            lastSyncedAt: new Date(),
          }));
        }
      })
      .catch((e: any) => {
        setError(e?.message ?? String(e));
      })
      .finally(() => setLoading(false));
  }, []);

  const addOptimisticListing = useCallback((listing: DataListing) => {
    setState((prev) => ({
      ...prev,
      listings: [listing, ...prev.listings.filter((l) => l.datasetId !== listing.datasetId)],
      lastSyncedAt: new Date(),
    }));
  }, []);

  const incrementVerifiedCount = useCallback(() => {
    setState((prev) => ({
      ...prev,
      verifiedCount: prev.verifiedCount + 1,
      lastSyncedAt: new Date(),
    }));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 20_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return {
    state,
    loading,
    error,
    refresh,
    contractConfigured,
    contractAddress: CONTRACT_ADDRESS,
    addOptimisticListing,
    incrementVerifiedCount,
  };
}
