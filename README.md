# Proxy (Privpay)

A programmable delegation infrastructure deployed on the **Sui blockchain**. Proxy allows users to grant highly constrained, granular transaction permissions (financial, governance, operational, or legal) to secondary wallets, automated bots, or AI agents without ever sharing private keys.

---

## 🚀 Key Features

*   **Secure Wallet Connection:** Integrated via `@mysten/dapp-kit` for seamless authentication and transaction signing.
*   **Granular On-Chain Delegation:** Mint `DelegationObject`s with custom budgets (in SUI/MIST), expiration timestamps, and recursive sub-delegation depth limits.
*   **Decentralized Evidence Storage (Walrus):** Upload legal/agreement documents to the Walrus network. The resulting immutable Blob ID is anchored directly to the on-chain delegation object for absolute auditability.
*   **Interactive Ledger Dashboard:** View and manage delegations you have granted and authorities delegated to you, featuring real-time health score metrics and certificate canvas export.
*   **Hold-to-Confirm Revocation:** A safety-first, 1.5-second hold-action confirmation mechanism to prevent accidental revocation of delegations.
*   **Pause & Resume State Machine:** Instantly pause or resume delegations on-chain to temporarily suspend a delegate's authority.
*   **DeFi Action Execution (DeepBook):** Simulate the execution of delegated funds through DeepBook swap operations.
*   **VM Sandbox Query Terminal:** Perform dry-run authorization checks (`is_authorized`) against the live network via Sui's `devInspectTransactionBlock` without gas costs.
*   **Cryptographic Verifier:** Validate the integrity of off-chain agreements by comparing hashes directly against the Walrus storage network.

---

## 🛠️ Technology Stack

*   **Frontend Framework:** Next.js (App Router)
*   **Blockchain Integration:** `@mysten/sui` (Sui TypeScript SDK) & `@mysten/dapp-kit`
*   **State Management:** Zustand (Client-side state) & React Query (RPC state caching)
*   **Styling & Motion:** Tailwind CSS, Framer Motion, and AOS (Animate on Scroll)
*   **Decentralized Storage:** Walrus Protocol (Testnet API)
*   **Smart Contracts:** Move (Sui Move bytecode under `proxy-contracts/`)

---

## 📂 Project Architecture

```
privpay/
├── proxy-contracts/          # Move Smart Contracts (Sui)
│   ├── sources/
│   │   └── delegation.move   # Core delegation and validation logic
│   ├── Move.toml             # Move package definition
│   └── Published.toml        # Deployed package parameters
├── src/                      # Next.js Web Application
│   ├── app/                  # App Router Pages & Pages API
│   │   ├── app/              # Dashboard, Create, Execute, Sandbox, Verify
│   │   └── layout.tsx
│   ├── components/           # UI Components (Cards, Graphs, Modals)
│   ├── hooks/                # React custom hooks (Transaction execution, SuiNS)
│   ├── lib/                  # State stores, Sui SDK clients, utilities
│   │   ├── sui.ts            # Sui JSON-RPC Client & Transaction builders
│   │   ├── state.ts          # Zustand global UI state store
│   │   └── constants.ts      # Deployed Package IDs and Object IDs
└── package.json              # Project dependencies
```

---

## ⚙️ Setup & Development

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org) (v18+) and [npm](https://npmjs.com) installed.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory and configure the environment variables:

```env
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_PROXY_PACKAGE_ID=0x... (Your deployed proxy contract package ID)
```

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in the browser.

### 5. Build for Production

To build the application and check for compile/type errors:

```bash
npm run build
```

---

## 📦 Smart Contract Details (`proxy-contracts`)

The core Move module contains the struct `DelegationObject` containing the following fields:
*   `id: UID` — Unique object identifier
*   `delegator: address` — Wallet granting the authority
*   `delegate: address` — Wallet authorized to use it
*   `delegation_type: u8` — `0 = Financial`, `1 = Governance`, `2 = Operational`, `3 = Legal`
*   `scope_limit: u64` — Maximum allowed budget in MIST (for financial delegations)
*   `spent: u64` — Running total of spent MIST
*   `expiry: u64` — Expiration epoch timestamp in milliseconds (`0 = No Expiry`)
*   `status: u8` — `0 = Active`, `1 = Revoked`, `3 = Paused`
*   `depth_remaining: u8` — Number of times the delegate can sub-delegate this authority
*   `evidence_hash: String` — Walrus Blob ID containing immutable proof of the delegation terms

---

## 🛡️ License

This project is licensed under the MIT License.
