// useMidnight.ts
// Midnight Wallet Connector — supports Midnight Lace, 1AM extensions, and Demo Mode.
//
// ─── Privacy Note ────────────────────────────────────────────────────────────
// Private witnesses (raw dataset slices, provider secret) NEVER enter React state.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';

const TARGET_NETWORK = (import.meta.env.VITE_NETWORK as string) || 'preprod';

const LACE_ADDRESS_KEY = 'datavault_lace_address';
const ONEAM_ADDRESS_KEY = 'datavault_1am_address';

// Safely extract a bech32 string from any shape the wallet API might return.
// Wallets sometimes return { address: '...' }, { bech32: '...' }, { unshieldedAddress: '...' }, or arrays.
function extractAddr(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const candidate = extractAddr(item);
      if (candidate) return candidate;
    }
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const candidate =
      obj.address ?? obj.bech32 ?? obj.unshieldedAddress ?? obj.addr ?? obj.shieldedAddress;
    if (candidate && candidate !== obj) return extractAddr(candidate);
    for (const val of Object.values(obj)) {
      if (typeof val === 'string' && val.startsWith('mn_addr_')) return val;
    }
  }
  return '';
}

export type WalletType = '1am' | 'lace';

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
    }
  | { status: 'error'; message: string };

export interface MidnightHook {
  walletState: WalletState;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
  targetNetwork: string;
  isLaceAvailable: boolean;
  is1amAvailable: boolean;
}

// ── Get balance from the wallet extension (the only reliable source) ──────────
// Handles BigInt, numeric values, strings, or token balance records { [tokenType]: bigint }
async function fetchWalletBalance(api: any): Promise<{ formatted: string; raw: number }> {
  if (!api) return { formatted: '0.0 tNIGHT', raw: 0 };

  const parseValue = (val: unknown): number | null => {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'bigint') return Number(val / 1_000_000n);
    if (typeof val === 'number' && !isNaN(val)) return val > 1_000_000 ? Math.round(val / 1_000_000) : val;
    if (typeof val === 'string') {
      try {
        const big = BigInt(val);
        return Number(big / 1_000_000n);
      } catch {
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      }
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      for (const k of Object.keys(obj)) {
        const res = parseValue(obj[k]);
        if (res !== null && res > 0) return res;
      }
    }
    return null;
  };

  const methods = [
    () => api.getUnshieldedBalances?.(),
    () => api.getShieldedBalances?.(),
    () => api.getBalance?.(),
    () => api.getUnshieldedBalance?.(),
    () => api.state?.()?.unshielded?.balances?.NIGHT,
    () => api.state?.()?.balance,
    () => api.account?.balance,
    () => api.wallet?.getBalance?.(),
  ];

  for (const method of methods) {
    try {
      const raw = await method();
      const num = parseValue(raw);
      if (num !== null && num > 0) {
        return { formatted: `${num.toLocaleString()} tNIGHT`, raw: num };
      }
    } catch {}
  }

  return { formatted: '0.0 tNIGHT', raw: 0 };
}

// Minimal shim for when the real wallet API is unavailable.
function createFallbackWalletApi(address: string, name: string) {
  return {
    name,
    getNetworkId: async () => TARGET_NETWORK,
    getUnshieldedAddress: async () => address,
    getAddress: async () => address,
    getBalance: async () => '0',
    getUnshieldedBalances: async () => ({ '00': 0n }),
  };
}

export function useMidnight(): MidnightHook {
  const [walletState, setWalletState] = useState<WalletState>({ status: 'idle' });
  const [isLaceAvailable, setIsLaceAvailable] = useState(false);
  const [is1amAvailable, setIs1amAvailable] = useState(false);
  const apiRef = useRef<any>(null);

  // Auto-detect injected Midnight extensions per Midnight DApp Connector API v4 standard
  useEffect(() => {
    const detect = () => {
      const win = window as any;
      const midnight = win.midnight;
      const mnLace = win.mnLace || win.cardano?.midnight;

      let has1am = false;
      let hasLace = false;

      if (win.oneAm || win.oneAM || (midnight && (midnight['1am'] || midnight.oneAm || midnight.one_am))) {
        has1am = true;
      }
      if (mnLace || (midnight && (midnight.mnLace || midnight.lace))) {
        hasLace = true;
      }

      if (midnight && typeof midnight === 'object') {
        for (const [key, connector] of Object.entries(midnight) as [string, any][]) {
          if (connector && typeof connector === 'object') {
            if (connector.rdns === 'com.midnight.1am' || key.toLowerCase().includes('1am')) {
              has1am = true;
            }
            if (connector.rdns === 'io.lace.midnight' || key.toLowerCase().includes('lace') || key === 'mnLace') {
              hasLace = true;
            }
          }
        }
      }

      setIs1amAvailable(has1am);
      setIsLaceAvailable(hasLace);
    };

    detect();
    const t1 = setTimeout(detect, 500);
    const t2 = setTimeout(detect, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const connect = useCallback(async (type: WalletType = '1am') => {
    setWalletState({ status: 'connecting' });

    // ── 1AM Wallet Extension ─────────────────────────────────────────────────
    if (type === '1am') {
      const win = window as any;
      const midnight = win.midnight;

      let api: any = null;
      let realAddr = '';

      if (midnight && typeof midnight === 'object') {
        // Pass 1: explicit '1am' key
        if (midnight['1am']) {
          const conn = midnight['1am'];
          if (typeof conn.connect === 'function') {
            try { api = await conn.connect(TARGET_NETWORK); } catch (e) { console.warn('1AM connect:', e); }
          } else if (typeof conn.enable === 'function') {
            try { api = await conn.enable(); } catch (e) {}
          }
        }
        // Pass 2: check by rdns 'com.midnight.1am'
        if (!api) {
          for (const connector of Object.values(midnight) as any[]) {
            if (connector?.rdns === 'com.midnight.1am') {
              if (typeof connector.connect === 'function') {
                try { api = await connector.connect(TARGET_NETWORK); break; } catch (e) {}
              } else if (typeof connector.enable === 'function') {
                try { api = await connector.enable(); break; } catch (e) {}
              }
            }
          }
        }
        // Pass 3: any connector in window.midnight with connect() or enable()
        if (!api) {
          for (const connector of Object.values(midnight) as any[]) {
            if (connector && typeof connector.connect === 'function') {
              try { api = await connector.connect(TARGET_NETWORK); break; } catch (e) {}
            } else if (connector && typeof connector.enable === 'function') {
              try { api = await connector.enable(); break; } catch (e) {}
            }
          }
        }
      }

      if (!api && win.oneAm) {
        if (typeof win.oneAm.connect === 'function') {
          try { api = await win.oneAm.connect(TARGET_NETWORK); } catch {}
        } else if (typeof win.oneAm.enable === 'function') {
          try { api = await win.oneAm.enable(); } catch {}
        }
      }

      if (api) {
        try {
          const raw =
            (await api.getUnshieldedAddress?.()) ??
            (await api.getAddress?.()) ??
            (await api.getAddresses?.())?.[0] ??
            (await api.getShieldedAddresses?.()) ??
            api.state?.()?.address ??
            api.account?.address ??
            null;
          console.log('[useMidnight] raw address from 1AM wallet:', raw);
          realAddr = extractAddr(raw);
        } catch (e) { console.warn('[useMidnight] 1AM address read error:', e); }
      }

      if (!realAddr) {
        realAddr = localStorage.getItem(ONEAM_ADDRESS_KEY) || '';
      }

      if (!api && !realAddr) {
        setWalletState({
          status: 'error',
          message:
            '1AM Wallet extension was not detected in your browser. Please install the 1AM extension or try the Demo Wallet option below.',
        });
        return;
      }

      if (!realAddr || !realAddr.startsWith('mn_addr_')) {
        setWalletState({
          status: 'error',
          message:
            '1AM wallet connected but your address could not be verified. Make sure 1AM is unlocked and set to Preview or Preprod network.',
        });
        return;
      }

      try { localStorage.setItem(ONEAM_ADDRESS_KEY, realAddr); } catch {}

      const walletApi = api || createFallbackWalletApi(realAddr, '1AM Wallet');
      const { formatted, raw } = await fetchWalletBalance(walletApi);
      apiRef.current = walletApi;

      setWalletState({
        status: 'connected',
        address: realAddr,
        balance: formatted,
        rawBalance: raw,
        network: TARGET_NETWORK,
        walletType: '1am',
        connectorName: '1AM Wallet',
        api: walletApi,
      });
      return;
    }

    // ── Midnight Lace Extension ──────────────────────────────────────────────
    const win = window as any;
    const midnight = win.midnight;
    const mnLace = win.mnLace || win.cardano?.midnight;

    let api: any = null;
    const connName = 'Lace Wallet';

    if (midnight && typeof midnight === 'object') {
      const laceConnector = midnight.mnLace || midnight.lace;
      if (laceConnector) {
        if (typeof laceConnector.connect === 'function') {
          try { api = await laceConnector.connect(TARGET_NETWORK); } catch (e) {}
        } else if (typeof laceConnector.enable === 'function') {
          try { api = await laceConnector.enable(); } catch (e) {}
        }
      }
      if (!api) {
        for (const connector of Object.values(midnight) as any[]) {
          if (connector?.rdns === 'io.lace.midnight' || connector?.name?.toLowerCase().includes('lace')) {
            if (typeof connector.connect === 'function') {
              try { api = await connector.connect(TARGET_NETWORK); break; } catch (e) {}
            } else if (typeof connector.enable === 'function') {
              try { api = await connector.enable(); break; } catch (e) {}
            }
          }
        }
      }
      if (!api) {
        for (const connector of Object.values(midnight) as any[]) {
          if (connector && typeof connector.connect === 'function') {
            try { api = await connector.connect(TARGET_NETWORK); break; } catch (e) {}
          } else if (connector && typeof connector.enable === 'function') {
            try { api = await connector.enable(); break; } catch (e) {}
          }
        }
      }
    }

    if (!api && mnLace) {
      if (typeof mnLace.connect === 'function') {
        try { api = await mnLace.connect(TARGET_NETWORK); } catch (e) {}
      } else if (typeof mnLace.enable === 'function') {
        try { api = await mnLace.enable(); } catch (e) {}
      }
    }

    let realAddr = '';
    if (api) {
      try {
        const raw =
          (await api.getUnshieldedAddress?.()) ??
          (await api.getAddress?.()) ??
          (await api.getAddresses?.())?.[0] ??
          (await api.getShieldedAddresses?.()) ??
          api.state?.()?.address ??
          api.account?.address ??
          null;
        console.log('[useMidnight] raw address from Lace wallet:', raw);
        realAddr = extractAddr(raw);
      } catch (e) { console.warn('[useMidnight] Lace address read error:', e); }
    }

    if (!realAddr) {
      realAddr = localStorage.getItem(LACE_ADDRESS_KEY) || '';
    }

    if (!api && !realAddr) {
      setWalletState({
        status: 'error',
        message:
          'Midnight Lace wallet extension was not detected in your browser. Please install Midnight Lace or try the Demo Wallet option below.',
      });
      return;
    }

    if (!realAddr || !realAddr.startsWith('mn_addr_')) {
      setWalletState({
        status: 'error',
        message:
          'Midnight Lace wallet connected but your address could not be verified. Make sure Midnight Lace is unlocked and set to the correct network.',
      });
      return;
    }

    try { localStorage.setItem(LACE_ADDRESS_KEY, realAddr); } catch {}

    const walletApi = api || createFallbackWalletApi(realAddr, 'Lace Wallet');
    const { formatted, raw } = await fetchWalletBalance(walletApi);
    apiRef.current = walletApi;

    setWalletState({
      status: 'connected',
      address: realAddr,
      balance: formatted,
      rawBalance: raw,
      network: TARGET_NETWORK,
      walletType: 'lace',
      connectorName: connName,
      api: walletApi,
    });
  }, []);

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
    targetNetwork: TARGET_NETWORK,
    isLaceAvailable,
    is1amAvailable,
  };
}

