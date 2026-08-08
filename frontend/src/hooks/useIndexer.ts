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
    verifiedCount: 0,
    listings: [],
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
        if (res) {
          setState({
            verifiedCount: res.verifiedCount,
            listings: res.listings,
            lastSyncedAt: new Date(),
          });
          setError(null);
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
