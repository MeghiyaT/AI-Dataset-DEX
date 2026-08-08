# DataVault Exchange

**Privacy-preserving, GDPR/CCPA-compliant decentralised exchange for AI training datasets on Midnight Network.**

Midnight verifies dataset integrity without exposing raw data — solving the fundamental compliance problem for data sharing in the AI era.

---

## Project Vision

AI training datasets contain sensitive personal information (medical records, financial data, user behaviour) that is subject to GDPR and CCPA. Today, teams either share raw data (compliance risk) or share nothing (wasted value). DataVault Exchange resolves this with Midnight's zero-knowledge circuits: a dataset provider registers a cryptographic commitment (a hash of the dataset) on-chain, and any party can later *prove* — without revealing a single byte — that they still hold the exact same data. On-chain observers see a hash and metadata, never the underlying rows. Privacy is not a feature layer; it is the core architectural primitive.

---

## Smart Contract Deployment

| Field | Value |
|---|---|
| **Network** | Preview |
| **Deployed contract ID** | `9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592` |

> After running `npm run setup -- --network preview`, the contract address is printed to the terminal and saved to `.midnight-state.json`. Paste it into `frontend/.env.local` as `VITE_CONTRACT_ADDRESS=<address>`.

---

## Key Features

- **ZK Integrity Anchor** — datasets are registered as a 32-byte SHA-256 commitment (`dataCommitment`). The raw bytes never touch the chain.
- **`proveIntegrity` circuit** — proves in zero-knowledge that you hold a dataset whose commitment matches the on-chain value. `verifiedCount` increments as public proof. *"Proved without revealing your input."*
- **Owner-gated registry** — only the deployer (verified via `ownerCommit` = hash of their secret key) can register and toggle listings.
- **GDPR/CCPA by design** — `providerSecret` and `datasetSlices` are witnesses: circuit inputs that are proven and immediately discarded. They are never written to the ledger, never logged in the frontend, never sent to any server.
- **Public metadata** — `datasetName`, size, row count, license, and `isActive` flag are public so buyers can discover and evaluate datasets without seeing the data.
- **Live indexer reads** — the React frontend polls the Midnight Preview indexer (GraphQL) for `verifiedCount` and all active listings every 15 seconds.
- **DApp Connector** — wallet integration uses `Object.values(window.midnight)` enumeration (no hardcoded wallet names), validates the connected network, and routes proving/balancing/submission through the wallet adapter.

---

## Privacy Story

| What | Public (on-chain) | Private (never on-chain) |
|---|---|---|
| Dataset existence | ✓ `datasetId` (hex key in registry) | — |
| Provider identity | ✓ `providerCommit` = hash(secret key) | ✗ `providerSecret` (witness, dropped after proof) |
| Dataset content | ✓ `dataCommitment` = hash(slices) | ✗ `datasetSlices` = raw data (witness, dropped after proof) |
| Metadata | ✓ name, size, rowCount, license | — |
| Integrity proof result | ✓ `verifiedCount` increments | ✗ The data that produced the proof |

---

## Future Scope

- **Buyer access tokens** — a `requestAccess` circuit that lets a buyer pay tNIGHT and receive a ZK-gated decryption key without the provider ever seeing the buyer's identity.
- **Partial-data proofs** — prove that a *subset* of rows satisfies a statistical claim (e.g. ≥ 30 % positive labels) without revealing which rows.
- **Multi-provider co-registration** — aggregate datasets from multiple providers under a single commitment tree.
- **Mainnet path** — migrate to Midnight Mainnet once available; contract address update is a single env-var change.
- **Automated faucet + DUST management** — CLI helper that checks balance and auto-requests from the faucet before deploy.
- **Frontend indexer subscriptions** — replace polling with WebSocket subscriptions for real-time updates.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Compact (Midnight Network ZK language) |
| ZK proving | Midnight proof-server (Docker, port 6300) |
| Deploy / CLI | TypeScript + Node.js + Midnight JS SDK 4.1.1 |
| Wallet SDK | `@midnight-ntwrk/wallet-sdk` 1.2.0 |
| BIP-39 wallets | `@scure/bip39` (Lace-compatible seed derivation) |
| Frontend | React 18 + Vite 5 + TypeScript |
| Indexer | Midnight Preview Indexer (GraphQL, wss) |
| Tests | Vitest (37 tests, 3 files) |
| Local devnet | Docker Compose (node :9944, indexer :8088, proof-server :6300) |

---

## Local Development

### Prerequisites

- **Node ≥ 22** (`node --version`)
- **Docker Desktop** (running — verify: `docker ps`)
- **Compact compiler** (`compact --version` — install from [Midnight docs](https://docs.midnight.network))

### 1. Install dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Compile the smart contract

```bash
npm run compile
# → outputs to contracts/managed/datasetRegistry/
```

### 3. Start the proof-server (Preview network only needs this)

```bash
docker compose up -d proof-server
# Waits for port 6300 to be ready
```

### 4. Run setup → Preview Network

The setup script creates a fresh wallet, syncs with Preview, waits for DUST, and deploys the contract.

```bash
npm run setup -- --network preview
```

If the wallet has zero tNIGHT, the script prints the wallet address and waits up to 5 minutes for the faucet. Fund it at:

```
https://midnight-tmnight-preview.nethermind.dev
```

After success, the **contract address** is printed and saved to `.midnight-state.json`.

### 5. Configure the frontend

```bash
cp frontend/.env.example frontend/.env.local
# Edit .env.local — set VITE_CONTRACT_ADDRESS to the deployed address above
```

### 6. Run the frontend dev server

```bash
npm run frontend:dev
# → http://localhost:5173
```

### 7. Run tests

```bash
npm test
# → 37 tests across 3 files, all passing
```

### 8. Production build

```bash
npm run frontend:build
# → zero errors, output in frontend/dist/
```

### CLI usage (after deploy)

```bash
npm run cli -- --network preview list
npm run cli -- --network preview register --name "My Dataset" --file ./data.csv
npm run cli -- --network preview prove --id <dataset-id>
```

---

## Project Structure

```
.
├── contracts/
│   ├── datasetRegistry.compact      # ZK smart contract (Compact)
│   └── managed/datasetRegistry/     # compiled artifacts (gitignored)
├── src/
│   ├── network.ts                   # network config + wallet identity
│   ├── wallet.ts                    # wallet construction + sync restore
│   ├── setup.ts                     # one-shot setup entry point
│   ├── deploy.ts                    # deploy script
│   ├── cli.ts                       # interactive CLI
│   ├── contract-client.ts           # witness wiring + providers
│   ├── dataset.ts                   # slice/hash helpers (pure, testable)
│   └── wallet-state.ts              # on-disk wallet state serialisation
├── test/
│   ├── dataset.test.ts              # 9 tests — slice/hash helpers
│   ├── network.test.ts              # 21 tests — network + wallet identity
│   └── wallet-state.test.ts         # 7 tests — wallet state persistence
├── frontend/
│   ├── src/
│   │   ├── hooks/useMidnight.ts     # DApp Connector hook
│   │   ├── hooks/useIndexer.ts      # live indexer reads
│   │   ├── components/WalletConnect.tsx
│   │   └── components/DatasetExchange.tsx  # Browse / Register / Prove tabs
│   ├── .env.example
│   ├── vercel.json
│   └── netlify.toml
├── compose.yml                      # local devnet Docker stack
└── package.json
```

---

## Security Notes

- `.midnight-state.json` and `.midnight-wallet-state/` are gitignored — they contain wallet seeds.
- `PRIVATE_STATE_PASSWORD` defaults to a placeholder for local dev. Set a real secret in production.
- Private witnesses (`providerSecret`, `datasetSlices`) are **never** logged, emitted, persisted in the UI, or sent to any network endpoint other than the local proof-server.
# AI-Dataset-DEX
