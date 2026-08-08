# 🌐 DataVault Exchange

**Privacy-Preserving, GDPR/CCPA-Compliant Decentralised Exchange for AI Training Datasets on the Midnight Network.**

DataVault Exchange resolves the fundamental compliance and trust dilemma in AI data markets: verifying dataset integrity and ownership in zero-knowledge without exposing raw training records on-chain or over public networks.

---

## ⚡ Quick Links & Live Deployments

| Resource | Link / Target | Description |
|---|---|---|
| 🚀 **Live DApp (Vercel)** | [https://ai-dataset-dex.vercel.app/](https://ai-dataset-dex.vercel.app/) | Production frontend deployed on Vercel connected to Midnight Preview |
| 🎥 **Demo Video** | [Watch on Loom](https://www.loom.com/share/06f0afedace648bf866668f6adc52aee) | Full walkthrough: Lace wallet connection + live ZK circuit execution |
| 📜 **Preview Contract Address** | `9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592` | Deployed and active on Midnight Preview Network |
| 👤 **Deployer Address** | `mn_addr_preview1j9t8qdl4s6chfddrts8al5v5z2s343ff845up9uf0l0p356g87zqkhpkn3` | Contract deployer & owner identity commitment |
| 🔍 **Preview Indexer (GraphQL)** | `https://indexer.preview.midnight.network/api/v4/graphql` | Live on-chain ledger state query endpoint |
| 🧪 **Test Suite** | `37/37 passing` (Vitest) | Comprehensive unit & integration coverage |

---

## 📹 Demo Video Walkthrough

> 🔗 **Loom Video Demo:** [https://www.loom.com/share/06f0afedace648bf866668f6adc52aee](https://www.loom.com/share/06f0afedace648bf866668f6adc52aee)

The demo video showcases the end-to-end user and cryptographic lifecycle on Midnight Preview:
1. **Lace Wallet Connection**: Connecting the Midnight Lace browser wallet extension to the DApp and querying the user's unshielded address and tNIGHT / DUST balances.
2. **Live On-Chain Dataset Discovery**: Real-time querying of active dataset listings from the Midnight Preview Indexer via GraphQL.
3. **In-Browser Dataset Slicing & Commitment**: Computing SHA-256 integrity commitments ($16 \times 32\text{ bytes}$) locally in client memory.
4. **Successful Zero-Knowledge Circuit Call (`proveIntegrity`)**: Generating a ZK-SNARK proof off-chain through the local proof server and submitting the proof to the Midnight network.
5. **Verifiable State Transition**: Observing on-chain verification and the increment of `verifiedCount` without a single byte of private dataset content ever leaving the user's machine.

---

## 🛡️ The Privacy Claim & Architecture

### The Core Problem in AI Data Markets

AI training corpora (medical patient records, financial transactions, proprietary NLP datasets, user telemetry) are strictly regulated under **GDPR (Articles 5, 6, 9)** and **CCPA/CPRA**.

- **Traditional Problem**: To sell or prove possession of a dataset, data providers must either:
  1. Share raw files with prospective buyers or intermediaries (risking copyright leakage, regulatory fines, and data resale).
  2. Rely on centralized trusted escrow agents (creating single points of failure and compliance liability).
- **The DataVault Guarantee**: DataVault Exchange allows providers to register public dataset metadata and prove ownership/integrity **mathematically in zero-knowledge**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRIVATE REALM (Off-Chain)                               │
│                                                                                         │
│   Raw AI Training Data               Provider Secret Key                                │
│   (e.g., medical CSVs, PII)          (32-byte secret seed)                              │
│             │                                  │                                        │
│             ▼                                  ▼                                        │
│   ┌────────────────────┐             ┌────────────────────┐                             │
│   │   datasetSlices()  │             │  providerSecret()  │   Private Witnesses         │
│   │ (Vector<16, B32>)  │             │    (Bytes<32>)     │   (TypeScript / Browser)    │
│   └─────────┬──────────┘             └─────────┬──────────┘                             │
│             │                                  │                                        │
│             ▼                                  ▼                                        │
│   ┌────────────────────────────────────────────────────────┐                            │
│   │               Local Proof-Server (:6300)               │                            │
│   │  - Evaluates Compact ZK circuits                       │                            │
│   │  - Computes persistentHash() commitments               │                            │
│   │  - Discards raw witness data immediately after proving │                            │
│   └───────────────────────────┬────────────────────────────┘                            │
└───────────────────────────────┼─────────────────────────────────────────────────────────┘
                                │  Generates Zero-Knowledge Proof (ZK-SNARK)
                                │  (Zero raw data transmitted)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PUBLIC REALM (On-Chain)                                 │
│                                                                                         │
│   Midnight Preview Ledger / Indexer GraphQL                                             │
│                                                                                         │
│   • ownerCommit      → hash(providerSecret)                                             │
│   • dataCommitment   → hash(datasetSlices) [Integrity Anchor]                           │
│   • public metadata  → datasetName, datasetSize, rowCount, license                      │
│   • isActive         → boolean marketplace visibility flag                              │
│   • verifiedCount    → counter incremented upon successful ZK proof                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Public State vs. Private Witness Matrix

Midnight enforces a strict architectural boundary between **On-Chain Public State** and **Off-Chain Private Witnesses**:

| Dimension | Item | Classification | Where It Resides | Visibility & Leakage Guarantee |
|---|---|---|---|---|
| **Data Payload** | Raw Training Data / CSV / Parquet | **Private Witness** | Local filesystem / Browser memory | **0 bytes on-chain**. Never touches mempool, ledger, blocks, indexer, or network. |
| **Identity** | Provider Secret Key | **Private Witness** | Local keystore | **Never revealed**. Only its cryptographic commitment `ownerCommit` is published. |
| **Integrity Anchor** | `dataCommitment` | **Public Ledger State** | Midnight Ledger (`DataListing`) | 32-byte SHA-256 root hash of the 16 dataset slices. |
| **Listing Metadata** | Name, Size, Rows, License | **Public Ledger State** | Midnight Ledger (`DataListing`) | Publicly indexable for search, filtering, and marketplace discovery. |
| **Verification Score** | `verifiedCount` | **Public Ledger State** | Midnight Ledger (`Counter`) | Public integer tallying verified zero-knowledge proof submissions. |
| **Access Control** | `isActive` | **Public Ledger State** | Midnight Ledger (`DataListing`) | Boolean flag toggled exclusively via owner ZK signature. |

---

### How Zero-Knowledge Integrity Verification Works

When a data provider or holder proves integrity via `proveIntegrity(datasetId)`:

1. **Witness Provisioning (Off-Chain)**: The local client reads the raw dataset slices ($16 \times 32\text{ bytes}$) from private storage and passes them into the witness function `datasetSlices(datasetId)`.
2. **Local Circuit Execution**: The local proof server evaluates the Compact circuit logic in zero-knowledge:
   $$\text{anchor} = \text{persistentHash}(\text{datasetSlices})$$
   $$\text{assert}(\text{anchor} == \text{registry}[\text{datasetId}].\text{dataCommitment})$$
3. **ZK-SNARK Generation**: The proof server generates a cryptographic proof certifying:
   > *"I possess a set of private dataset slices whose SHA-256 commitment exactly equals the on-chain `dataCommitment` registered under `datasetId`."*
4. **On-Chain State Transition**: The Midnight ledger verifier verifies the SNARK proof. If valid, the ledger atomically increments `verifiedCount`.
5. **Zero Data Retention**: The raw dataset slices are purged from execution memory immediately. The validator node and block explorer only record the proof verification event and counter increment.

---

## 🔍 On-Chain Verifiable Deployment (Midnight Preview)

The smart contract is deployed on the **Midnight Preview Network** and verifiable on-chain:

- **Contract Address:** `9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592`
- **Deployer Public Address:** `mn_addr_preview1j9t8qdl4s6chfddrts8al5v5z2s343ff845up9uf0l0p356g87zqkhpkn3`
- **Network ID:** `preview`
- **Indexer Endpoint:** `https://indexer.preview.midnight.network/api/v4/graphql`

### Verifying via GraphQL

You can query the deployed contract state directly from the Midnight Preview GraphQL indexer:

```graphql
query QueryDataVaultContract {
  contract(address: "9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592") {
    address
    state
  }
}
```

Or using `curl`:

```bash
curl -X POST https://indexer.preview.midnight.network/api/v4/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ contract(address: \"9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592\") { address state } }"}'
```

### Verifying via CLI

```bash
# List all verified datasets on the deployed preview contract
npm run cli -- --network preview list

# Query public row count and status for a registered dataset
npm run cli -- --network preview row-count med-v1
```

---

## ⚡ Smart Contract Circuits (`contracts/datasetRegistry.compact`)

The Compact smart contract defines **4 provable ZK circuits**:

```typescript
// contracts/datasetRegistry.compact

struct DataListing {
  providerCommit: Bytes<32>;    // Hash of provider secret key
  dataCommitment: Bytes<32>;    // Public integrity anchor: hash(slices)
  datasetName: Opaque<"string">;// Dataset title
  datasetSize: Uint<64>;        // Byte size
  rowCount: Opaque<"string">;   // Claimed row count
  license: Opaque<"string">;    // Dataset license
  isActive: Boolean;            // Marketplace visibility toggle
};

export ledger registry: Map<Bytes<32>, DataListing>;
export ledger ownerCommit: Bytes<32>;
export ledger verifiedCount: Counter;
```

| Circuit | Execution Mode | Description |
|---|---|---|
| `registerDataset` | Owner ZK Circuit | Hashes private dataset slices into `dataCommitment` and records metadata in `registry`. |
| `proveIntegrity` | Public ZK Circuit | Proves in zero-knowledge that the caller holds the exact dataset matching `dataCommitment`; increments `verifiedCount`. |
| `setActive` | Owner ZK Circuit | Toggles dataset visibility (`isActive`) while verifying owner secret in ZK. |
| `readRowCount` | Pure Public Read | Queries and verifies dataset existence on-chain and returns `rowCount`. |

---

## 🛠️ Local Development & Quickstart

### Prerequisites

- **Node.js** ≥ 22.0.0 (`node --version`)
- **npm** ≥ 10.0.0 (`npm --version`)
- **Docker & Docker Desktop** (`docker ps`)
- **Compact Compiler** (`compact --version` — see [Midnight Docs](https://docs.midnight.network))

---

### Step 1: Clone and Install

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

### Step 2: Start Proof Server

Midnight contracts require a local proof-server container to evaluate ZK circuits:

```bash
# Start the proof-server container on port 6300
docker compose up -d proof-server

# Verify container status
docker ps --filter "name=datavault-proof-server"
```

---

### Step 3: Compile Smart Contracts

Compile the Compact smart contract to generate ZKIR circuits, verification keys, and TypeScript bindings:

```bash
npm run compile
```

Outputs are generated in `contracts/managed/datasetRegistry/`.

---

### Step 4: Run Automated Tests

Execute the test suite covering dataset slicing, cryptographic hashing, BIP-39 wallet derivation, and state management:

```bash
npm test
```

```
 RUN  v3.2.7
 ✓ test/wallet-state.test.ts (7 tests)
 ✓ test/dataset.test.ts (9 tests)
 ✓ test/network.test.ts (21 tests)

 Test Files  3 passed (3)
      Tests  37 passed (37)
```

---

### Step 5: Run Full-Stack Automated Setup (Preview Network)

Run the automated orchestrator to generate a wallet, sync with Preview, fund via faucet, mint DUST tokens, and deploy:

```bash
npm run setup -- --network preview
```

---

### Step 6: Configure and Run Frontend

Ensure `frontend/.env.local` contains:

```env
VITE_NETWORK=preview
VITE_CONTRACT_ADDRESS=9d8bb1b1ede579d5c47c5fafdf7d81f8549a3db14b4c6cdee034c3e7697f7592
VITE_INDEXER_URL=https://indexer.preview.midnight.network/api/v4/graphql
VITE_INDEXER_WS_URL=wss://indexer.preview.midnight.network/api/v4/graphql/ws
```

Start the Vite development server:

```bash
npm run frontend:dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧰 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **ZK Smart Contract** | Compact (`>= 0.23`) | Zero-knowledge smart contracts with dual public/private state model |
| **ZK Prover Engine** | Midnight Proof Server (`8.1.0`) | Local zero-knowledge proof generation container (:6300) |
| **Blockchain Client SDK** | Midnight JS Contracts (`4.1.1`) | Typed contract client, witness wiring & transaction submission |
| **Wallet & DUST SDK** | Midnight Wallet SDK (`1.2.0`) | Unshielded UTXO balances & DUST token generation |
| **Key Derivation** | `@scure/bip39` (`2.2.0`) | 24-word BIP-39 mnemonic & deterministic seed derivation |
| **Ledger Indexer** | Midnight Preview Indexer (`4.3.3`) | GraphQL & WebSocket interface for real-time ledger queries |
| **Frontend Framework** | React 18 + Vite 5 + TypeScript | Reactive marketplace UI with Lace wallet connector & glassmorphic design |
| **Unit & Integration Tests** | Vitest (`3.2.7`) | 37 automated tests across network, crypto, and state serialization |
| **Cloud Hosting** | Vercel | Production edge deployment of the DApp frontend |

---

## 🔒 Security & Privacy Practices

1. **Witness Isolation**: Private witnesses (`providerSecret` and `datasetSlices`) are computed exclusively within local client memory and the local proof server container. They are never serialized into transaction payloads or network messages.
2. **Cryptographic Integrity Anchors**: Datasets are partitioned into $16 \times 32$-byte chunks and anchored via SHA-256 commitments. Buyers can verify mathematical consistency without accessing the raw data before settlement.
3. **Disclose Boundary**: Compact's `disclose()` operator is applied strictly to non-sensitive listing metadata and cryptographic hashes. Raw data never enters a `disclose()` scope.
4. **State File Permissions**: Local wallet seed files (`.midnight-state.json` and `.midnight-wallet-state/`) are protected with strict OS permissions (`0o600`) and gitignored to prevent credential leakage.

---

## 📜 License

This project is licensed under the [MIT License](package.json).
