import { create } from "zustand";

// ---------------------------------------------------------------------------
// DelegationObject — mirrors the on-chain Move struct fields.
// This type is used to type-check data coming from suiClient.getObject calls.
// It is NOT stored in this store.
// ---------------------------------------------------------------------------
export interface DelegationObject {
  id: string;
  delegator: string;
  delegate: string;
  delegation_type: number;   // 0=Financial 1=Governance 2=Operational 3=Legal
  scope_limit: number;       // in SUI (converted from MIST)
  spent: number;             // in SUI (converted from MIST)
  expiry: number;            // Unix timestamp ms (0 = no expiry)
  status: number;            // 0=active 1=revoked 2=expired
  depth_remaining: number;
  evidence_hash: string;     // Walrus blob ID
  created_at: number;        // Unix timestamp ms
}

// ---------------------------------------------------------------------------
// UI-only store — holds ephemeral selection/form state only.
// No on-chain data. No mock data. No localStorage persistence.
// ---------------------------------------------------------------------------
interface CreateFormDraft {
  delegate: string;
  delegationType: number;
  scopeLimit: string;
  expiryDays: string;
  depth: number;
  description: string;
}

interface QueryInput {
  delegationId: string;
  amount: number;
}

interface ProxyUIState {
  // Which delegation the user is currently inspecting / acting on
  selectedDelegationId: string | null;
  setSelectedDelegationId: (id: string | null) => void;

  // Unsaved create-form field values
  createFormDraft: CreateFormDraft;
  setCreateFormDraft: (draft: Partial<CreateFormDraft>) => void;
  resetCreateFormDraft: () => void;

  // Verify terminal input
  verifyInput: string;
  setVerifyInput: (id: string) => void;

  // Query terminal inputs
  queryInput: QueryInput;
  setQueryInput: (input: Partial<QueryInput>) => void;
}

const DEFAULT_DRAFT: CreateFormDraft = {
  delegate: "",
  delegationType: 0,
  scopeLimit: "",
  expiryDays: "",
  depth: 1,
  description: "",
};

export const useProxyStore = create<ProxyUIState>((set) => ({
  selectedDelegationId: null,
  setSelectedDelegationId: (id) => set({ selectedDelegationId: id }),

  createFormDraft: DEFAULT_DRAFT,
  setCreateFormDraft: (draft) =>
    set((s) => ({ createFormDraft: { ...s.createFormDraft, ...draft } })),
  resetCreateFormDraft: () => set({ createFormDraft: DEFAULT_DRAFT }),

  verifyInput: "",
  setVerifyInput: (id) => set({ verifyInput: id }),

  queryInput: { delegationId: "", amount: 100 },
  setQueryInput: (input) =>
    set((s) => ({ queryInput: { ...s.queryInput, ...input } })),
}));
