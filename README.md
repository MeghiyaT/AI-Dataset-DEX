# DataVault Exchange

**Privacy-preserving, GDPR/CCPA-compliant decentralised exchange for AI training datasets on Midnight Network.**

Midnight verifies dataset integrity without exposing raw data — solving the fundamental compliance problem for data sharing in the AI era.

---

## 🌟 Project Vision

AI training datasets contain sensitive personal information (medical records, financial data, proprietary corpora, user behaviour) subject to strict global privacy regulations such as GDPR and CCPA. Today, data owners face a binary dilemma:
1. **Share raw data** → massive regulatory exposure, copyright leakage, and compliance risk.
2. **Share nothing** → isolated data silos, stalled AI research, and lost commercial value.

**DataVault Exchange** resolves this dilemma using **Midnight's zero-knowledge Compact smart contracts**. A dataset provider registers a cryptographic commitment (a SHA-256 integrity anchor of dataset slices) on-chain. Any party can subsequently **prove in zero-knowledge** — without disclosing a single row or byte — that they possess the authentic dataset matching the registered commitment. Observers on-chain see public metadata and a verified counter increment, while the raw training data remains entirely within the provider's sovereign control.

---

## 🔐 Public State vs Private Witness

Midnight Network operates on a **dual-state privacy model** that cleanly separates what is publicly recorded on the blockchain ledger from what is computed privately off-chain inside zero-knowledge witnesses.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PRIVATE REALM (Off-Chain)                        │
│                                                                             │
│   Raw Training Data              Provider Secret Key                        │
│   (e.g., medical CSVs, PII)      (32-byte secret seed)                      │
│            │                              │                                 │
│            ▼                              ▼                                 │
│   ┌──────────────────┐           ┌──────────────────┐                       │
│   │  datasetSlices() │           │ providerSecret() │  Private Witnesses    │
│   │ (Vector<16,B32>) │           │   (Bytes<32>)    │  (TypeScript runtime) │
│   └────────┬─────────┘           └────────┬─────────┘                       │
│            │                              │                                 │
│            ▼                              ▼                                 │
│   ┌─────────────────────────────────────────────────┐                       │
│   │            Local Proof-Server (:6300)           │                       │
│   │  - Evaluates Compact circuits in zero-knowledge │                       │
│   │  - Computes persistentHash() commitments        │                       │
│   │  - Discards raw witness bytes immediately       │                       │
│   └────────────────────────┬────────────────────────┘                       │
└────────────────────────────┼────────────────────────────────────────────────┘
                             │  Generates ZK-SNARK Proof
                             │  (Zero knowledge of raw inputs)
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PUBLIC REALM (On-Chain)                          │
│                                                                             │
│   Midnight Preview Ledger / Indexer GraphQL                                 │
│                                                                             │
│   • ownerCommit      → hash(providerSecret)                                 │
│   • dataCommitment   → hash(datasetSlices) [Integrity Anchor]               │
│   • public metadata  → datasetName, datasetSize, rowCount, license          │
│   • isActive         → boolean visibility flag                              │
│   • verifiedCount    → counter incremented upon successful ZK proof         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1. Public Ledger State (On-Chain)

Public state consists of ledger variables stored directly on the Midnight blockchain. Anyone indexing or querying the chain (block explorers, Midnight Preview Indexer, DApp frontend, or prospective buyers) can inspect these fields:

```typescript
// contracts/datasetRegistry.compact

struct DataListing {
  providerCommit: Bytes<32>;    // Hash of provider's secret key (identity commitment)
  dataCommitment: Bytes<32>;    // Public integrity anchor: hash(slices)
  datasetName: Opaque<"string">;// Human-readable dataset name
  datasetSize: Uint<64>;        // Total byte size of the dataset
  rowCount: Opaque<"string">;   // Claimed record/row count (e.g. "1,000,000")
  license: Opaque<"string">;    // Dataset license (e.g. "CC-BY-4.0", "Commercial")
  isActive: Boolean;            // Marketplace visibility toggle
};

export ledger registry: Map<Bytes<32>, DataListing>; // Keyed by dataset ID
export ledger ownerCommit: Bytes<32>;                // Hash of deployer's secret
export ledger verifiedCount: Counter;                // Public tally of successful ZK proofs
```

- **`registry`**: A public map of dataset IDs to metadata and commitments. Buyers discover dataset names, sizes, row counts, and licenses without seeing underlying records.
- **`ownerCommit`**: The deployer's public identity commitment (`persistentHash("datavault:provider:", sk)`). Ensures only authorized accounts manage registry listings without revealing their private keys.
- **`verifiedCount`**: A public integer counter incremented every time an integrity proof succeeds. Serves as verifiable on-chain reputation.

### 2. Private Witness (Off-Chain)

Private witnesses are functions executed **strictly on the client machine** (in TypeScript via Node.js or the browser wallet). They provide secret runtime inputs into the local Midnight proof-server to generate ZK proofs. **Witness inputs are never published to the ledger, never stored in blocks, never sent over the network, and never exposed in indexer feeds.**

```typescript
// contracts/datasetRegistry.compact

witness providerSecret(): Bytes<32>;
witness datasetSlices(datasetId: Bytes<32>): Vector<16, Bytes<32>>;
```

- **`providerSecret`**: The provider's 32-byte secret key derived from their wallet seed. Used off-chain to prove ownership during contract deployment, dataset registration, and status toggles.
- **`datasetSlices`**: The actual raw dataset payload divided into 16 slices of 32 bytes (`Vector<16, Bytes<32>>`). Consumed inside the `registerDataset` and `proveIntegrity` circuits to compute the cryptographic SHA-256 integrity anchor.

### 3. How Zero-Knowledge Integrity Verification Works

When a provider or holder executes `proveIntegrity(datasetId)`:

1. **Witness invocation**: The client fetches the raw dataset slices locally from private storage.
2. **Off-chain ZK execution**: The local proof-server executes the circuit:
   $$\text{anchor} = \text{persistentHash}(\text{datasetSlices})$$
   $$\text{assert}(\text{anchor} == \text{registry}[\text{datasetId}].\text{dataCommitment})$$
3. **ZK Proof emission**: The proof-server produces a zero-knowledge proof stating *"I know private slices that produce the registered hash anchor."*
4. **On-chain transition**: The Midnight validators verify the ZK proof and increment `verifiedCount`. The raw slices are discarded immediately.

### 4. Privacy & Compliance Matrix

| Property | Classification | Where It Lives | Visibility & Access |
|---|---|---|---|
| **Raw Training Data** | **Private Witness** | Local disk / Client memory | **Never on-chain**. Dropped immediately after proof generation. |
| **Provider Secret Key** | **Private Witness** | Local wallet keystore | **Never on-chain**. Only hashed commitment is published. |
| **Dataset ID** | Public State | Ledger (`registry` key) | Publicly visible to all network participants. |
| **Content Commitment** | Public State | Ledger (`dataCommitment`) | 32-byte SHA-256 cryptographic hash (integrity anchor). |
| **Provider Commitment** | Public State | Ledger (`providerCommit`) | 32-byte SHA-256 hash of provider secret key. |
| **Metadata (Name, Size, Rows, License)** | Public State | Ledger (`DataListing`) | Publicly visible for dataset discovery and marketplace filtering. |
| **Integrity Proof Result** | Public State | Ledger (`verifiedCount`) | Public counter incrementing upon valid ZK proof. |

---

## ⚡ Smart Contract & Circuits

The DataVault Exchange contract (`contracts/datasetRegistry.compact`) defines **4 provable circuits**:

| Circuit | Access | Description |
|---|---|---|
| `registerDataset` | Owner-only (ZK check) | Registers a new dataset with public metadata and hashes private dataset slices into `dataCommitment`. |
| `proveIntegrity` | Public / Data Holder | Proves in zero-knowledge that the caller holds the exact dataset matching `dataCommitment`. Increments `verifiedCount`. |
| `setActive` | Owner-only (ZK check) | Toggles the `isActive` visibility state of a registered dataset. |
| `readRowCount` | Pure Public Read | Queries and verifies existence of a dataset ID and returns its registered row count. |

---

## 📸 Compilation Output (Circuits Listed)

Compiling the Compact contract generates cryptographic proving artifacts, ZKIR (Zero-Knowledge Intermediate Representation), verification keys, and TypeScript runtime bindings:

```bash
npm run compile
```

### Terminal Output:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  $ compact compile contracts/datasetRegistry.compact \                       │
│                    contracts/managed/datasetRegistry                         │
│                                                                              │
│  Compiling 4 circuits:                                                       │
│    ✓ registerDataset   (Impure Circuit → ZK-SNARK prover & verifier keys)    │
│    ✓ proveIntegrity    (Impure Circuit → ZK-SNARK prover & verifier keys)    │
│    ✓ setActive         (Impure Circuit → ZK-SNARK prover & verifier keys)    │
│    ✓ readRowCount      (Impure Circuit → Query & State Assertion)            │
│                                                                              │
│  Generated artifacts in contracts/managed/datasetRegistry/:                  │
│    ├── zkir/                                                                 │
│    │   ├── registerDataset.zkir        (8.5 KB)                              │
│    │   ├── registerDataset.bzkir       (553 B)                               │
│    │   ├── proveIntegrity.zkir         (7.7 KB)                              │
│    │   ├── proveIntegrity.bzkir        (466 B)                               │
│    │   ├── setActive.zkir              (5.7 KB)                              │
│    │   ├── setActive.bzkir             (363 B)                               │
│    │   ├── readRowCount.zkir           (3.7 KB)                              │
│    │   └── readRowCount.bzkir          (239 B)                               │
│    ├── contract/                                                             │
│    │   ├── index.d.ts                  (4.2 KB - TypeScript contract types)  │
│    │   ├── index.js                    (53.1 KB - Compact runtime bindings)  │
│    │   └── index.js.map                (2.5 KB)                              │
│    ├── keys/                           (Proving and verification keys)       │
│    └── compiler/                       (Compact metadata & schema)           │
│                                                                              │
│  ✓ Compilation completed successfully with zero errors.                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Contract Deployment & Verification

DataVault Exchange is deployed and active on the **Midnight Preview Network**.

| Parameter | Value |
|---|---|
| **Network** | Midnight Preview |
| **Contract Address** | `9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592` |
| **Deployer Address** | `mn_addr_preview1j9t8qdl4s6chfddrts8al5v5z2s343ff845up9uf0l0p356g87zqkhpkn3` |
| **State Persistence** | `.midnight-state.json` (auto-saved) |

### Deployment Terminal Output:

```
╔══════════════════════════════════════════════════════════════╗
║  Deploy DataVault Exchange to preview                        ║
╚══════════════════════════════════════════════════════════════╝

─── Wallet setup ───────────────────────────────────────────────

  Creating wallet...
  Syncing with network...
  ✓ Synced with network.                                      

  Wallet Address: mn_addr_preview1j9t8qdl4s6chfddrts8al5v5z2s343ff845up9uf0l0p356g87zqkhpkn3
  Balance: 10,000,000,000 tNight

─── DUST Token Setup ───────────────────────────────────────────

  Registering 1 NIGHT UTXOs for DUST generation...
  DUST tokens ready!

─── Deploy Contract ────────────────────────────────────────────

  Checking proof server...
  ✓ Proof server ready! (http://127.0.0.1:6300)
  Generating DUST... done.
  Deploying contract...

  ✅ Contract deployed successfully!

  Contract Address: 9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592

  Saved to .midnight-state.json
─── Deployment complete ────────────────────────────────────────
  Next: npm run cli
```

---

## 🛠️ Local Development & Setup Instructions

Follow these step-by-step instructions to run the entire DataVault Exchange stack locally.

### Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js ≥ 22.0.0** (`node --version`)
- **npm ≥ 10.0.0** (`npm --version`)
- **Docker & Docker Desktop** (`docker ps`)
- **Compact Compiler** (`compact --version` — available from [Midnight Developer Docs](https://docs.midnight.network))

---

### Step 1: Clone and Install Dependencies

Install all root dependencies (Midnight JS SDK, Vitest, RxJS, Compact Runtime) and frontend dependencies (React 18, Vite, Lucide):

```bash
# Clone the repository
git clone https://github.com/MeghiyaT/AI-Dataset-DEX.git
cd AI-Dataset-DEX

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### Step 2: Start the Midnight Proof Server

Midnight contracts require a local proof-server container to evaluate ZK circuits and compute zero-knowledge proofs:

```bash
# Start proof-server container (runs on port 6300)
docker compose up -d proof-server

# Verify container health
docker ps --filter "name=datavault-proof-server"
```

> **Note for Local Devnet (undeployed mode):** If you wish to run a completely offline local chain (node + standalone indexer + proof-server), run `docker compose up -d`.

---

### Step 3: Compile the Compact Smart Contract

Compile the ZK smart contract into bytecode, ZKIR circuits, and TypeScript typings:

```bash
npm run compile
```

Outputs are placed in `contracts/managed/datasetRegistry/`.

---

### Step 4: Run Automated Tests

Execute the unit test suite covering dataset hashing, BIP-39 wallet identity, and state management:

```bash
npm test
```

Expected output: **37 passing tests across 3 test suites** (`test/dataset.test.ts`, `test/network.test.ts`, `test/wallet-state.test.ts`).

---

### Step 5: Deploy the Contract (Preview Network)

Run the automated setup script to generate a BIP-39 wallet, sync with Preview, fund via faucet, generate DUST tokens, and deploy:

```bash
npm run setup -- --network preview
```

1. The script displays a generated 24-word mnemonic phrase and Bech32 address.
2. If your wallet has 0 balance, it prompts you to fund the address at the [Midnight Preview Faucet](https://midnight-tmnight-preview.nethermind.dev).
3. The script automatically detects arriving tNIGHT, mints DUST, and deploys the contract.
4. The deployed address is printed to the console and saved to `.midnight-state.json`.

---

### Step 6: Configure the Frontend

Copy the environment configuration and set your deployed contract address:

```bash
cp frontend/.env.example frontend/.env.local
```

Ensure `frontend/.env.local` contains:

```env
VITE_NETWORK=preview
VITE_CONTRACT_ADDRESS=9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592
VITE_INDEXER_URL=https://indexer.preview.midnight.network/api/v4/graphql
VITE_INDEXER_WS_URL=wss://indexer.preview.midnight.network/api/v4/graphql/ws
```

---

### Step 7: Launch the Frontend Application

Start the Vite development server:

```bash
npm run frontend:dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

Features available in the UI:
- **Lace DApp Connector**: Connect your Midnight Lace wallet (Preview network).
- **Live Indexer Feed**: Browse active dataset listings queried via GraphQL every 15 seconds.
- **Dataset Registration Tab**: Compute SHA-256 commitments in-browser and register datasets.
- **ZK Integrity Prover Tab**: Prove possession of dataset slices in zero-knowledge and watch the on-chain `verifiedCount` increment in real time.

---

### Step 8: CLI Commands & Operations

You can interact with the deployed contract directly via the CLI:

```bash
# List all datasets registered in public state
npm run cli -- --network preview list

# Register a new dataset
npm run cli -- --network preview register <label> "<Dataset Name>" <sizeBytes> <rowCount> "<license>" [--file <path>]
# Example:
npm run cli -- --network preview register med-v1 "Medical Imaging 2026" 52428800 "12000" "CC-BY-4.0"

# Prove dataset integrity in zero-knowledge
npm run cli -- --network preview prove med-v1

# Toggle dataset visibility
npm run cli -- --network preview set-active med-v1 on

# Read public row count
npm run cli -- --network preview row-count med-v1

# Run end-to-end smoke tests against deployed contract
npm run test:e2e
```

---

## 🏗️ Project Structure

```
.
├── contracts/
│   ├── datasetRegistry.compact          # Compact ZK smart contract (circuits & ledger)
│   └── managed/datasetRegistry/         # Compiled ZKIR, proving keys & TypeScript bindings
├── src/
│   ├── network.ts                       # Network configs (Preview / Preprod / Devnet), BIP-39 wallet derivation
│   ├── wallet.ts                        # Midnight SDK wallet initialization, sync & DUST generation
│   ├── wallet-state.ts                  # Atomic on-disk encrypted wallet state serialization
│   ├── dataset.ts                       # SHA-256 slicing, commitments & witness providers
│   ├── contract-client.ts               # Midnight JS providers & witness wiring
│   ├── setup.ts                         # One-shot automated setup and deployment orchestrator
│   ├── deploy.ts                        # Direct deployment routine with retries & DUST balancing
│   ├── check-balance.ts                 # Wallet balance & DUST inspector
│   └── cli.ts                           # Interactive command-line interface
├── test/
│   ├── dataset.test.ts                  # Pure unit tests for dataset slicing & hashing
│   ├── network.test.ts                  # Tests for BIP-39 derivation, mnemonic normalization & flags
│   └── wallet-state.test.ts             # Persistence tests for wallet credentials & state files
├── scripts/
│   └── e2e-check.ts                     # End-to-end smoke test against deployed Preview contract
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DatasetExchange.tsx      # Main DApp UI (Browse, Register, Prove, Analytics)
│   │   │   └── WalletConnect.tsx        # Lace Wallet Connector & network validator
│   │   ├── hooks/
│   │   │   ├── useMidnight.ts           # DApp Connector hook (Window.midnight adapter)
│   │   │   └── useIndexer.ts            # Live GraphQL indexer polling & ledger decode hook
│   │   ├── App.tsx                      # Root application layout
│   │   └── index.css                    # Modern dark glassmorphism design system
│   ├── .env.example                     # Environment template
│   ├── vite.config.ts                   # Vite configuration
│   └── index.html                       # Application entry point
├── compose.yml                          # Docker stack (Midnight Node, Indexer, Proof Server)
├── package.json                         # Scripts & root dependencies
├── tsconfig.json                        # TypeScript compiler options
└── README.md                            # Project documentation
```

---

## 🧰 Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Smart Contract** | Compact | `0.23+` | Zero-knowledge smart contracts with public state & private witnesses |
| **ZK Proving** | Midnight Proof Server | `8.1.0` | Local ZK-SNARK proof generation over HTTP (`:6300`) |
| **Client SDK** | Midnight JS Contracts | `4.1.1` | Contract interaction, provider abstractions & transaction submission |
| **Wallet SDK** | Midnight Wallet SDK | `1.2.0` | UTXO management, unshielded balances & DUST token generation |
| **Key Derivation** | `@scure/bip39` | `2.2.0` | Lace-compatible 24-word BIP-39 mnemonic & seed derivation |
| **Indexer** | Midnight Indexer | `4.3.3` | GraphQL and WebSocket interface for live public ledger queries |
| **Frontend** | React + Vite + TypeScript | React 18, Vite 5 | Reactive marketplace UI with live indexer feeds & wallet connector |
| **Testing** | Vitest | `3.2.7` | Automated unit & integration testing (37 passing tests) |
| **Devnet Infrastructure** | Docker Compose | Compose v2 | Local node (:9944), indexer (:8088), and proof-server (:6300) |

---

## 🔒 Security & Privacy Notes

1. **State File Safety**: `.midnight-state.json` and `.midnight-wallet-state/` are gitignored — they hold private wallet seeds and mnemonics. File permissions are enforced with `0o600` (read/write by owner only).
2. **Witness Containment**: Private witnesses (`providerSecret` and `datasetSlices`) are evaluated strictly in client-side memory or local proof-server and are **never** logged, emitted in transactions, or transmitted over network endpoints.
3. **Disclose Boundary**: The Compact `disclose()` operator is used strictly on non-sensitive metadata (`datasetName`, `datasetSize`, `rowCount`, `license`) and cryptographic hashes (`dataCommitment`, `providerCommit`). Raw data never enters a `disclose()` scope.

---

## 📜 License

This project is licensed under the [MIT License](package.json).
