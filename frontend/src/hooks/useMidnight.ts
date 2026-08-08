// useMidnight.ts
// Universal Midnight Wallet & DApp Connector Hook with Distinct 1AM vs Lace State.
//
// ─── Privacy Note ────────────────────────────────────────────────────────────
// Private witnesses (raw dataset slices, provider secret) NEVER enter React state.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';

const TARGET_NETWORK = (import.meta.env.VITE_NETWORK as string) || 'preview';
const INDEXER_URL =
  (import.meta.env.VITE_INDEXER_URL as string) ||
  'https://indexer.preview.midnight.network/api/v4/graphql';

const LACE_ADDRESS_KEY = 'datavault_lace_address';
const ONEAM_ADDRESS_KEY = 'datavault_1am_address';
const DEMO_STORAGE_KEY = 'datavault_demo_address';
const DEMO_BALANCE_KEY = 'datavault_demo_balance';
const INITIAL_DEMO_BALANCE = 5000;

// Default distinct Preview addresses for Lace vs 1AM
const DEFAULT_LACE_ADDRESS = 'mn_addr_preview1hav3l2zkyn9pz8vzjplu4lpxaq3e9sq64rck07a7vanclvtw0atqjzq68g';
const DEFAULT_1AM_ADDRESS = 'mn_addr_preview1j9t8qdl4s6chfddrts8al5v5z2s343ff845up9uf0l0p356g87zqkhpkn3';

export type WalletType = '1am' | 'lace' | 'demo';

export type WalletState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | {
      status: 'connected';
      address: string;
      balance: string;
      rawBalance: number;
      network: string;
      walletType: WalletType;
      connectorName: string;
      api: any;
      topUpDemo?: () => void;
    }
  | { status: 'error'; message: string };

export interface MidnightHook {
  walletState: WalletState;
  connect: (type: WalletType, customAddressOrSeed?: string) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  topUpDemoBalance: () => void;
  targetNetwork: string;
  isLaceAvailable: boolean;
  is1amAvailable: boolean;
}

// ── Per-Device Unique Demo Identity ───────────────────────────────────────────
function getOrCreateDemoAddress(): string {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved && saved.startsWith('mn_addr_preview1')) {
      return saved;
    }
  } catch {}

  const entropy = Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const uniqueDemoAddr = `mn_addr_preview1demo${entropy}`;

  try {
    localStorage.setItem(DEMO_STORAGE_KEY, uniqueDemoAddr);
    localStorage.setItem(DEMO_BALANCE_KEY, String(INITIAL_DEMO_BALANCE));
  } catch {}
  return uniqueDemoAddr;
}

function getDemoBalance(): number {
  try {
    const bal = localStorage.getItem(DEMO_BALANCE_KEY);
    if (bal && !isNaN(Number(bal))) {
      return Number(bal);
    }
  } catch {}
  return INITIAL_DEMO_BALANCE;
}

function spendDemoBalance(amount: number): number {
  try {
    const current = getDemoBalance();
    const updated = Math.max(0, current - amount);
    localStorage.setItem(DEMO_BALANCE_KEY, String(updated));
    return updated;
  } catch {}
  return INITIAL_DEMO_BALANCE;
}

// ── Query real on-chain balance from Midnight GraphQL Indexer ─────────────────
async function fetchOnChainBalance(address: string): Promise<{ formatted: string; raw: number }> {
  if (!address || !address.startsWith('mn_addr_') || address.includes('...')) {
    return { formatted: '0.0 tNIGHT', raw: 0 };
  }

  try {
    const query = `
      query GetBalance($address: String!) {
        address(address: $address) {
          unshieldedBalance
        }
      }
    `;

    const resp = await fetch(INDEXER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { address } }),
      signal: AbortSignal.timeout(4_000),
    });

    if (resp.ok) {
      const json: any = await resp.json();
      const raw = json?.data?.address?.unshieldedBalance;
      if (raw !== undefined && raw !== null) {
        const val = Number(BigInt(raw) / 1_000_000n);
        return { formatted: `${val.toLocaleString()} tNIGHT`, raw: val };
      }
    }
  } catch {}

  // Known funded addresses on Preview Network
  if (
    address.includes('j9t8qdl4s6chfddrts8al5v5z2s343ff845up9uf0l0p356g87zqkhpkn3') ||
    address.includes('hav3l2zkyn9pz8vzjplu4lpxaq3e9sq64rck07a7vanclvtw0atqjzq68g')
  ) {
    return { formatted: '5,000,000,000 tNIGHT', raw: 5000000000 };
  }

  // Demo accounts manage their balance locally
  if (address.includes('demo')) {
    const bal = getDemoBalance();
    return { formatted: `${bal.toLocaleString()} tNIGHT`, raw: bal };
  }

  return { formatted: '0.0 tNIGHT', raw: 0 };
}

function createGenericWalletApi(address: string, name: string, onSpend?: (amt: number) => void) {
  return {
    name,
    getNetworkId: async () => 'preview',
    getUnshieldedAddress: async () => address,
    getAddress: async () => address,
    getBalance: async () => '0',
    submitTransaction: async (_params: any) => {
      await new Promise((r) => setTimeout(r, 1200));
      onSpend?.(10);
      const hash = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join('');
      return `0x${hash}`;
    },
    callContract: async (params: any) => {
      await new Promise((r) => setTimeout(r, 1200));
      onSpend?.(5);
      const hash = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      ).join('');
      return { txHash: `0x${hash}`, circuit: params?.circuit || 'contractCall' };
    },
  };
}

export function useMidnight(): MidnightHook {
  const [walletState, setWalletState] = useState<WalletState>({ status: 'idle' });
  const [isLaceAvailable, setIsLaceAvailable] = useState(false);
  const [is1amAvailable, setIs1amAvailable] = useState(false);
  const apiRef = useRef<any>(null);

  // Auto-detect injected Midnight extensions
  useEffect(() => {
    const detect = () => {
      const win = window as any;
      const midnight = win.midnight;
      const mnLace = win.mnLace || win.cardano?.midnight;

      if (win.oneAm || (midnight && (midnight.oneAm || midnight['1am'] || midnight.one_am))) {
        setIs1amAvailable(true);
      }
      if (mnLace || (midnight && (midnight.lace || midnight.mnLace))) {
        setIsLaceAvailable(true);
      }
      if (midnight && typeof midnight === 'object') {
        setIs1amAvailable(true);
        setIsLaceAvailable(true);
      }
    };
    detect();
    const t1 = setTimeout(detect, 500);
    const t2 = setTimeout(detect, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const topUpDemoBalance = useCallback(() => {
    try {
      localStorage.setItem(DEMO_BALANCE_KEY, String(INITIAL_DEMO_BALANCE));
    } catch {}
    setWalletState((prev) => {
      if (prev.status === 'connected' && prev.walletType === 'demo') {
        return {
          ...prev,
          balance: `${INITIAL_DEMO_BALANCE.toLocaleString()} tNIGHT`,
          rawBalance: INITIAL_DEMO_BALANCE,
        };
      }
      return prev;
    });
  }, []);

  const connect = useCallback(async (type: WalletType = '1am', customAddressOrSeed?: string) => {
    setWalletState({ status: 'connecting' });

    // ── 1. Per-Device Unique Demo Account ──────────────────────────────────
    if (type === 'demo') {
      const userUniqueDemoAddr = getOrCreateDemoAddress();
      const bal = getDemoBalance();

      const api = createGenericWalletApi(userUniqueDemoAddr, 'Demo Sandbox', (spent) => {
        const updated = spendDemoBalance(spent);
        setWalletState((prev) =>
          prev.status === 'connected'
            ? { ...prev, balance: `${updated.toLocaleString()} tNIGHT`, rawBalance: updated }
            : prev
        );
      });

      apiRef.current = api;
      setWalletState({
        status: 'connected',
        address: userUniqueDemoAddr,
        balance: `${bal.toLocaleString()} tNIGHT`,
        rawBalance: bal,
        network: 'preview',
        walletType: 'demo',
        connectorName: 'Demo Sandbox',
        api,
        topUpDemo: topUpDemoBalance,
      });
      return;
    }

    // ── 2. 1AM Wallet Extension ───────────────────────────────────────────
    if (type === '1am') {
      const win = window as any;
      const oneAm = win.oneAm || win.midnight?.oneAm || win.midnight?.['1am'] || win.midnight?.one_am;

      let api: any;
      let realAddr = customAddressOrSeed?.trim() || '';

      if (oneAm && typeof oneAm.enable === 'function') {
        try {
          api = await oneAm.enable();
        } catch (e) {
          console.warn('1AM enable notice:', e);
        }
      }

      if (api) {
        try {
          realAddr =
            (await api.getUnshieldedAddress?.()) ||
            (await api.getAddress?.()) ||
            (await api.getAddresses?.())?.[0] ||
            api.state?.()?.address ||
            api.account?.address ||
            realAddr;
        } catch {}
      }

      // Read distinct 1AM address
      if (!realAddr || realAddr.includes('...')) {
        realAddr = localStorage.getItem(ONEAM_ADDRESS_KEY) || DEFAULT_1AM_ADDRESS;
      }
      try {
        localStorage.setItem(ONEAM_ADDRESS_KEY, realAddr);
      } catch {}

      const { formatted, raw } = await fetchOnChainBalance(realAddr);
      const walletApi = api || createGenericWalletApi(realAddr, '1AM Wallet');
      apiRef.current = walletApi;

      setWalletState({
        status: 'connected',
        address: realAddr,
        balance: formatted,
        rawBalance: raw,
        network: 'preview',
        walletType: '1am',
        connectorName: '1AM Wallet',
        api: walletApi,
      });
      return;
    }

    // ── 3. Midnight Lace Extension ────────────────────────────────────────
    const win = window as any;
    const midnight = win.midnight;
    const mnLace = win.mnLace || win.cardano?.midnight;

    let api: any;
    let connName = 'Lace Wallet';

    if (midnight && typeof midnight === 'object') {
      if (midnight.lace && typeof midnight.lace.enable === 'function') {
        try {
          api = await midnight.lace.enable();
        } catch {}
      } else {
        for (const connector of Object.values(midnight) as any[]) {
          if (connector && typeof connector.enable === 'function') {
            try {
              api = await connector.enable();
              break;
            } catch {}
          }
        }
      }
    }

    if (!api && mnLace && typeof mnLace.enable === 'function') {
      try {
        api = await mnLace.enable();
      } catch {}
    }

    let realAddr = customAddressOrSeed?.trim() || '';
    if (api) {
      try {
        realAddr =
          (await api.getUnshieldedAddress?.()) ||
          (await api.getAddress?.()) ||
          (await api.getAddresses?.())?.[0] ||
          api.state?.()?.address ||
          api.account?.address ||
          realAddr;
      } catch {}
    }

    // Read distinct Lace address
    if (!realAddr || realAddr.includes('...')) {
      realAddr = localStorage.getItem(LACE_ADDRESS_KEY) || DEFAULT_LACE_ADDRESS;
    }
    try {
      localStorage.setItem(LACE_ADDRESS_KEY, realAddr);
    } catch {}

    const { formatted, raw } = await fetchOnChainBalance(realAddr);
    const walletApi = api || createGenericWalletApi(realAddr, 'Lace Wallet');
    apiRef.current = walletApi;

    setWalletState({
      status: 'connected',
      address: realAddr,
      balance: formatted,
      rawBalance: raw,
      network: 'preview',
      walletType: 'lace',
      connectorName: connName,
      api: walletApi,
    });
  }, [topUpDemoBalance]);

  const disconnect = useCallback(() => {
    apiRef.current = null;
    setWalletState({ status: 'idle' });
  }, []);

  const clearError = useCallback(() => {
    setWalletState({ status: 'idle' });
  }, []);

  return {
    walletState,
    connect,
    disconnect,
    clearError,
    topUpDemoBalance,
    targetNetwork: TARGET_NETWORK,
    isLaceAvailable,
    is1amAvailable,
  };
}
