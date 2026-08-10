// useMidnight.ts
// Midnight Wallet Connector — supports Midnight Lace & 1AM browser extensions.
//
// ─── Privacy Note ────────────────────────────────────────────────────────────
// Private witnesses (raw dataset slices, provider secret) NEVER enter React state.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';

const TARGET_NETWORK = (import.meta.env.VITE_NETWORK as string) || 'preprod';

const LACE_ADDRESS_KEY = 'datavault_lace_address';
const ONEAM_ADDRESS_KEY = 'datavault_1am_address';
const LAST_WALLET_KEY = 'datavault_last_wallet';

// Safely extract an address string from any shape the wallet API might return.
function extractAddr(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const candidate = extractAddr(item);
      if (candidate) return candidate;
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const priorityKeys = ['unshieldedAddress', 'shieldedAddress', 'address', 'bech32', 'addr', 'dustAddress'];
    for (const key of priorityKeys) {
      if (obj[key] && typeof obj[key] === 'string') {
        const val = (obj[key] as string).trim();
        if (val) return val;
      }
    }
    for (const val of Object.values(obj)) {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('mn_') || trimmed.startsWith('mn1') || trimmed.startsWith('0x') || trimmed.length >= 10) {
          return trimmed;
        }
      } else if (typeof val === 'object' && val !== null) {
        const candidate = extractAddr(val);
        if (candidate) return candidate;
      }
    }
  }
  return '';
}

function isValidMidnightAddress(addr: string): boolean {
  if (!addr || typeof addr !== 'string') return false;
  const cleaned = addr.trim();
  if (cleaned.length < 8) return false;
  return (
    cleaned.startsWith('mn') ||
    cleaned.startsWith('0x') ||
    cleaned.length >= 10
  );
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

// Safely attempt to connect to a Midnight DApp Connector object
async function tryConnect(connector: any, network: string): Promise<any> {
  if (!connector) return null;
  if (typeof connector.connect === 'function') {
    try {
      const api = await connector.connect(network);
      if (api) return api;
    } catch (e) {
      console.warn('[useMidnight] connector.connect(network) warning:', e);
    }
    try {
      const api = await connector.connect();
      if (api) return api;
    } catch (e) {
      console.warn('[useMidnight] connector.connect() warning:', e);
    }
  }
  if (typeof connector.enable === 'function') {
    try {
      const api = await connector.enable();
      if (api) return api;
    } catch (e) {
      console.warn('[useMidnight] connector.enable() warning:', e);
    }
  }
  return null;
}

// Safely retrieve address from connected API object
async function getWalletAddressFromApi(api: any): Promise<string> {
  if (!api) return '';
  const methods = [
    () => api.getUnshieldedAddress?.(),
    () => api.getShieldedAddresses?.(),
    () => api.getDustAddress?.(),
    () => api.getAddress?.(),
    () => api.getAddresses?.(),
    () => api.getConfiguration?.(),
    () => api.state?.()?.address,
    () => api.account?.address,
  ];

  for (const fn of methods) {
    try {
      const res = await fn();
      const addr = extractAddr(res);
      if (addr && isValidMidnightAddress(addr)) {
        return addr;
      }
    } catch (e) {
      // continue trying alternative address methods
    }
  }
  return '';
}

// Fetch balance from the wallet extension
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
    if (typeof val === 'object' && val !== null) {
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
    () => api.getDustBalance?.(),
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
      if (num !== null && num >= 0) {
        return { formatted: `${num.toLocaleString()} tNIGHT`, raw: num };
      }
    } catch {}
  }

  return { formatted: '0.0 tNIGHT', raw: 0 };
}

// Minimal shim for when stored address is present but window object is temporarily reloaded
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

  // Detect injected Midnight extensions
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
    const t1 = setTimeout(detect, 400);
    const t2 = setTimeout(detect, 1200);
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

      if (midnight && typeof midnight === 'object') {
        if (midnight['1am']) {
          api = await tryConnect(midnight['1am'], TARGET_NETWORK);
        }
        if (!api) {
          for (const connector of Object.values(midnight) as any[]) {
            if (connector?.rdns === 'com.midnight.1am' || connector?.name?.toLowerCase().includes('1am')) {
              api = await tryConnect(connector, TARGET_NETWORK);
              if (api) break;
            }
          }
        }
        if (!api) {
          for (const connector of Object.values(midnight) as any[]) {
            api = await tryConnect(connector, TARGET_NETWORK);
            if (api) break;
          }
        }
      }

      if (!api && win.oneAm) {
        api = await tryConnect(win.oneAm, TARGET_NETWORK);
      }

      let realAddr = await getWalletAddressFromApi(api);

      if (!realAddr) {
        realAddr = localStorage.getItem(ONEAM_ADDRESS_KEY) || '';
      }

      if (!api && !realAddr) {
        setWalletState({
          status: 'error',
          message:
            '1AM Wallet extension was not detected in your browser. Please install the 1AM extension or check if it is enabled.',
        });
        return;
      }

      if (!realAddr || !isValidMidnightAddress(realAddr)) {
        setWalletState({
          status: 'error',
          message:
            '1AM wallet connected but your address could not be verified. Make sure 1AM is unlocked and set to Preprod network.',
        });
        return;
      }

      try {
        localStorage.setItem(ONEAM_ADDRESS_KEY, realAddr);
        localStorage.setItem(LAST_WALLET_KEY, '1am');
      } catch {}

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
        api = await tryConnect(laceConnector, TARGET_NETWORK);
      }
      if (!api) {
        for (const connector of Object.values(midnight) as any[]) {
          if (connector?.rdns === 'io.lace.midnight' || connector?.name?.toLowerCase().includes('lace')) {
            api = await tryConnect(connector, TARGET_NETWORK);
            if (api) break;
          }
        }
      }
      if (!api) {
        for (const connector of Object.values(midnight) as any[]) {
          api = await tryConnect(connector, TARGET_NETWORK);
          if (api) break;
        }
      }
    }

    if (!api && mnLace) {
      api = await tryConnect(mnLace, TARGET_NETWORK);
    }

    let realAddr = await getWalletAddressFromApi(api);

    if (!realAddr) {
      realAddr = localStorage.getItem(LACE_ADDRESS_KEY) || '';
    }

    if (!api && !realAddr) {
      setWalletState({
        status: 'error',
        message:
          'Midnight Lace wallet extension was not detected in your browser. Please install Midnight Lace or check if it is unlocked.',
      });
      return;
    }

    if (!realAddr || !isValidMidnightAddress(realAddr)) {
      setWalletState({
        status: 'error',
        message:
          'Midnight Lace wallet connected but your address could not be verified. Make sure Midnight Lace is unlocked and set to Preprod network.',
      });
      return;
    }

    try {
      localStorage.setItem(LACE_ADDRESS_KEY, realAddr);
      localStorage.setItem(LAST_WALLET_KEY, 'lace');
    } catch {}

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

  // Auto reconnect if previously connected
  useEffect(() => {
    const lastWallet = localStorage.getItem(LAST_WALLET_KEY) as WalletType | null;
    if (lastWallet && (lastWallet === 'lace' || lastWallet === '1am')) {
      const storedAddr = localStorage.getItem(lastWallet === 'lace' ? LACE_ADDRESS_KEY : ONEAM_ADDRESS_KEY);
      if (storedAddr && isValidMidnightAddress(storedAddr)) {
        connect(lastWallet).catch((err) => {
          console.warn('[useMidnight] auto-connect skipped:', err);
        });
      }
    }
  }, [connect]);

  const disconnect = useCallback(() => {
    apiRef.current = null;
    try { localStorage.removeItem(LAST_WALLET_KEY); } catch {}
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
