# Proxy — Programmable On-Chain Delegation Infrastructure

> **Trustless, non-custodial authority delegation on the Sui blockchain.**
> Grant financial, governance, operational, or legal authority to any wallet — with hard constraints enforced in Move bytecode, and immutable evidence anchored on Walrus.

[![Next.js](https://img.shields.io/badge/Next.js-16.2.7-black?logo=nextdotjs)](https://nextjs.org/)
[![Sui](https://img.shields.io/badge/Sui-Testnet-4da2ff?logo=sui)](https://sui.io/)
[![Move](https://img.shields.io/badge/Language-Move-blueviolet)](https://docs.sui.io/build/move)
[![Walrus](https://img.shields.io/badge/Storage-Walrus-orange)](https://walrus.xyz/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Value Proposition](#2-core-value-proposition)
3. [Live Architecture Diagram](#3-live-architecture-diagram)
4. [Repository Structure](#4-repository-structure)
5. [Smart Contract Deep Dive](#5-smart-contract-deep-dive)
   - [DelegationObject Struct](#delegationobject-struct)
   - [Entry Functions](#entry-functions)
   - [Error Codes](#error-codes)
   - [Read-Only Functions](#read-only-functions)
6. [Frontend Application — Pages & Features](#6-frontend-application--pages--features)
   - [/ — Landing Page](#---landing-page)
   - [/app/delegations — Authority Ledger Dashboard](#appdelegations--authority-ledger-dashboard)
   - [/app/create — Create Delegation Wizard](#appcreate--create-delegation-wizard)
   - [/app/defi — DeFi Action Executor](#appdefi--defi-action-executor)
   - [/app/query — VM Sandbox Query Terminal](#appquery--vm-sandbox-query-terminal)
   - [/app/verify — Cryptographic Verification Terminal](#appverify--cryptographic-verification-terminal)
   - [/app/subdelegate/[objectId] — Sub-Delegation](#appsubdelegateobjectid--sub-delegation)
   - [/app/delegations/[objectId]/audit — Audit Page](#appdelegationsobjectidaudit--audit-page)
   - [/explore — Global Explorer](#explore--global-explorer)
7. [Core Libraries](#7-core-libraries)
   - [sui.ts — Blockchain Client & Transaction Builders](#suits--blockchain-client--transaction-builders)
   - [walrus.ts — Decentralized Evidence Storage](#walrusts--decentralized-evidence-storage)
   - [suins.ts — SuiNS Name Resolution](#suinsts--suins-name-resolution)
   - [state.ts — Zustand Global Store](#statets--zustand-global-store)
   - [constants.ts — Configuration & Package IDs](#constantsts--configuration--package-ids)
   - [hash.ts — Cryptographic Utilities](#hashts--cryptographic-utilities)
   - [certificate.tsx — PDF/PNG Certificate Generator](#certificatetsx--pdfpng-certificate-generator)
8. [React Hooks](#8-react-hooks)
9. [Shared UI Components](#9-shared-ui-components)
10. [User Roles & Permission Model](#10-user-roles--permission-model)
11. [Complete User Flows](#11-complete-user-flows)
12. [External API Reference](#12-external-api-reference)
13. [Business Logic & Algorithms](#13-business-logic--algorithms)
14. [Security Model](#14-security-model)
15. [Environment Variables](#15-environment-variables)
16. [Setup & Development Guide](#16-setup--development-guide)
17. [Deployment](#17-deployment)
18. [Testnet Status & Maturity](#18-testnet-status--maturity)

---

## 1. Overview

**Proxy** (codenamed *Privpay*) is a programmable delegation infrastructure deployed on the [Sui blockchain](https://sui.io/). The protocol enables a **Delegator** wallet to grant constrained, time-limited authority to a **Delegate** wallet without ever sharing private keys or giving up custody.

Each delegation is represented as an owned **`DelegationObject`** — a Move struct living in Sui's object model. Constraints such as spending limits, expiry timestamps, delegation types, and recursive depth are immutably encoded inside the object at creation time and enforced atomically by the Move VM on every execution attempt.

Off-chain evidence documents (legal agreements, DAO proposals, or audit trails) are pinned to the [Walrus](https://walrus.xyz/) decentralized storage network. Their Blob IDs are sealed into the on-chain object, creating an unbreakable, bi-directional proof chain between the blockchain and decentralized storage.

**Target Users:**
- DeFi power users running automated trading bots
- DAOs managing sub-treasuries with constrained multisigs
- Enterprise organizations requiring verifiable on-chain authorizations
- Legal entities needing cryptographically verifiable Powers of Attorney
- AI agents executing transactions within strict programmatic budgets

---

## 2. Core Value Proposition

| Problem | Proxy Solution |
|---|---|
| Sharing private keys to allow bots/agents to trade | Grant a `Financial` delegation with a SUI spending cap — the key stays secret |
| Trusting a DAO subcommittee with treasury funds | Create a delegation with a hard scope limit enforced in Move bytecode |
| Proving authority delegation in a dispute | Immutable evidence Blob ID sealed on-chain, retrievable forever via Walrus |
| Preventing accidental over-spending | `spent + amount <= scope_limit` assertion prevents any overage, period |
| Needing to pause an agent's authority temporarily | `pause()` / `unpause()` toggling without revoking the object |

---

## 3. Live Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (Next.js SPA)                         │
│                                                                   │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐  │
│  │ @mysten/     │  │  React Pages & Components                │  │
│  │ dapp-kit     │  │  (App Router, TailwindCSS, Framer Motion)│  │
│  │ (Wallet Std) │  │                                           │  │
│  └──────┬───────┘  └────────────────┬────────────────────────┘  │
│         │                            │                            │
│         │         ┌──────────────────┴──────────────────────┐   │
│         │         │           Core Libraries                  │   │
│         │         │  sui.ts · walrus.ts · suins.ts · state.ts│   │
│         │         └──────────────────┬──────────────────────┘   │
└─────────┼────────────────────────────┼─────────────────────────-┘
          │                            │
          ▼                            ▼
┌─────────────────┐       ┌────────────────────────┐
│   Sui Wallet    │       │   Sui Testnet RPC Node   │
│ (Nightly, Sui   │       │   fullnode.testnet.sui.io│
│  Wallet, etc.)  │       │                          │
└────────┬────────┘       │  ┌─────────────────────┐│
         │ sign tx        │  │   proxy::delegation  ││
         └───────────────►│  │   Move Module        ││
                          │  │   Package:           ││
                          │  │   0xc21e43a3...      ││
                          │  └─────────────────────┘│
                          └────────────────────────┘
                                       │
                                       │ evidence_hash
                                       ▼
                          ┌─────────────────────────┐
                          │  Walrus Testnet          │
                          │  Publisher + Aggregator  │
                          │  (Blob storage, 50 epochs)│
                          └─────────────────────────┘
                                       │
                                       │ reverse resolve
                                       ▼
                          ┌─────────────────────────┐
                          │  SuiNS                   │
                          │  (Address → .sui name)   │
                          └─────────────────────────┘
```

---

## 4. Repository Structure

```
privpay/
├── proxy-contracts/                    # Move Smart Contracts
│   ├── sources/
│   │   └── delegation.move             # Core delegation module (221 lines)
│   ├── build/proxy/                    # Compiled bytecode artifacts
│   ├── Move.toml                       # Package definition (edition 2024.beta)
│   ├── Move.lock                       # Dependency lock file
│   └── Published.toml                  # Deployed package address on testnet
│
├── src/                                # Next.js App Router application
│   ├── app/
│   │   ├── layout.tsx                  # Root HTML shell, font providers
│   │   ├── page.tsx                    # Root redirect → /app or landing
│   │   ├── globals.css                 # Global Tailwind + custom animation styles
│   │   ├── app/
│   │   │   ├── layout.tsx              # Authenticated shell: Sidebar + Topbar
│   │   │   ├── page.tsx                # /app redirect
│   │   │   ├── loading.tsx             # Suspense fallback
│   │   │   ├── create/page.tsx         # Delegation minting wizard
│   │   │   ├── delegations/
│   │   │   │   ├── page.tsx            # Ledger dashboard (cards + D3 graph)
│   │   │   │   └── [objectId]/audit/   # Deep audit view for a single object
│   │   │   ├── defi/page.tsx           # DeepBook atomic swap executor
│   │   │   ├── execute/page.tsx        # Generic execute_action page
│   │   │   ├── query/page.tsx          # devInspect VM sandbox terminal
│   │   │   ├── verify/page.tsx         # Cryptographic verification terminal
│   │   │   └── subdelegate/[objectId]/ # Sub-delegation wizard
│   │   ├── explore/page.tsx            # Global delegation explorer (all txs)
│   │   └── verify/[objectId]/page.tsx  # Public shareable verify URL
│   │
│   ├── components/
│   │   ├── AosInit.tsx                 # AOS scroll animation initializer
│   │   ├── app/
│   │   │   ├── DelegationCard.tsx      # Full delegation display card (578 lines)
│   │   │   ├── DelegationGraph.tsx     # D3-powered force graph visualization
│   │   │   ├── ExecuteModal.tsx        # Execute action modal dialog
│   │   │   ├── ObjectPreview.tsx       # Live preview during creation
│   │   │   ├── OnboardingOverlay.tsx   # First-visit onboarding carousel
│   │   │   ├── ScopeBar.tsx            # Spent/limit progress bar component
│   │   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   │   ├── SuiProviders.tsx        # Sui wallet + React Query providers
│   │   │   └── Topbar.tsx              # Top navigation with notifications
│   │   ├── landing/
│   │   │   ├── CTA.tsx                 # Call to action section
│   │   │   ├── DelegationTypes.tsx     # Four delegation type cards
│   │   │   ├── DemoSection.tsx         # Interactive demo section
│   │   │   ├── Features.tsx            # Feature highlights grid
│   │   │   ├── Footer.tsx              # Site footer
│   │   │   ├── Hero.tsx                # Hero banner with tagline
│   │   │   ├── HowItWorks.tsx          # 3-step explainer
│   │   │   ├── LiveFeed.tsx            # Real-time delegation activity ticker
│   │   │   └── Navbar.tsx              # Landing page navigation
│   │   └── shared/
│   │       ├── AddressBadge.tsx        # SuiNS-resolved address display
│   │       ├── BlobLink.tsx            # Walrus blob ID hyperlink
│   │       ├── DeploymentGate.tsx      # Gate shown when contract is undeployed
│   │       ├── ExplorerLink.tsx        # SuiScan explorer link button
│   │       ├── PrivPayLoader.tsx       # Animated loading spinner
│   │       ├── StatusBadge.tsx         # Active/Revoked/Paused/Expired badge
│   │       └── WalletButton.tsx        # Connect/disconnect wallet button
│   │
│   ├── hooks/
│   │   ├── useProxyTransaction.ts      # Transaction signing & execution hook
│   │   └── useSuiNS.ts                 # SuiNS name resolution React hooks
│   │
│   └── lib/
│       ├── certificate.tsx             # Canvas-based delegation certificate generator
│       ├── constants.ts                # Package IDs, Walrus URLs, network config
│       ├── hash.ts                     # SHA-256 via Web Crypto API
│       ├── state.ts                    # Zustand UI state store + DelegationObject type
│       ├── sui.ts                      # SuiJsonRpcClient, tx builders, RPC queries
│       ├── suins.ts                    # SuiNS forward + reverse resolution
│       ├── utils.ts                    # Tailwind class merging utilities
│       └── walrus.ts                   # Walrus upload/fetch/URL helpers
│
├── .env.local                          # Local environment variables (gitignored)
├── next.config.ts                      # Next.js config (Turbopack)
├── tsconfig.json                       # TypeScript config (strict, bundler resolution)
├── package.json                        # Dependencies & scripts
└── AGENTS.md                           # Agent/AI coding rules for this repo
```

---

## 5. Smart Contract Deep Dive

**Module:** `proxy::delegation`  
**Package ID (Testnet):** `0xc21e43a3672638aa30311002b34551b629ab98af2d8924dcfbbcfd483e1c5b10`  
**Move Edition:** `2024.beta`  
**Source:** [`proxy-contracts/sources/delegation.move`](proxy-contracts/sources/delegation.move)

### DelegationObject Struct

```move
public struct DelegationObject has key, store {
    id: UID,               // Unique Sui object identifier
    delegator: address,    // Wallet that created and controls this delegation
    delegate: address,     // Wallet authorized to act under this delegation
    delegation_type: u8,   // 0=Financial | 1=Governance | 2=Operational | 3=Legal
    scope_limit: u64,      // Max authorized amount in MIST (1 SUI = 1_000_000_000 MIST)
    spent: u64,            // Running accumulator of MIST spent so far
    expiry: u64,           // Expiration timestamp in milliseconds (0 = perpetual)
    status: u8,            // 0=Active | 1=Revoked | 3=Paused
    depth_remaining: u8,   // Number of further sub-delegations allowed
    evidence_hash: String, // Walrus Blob ID anchoring the off-chain agreement
    created_at: u64,       // Creation timestamp in milliseconds (from Sui Clock)
}
```

**Object Ownership:** Created objects are immediately `transfer::transfer`-ed to the `delegate` address. This means the delegate **owns** the object but the **delegator retains control** (revoke, pause) because the Move entry functions assert `tx_context::sender(ctx) == delegation.delegator`.

### Entry Functions

| Function | Caller | Description |
|---|---|---|
| `create_delegation(delegate, type, scope_limit, expiry, depth, evidence_hash, clock, ctx)` | **Delegator** | Mints a new `DelegationObject` and transfers it to the delegate. The `evidence_hash` is a `vector<u8>` (UTF-8 encoded Walrus Blob ID). |
| `execute_action(delegation, amount, clock, ctx)` | **Delegate** | Records a spend of `amount` MIST. Asserts sender == delegate, status == ACTIVE, not expired, and `spent + amount <= scope_limit`. |
| `execute_defi_action(delegation, amount, clock, ctx)` | **Delegate** | Like `execute_action` but additionally asserts `delegation_type == 0` (Financial). Used as the authorization gate for DeepBook swaps. |
| `revoke(delegation, ctx)` | **Delegator** | Sets `status = STATUS_REVOKED (1)`. Irreversible. |
| `pause(delegation, ctx)` | **Delegator** | Sets `status = STATUS_PAUSED (3)`. Delegate cannot execute while paused. Asserts currently ACTIVE. |
| `unpause(delegation, ctx)` | **Delegator** | Sets `status = STATUS_ACTIVE (0)`. Asserts currently PAUSED. |
| `sub_delegate(parent, new_delegate, scope_limit, expiry, clock, ctx)` | **Delegate** | Creates a child `DelegationObject` with `depth_remaining - 1`. Child's `scope_limit <= parent.scope_limit` and `expiry <= parent.expiry` are asserted. |

### Error Codes

| Code | Constant | Meaning |
|---|---|---|
| `0` | `E_NOT_DELEGATOR` | Transaction sender is not the delegator |
| `1` | `E_NOT_DELEGATE` | Transaction sender is not the delegate |
| `2` | `E_DELEGATION_REVOKED` | Delegation has been permanently revoked |
| `3` | `E_DELEGATION_EXPIRED` | Current clock time ≥ expiry timestamp |
| `4` | `E_SCOPE_LIMIT_EXCEEDED` | `spent + amount > scope_limit` |
| `5` | `E_NO_SUBDELEGATION_DEPTH` | `depth_remaining == 0`, no further delegation allowed |
| `6` | `E_INVALID_SUBDELEGATION_SCOPE` | Child scope_limit exceeds parent |
| `7` | `E_INVALID_SUBDELEGATION_EXPIRY` | Child expiry exceeds parent |
| `8` | `E_ALREADY_PAUSED` | Attempted to pause an already paused delegation |
| `9` | `E_NOT_PAUSED` | Attempted to unpause an active delegation |
| `10` | `E_DELEGATION_PAUSED` | Attempted to execute on a paused delegation |

### Read-Only Functions

```move
// Primary authorization check — callable by any protocol
public fun is_authorized(delegation: &DelegationObject, amount: u64, clock: &Clock, ctx: &TxContext): bool

// Individual field accessors
public fun get_delegator(d: &DelegationObject): address
public fun get_delegate(d: &DelegationObject): address
public fun get_status(d: &DelegationObject): u8
public fun get_scope_limit(d: &DelegationObject): u64
public fun get_spent(d: &DelegationObject): u64
public fun get_expiry(d: &DelegationObject): u64
public fun get_depth_remaining(d: &DelegationObject): u8
public fun get_evidence_hash(d: &DelegationObject): &String
public fun get_delegation_type(d: &DelegationObject): u8
public fun get_created_at(d: &DelegationObject): u64
```

The `is_authorized()` function is the protocol integration point — any other Sui Move module can call it to verify whether a given delegation allows a proposed action.

---

## 6. Frontend Application — Pages & Features

### `/` — Landing Page

The public-facing marketing page. Composed of:
- **`Navbar`** — Logo + connect wallet button + navigation links
- **`Hero`** — Bold tagline, animated gradient background, primary CTA
- **`LiveFeed`** — Polls the Sui RPC for recent `create_delegation` transactions and displays them in a live ticker
- **`Features`** — Card grid explaining the four delegation types and core features
- **`HowItWorks`** — 3-step visual explainer: Create → Delegate → Execute
- **`DelegationTypes`** — Tabbed showcase of Financial, Governance, Operational, Legal
- **`DemoSection`** — Interactive animated demo section
- **`CTA`** — Final call-to-action to launch the app
- **`Footer`** — Links, brand, legal

---

### `/app/delegations` — Authority Ledger Dashboard

**Auth required:** Wallet connection  
**Source:** [`src/app/app/delegations/page.tsx`](src/app/app/delegations/page.tsx)

The primary dashboard. Split into two sections:

**"Delegations You Granted"** — fetched by querying `queryTransactionBlocks` filtered by `proxy::delegation::create_delegation`, then cross-referencing the `objectChanges` to find created `DelegationObject` IDs from your address's transactions.

**"Authority Delegated To You"** — fetched via `getOwnedObjects` filtering by `StructType: proxy::delegation::DelegationObject`.

**Features:**
- **Stats Bar** — 4 animated metric cards: Active count, Total Objects, Total Budget (SUI), Total Spent (SUI)
- **Expiry Warning Banner** — Automatically appears when any active delegation expires within 72 hours. Dismissible.
- **Search** — Live filter by Object ID, delegator address, or delegate address
- **Type Filters** — ALL / Financial / Governance / Operational / Legal pill buttons
- **View Toggle** — Switch between **Ledger** (card grid) and **Graph** (D3 force-directed) views
- **Skeleton Loaders** — Pulsing card placeholders during data fetching
- **Empty States** — Contextual empty state for no delegations and for no search results

**DelegationCard** features (per card):
- Health Score ring (0–100%) with dynamic color coding (green/amber/red)
- Delegator → Delegate identity strip with SuiNS resolution
- Scope bar (spent / limit visual progress)
- Expiry countdown in days
- Activity Log (last 3 on-chain transactions for this object ID)
- Certificate download (PNG via Canvas API)
- Revoke button (1.5-second hold-to-confirm mechanism)
- Pause / Unpause button (delegator only)
- Copy Object ID to clipboard
- SuiScan explorer link
- Share receipt button

**DelegationGraph** (D3 visualization):
- Force-directed graph with wallet addresses as nodes and delegations as directed edges
- Connected wallet highlighted with a special node color
- Hover tooltips showing delegation type and amounts
- Zoom and pan support

---

### `/app/create` — Create Delegation Wizard

**Auth required:** Wallet connection  
**Source:** [`src/app/app/create/page.tsx`](src/app/app/create/page.tsx)

A full-width split-panel wizard for minting new `DelegationObject`s.

**Left Panel — Form:**

1. **Quick Templates** — One-click preset configs:
   - `DAO Treasury` — Financial · 10,000 SUI · 90 days · Depth 1
   - `Corporate Signing` — Legal · Unlimited · 365 days · Depth 2
   - `Medical POA` — Operational · Unlimited · 180 days · Depth 0

2. **Delegation Type** — 4-button toggle: Financial / Governance / Operational / Legal

3. **Delegate Address** — Text field accepting both raw `0x...` addresses and `.sui` SuiNS names. When a `.sui` name is entered, the app resolves it in real-time via the `useSuiNSAddress` hook and displays the resolved address.

4. **Spending Limit (SUI)** — Only shown for Financial type. Validates `> 0`.

5. **Expiry (days)** — Converts to milliseconds timestamp: `Date.now() + days * 86_400_000`. Leave empty for perpetual.

6. **Sub-delegation Depth** — Button group: 0, 1, 2, 3

7. **Evidence Document Upload** — Drag-and-drop or click-to-browse file picker (PDF, PNG, DOCX, any format, max 10 MB). On file selection, the file is immediately uploaded to Walrus via `PUT /v1/blobs?epochs=50`. States:
   - `IDLE` — Upload prompt
   - `UPLOADING` — Loading indicator
   - `SUCCESS` — Shows Blob ID + WalrusScan link
   - `ERROR` — Error message + "Try Again" button

8. **Submit & Seal Delegation** — Disabled until Walrus upload succeeds. Calls `buildCreateDelegationTx()` → `execute()` → displays success.

**Right Panel — ObjectPreview:**
- A live-updating `DelegationCard` in PREVIEW mode showing exactly what the object will look like on-chain, reflecting all current form values in real time.
- After mint: transforms into the final delegation card with Object ID, tx digest, and WalrusScan link, plus a Share Receipt button.

---

### `/app/defi` — DeFi Action Executor

**Auth required:** Wallet connection + Financial delegation ownership  
**Source:** [`src/app/app/defi/page.tsx`](src/app/app/defi/page.tsx)

The DeFi integration page composing the Proxy authorization check with a DeepBook V2 atomic swap in a single Programmable Transaction Block (PTB).

**Flow:**
1. App checks if the connected wallet owns a `DeepBook::custodian_v2::AccountCap`. If not, offers a one-time setup button to create one.
2. Fetches all Financial + Active `DelegationObject`s owned by the connected wallet.
3. User selects a delegation from the list (shows limit/spent).
4. User enters a SUI swap amount.
5. On submit:
   - Calls `queryIsAuthorized()` (devInspect) as a pre-flight check.
   - If authorized, constructs the composed PTB using `buildDeepBookSwapTx()` containing:
     - **Command 1:** `proxy::delegation::execute_defi_action` — validates + records spend
     - **Command 2:** `deepbook::clob_v2::swap_exact_base_for_quote` — executes SUI→USDC swap
   - Displays an atomic transaction preview panel showing both commands and their arguments.

**Atomic Guarantee:** If `execute_defi_action` aborts (e.g. scope exceeded), the entire PTB fails and the swap never executes.

**Fallback:** If no `AccountCap` is found on-chain, the app uses a demo hex string `0x7f1a3b...` to allow demonstration of the transaction composition logic without breaking the UI.

---

### `/app/query` — VM Sandbox Query Terminal

**Auth required:** Wallet connection  
**Source:** [`src/app/app/query/page.tsx`](src/app/app/query/page.tsx)

A real-time `is_authorized()` query interface that runs against the live Sui network without consuming any gas (using `devInspectTransactionBlock`).

**How it works:**
1. User enters a 66-character (`0x` + 64 hex) Object ID.
2. A `useEffect` fires, fetches the object via `getObject`, validates it is a `DelegationObject`, and reads `scope_limit` / `spent` to initialize the slider range.
3. A second `useEffect` reactive on `[amount, delegationId, isValidObject]` calls `queryIsAuthorized()` automatically on every change.
4. The terminal panel displays: delegation ID, requested amount, execution steps, and final `AUTHORIZED` / `NOT AUTHORIZED` result with reason.
5. A code snippet shows how any Move module can call `proxy::is_authorized()` as a composable authorization primitive.

The slider range is dynamically set to `1.2 × scopeLimit` to make it easy to test both authorized and unauthorized amounts.

---

### `/app/verify` — Cryptographic Verification Terminal

**Auth required:** None (fully public)  
**Source:** [`src/app/app/verify/page.tsx`](src/app/app/verify/page.tsx)

A step-by-step cryptographic audit tool that proves a delegation is live, active, and evidence-backed.

**7-Step Verification Pipeline:**

| Step | Action | Success Condition |
|---|---|---|
| 1 | Fetch object from Sui RPC | Object exists and is of type `proxy::delegation::DelegationObject` |
| 2 | Parse Move struct fields | All expected fields are present and valid |
| 3 | Resolve SuiNS identities | Delegator and delegate addresses resolved (or truncated) |
| 4 | Status check | `status == ACTIVE` and `expiry > Date.now()` (or perpetual) |
| 5 | Fetch Walrus blob | HTTP GET to Walrus aggregator for the `evidence_hash` Blob ID |
| 6 | Verify blob retrieval | Blob successfully fetched = content is permanently sealed at certified ID |
| 7 | Expiry detail | Reports remaining days, or confirms perpetual |

On success, a result panel is shown with all parsed delegation fields, plus deep links to SuiScan and WalrusScan.

Also accessible via the public shareable URL: `/verify/[objectId]` which pre-fills the Object ID from the route parameter.

---

### `/app/subdelegate/[objectId]` — Sub-Delegation

**Auth required:** Must own the parent delegation as delegate  
**Source:** [`src/app/app/subdelegate/[objectId]/page.tsx`](src/app/app/subdelegate/[objectId]/page.tsx)

Allows the current delegate to create a child delegation from a parent object, subject to Move-enforced constraints:
- Child `scope_limit` ≤ parent `scope_limit`
- Child `expiry` ≤ parent `expiry`
- Parent `depth_remaining > 0` (child gets `depth_remaining - 1`)

---

### `/app/delegations/[objectId]/audit` — Audit Page

Detailed audit view for a specific delegation object. Fetches full on-chain data, activity logs, and Walrus evidence content.

---

### `/explore` — Global Explorer

Fetches all recent `create_delegation` and `sub_delegate` transactions across the entire protocol (not just the connected wallet) and displays them in a global explorer view.

---

## 7. Core Libraries

### `sui.ts` — Blockchain Client & Transaction Builders

**Source:** [`src/lib/sui.ts`](src/lib/sui.ts)

#### Client

```typescript
export const suiClient = new SuiJsonRpcClient({
  url: process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443",
  network: "testnet",
});
```

#### Transaction Builders (Write Operations)

All return a `Transaction` object ready to be signed via `useProxyTransaction`.

| Builder | Move Call | Parameters |
|---|---|---|
| `buildCreateDelegationTx(params)` | `proxy::delegation::create_delegation` | delegate, delegationType, scopeLimit, expiry, depth, evidenceHash |
| `buildExecuteActionTx(delegationId, amount)` | `proxy::delegation::execute_action` | objectId, amount (SUI, converted to MIST) |
| `buildRevokeTx(delegationId)` | `proxy::delegation::revoke` | objectId |
| `buildPauseTx(delegationId)` | `proxy::delegation::pause` | objectId |
| `buildUnpauseTx(delegationId)` | `proxy::delegation::unpause` | objectId |
| `buildSubDelegateTx(params)` | `proxy::delegation::sub_delegate` | parentId, newDelegate, scopeLimit, expiry |
| `buildDeepBookSwapTx(params)` | Composed PTB: `execute_defi_action` + `clob_v2::swap_exact_base_for_quote` | delegationId, amount, poolId, accountCapId |
| `buildCreateAccountCapTx(address)` | `deepbook::clob_v2::create_account` | walletAddress |

#### RPC Query Functions (Read Operations)

| Function | Description |
|---|---|
| `queryIsAuthorized(delegationId, amount, callerAddress)` | Runs `is_authorized()` via `devInspectTransactionBlock`. Returns `{ authorized: boolean, reason: string }`. |
| `getDelegationObject(objectId)` | Fetches object with content, owner, and type via `getObject`. |
| `getOwnedDelegations(walletAddress)` | Fetches all owned `DelegationObject`s via `getOwnedObjects` with StructType filter. |
| `getRecentDelegations(limit)` | Queries both `create_delegation` and `sub_delegate` transactions, resolves their created objects. |

#### Utility Functions

| Function | Description |
|---|---|
| `suiToMist(sui)` | `BigInt(Math.round(sui * 1_000_000_000))` |
| `mistToSui(mist)` | `Number(mist) / 1_000_000_000` |
| `getSuiScanUrl(id, type)` | Returns `https://suiscan.xyz/testnet/object/{id}` or `.../tx/{id}` |
| `getCurrentEpoch()` | Fetches current epoch via `getLatestSuiSystemState()` |
| `parseWalletError(err)` | Parses wallet rejection errors into human-readable strings |

---

### `walrus.ts` — Decentralized Evidence Storage

**Source:** [`src/lib/walrus.ts`](src/lib/walrus.ts)

| Function | HTTP Method | Endpoint | Description |
|---|---|---|---|
| `uploadToWalrus(file, epochs=50)` | `PUT` | `{PUBLISHER}/v1/blobs?epochs=50` | Uploads file as binary blob. Handles both `newlyCreated` and `alreadyCertified` responses. Returns Blob ID. |
| `fetchFromWalrus(blobId)` | `GET` | `{AGGREGATOR}/v1/blobs/{blobId}` | Downloads a blob as a `Blob` object. Throws on 404 (pruned). |
| `getWalrusScanUrl(blobId)` | — | — | Returns `https://walruscan.com/testnet/blob/{blobId}` |
| `getWalrusAggregatorUrl(blobId)` | — | — | Returns full aggregator download URL |

**Defaults:**
- Publisher: `https://publisher.walrus-testnet.walrus.space`
- Aggregator: `https://aggregator.walrus-testnet.walrus.space`
- Retention: 50 epochs (configurable)

---

### `suins.ts` — SuiNS Name Resolution

**Source:** [`src/lib/suins.ts`](src/lib/suins.ts)

Integrates with `@mysten/suins` to resolve `.sui` names to addresses and vice versa.

| Function | Description |
|---|---|
| `resolveSuiNSAddress(name)` | Resolves `alice.sui` → `0x...`. Returns null if not found. Timeout: 3 seconds. |
| `resolveSuiNSName(address)` | Reverse resolves `0x...` → `alice.sui`. Two-attempt strategy: SuiNS client, then owned objects fallback. Timeout: 1.5s each. |
| `resolveMultipleAddresses(addresses)` | Batch resolves an array of addresses in parallel. Returns a `Record<address, name>` map. |
| `formatIdentity(address, name)` | Returns name if available, else `0x1234...5678` |
| `formatIdentityForContext(address, name, context)` | Context-aware formatting (`card`, `certificate`, `terminal`, `graph`) |
| `isSuiNSName(input)` | Returns `true` if input ends with `.sui` |

---

### `state.ts` — Zustand Global Store

**Source:** [`src/lib/state.ts`](src/lib/state.ts)

Client-side ephemeral state only. No persistence, no on-chain data stored here.

```typescript
interface ProxyUIState {
  selectedDelegationId: string | null;      // Currently inspected delegation
  createFormDraft: CreateFormDraft;          // Unsaved create form values
  verifyInput: string;                       // Verify terminal object ID input
  queryInput: { delegationId: string; amount: number }; // Query terminal inputs
}
```

The `DelegationObject` TypeScript interface mirrors the Move struct:

```typescript
export interface DelegationObject {
  id: string;
  delegator: string;
  delegate: string;
  delegation_type: number;   // 0=Financial 1=Governance 2=Operational 3=Legal
  scope_limit: number;       // in MIST
  spent: number;             // in MIST
  expiry: number;            // Unix timestamp ms (0 = no expiry)
  status: number;            // 0=Active 1=Revoked 3=Paused
  depth_remaining: number;
  evidence_hash: string;     // Walrus blob ID
  created_at: number;        // Unix timestamp ms
}
```

---

### `constants.ts` — Configuration & Package IDs

**Source:** [`src/lib/constants.ts`](src/lib/constants.ts)

```typescript
export const SUI_NETWORK = "testnet";
export const PROXY_PACKAGE_ID = "0xc21e43a3672638aa30311002b34551b629ab98af2d8924dcfbbcfd483e1c5b10";
export const DELEGATION_OBJECT_TYPE = `${PROXY_PACKAGE_ID}::delegation::DelegationObject`;
export const WALRUS_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";
export const WALRUS_AGGREGATOR_URL = "https://aggregator.walrus-testnet.walrus.space";
export const SUI_CLOCK_OBJECT_ID = "0x6"; // Sui system Clock object
export const isContractDeployed = () => !!PROXY_PACKAGE_ID;
```

All values are overridable via environment variables (see [Environment Variables](#15-environment-variables)).

---

### `hash.ts` — Cryptographic Utilities

**Source:** [`src/lib/hash.ts`](src/lib/hash.ts)

```typescript
export async function sha256(buffer: ArrayBuffer): Promise<string>
```

Computes SHA-256 using the browser's native `crypto.subtle.digest` API. Returns a `0x`-prefixed hex string. Used for local file hash computation during evidence verification.

---

### `certificate.tsx` — PDF/PNG Certificate Generator

**Source:** [`src/lib/certificate.tsx`](src/lib/certificate.tsx)

Generates a downloadable PNG delegation certificate using the HTML5 Canvas API. Encodes:
- Delegation type and status
- Delegator and delegate identities (SuiNS resolved names)
- Scope limit and spent amount
- Expiry date
- Object ID (as text and QR code)
- Evidence hash

Downloaded as `delegation-cert-{objectId}.png`.

---

## 8. React Hooks

### `useProxyTransaction`

**Source:** [`src/hooks/useProxyTransaction.ts`](src/hooks/useProxyTransaction.ts)

The core transaction execution hook. Internally:
1. Resolves the connected wallet from `useWallets()` matching `currentAccount.address`
2. Asserts the wallet supports the `sui:signTransaction` feature
3. Sets the sender on the `Transaction` object
4. Builds the transaction bytes via `tx.build({ client: suiClient })`
5. Signs via `wallet.features["sui:signTransaction"].signTransaction()`
6. Submits via `suiClient.executeTransactionBlock()` with `showEffects` and `showObjectChanges`
7. Throws if `effects.status.status === "failure"`

```typescript
const { execute } = useProxyTransaction();
const result = await execute(tx); // returns TransactionBlockResponse
```

### `useSuiNSName(address)`

React Query hook wrapping `resolveSuiNSName`. Returns `{ data: string | null, isLoading }`.

### `useSuiNSAddress(name)`

React Query hook wrapping `resolveSuiNSAddress`. Returns resolved address or null. Pass `null` to disable.

---

## 9. Shared UI Components

| Component | Props | Description |
|---|---|---|
| `StatusBadge` | `status: number` | Color-coded badge: ACTIVE (green) / REVOKED (red) / PAUSED (amber) / EXPIRED (grey) |
| `AddressBadge` | `address: string`, `context: string` | Displays SuiNS name if available, else truncated hex. Handles loading state. |
| `BlobLink` | `blobId: string` | Styled hyperlink to WalrusScan for a given Blob ID |
| `ExplorerLink` | `id: string` | Button linking to SuiScan for an object or transaction |
| `ScopeBar` | `spent: number`, `limit: number` | Progress bar showing budget utilization |
| `PrivPayLoader` | `size`, `mode` | Animated loading spinner, used in `xs/sm/md/lg` and `compact/default` variants |
| `DeploymentGate` | — | Full-page notice shown when `PROXY_PACKAGE_ID` is not set |
| `WalletButton` | — | Wraps `@mysten/dapp-kit` connect/disconnect UI |

---

## 10. User Roles & Permission Model

```
┌──────────────────────────────────────────────────────────────────┐
│                         DELEGATOR                                  │
│  (Creates the delegation — the authority granter)                  │
│                                                                    │
│  CAN:  create_delegation(), revoke(), pause(), unpause()          │
│  CANNOT: execute_action(), sub_delegate() (those are delegate ops) │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ grants authority to
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                          DELEGATE                                  │
│  (Receives the DelegationObject — owns it in Sui object model)     │
│                                                                    │
│  CAN:  execute_action(), execute_defi_action(), sub_delegate()    │
│  CANNOT: revoke(), pause(), unpause() (delegator-only operations) │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ can further delegate to
                                   ▼ (if depth_remaining > 0)
┌──────────────────────────────────────────────────────────────────┐
│                        SUB-DELEGATE                                │
│  (Child DelegationObject with reduced scope and depth)             │
└──────────────────────────────────────────────────────────────────┘
```

**Move VM (System Role):**  
All constraints are enforced at the bytecode level. The VM rejects any transaction that violates: sender identity, active status, expiry, or scope limit. There is no admin key, no upgrade authority, and no backdoor.

---

## 11. Complete User Flows

### 🟢 Creating a Delegation

```
1. Connect Sui wallet
2. Navigate to /app/create
3. (Optional) Select a Quick Template
4. Choose Delegation Type (Financial/Governance/Operational/Legal)
5. Enter delegate address (0x... or name.sui — auto-resolved)
6. Set Spending Limit (Financial only), Expiry days, Sub-delegation Depth
7. Upload evidence document → Walrus PUT → Blob ID returned
8. Click "Submit & Seal Delegation"
9. Wallet prompts for signature
10. Transaction submitted → DelegationObject minted → transferred to delegate
11. Success panel shows Object ID, tx digest, WalrusScan link, and Share Receipt
```

### 🔴 Revoking a Delegation

```
1. Navigate to /app/delegations
2. Find delegation in "Delegations You Granted"
3. Click "Revoke" button on the card
4. Modal appears: "This action will permanently invalidate this authority on-chain."
5. Hold the "HOLD TO CONFIRM (1.5s)" button for 1.5 seconds
6. PTB executes revoke() → status set to REVOKED
7. Card updates with red REVOKED badge
```

### ⏸️ Pausing / Resuming

```
1. Click "Pause" or "Resume" on a delegation card you own as delegator
2. Transaction immediately submitted (no confirmation modal)
3. Status toggles between ACTIVE and PAUSED
```

### 💱 Executing a DeFi Action

```
1. Navigate to /app/defi
2. Select from your active Financial delegations
3. Verify AccountCap exists (or setup once)
4. Enter swap amount in SUI
5. Click "Preview Atomic Transaction"
6. App runs queryIsAuthorized() pre-flight check
7. If authorized, builds composed PTB
8. Preview panel shows both PTB commands atomically
9. Execute submits the full transaction
```

### 🔍 Verifying a Delegation

```
1. Navigate to /app/verify (or /verify/{objectId} for shareable link)
2. Enter Object ID
3. Click "Verify"
4. 7-step pipeline runs, showing live log output:
   - Object resolution ✓
   - Struct field parsing ✓
   - Identity resolution ✓
   - Status check ✓
   - Walrus blob fetch ✓
   - Hash verification ✓
   - Expiry confirmation ✓
5. Result card shows all delegation metadata + SuiScan/WalrusScan links
```

### 🌿 Sub-Delegating

```
1. Navigate to /app/subdelegate/{parentObjectId}
2. Enter new delegate address
3. Set child scope_limit (must be ≤ parent's)
4. Set child expiry (must be ≤ parent's)
5. Submit → sub_delegate() called → child DelegationObject created
```

---

## 12. External API Reference

### Sui RPC

**Base URL:** `https://fullnode.testnet.sui.io:443` (default)

| RPC Method | Usage |
|---|---|
| `sui_getObject` | Fetch delegation object fields and metadata |
| `sui_getOwnedObjects` | List delegations owned by a wallet |
| `sui_queryTransactionBlocks` | Find all create/sub_delegate transactions |
| `sui_devInspectTransactionBlock` | Dry-run `is_authorized()` without gas |
| `sui_executeTransactionBlock` | Submit signed PTBs |
| `suix_getLatestSuiSystemState` | Get current epoch |

### Walrus Protocol

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `{PUBLISHER}/v1/blobs?epochs=50` | `PUT` | Raw file bytes | `{ newlyCreated: { blobObject: { blobId: "..." } } }` or `{ alreadyCertified: { blobId: "..." } }` |
| `{AGGREGATOR}/v1/blobs/{blobId}` | `GET` | — | Raw file bytes (404 if pruned) |

### SuiNS

Accessed via `@mysten/suins` `SuinsClient` SDK, which internally calls SuiNS smart contracts on-chain. Timeout wrappers of 1.5–3 seconds are applied to prevent UI hangs on failed lookups.

---

## 13. Business Logic & Algorithms

### Health Score Calculation

Computed client-side for display purposes. Not stored on-chain.

```typescript
// For Financial delegations (type === 0):
timeScore  = clamp(((expiry - now) / (30 * 86400 * 1000)) * 100, 0, 100)
budgetScore = clamp((1 - spent / scope_limit) * 100, 0, 100)
depthScore  = depth_remaining === 0 ? 50 : depth_remaining === 1 ? 75 : 100
healthScore = (timeScore * 0.4) + (budgetScore * 0.4) + (depthScore * 0.2)

// For non-Financial delegations:
healthScore = (timeScore * 0.7) + (depthScore * 0.3)
```

**Color coding:**
- ≥ 80% → Green (`#22c55e`)
- ≥ 50% → Amber (`#f59e0b`)
- < 50% → Red (`#ef4444`)

### Status Inference (UI-only)

The on-chain `status` field only records `0=Active`, `1=Revoked`, `3=Paused`. The UI infers the effective state:

```typescript
const isExpired = delegation.expiry > 0 && delegation.expiry < Date.now();
const isActive  = delegation.status === 0 && !isExpired;
const isPaused  = delegation.status === 3;
const isRevoked = delegation.status === 1;
```

### SUI ↔ MIST Conversion

```typescript
suiToMist(sui: number): bigint  => BigInt(Math.round(sui * 1_000_000_000))
mistToSui(mist: bigint): number => Number(mist) / 1_000_000_000
```

### Hold-to-Confirm Mechanism (Revocation)

A `setInterval` running at 50ms intervals increments a `holdProgress` state from 0 to 100 over 1.5 seconds (30 steps × 50ms). Releasing the mouse or touch before 100% resets progress to 0. Only at 100% does `triggerRevoke()` fire.

---

## 14. Security Model

| Concern | Mitigation |
|---|---|
| **Access Control** | All entry functions assert `tx_context::sender(ctx) == delegation.delegator/delegate`. There is no way to bypass this in Move. |
| **Budget Enforcement** | `spent + amount <= scope_limit` is a hard assertion. Any amount exceeding the limit causes the VM to abort the entire PTB. |
| **Expiry Enforcement** | `clock::timestamp_ms(clock) < delegation.expiry` uses the network-provided Sui `Clock` object (`0x6`). It cannot be manipulated by the caller. |
| **Reentrancy** | Sui's object model and Move's borrow checker prevent reentrancy by design. Objects must be explicitly borrowed, and a borrowed object cannot be borrowed again in the same transaction. |
| **Evidence Integrity** | Walrus Blob IDs are content-addressed. Once stored, a blob's ID is its fingerprint. The Blob ID sealed in the Move struct cannot be altered after creation. |
| **UI Parsing Safety** | `parseDelegationFields` strictly validates `content.type?.includes("DelegationObject")` before parsing. This prevents UI crashes from unrelated objects (e.g., SUI coins or NFTs) that might appear in query results. |
| **Input Validation** | Frontend validates: amounts > 0, expiry in the future, valid hex addresses. Move contracts assert all bounds internally as a second layer. |
| **No Admin Keys** | The Move module has no `AdminCap`, no `owner`, and no upgradeable proxy pattern. Once deployed, the logic is immutable. |

---

## 15. Environment Variables

Create a `.env.local` file in the project root. All variables are optional — defaults point to Sui Testnet and the deployed contract.

```env
# Sui Network Configuration
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Proxy Smart Contract
# The package ID of the deployed proxy::delegation module
NEXT_PUBLIC_PROXY_PACKAGE_ID=0xc21e43a3672638aa30311002b34551b629ab98af2d8924dcfbbcfd483e1c5b10

# Walrus Decentralized Storage
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

> **Note:** `.env.local` is gitignored. Never commit secrets. All variables are prefixed `NEXT_PUBLIC_` — they are embedded into the client bundle and visible in the browser.

---

## 16. Setup & Development Guide

### Prerequisites

- **Node.js** v18 or higher (`node --version`)
- **npm** v9 or higher (`npm --version`)
- A **Sui-compatible wallet** browser extension ([Nightly](https://nightly.app/), [Sui Wallet](https://suiwallet.com/))
- Testnet SUI tokens — get from the [Sui Testnet Faucet](https://faucet.sui.io/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Xconmax245/Proxy.git
cd Proxy
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json` including:
- `next` 16.2.7, `react` 19.2.4
- `@mysten/sui` ^2.17.0 — Sui TypeScript SDK
- `@mysten/dapp-kit` ^1.0.6 — Wallet connection
- `@mysten/suins` ^1.1.4 — SuiNS resolution
- `@tanstack/react-query` ^5.101.0 — RPC state caching
- `zustand` ^5.0.14 — UI state management
- `d3` ^7.9.0 — Graph visualization
- `framer-motion` ^12.40.0 — Animations
- `aos` ^2.3.4 — Scroll animations
- `html2canvas` + `jspdf` — Certificate export
- `qrcode.react` — QR codes in certificates

### Step 3: Configure Environment

```bash
cp .env.local.example .env.local  # or create manually
```

Edit `.env.local` with your values (the defaults work for testnet).

### Step 4: Run Development Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000) using Turbopack.

### Step 5: Available Scripts

```bash
npm run dev    # Start Turbopack dev server with hot reload
npm run build  # Run TypeScript check + production build
npm run start  # Serve the production build locally
npm run lint   # Run ESLint
```

### Deploying the Move Contract (Optional)

If you want to deploy your own instance of the contract:

1. Install the [Sui CLI](https://docs.sui.io/build/install)
2. Switch to testnet: `sui client switch --env testnet`
3. Fund your address via the [faucet](https://faucet.sui.io/)
4. Deploy:

```bash
cd proxy-contracts
sui client publish --gas-budget 100000000
```

5. Copy the `packageId` from the output and update `NEXT_PUBLIC_PROXY_PACKAGE_ID` in `.env.local`.

---

## 17. Deployment

The application is a standard Next.js App Router project and can be deployed to any Node.js host.

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**.

### Self-Hosted (Node.js)

```bash
npm run build
npm run start  # Starts on port 3000
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 18. Testnet Status & Maturity

| Dimension | Current Status |
|---|---|
| **Network** | Sui Testnet (not Mainnet) |
| **Contract** | Deployed and functional. Package ID: `0xc21e43a3...` |
| **Security Audit** | ❌ Not yet audited — do not use for real funds |
| **Walrus Storage** | Testnet blobs have limited epoch retention. Evidence may be pruned. |
| **SuiNS** | Testnet SuiNS names supported |
| **Maturity** | **Testnet Beta** — functionally complete for demonstration |

**Before Mainnet production use, the following are required:**
1. Formal Move smart contract security audit
2. Sui Mainnet deployment
3. Production Walrus storage configuration with sufficient epochs
4. Comprehensive integration testing suite
5. Bug bounty program

---

## Contributing

Contributions, issue reports, and feature requests are welcome.  
Please open an [Issue](https://github.com/Xconmax245/Proxy/issues) or submit a [Pull Request](https://github.com/Xconmax245/Proxy/pulls).

---

## License

MIT License — see [LICENSE](LICENSE) for details.