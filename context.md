# Privpay Project Context

This document provides a comprehensive overview of the Privpay project, covering its architecture, codebase structure, Move smart contract mechanics, frontend integration, and state management.

---

## 1. Project Overview

**Privpay** is a delegation-based proxy payment and authority management application built on the **Sui blockchain**. It allows users to delegate transaction authority (financial, governance, operational, or legal) to other wallets under specific constraints, such as spending limits and expiration times. 

Delegates can then execute actions on behalf of the delegator or sub-delegate authority down a chain up to a specified depth limit.

---

## 2. Directory Structure

```
privpay/
├── proxy-contracts/          # Move smart contracts (Sui)
│   ├── sources/
│   │   └── delegation.move   # Core delegation logic
│   ├── Move.toml             # Move package definition
│   ├── Move.lock
│   └── Published.toml        # Deployed package details
├── src/                      # Next.js web application
│   ├── app/                  # App Router pages & layouts
│   │   ├── app/
│   │   │   ├── create/       # Page: Grant/create new delegation
│   │   │   ├── delegations/  # Page: Ledger & graph dashboard
│   │   │   ├── execute/      # Page: Execute a delegated action
│   │   │   ├── query/        # Page: Live authorization VM sandbox
│   │   │   └── verify/       # Page: Verify delegation hashes/details
│   │   └── layout.tsx
│   ├── components/           # Shared & feature-specific components
│   ├── hooks/                # React custom hooks
│   ├── lib/                  # Sui client, state management, & constants
│   │   ├── sui.ts            # Sui SDK transaction builders & RPC queries
│   │   ├── state.ts          # Zustand global UI state store
│   │   └── constants.ts      # Package IDs, clock IDs, and config constants
└── package.json              # App dependencies (Next.js, @mysten/sui, etc.)
```

---

## 3. Smart Contract Architecture (`proxy-contracts`)

The core contract is located in [delegation.move](file:///c:/Users/USER/Downloads/privpay/proxy-contracts/sources/delegation.move).

### Core Data Structure: `DelegationObject`
Each delegation is represented by an owned object:
```move
public struct DelegationObject has key, store {
    id: UID,
    delegator: address,       // Wallet that granted the authority
    delegate: address,        // Wallet authorized to use the authority
    delegation_type: u8,      // 0=Financial, 1=Governance, 2=Operational, 3=Legal
    scope_limit: u64,         // Total limit in MIST
    spent: u64,               // Total amount used so far in MIST
    expiry: u64,              // Expiration timestamp in ms (0 = no expiry)
    status: u8,               // 0=Active, 1=Revoked
    depth_remaining: u8,      // Allowed depth of sub-delegation
    evidence_hash: String,    // Walrus blob ID or audit hash
    created_at: u64,          // Timestamp of creation
}
```

### Key Functions
- **`create_delegation`**: Instantiates a `DelegationObject` and transfers ownership to the `delegate`.
- **`execute_action`**: Used by the delegate to perform actions. Validates that the sender is the delegate, the status is active, it hasn't expired, and the requested amount does not exceed the remaining `scope_limit`. Updates the `spent` amount.
- **`revoke`**: Used by the delegator to set the status to `STATUS_REVOKED (1)`.
- **`sub_delegate`**: Allows a delegate to spawn a child `DelegationObject` to a new address, decreasing `depth_remaining` by 1.
- **`is_authorized`**: Read-only function returning `bool`. Checks whether a proposed action is valid under the current object conditions.

---

## 4. Frontend & Sui Integration (`src/lib/sui.ts`)

The frontend interacts with the Sui blockchain using the `@mysten/sui` SDK. Detailed operations are encapsulated in [sui.ts](file:///c:/Users/USER/Downloads/privpay/src/lib/sui.ts):

### Transaction Builders (Write Operations)
These return a `Transaction` object that the user signs via their connected wallet:
- `buildCreateDelegationTx(params)`: Calls `delegation::create_delegation`.
- `buildExecuteActionTx(delegationId, amount)`: Calls `delegation::execute_action`.
- `buildRevokeTx(delegationId)`: Calls `delegation::revoke`.
- `buildSubDelegateTx(params)`: Calls `delegation::sub_delegate`.

### RPC Queries (Read Operations)
- `queryIsAuthorized(delegationId, amount, callerAddress)`:
  - Fetches the object's current metadata (`version`, `digest`).
  - Constructs a transaction invoking `delegation::is_authorized` with `tx.objectRef`.
  - Simulates the call using `suiClient.devInspectTransactionBlock` without gas cost.
- `getDelegationObject(objectId)`: Fetches fields of a specific delegation object.
- `getOwnedDelegations(walletAddress)`: Fetches all `DelegationObject`s owned by a wallet address.

---

## 5. UI State Management (`src/lib/state.ts`)

Ephemeral UI/form state is managed using a client-side **Zustand** store ([state.ts](file:///c:/Users/USER/Downloads/privpay/src/lib/state.ts)):
- `selectedDelegationId`: The ID of the delegation being audited or acted on.
- `createFormDraft`: Temporary storage for inputs in the "Create Delegation" wizard.
- `queryInput`: Input state for the Query Terminal (delegation ID and requested amount).
- `verifyInput`: Input state for the Verify Terminal.

---

## 6. Real-Time Query VM Sandbox (`src/app/app/query/page.tsx`)

The **Query Terminal** page provides interactive VM execution:
- As soon as a user inputs a valid 66-character delegation ID, the app fetches the on-chain object to resolve its `scope_limit` and `spent` parameters.
- It displays a range slider (scaled to `1.2 * scopeLimit`) synchronized with a manual number input.
- Any change to the amount or delegation ID triggers a reactive `useEffect` hook that performs a simulated dry-run (`devInspect`) using `queryIsAuthorized` and prints the output (`AUTHORIZED` / `NOT AUTHORIZED`) instantly in the visual VM console.
