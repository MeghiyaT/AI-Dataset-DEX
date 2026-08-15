// useIndexer.ts
// Live GraphQL indexer queries for Midnight Preview on-chain ledger state.
//
// ─── Privacy Architecture ───────────────────────────────────────────────────
// • Reads exclusively PUBLIC ledger state: verifiedCount, registry listings,
//   commitment hashes (providerCommit, dataCommitment), and metadata.
// • Raw data vectors & provider secrets are NEVER stored or transmitted.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  INDEXER_URL,
  CONTRACT_ADDRESS,
  INDEXER_POLL_MS,
  INDEXER_FETCH_TIMEOUT_MS,
} from '../config';

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
}

export interface RegistryState {
  verifiedCount: number;
  listings: DataListing[];
  lastSyncedAt: Date;
}

const LOCAL_STORAGE_KEY = 'datavault_registered_datasets';
const VERIFIED_STORAGE_KEY = 'datavault_verified_count';

function getLocalListings(): DataListing[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalListings(listings: DataListing[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(listings));
  } catch {}
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
      signal: AbortSignal.timeout(INDEXER_FETCH_TIMEOUT_MS),
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
      // isActive defaults to false (conservative): unlisted data is hidden
      // until the on-chain field explicitly confirms it is active.
      isActive: e.value?.isActive ?? false,
      category: e.value?.category ?? 'General AI',
      // complianceTag is sourced from on-chain metadata; null if not set.
      complianceTag: e.value?.complianceTag ?? null,
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
  toggleArchiveListing: (datasetId: string) => void;
  removeListing: (datasetId: string) => void;
}

function getInitialListings(): DataListing[] {
  return getLocalListings();
}

export function useIndexer(): IndexerHook {
  const [state, setState] = useState<RegistryState>(() => {
    let savedVerified = 0;
    try {
      const v = localStorage.getItem(VERIFIED_STORAGE_KEY);
      if (v && !isNaN(Number(v))) savedVerified = Number(v);
    } catch {}

    return {
      verifiedCount: savedVerified,
      listings: getInitialListings(),
      lastSyncedAt: new Date(),
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contractConfigured = !!CONTRACT_ADDRESS;

  const refresh = useCallback(() => {
    if (!CONTRACT_ADDRESS) return;
    setLoading(true);

    fetchRegistryState()
      .then((res) => {
        const local = getLocalListings();
        const onChain = res?.listings ?? [];
        const onChainIds = new Set(onChain.map((l) => l.datasetId));

        // Merge: on-chain items + locally saved user-registered items
        const mergedLocal = local.filter((l) => !onChainIds.has(l.datasetId));

        const finalList = [...onChain, ...mergedLocal];

        let currentVerified = 0;
        try {
          const v = localStorage.getItem(VERIFIED_STORAGE_KEY);
          if (v && !isNaN(Number(v))) currentVerified = Number(v);
        } catch {}

        const finalVerified = Math.max(res?.verifiedCount ?? 0, currentVerified);

        setState({
          verifiedCount: finalVerified,
          listings: finalList,
          lastSyncedAt: new Date(),
        });
        setError(null);
      })
      .catch((e: any) => {
        setError(e?.message ?? String(e));
      })
      .finally(() => setLoading(false));
  }, []);

  const addOptimisticListing = useCallback((listing: DataListing) => {
    const cleanId = listing.datasetId.startsWith('0x')
      ? listing.datasetId.slice(2)
      : listing.datasetId;
    const cleanListing = { ...listing, datasetId: cleanId };

    const currentLocal = getLocalListings();
    const updatedLocal = [cleanListing, ...currentLocal.filter((l) => l.datasetId !== cleanId)];
    saveLocalListings(updatedLocal);

    setState((prev) => {
      const rest = prev.listings.filter((l) => l.datasetId !== cleanId);
      return {
        ...prev,
        listings: [cleanListing, ...rest],
        lastSyncedAt: new Date(),
      };
    });
  }, []);

  const toggleArchiveListing = useCallback((datasetId: string) => {
    const cleanId = datasetId.startsWith('0x') ? datasetId.slice(2) : datasetId;

    setState((prev) => {
      const updatedListings = prev.listings.map((l) => {
        if (l.datasetId === cleanId) {
          return { ...l, isActive: !l.isActive };
        }
        return l;
      });
      saveLocalListings(updatedListings);
      return {
        ...prev,
        listings: updatedListings,
        lastSyncedAt: new Date(),
      };
    });
  }, []);

  const removeListing = useCallback((datasetId: string) => {
    const cleanId = datasetId.startsWith('0x') ? datasetId.slice(2) : datasetId;

    setState((prev) => {
      const updatedListings = prev.listings.filter((l) => l.datasetId !== cleanId);
      saveLocalListings(updatedListings);
      return {
        ...prev,
        listings: updatedListings,
        lastSyncedAt: new Date(),
      };
    });
  }, []);

  const incrementVerifiedCount = useCallback(() => {
    setState((prev) => {
      const updated = prev.verifiedCount + 1;
      try {
        localStorage.setItem(VERIFIED_STORAGE_KEY, String(updated));
      } catch {}
      return {
        ...prev,
        verifiedCount: updated,
        lastSyncedAt: new Date(),
      };
    });
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, INDEXER_POLL_MS);
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
    toggleArchiveListing,
    removeListing,
  };
}
