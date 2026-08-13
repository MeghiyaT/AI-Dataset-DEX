// useMidnight.ts
// Midnight Wallet Connector — supports Midnight Lace & 1AM browser extensions with
// dynamic CAIP-372 wallet discovery, non-destructive switching, and Preprod faucet support.
//
// ─── Privacy Note ────────────────────────────────────────────────────────────
// Private witnesses (raw dataset slices, provider secret) NEVER enter React state.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react';

export const TARGET_NETWORK = (import.meta.env.VITE_NETWORK as string) || 'preprod';

const LACE_ADDRESS_KEY = 'datavault_lace_address';
const ONEAM_ADDRESS_KEY = 'datavault_1am_address';
const LAST_WALLET_KEY = 'datavault_last_wallet';

export const WALLET_INSTALL_URLS = {
  lace: 'https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk',
  '1am': 'https://1am.xyz',
};

export function getFaucetUrl(network: string = TARGET_NETWORK): string {
  const net = (network || '').toLowerCase();
  if (net === 'preview') return 'https://midnight-tmnight-preview.nethermind.dev/';
  if (net === 'preprod') return 'https://midnight-tmnight-preprod.nethermind.dev/';
  return 'https://midnight-tmnight-preprod.nethermind.dev/';
}

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

export interface DiscoveredWalletInfo {
  id: WalletType | string;
  name: string;
  icon?: string;
  rdns?: string;
  apiVersion?: string;
  isAvailable: boolean;
}

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
      iconUrl?: string;
      api: any;
    }
  | { status: 'error'; message: string };

export interface MidnightHook {
  walletState: WalletState;
  connect: (type: WalletType) => Promise<boolean>;
  disconnect: () => void;
  clearError: () => void;
  targetNetwork: string;
  faucetUrl: string;
  isLaceAvailable: boolean;
  is1amAvailable: boolean;
  laceIcon?: string;
  oneAmIcon?: string;
  switchNotification: string | null;
  clearSwitchNotification: () => void;
}

// Safely attempt to connect to a Midnight DApp Connector object
async function tryConnect(connector: any, network: string): Promise<any> {
  if (!connector) return null;
  if (typeof connector.connect === 'function') {
    try {
      const api = await connector.connect(network);
      if (api) return api;
    } catch (e) {
      console.warn('[useMidnight] connector.connect(network) attempt returned:', e);
    }
    try {
      const api = await connector.connect();
      if (api) return api;
    } catch (e) {
      console.warn('[useMidnight] connector.connect() attempt returned:', e);
    }
  }
  if (typeof connector.enable === 'function') {
    try {
      const api = await connector.enable();
      if (api) return api;
    } catch (e) {
      console.warn('[useMidnight] connector.enable() attempt returned:', e);
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

// Minimal fallback API if address is stored but window reloads temporarily
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

// Discovery for 1AM Wallet
function get1amConnectorInfo(): { connector: any; icon?: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  const midnight = win.midnight;
  if (midnight && typeof midnight === 'object') {
    if (midnight['1am']) {
      return { connector: midnight['1am'], icon: midnight['1am'].icon, name: midnight['1am'].name || '1AM Wallet' };
    }
    if (midnight.oneAm) {
      return { connector: midnight.oneAm, icon: midnight.oneAm.icon, name: midnight.oneAm.name || '1AM Wallet' };
    }
    if (midnight.one_am) {
      return { connector: midnight.one_am, icon: midnight.one_am.icon, name: midnight.one_am.name || '1AM Wallet' };
    }
    for (const [key, connector] of Object.entries(midnight) as [string, any][]) {
      if (connector && typeof connector === 'object') {
        if (
          connector.rdns === 'com.midnight.1am' ||
          connector.rdns === 'xyz.1am' ||
          connector.name?.toLowerCase().includes('1am') ||
          key.toLowerCase().includes('1am')
        ) {
          return { connector, icon: connector.icon, name: connector.name || '1AM Wallet' };
        }
      }
    }
  }
  if (win.oneAm) return { connector: win.oneAm, icon: win.oneAm.icon, name: win.oneAm.name || '1AM Wallet' };
  if (win.oneAM) return { connector: win.oneAM, icon: win.oneAM.icon, name: win.oneAM.name || '1AM Wallet' };
  return null;
}

// Discovery for Midnight Lace
function getLaceConnectorInfo(): { connector: any; icon?: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  const midnight = win.midnight;
  if (midnight && typeof midnight === 'object') {
    if (midnight.mnLace) {
      return { connector: midnight.mnLace, icon: midnight.mnLace.icon, name: midnight.mnLace.name || 'Midnight Lace' };
    }
    if (midnight.lace) {
      return { connector: midnight.lace, icon: midnight.lace.icon, name: midnight.lace.name || 'Midnight Lace' };
    }
    for (const [key, connector] of Object.entries(midnight) as [string, any][]) {
      if (connector && typeof connector === 'object') {
        if (
          connector.rdns === 'io.lace.midnight' ||
          connector.name?.toLowerCase().includes('lace') ||
          key.toLowerCase().includes('lace') ||
          key === 'mnLace'
        ) {
          return { connector, icon: connector.icon, name: connector.name || 'Midnight Lace' };
        }
      }
    }
  }
  if (win.mnLace) return { connector: win.mnLace, icon: win.mnLace.icon, name: win.mnLace.name || 'Midnight Lace' };
  if (win.cardano?.midnight) return { connector: win.cardano.midnight, icon: win.cardano.midnight.icon, name: 'Midnight Lace' };
  return null;
}

export function useMidnight(): MidnightHook {
  const [walletState, setWalletState] = useState<WalletState>({ status: 'idle' });
  const [isLaceAvailable, setIsLaceAvailable] = useState(false);
  const [is1amAvailable, setIs1amAvailable] = useState(false);
  const [laceIcon, setLaceIcon] = useState<string | undefined>(undefined);
  const [oneAmIcon, setOneAmIcon] = useState<string | undefined>(undefined);
  const [switchNotification, setSwitchNotification] = useState<string | null>(null);
  const apiRef = useRef<any>(null);

  // Detect injected Midnight extensions
  useEffect(() => {
    const detect = () => {
      const info1am = get1amConnectorInfo();
      const infoLace = getLaceConnectorInfo();

      setIs1amAvailable(!!info1am);
      setIsLaceAvailable(!!infoLace);

      if (info1am?.icon) setOneAmIcon(info1am.icon);
      if (infoLace?.icon) setLaceIcon(infoLace.icon);
    };

    detect();
    const t1 = setTimeout(detect, 300);
    const t2 = setTimeout(detect, 1000);
    const t3 = setTimeout(detect, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const clearSwitchNotification = useCallback(() => {
    setSwitchNotification(null);
  }, []);

  const connect = useCallback(async (type: WalletType = '1am'): Promise<boolean> => {
    const info = type === '1am' ? get1amConnectorInfo() : getLaceConnectorInfo();
    const walletLabel = type === '1am' ? '1AM Wallet' : 'Midnight Lace';
    const isCurrentlyConnected = walletState.status === 'connected';

    // If switching wallet while already connected, perform non-destructive switch:
    if (isCurrentlyConnected) {
      if (!info?.connector) {
        setSwitchNotification(
          `${walletLabel} extension is not detected in your browser. Install ${walletLabel} to switch.`
        );
        return false;
      }
    } else {
      setWalletState({ status: 'connecting' });
    }

    try {
      let api: any = null;
      if (info?.connector) {
        api = await tryConnect(info.connector, TARGET_NETWORK);
      }

      const realAddr = await getWalletAddressFromApi(api);

      if (!api && !realAddr) {
        const errorMsg =
          type === '1am'
            ? '1AM Wallet extension was not detected. Please ensure 1AM is installed and unlocked.'
            : 'Midnight Lace wallet extension was not detected. Please ensure Midnight Lace is installed and unlocked.';

        if (isCurrentlyConnected) {
          setSwitchNotification(errorMsg);
          return false;
        } else {
          setWalletState({ status: 'error', message: errorMsg });
          return false;
        }
      }

      if (!realAddr || !isValidMidnightAddress(realAddr)) {
        const errorMsg = `${walletLabel} connected, but the wallet address could not be retrieved. Please unlock ${walletLabel} and approve connection.`;
        if (isCurrentlyConnected) {
          setSwitchNotification(errorMsg);
          return false;
        } else {
          setWalletState({ status: 'error', message: errorMsg });
          return false;
        }
      }

      // Success: extract active network & balance
      const activeNetwork = await extractWalletNetwork(api, realAddr);

      try {
        localStorage.setItem(type === '1am' ? ONEAM_ADDRESS_KEY : LACE_ADDRESS_KEY, realAddr);
        localStorage.setItem(LAST_WALLET_KEY, type);
      } catch {}

      const walletApi = api || createFallbackWalletApi(realAddr, walletLabel);
      const { formatted, raw } = await fetchWalletBalance(walletApi);
      apiRef.current = walletApi;

      setSwitchNotification(null);
      setWalletState({
        status: 'connected',
        address: realAddr,
        balance: formatted,
        rawBalance: raw,
        network: activeNetwork,
        walletType: type,
        connectorName: info?.name || walletLabel,
        iconUrl: info?.icon,
        api: walletApi,
      });

      return true;
    } catch (err: any) {
      console.error(`[useMidnight] Error connecting to ${walletLabel}:`, err);
      const msg = err?.message || `Failed to connect to ${walletLabel}.`;
      if (isCurrentlyConnected) {
        setSwitchNotification(msg);
        return false;
      } else {
        setWalletState({ status: 'error', message: msg });
        return false;
      }
    }
  }, [walletState.status]);

  // Auto reconnect on page mount
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
  }, []);

  const disconnect = useCallback(() => {
    apiRef.current = null;
    try {
      localStorage.removeItem(LAST_WALLET_KEY);
    } catch {}
    setSwitchNotification(null);
    setWalletState({ status: 'idle' });
  }, []);

  const clearError = useCallback(() => {
    setSwitchNotification(null);
    setWalletState({ status: 'idle' });
  }, []);

  const activeNetwork = walletState.status === 'connected' ? walletState.network : TARGET_NETWORK;
  const faucetUrl = getFaucetUrl(activeNetwork);

  return {
    walletState,
    connect,
    disconnect,
    clearError,
    targetNetwork: TARGET_NETWORK,
    faucetUrl,
    isLaceAvailable,
    is1amAvailable,
    laceIcon,
    oneAmIcon,
    switchNotification,
    clearSwitchNotification,
  };
}
