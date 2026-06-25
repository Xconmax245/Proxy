# PROJECT_FEATURES_AND_FUNCTIONAL_SPECIFICATION

## SECTION 1 — EXECUTIVE SUMMARY

### Project Overview
**Name:** Proxy
**Main Purpose:** A programmable delegation infrastructure deployed on the Sui blockchain. It allows users to grant highly constrained, granular permissions to secondary wallets, automated bots, or AI agents to execute on-chain transactions on their behalf without handing over private keys.
**Target Users:** Web3 power users, DeFi traders utilizing automated bots, DAOs managing sub-treasuries, and enterprise organizations requiring strict on-chain operational constraints.
**Core Value Proposition:** Trustless, non-custodial authorization. Through on-chain assertions and off-chain decentralized evidence (via Walrus), users can confidently delegate authority knowing that the delegate is physically blocked by the Sui network from exceeding their predefined budget, time limit, or scope.

### Product Type
**Web3 Application / Smart Contract System**

---

## SECTION 2 — COMPLETE FEATURE INVENTORY

### Feature: Wallet Connection & Session Management
- **Description:** Users connect their Sui wallet to interact with the dApp.
- **Purpose:** Authenticate the user and retrieve their address for querying objects.
- **User Benefit:** Seamless interaction with blockchain state without manual key entry.
- **Technical Implementation:** Uses `@mysten/dapp-kit` (Sui Client Provider, Wallet Provider).
- **Dependencies:** `@mysten/dapp-kit`, `@mysten/sui`, `@tanstack/react-query`.
- **Trigger Conditions:** Clicking "Connect Wallet" on the landing page or sidebar.

### Feature: Delegation Object Creation (Minting)
- **Description:** Deploys a new `DelegationObject` to the Sui network.
- **Purpose:** Establishes a new delegation constraint on-chain.
- **Technical Implementation:** Executes a Programmable Transaction Block (PTB) calling `proxy::delegation::create_delegation`. 
- **Inputs:** Delegate address, Delegation Type (0-3), Scope Limit (SUI), Expiry (Timestamp), Sub-delegation Depth, Evidence Hash (Walrus Blob ID).
- **Outputs:** An owned `DelegationObject` transferred to the delegate.

### Feature: Decentralized Evidence Upload (Walrus)
- **Description:** Uploads a text-based legal/agreement document to the Walrus decentralized storage network.
- **Technical Implementation:** Sends a PUT request to the Walrus publisher node (`https://publisher.walrus-testnet.walrus.space/v1/store?epochs=5`).
- **Outputs:** A Base64URL encoded Blob ID representing the immutable data.
- **Security:** Immutable storage ensures the terms agreed upon cannot be altered.

### Feature: Real-time Ledger Dashboard
- **Description:** A split view showing "Delegations You Granted" (Owned) and "Authority Delegated To You" (Incoming).
- **Technical Implementation:** Uses `suiClient.getOwnedObjects` for incoming, and `suiClient.queryTransactionBlocks` for granted delegations. Strictly parses data to ensure only valid `DelegationObject` structs are rendered.
- **Edge Cases:** Ignores randomly dropped SUI coins or unrelated objects via strict string inclusion validation on `content.type`.

### Feature: Delegation Revocation
- **Description:** Permanently invalidates an active delegation.
- **Trigger Conditions:** Delegator clicks "Revoke", holds the confirmation button for 1.5 seconds.
- **Technical Implementation:** Calls `proxy::delegation::revoke`. Changes status to `1`.
- **Security Considerations:** Only the original Delegator can trigger this. Asserted on-chain.

### Feature: Pause / Unpause
- **Description:** Temporarily suspends or resumes a delegate's authority.
- **Technical Implementation:** Calls `proxy::delegation::pause` (status `3`) or `unpause`.

### Feature: DeFi Action Execution (DeepBook Simulation)
- **Description:** Simulates the usage of delegated funds on DeepBook.
- **Technical Implementation:** Executes `proxy::delegation::execute_defi_action`. Verifies expiry, status, and budget. Adds the transaction cost to the `spent` accumulator.
- **Edge Cases:** If `AccountCap` is missing, UI safely falls back to a mock/demo string `0x7f1a3b...0f1a`.

### Feature: Cryptographic Verification Terminal
- **Description:** Validates the authenticity of an off-chain agreement against on-chain state.
- **Technical Implementation:** Fetches object fields, fetches Walrus Blob, runs SHA-256 hash comparison.
- **Error Handling:** Throws clear UI errors if Walrus blob has been pruned/expired.

### Feature: VM Sandbox Querying (devInspect)
- **Description:** Simulates an `is_authorized()` check against the live network without consuming gas.
- **Technical Implementation:** Utilizes Sui's `devInspectTransactionBlock` RPC endpoint.

---

## SECTION 3 — USER ROLES & PERMISSIONS

### 1. Delegator (Creator)
- **Permissions:** Can Create, Revoke, Pause, Unpause.
- **Restrictions:** Cannot execute actions using the delegation (funds are executed by the delegate).

### 2. Delegate (Recipient)
- **Permissions:** Can Execute DeFi actions, can Sub-delegate (if `depth_remaining > 0`).
- **Restrictions:** Cannot revoke, pause, or alter the constraints of the delegation. Cannot exceed the `scope_limit` or operate past `expiry`.

### 3. Smart Contract (System)
- **Permissions:** Enforces all constraints. Validates timestamps against the network `Clock`.
- **Security Controls:** Prevents authorization if `spent + amount > scope_limit`.

---

## SECTION 4 — COMPLETE USER FLOWS

### Creation Flow
1. User clicks "Create" in sidebar.
2. Form validates Sui Address, amount, and date.
3. User types evidence/terms.
4. UI uploads terms to Walrus -> Returns Blob ID.
5. UI generates PTB with Blob ID and fields.
6. Wallet prompts for signature.
7. Transaction submitted -> Success screen -> Redirect to Dashboard.

### Revocation Flow
1. User clicks "Revoke" on an owned delegation card.
2. Modal appears warning of permanent action.
3. User holds "Hold to Confirm" button for 1.5s.
4. PTB executes `revoke`.
5. Status changes to "Revoked" (Red badge).

---

## SECTION 5 — FRONTEND FUNCTIONALITIES

| Page | Function | APIs Used | Permissions |
|------|----------|-----------|-------------|
| `/` | Landing page / Marketing | None | Public |
| `/app/delegations` | Dashboard Ledger & Graph | `getOwnedObjects`, `queryTransactionBlocks`, SuiNS | Wallet Required |
| `/app/create` | Form to mint new delegation | Walrus Publisher API, Sui PTB | Wallet Required |
| `/app/defi` | DeepBook interface | Sui PTB (`execute_defi_action`) | Must be Delegate |
| `/app/verify` | Cryptographic verification | Sui `getObject`, Walrus Aggregator | Public |
| `/app/query` | DevInspect sandbox | Sui `devInspectTransactionBlock` | Public |

---

## SECTION 6 — BACKEND FUNCTIONALITIES

*Note: This architecture is fully decentralized. There is no traditional centralized Node.js/Python backend. The "Backend" consists of decentralized nodes.*

### Services
1. **Sui RPC Nodes** (`https://fullnode.testnet.sui.io:443`): Handles all chain reads and PTB submissions.
2. **Walrus Publisher Node** (`publisher.walrus-testnet.walrus.space`): Handles blob persistence.
3. **Walrus Aggregator Node** (`aggregator.walrus-testnet.walrus.space`): Handles blob retrieval.

---

## SECTION 7 — DATABASE ANALYSIS

### Table/Collection: `DelegationObject` (Sui State Tree)
- **Name:** `proxy::delegation::DelegationObject`
- **Fields:**
  - `id`: `UID` (Global object identifier)
  - `delegator`: `address` (Owner/Creator)
  - `delegate`: `address` (Authorized spender)
  - `delegation_type`: `u8` (0=Financial, 1=Governance, 2=Operational, 3=Legal)
  - `scope_limit`: `u64` (Maximum MIST limit)
  - `spent`: `u64` (Running accumulator of spent MIST)
  - `expiry`: `u64` (Unix timestamp limit)
  - `status`: `u8` (0=Active, 1=Revoked, 3=Paused)
  - `depth_remaining`: `u8` (Number of allowed recursive sub-delegations)
  - `evidence_hash`: `String` (Walrus Blob ID)
  - `created_at`: `u64` (Timestamp of creation)
- **Constraints:** `spent` can never exceed `scope_limit`. Cannot execute if `Clock` > `expiry`.

---

## SECTION 8 — API DOCUMENTATION

### Endpoint: Walrus Store
- **URL:** `PUT https://publisher.walrus-testnet.walrus.space/v1/store?epochs=5`
- **Method:** `PUT`
- **Body:** Raw text/plaintext (Evidence document)
- **Response:** `200 OK`
- **Body:** `{ "newlyCreated": { "blobObject": { "blobId": "..." } } }`

### Endpoint: Walrus Read
- **URL:** `GET https://aggregator.walrus-testnet.walrus.space/v1/{blobId}`
- **Response:** `200 OK` (Raw text/plaintext of evidence)
- **Error Codes:** `404 Not Found` (Blob pruned or expired).

---

## SECTION 9 — BUSINESS LOGIC

1. **Health Score Calculation:** 
   - Financial delegations: `(TimeLeft * 0.4) + (BudgetLeft * 0.4) + (Depth * 0.2)`
   - Non-Financial: `(TimeLeft * 0.7) + (Depth * 0.3)`
2. **Status Inference:** If `Clock > expiry`, object is treated as `Expired` implicitly in UI, even if `status` field is still `0`.
3. **Sub-delegation Constraints:** Child delegations must have a `scope_limit` <= parent `scope_limit`, and `expiry` <= parent `expiry`.

---

## SECTION 10 — INTEGRATIONS

1. **Sui Network:** Core ledger and execution environment.
2. **Walrus Protocol:** Decentralized BLOB storage. Failure handling: UI displays "Blob not found" gracefully.
3. **SuiNS (Name Service):** Translates raw addresses (`0x...`) to human-readable names (`name.sui`).

---

## SECTION 11 — SMART CONTRACT ANALYSIS

### Module: `proxy::delegation`
- **Instructions (Entry Functions):**
  - `create_delegation()`: Mints and transfers.
  - `execute_action()`: Generic action execution accumulator.
  - `revoke()`: Asserts sender is delegator, sets status to 1.
  - `pause() / unpause()`: Asserts sender is delegator, toggles status to/from 3.
  - `sub_delegate()`: Asserts depth > 0, mints child object.
  - `execute_defi_action()`: Asserts type == 0 (Financial), increments spent.
- **Security Risks / Mitigations:** Reentrancy is mitigated by Sui's object model (borrow checker). Access controls are strictly enforced via `tx_context::sender(ctx)`.

---

## SECTION 12 — SECURITY AUDIT SUMMARY

- **Authentication:** Provided securely via cryptographic wallet signatures (Sui Wallet Standard).
- **Input Validation:** Frontend strictly ensures amounts are > 0 and expiry is in the future. Move contract asserts state-bounds internally.
- **Parsing Resilience:** `parseDelegationFields` strictly filters objects requiring `content.type?.includes("DelegationObject")` to prevent UI injection/crashes from unrelated Move objects (e.g., SUI Coins).

---

## SECTION 13 — AUTOMATIONS & BACKGROUND OPERATIONS

- **Passive Expiry:** Sui smart contracts do not have "Cron jobs". Expiry is handled passively. Any function attempting to mutate the object checks `clock::timestamp_ms(clock) < delegation.expiry`. If false, the transaction reverts.
- **Data Pruning:** Walrus Network automatically deletes evidence blobs after the requested epochs (e.g., 5 epochs).

---

## SECTION 14 — FEATURE DEPENDENCY MAP

```text
Dashboard Ledger
 ├─ Sui RPC Query (Owned Objects)
 ├─ Sui RPC Query (Transaction Blocks)
 ├─ Move Object Parsing
 └─ SuiNS Resolution
     └─ Address Formatting
```

---

## SECTION 15 — SYSTEM ARCHITECTURE

1. **Client Tier:** Next.js React SPA.
2. **State Management:** `@tanstack/react-query` for RPC caching.
3. **Middleware:** `@mysten/dapp-kit` for transaction signing.
4. **Consensus Tier:** Sui Testnet Validators execute Move bytecode.
5. **Storage Tier:** Walrus nodes chunk, encode, and store Blob strings.

---

## SECTION 16 — HIDDEN FUNCTIONALITIES

- **Debug / Fallback Strings:** In `/app/defi/page.tsx`, if a user lacks a DeepBook `AccountCap`, the system utilizes a realistic hex fallback (`0x7f1a...`) to prevent UI breaking and allow demonstration of execution parameters.
- **Hold-to-Confirm Mechanism:** Revocation buttons utilize a hidden `setInterval` state machine calculating a 1.5s hold delay to prevent accidental irreversible on-chain destruction.
- **Animated Component Bootstrapping:** `AosInit.tsx` runs silently on layout mount to inject `data-aos` scroll animations globally.

---

## SECTION 17 — COMPLETE FEATURE CHECKLIST

- [x] Wallet Connection & State Management
- [x] SuiNS Address Resolution
- [x] Delegation Object Minting
- [x] Walrus Blob Storage Integration
- [x] Ledger Dashboard Visualization
- [x] Recursive Sub-Delegation
- [x] Real-time Health Score Algorithms
- [x] Certificate Canvas Export
- [x] Object ID Copy-to-Clipboard
- [x] Hold-to-Confirm Revocation
- [x] State Pausing/Resuming
- [x] DeepBook Execution Simulation
- [x] Sandbox devInspect Terminal
- [x] Cryptographic Data Verifier

---

## SECTION 18 — PRODUCT RECONSTRUCTION GUIDE

**Development Order for Reconstruction:**
1. **Move Contracts:** Rebuild `proxy::delegation`. This defines the entire data structure and must be deployed first to generate the `PROXY_PACKAGE_ID`.
2. **Sui Provider & Layout:** Setup Next.js, Tailwind, and `SuiProviders.tsx` (`@mysten/dapp-kit`).
3. **Core Utilities:** Rebuild `lib/sui.ts` (RPC queries, tx builders) and `lib/walrus.ts` (blob endpoints).
4. **Creation Form:** Rebuild `/app/create` to allow minting.
5. **Dashboard:** Rebuild `/app/delegations` to visualize the minted objects. Requires strict filtering logic to avoid mapping errors.
6. **Actions & Terminals:** Rebuild DeFi mock screens and Verification terminals.

**Complexity & Maturity:**
The system architecture is relatively complex due to the orchestration of multiple decentralized systems (Sui + Walrus) and strict client-side validations. The product is currently at a **Testnet Beta** maturity level—functionally complete for demonstration and testing, but requires a Mainnet deployment, a formal smart contract security audit, and persistent storage funding before production use.
