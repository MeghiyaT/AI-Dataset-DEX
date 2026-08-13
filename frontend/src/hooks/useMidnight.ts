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
    } catch {
      // continue trying alternative address methods
    }
  }
  return '';
}

// Dynamically determine the active network from the wallet API or address format
async function extractWalletNetwork(api: any, address: string): Promise<string> {
  if (api) {
    try {
      const status = await api.getConnectionStatus?.();
      if (status?.networkId) return String(status.networkId).toLowerCase();
    } catch {}
    try {
      const config = await api.getConfiguration?.();
      if (config?.networkId) return String(config.networkId).toLowerCase();
    } catch {}
    try {
      const net = await api.getNetworkId?.();
      if (net) return String(net).toLowerCase();
    } catch {}
  }
  if (address) {
    const lower = address.toLowerCase();
    if (lower.includes('preview')) return 'preview';
    if (lower.includes('preprod')) return 'preprod';
    if (lower.includes('test')) return 'testnet';
    if (lower.includes('mainnet')) return 'mainnet';
    if (lower.includes('local') || lower.includes('undeployed')) return 'undeployed';
  }
  return TARGET_NETWORK;
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

// Explicit, isolated connector lookup for 1AM Wallet
function get1amConnector(): any {
  const win = window as any;
  const midnight = win.midnight;
  if (midnight && typeof midnight === 'object') {
    if (midnight['1am']) return midnight['1am'];
    if (midnight.oneAm) return midnight.oneAm;
    if (midnight.one_am) return midnight.one_am;
    for (const [key, connector] of Object.entries(midnight) as [string, any][]) {
      if (connector && typeof connector === 'object') {
        if (
          connector.rdns === 'com.midnight.1am' ||
          connector.name?.toLowerCase().includes('1am') ||
          key.toLowerCase().includes('1am')
        ) {
          return connector;
        }
      }
    }
  }
  if (win.oneAm) return win.oneAm;
  if (win.oneAM) return win.oneAM;
  return null;
}

// Explicit, isolated connector lookup for Midnight Lace
function getLaceConnector(): any {
  const win = window as any;
  const midnight = win.midnight;
  if (midnight && typeof midnight === 'object') {
    if (midnight.mnLace) return midnight.mnLace;
    if (midnight.lace) return midnight.lace;
    for (const [key, connector] of Object.entries(midnight) as [string, any][]) {
      if (connector && typeof connector === 'object') {
        if (
          connector.rdns === 'io.lace.midnight' ||
          connector.name?.toLowerCase().includes('lace') ||
          key.toLowerCase().includes('lace') ||
          key === 'mnLace'
        ) {
          return connector;
        }
      }
    }
  }
  if (win.mnLace) return win.mnLace;
  if (win.cardano?.midnight) return win.cardano.midnight;
  return null;
}

export function useMidnight(): MidnightHook {
  const [walletState, setWalletState] = useState<WalletState>({ status: 'idle' });
  const [isLaceAvailable, setIsLaceAvailable] = useState(false);
  const [is1amAvailable, setIs1amAvailable] = useState(false);
  const apiRef = useRef<any>(null);

  // Detect injected Midnight extensions accurately
  useEffect(() => {
    const detect = () => {
      const has1am = !!get1amConnector();
      const hasLace = !!getLaceConnector();

      setIs1amAvailable(has1am);
      setIsLaceAvailable(hasLace);
    };

    detect();
    const t1 = setTimeout(detect, 300);
    const t2 = setTimeout(detect, 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const connect = useCallback(async (type: WalletType = '1am') => {
    // Cleanly clear previous session before connecting
    apiRef.current = null;
    setWalletState({ status: 'connecting' });

    const connector = type === '1am' ? get1amConnector() : getLaceConnector();
    const walletLabel = type === '1am' ? '1AM Wallet' : 'Midnight Lace';

    let api: any = null;
    if (connector) {
      api = await tryConnect(connector, TARGET_NETWORK);
    }

    let realAddr = await getWalletAddressFromApi(api);

    if (!api && !realAddr) {
      const errorMsg =
        type === '1am'
          ? '1AM Wallet extension was not detected in your browser. Please install 1AM or ensure it is enabled.'
          : 'Midnight Lace wallet extension was not detected in your browser. Please install Midnight Lace or check that it is enabled and unlocked.';
      setWalletState({ status: 'error', message: errorMsg });
      return;
    }

    if (!realAddr || !isValidMidnightAddress(realAddr)) {
      setWalletState({
        status: 'error',
        message: `${walletLabel} connected, but the wallet address could not be retrieved. Please unlock ${walletLabel} and authorize connection.`,
      });
      return;
    }

    // Detect if wallet is on Preview, Preprod, etc.
    const activeNetwork = await extractWalletNetwork(api, realAddr);

    try {
      localStorage.setItem(type === '1am' ? ONEAM_ADDRESS_KEY : LACE_ADDRESS_KEY, realAddr);
      localStorage.setItem(LAST_WALLET_KEY, type);
    } catch {}

    const walletApi = api || createFallbackWalletApi(realAddr, walletLabel);
    const { formatted, raw } = await fetchWalletBalance(walletApi);
    apiRef.current = walletApi;

    setWalletState({
      status: 'connected',
      address: realAddr,
      balance: formatted,
      rawBalance: raw,
      network: activeNetwork,
      walletType: type,
      connectorName: walletLabel,
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
    try {
      localStorage.removeItem(LAST_WALLET_KEY);
    } catch {}
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

