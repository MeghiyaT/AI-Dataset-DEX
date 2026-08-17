// proofServerService.ts
// Direct integration with the Midnight Proof Server & Midnight Preview blockchain.
// 100% honest — no synthetic hashes or simulated confirmations.

import { PROOF_SERVER_URL } from '../config';

export interface ProofServerStatus {
  isOnline: boolean;
  url: string;
  latencyMs?: number;
  error?: string;
}

export interface OnChainProofResult {
  success: boolean;
  txHash?: string;
  circuit: string;
  durationMs: number;
  serverUrl: string;
  error?: string;
  proofServerOffline?: boolean;
}

/**
 * Probes the configured Midnight Proof Server to verify if it is online and responsive.
 */
export async function checkProofServerStatus(): Promise<ProofServerStatus> {
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const resp = await fetch(PROOF_SERVER_URL, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    }).catch(async () => {
      // Fallback probe with HEAD
      return await fetch(PROOF_SERVER_URL, {
        method: 'HEAD',
        mode: 'cors',
        signal: controller.signal,
      });
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (resp && (resp.ok || resp.status < 500)) {
      return {
        isOnline: true,
        url: PROOF_SERVER_URL,
        latencyMs,
      };
    }

    return {
      isOnline: false,
      url: PROOF_SERVER_URL,
      error: `Proof server returned HTTP ${resp?.status || 'network error'}`,
    };
  } catch (err: any) {
    return {
      isOnline: false,
      url: PROOF_SERVER_URL,
      error: err?.message || 'Proof Server is offline or unreachable.',
    };
  }
}

/**
 * Executes a real on-chain circuit call with the Midnight Proof Server and connected wallet.
 */
export async function requestOnChainProof(
  circuit: 'proveIntegrity' | 'registerDataset' | 'setActive',
  datasetId: string,
  walletApi: any
): Promise<OnChainProofResult> {
  const startTime = performance.now();

  // 1. Check if wallet is provided
  if (!walletApi) {
    return {
      success: false,
      circuit,
      durationMs: 0,
      serverUrl: PROOF_SERVER_URL,
      error: 'Midnight wallet is not connected. Please connect Lace or 1AM.',
    };
  }

  // 2. Probe proof server connectivity
  const status = await checkProofServerStatus();
  if (!status.isOnline) {
    return {
      success: false,
      circuit,
      durationMs: Math.round(performance.now() - startTime),
      serverUrl: PROOF_SERVER_URL,
      proofServerOffline: true,
      error: `Midnight Proof Server is offline at ${PROOF_SERVER_URL}. To submit real on-chain transactions, start your proof-server Docker container or deploy it to a cloud host (e.g. Railway/Render).`,
    };
  }

  // 3. Attempt contract invocation via wallet connector
  try {
    if (typeof walletApi.callContract === 'function') {
      const res = await walletApi.callContract({
        circuit,
        args: { datasetId },
        proofServerUrl: PROOF_SERVER_URL,
      });

      if (res && res.txHash) {
        return {
          success: true,
          txHash: res.txHash,
          circuit,
          durationMs: Math.round(performance.now() - startTime),
          serverUrl: PROOF_SERVER_URL,
        };
      }
    }

    throw new Error(
      `Your browser wallet connector does not expose direct contract execution. Run the proof via CLI or connect a contract-enabled bridge.`
    );
  } catch (err: any) {
    return {
      success: false,
      circuit,
      durationMs: Math.round(performance.now() - startTime),
      serverUrl: PROOF_SERVER_URL,
      error: err?.message || 'On-chain proof generation failed.',
    };
  }
}
