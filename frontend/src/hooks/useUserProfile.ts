// useUserProfile.ts
// Per-wallet profile storage — keyed by wallet address in localStorage.
//
// ─── Privacy Note ────────────────────────────────────────────────────────────
// Profile data is stored locally in the browser only.
// Wallet address is the key — no signup required.
// No mock or sample data is ever pre-populated.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from 'react';

export interface UserProfile {
  nickname: string;
  avatarEmoji: string;
  bio: string;
}

export type TransactionType = 'registered' | 'verified';

export type TransactionStatus = 'completed' | 'pending';

export interface UserTransaction {
  id: string;
  date: string;           // ISO string
  datasetName: string;
  datasetId: string;
  type: TransactionType;
  txId?: string;          // on-chain transaction ID if available
  status: TransactionStatus;
}

export interface UserProfileHook {
  profile: UserProfile;
  transactions: UserTransaction[];
  updateProfile: (partial: Partial<UserProfile>) => void;
  addTransaction: (tx: UserTransaction) => void;
  clearProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  nickname: '',
  avatarEmoji: '🛡️',
  bio: '',
};

function profileKey(address: string): string {
  return `datavault_profile_${address}`;
}

function txKey(address: string): string {
  return `datavault_txns_${address}`;
}

function loadProfile(address: string): UserProfile {
  try {
    const raw = localStorage.getItem(profileKey(address));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          nickname: parsed.nickname ?? DEFAULT_PROFILE.nickname,
          avatarEmoji: parsed.avatarEmoji ?? DEFAULT_PROFILE.avatarEmoji,
          bio: parsed.bio ?? DEFAULT_PROFILE.bio,
        };
      }
    }
  } catch {}
  return { ...DEFAULT_PROFILE };
}

function saveProfile(address: string, profile: UserProfile): void {
  try {
    localStorage.setItem(profileKey(address), JSON.stringify(profile));
  } catch {}
}

function loadTransactions(address: string): UserTransaction[] {
  try {
    const raw = localStorage.getItem(txKey(address));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveTransactions(address: string, txns: UserTransaction[]): void {
  try {
    localStorage.setItem(txKey(address), JSON.stringify(txns));
  } catch {}
}

export function useUserProfile(walletAddress: string | null): UserProfileHook {
  const [profile, setProfile] = useState<UserProfile>(() =>
    walletAddress ? loadProfile(walletAddress) : { ...DEFAULT_PROFILE },
  );
  const [transactions, setTransactions] = useState<UserTransaction[]>(() =>
    walletAddress ? loadTransactions(walletAddress) : [],
  );

  // Reload when wallet address changes (e.g. user switches accounts)
  useEffect(() => {
    if (walletAddress) {
      setProfile(loadProfile(walletAddress));
      setTransactions(loadTransactions(walletAddress));
    } else {
      setProfile({ ...DEFAULT_PROFILE });
      setTransactions([]);
    }
  }, [walletAddress]);

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      if (!walletAddress) return;
      setProfile((prev) => {
        const updated = { ...prev, ...partial };
        saveProfile(walletAddress, updated);
        return updated;
      });
    },
    [walletAddress],
  );

  const addTransaction = useCallback(
    (tx: UserTransaction) => {
      if (!walletAddress) return;
      setTransactions((prev) => {
        const updated = [tx, ...prev];
        saveTransactions(walletAddress, updated);
        return updated;
      });
    },
    [walletAddress],
  );

  const clearProfile = useCallback(() => {
    if (!walletAddress) return;
    const fresh = { ...DEFAULT_PROFILE };
    saveProfile(walletAddress, fresh);
    saveTransactions(walletAddress, []);
    setProfile(fresh);
    setTransactions([]);
  }, [walletAddress]);

  return { profile, transactions, updateProfile, addTransaction, clearProfile };
}
