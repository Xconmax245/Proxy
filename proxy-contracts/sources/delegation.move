module proxy::delegation {

    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};

    // ═══════════════════════════════════════
    // Error codes
    // ═══════════════════════════════════════

    const E_NOT_DELEGATOR: u64 = 0;
    const E_NOT_DELEGATE: u64 = 1;
    const E_DELEGATION_REVOKED: u64 = 2;
    const E_DELEGATION_EXPIRED: u64 = 3;
    const E_SCOPE_LIMIT_EXCEEDED: u64 = 4;
    const E_NO_SUBDELEGATION_DEPTH: u64 = 5;
    const E_INVALID_SUBDELEGATION_SCOPE: u64 = 6;
    const E_INVALID_SUBDELEGATION_EXPIRY: u64 = 7;
    const E_ALREADY_PAUSED: u64 = 8;
    const E_NOT_PAUSED: u64 = 9;
    const E_DELEGATION_PAUSED: u64 = 10;

    // ═══════════════════════════════════════
    // Status constants
    // ═══════════════════════════════════════

    const STATUS_ACTIVE: u8 = 0;
    const STATUS_REVOKED: u8 = 1;
    const STATUS_PAUSED: u8 = 3;

    // ═══════════════════════════════════════
    // Core object
    // ═══════════════════════════════════════

    public struct DelegationObject has key, store {
        id: UID,
        delegator: address,
        delegate: address,
        delegation_type: u8,
        scope_limit: u64,
        spent: u64,
        expiry: u64,
        status: u8,
        depth_remaining: u8,
        evidence_hash: String,
        created_at: u64,
    }

    // ═══════════════════════════════════════
    // Create
    // ═══════════════════════════════════════

    public entry fun create_delegation(
        delegate: address,
        delegation_type: u8,
        scope_limit: u64,
        expiry: u64,
        depth: u8,
        evidence_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let delegation = DelegationObject {
            id: object::new(ctx),
            delegator: tx_context::sender(ctx),
            delegate,
            delegation_type,
            scope_limit,
            spent: 0,
            expiry,
            status: STATUS_ACTIVE,
            depth_remaining: depth,
            evidence_hash: string::utf8(evidence_hash),
            created_at: clock::timestamp_ms(clock),
        };
        transfer::transfer(delegation, delegate);
    }

    // ═══════════════════════════════════════
    // Execute action
    // ═══════════════════════════════════════

    public entry fun execute_action(
        delegation: &mut DelegationObject,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == delegation.delegate, E_NOT_DELEGATE);
        assert!(delegation.status == STATUS_ACTIVE, E_DELEGATION_REVOKED);
        assert!(delegation.status != STATUS_PAUSED, E_DELEGATION_PAUSED);
        assert!(clock::timestamp_ms(clock) < delegation.expiry, E_DELEGATION_EXPIRED);
        assert!(delegation.spent + amount <= delegation.scope_limit, E_SCOPE_LIMIT_EXCEEDED);
        delegation.spent = delegation.spent + amount;
    }

    // ═══════════════════════════════════════
    // Revoke
    // ═══════════════════════════════════════

    public entry fun revoke(
        delegation: &mut DelegationObject,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == delegation.delegator, E_NOT_DELEGATOR);
        delegation.status = STATUS_REVOKED;
    }

    // ═══════════════════════════════════════
    // Pause / Unpause
    // ═══════════════════════════════════════

    public entry fun pause(
        delegation: &mut DelegationObject,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == delegation.delegator, E_NOT_DELEGATOR);
        assert!(delegation.status == STATUS_ACTIVE, E_DELEGATION_REVOKED);
        delegation.status = STATUS_PAUSED;
    }

    public entry fun unpause(
        delegation: &mut DelegationObject,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == delegation.delegator, E_NOT_DELEGATOR);
        assert!(delegation.status == STATUS_PAUSED, E_NOT_PAUSED);
        delegation.status = STATUS_ACTIVE;
    }

    // ═══════════════════════════════════════
    // Sub-delegate
    // ═══════════════════════════════════════

    public entry fun sub_delegate(
        parent: &DelegationObject,
        new_delegate: address,
        scope_limit: u64,
        expiry: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == parent.delegate, E_NOT_DELEGATE);
        assert!(parent.status == STATUS_ACTIVE, E_DELEGATION_REVOKED);
        assert!(clock::timestamp_ms(clock) < parent.expiry, E_DELEGATION_EXPIRED);
        assert!(parent.depth_remaining > 0, E_NO_SUBDELEGATION_DEPTH);
        assert!(scope_limit <= parent.scope_limit, E_INVALID_SUBDELEGATION_SCOPE);
        assert!(expiry <= parent.expiry, E_INVALID_SUBDELEGATION_EXPIRY);

        let child = DelegationObject {
            id: object::new(ctx),
            delegator: tx_context::sender(ctx),
            delegate: new_delegate,
            delegation_type: parent.delegation_type,
            scope_limit,
            spent: 0,
            expiry,
            status: STATUS_ACTIVE,
            depth_remaining: parent.depth_remaining - 1,
            evidence_hash: parent.evidence_hash,
            created_at: clock::timestamp_ms(clock),
        };
        transfer::transfer(child, new_delegate);
    }

    // ═══════════════════════════════════════
    // DeFi Action Execution
    // ═══════════════════════════════════════

    public entry fun execute_defi_action(
        delegation: &mut DelegationObject,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == delegation.delegate, E_NOT_DELEGATE);
        assert!(delegation.status == STATUS_ACTIVE, E_DELEGATION_REVOKED);
        assert!(clock::timestamp_ms(clock) < delegation.expiry, E_DELEGATION_EXPIRED);
        assert!(delegation.spent + amount <= delegation.scope_limit, E_SCOPE_LIMIT_EXCEEDED);
        assert!(delegation.delegation_type == 0, E_NOT_DELEGATOR); // Financial only
        delegation.spent = delegation.spent + amount;
        // DeepBook interaction happens in the frontend transaction block
        // This function validates authorization and records the spend
    }

    // ═══════════════════════════════════════
    // Read-only authorization check
    // ═══════════════════════════════════════

    public fun is_authorized(
        delegation: &DelegationObject,
        amount: u64,
        clock: &Clock,
        ctx: &TxContext
    ): bool {
        if (tx_context::sender(ctx) != delegation.delegate) { return false };
        if (delegation.status != STATUS_ACTIVE) { return false };
        if (delegation.status == STATUS_PAUSED) { return false };
        if (clock::timestamp_ms(clock) >= delegation.expiry) { return false };
        if (delegation.spent + amount > delegation.scope_limit) { return false };
        true
    }

    // ═══════════════════════════════════════
    // View functions (for frontend reads)
    // ═══════════════════════════════════════

    public fun get_delegator(d: &DelegationObject): address { d.delegator }
    public fun get_delegate(d: &DelegationObject): address { d.delegate }
    public fun get_status(d: &DelegationObject): u8 { d.status }
    public fun get_scope_limit(d: &DelegationObject): u64 { d.scope_limit }
    public fun get_spent(d: &DelegationObject): u64 { d.spent }
    public fun get_expiry(d: &DelegationObject): u64 { d.expiry }
    public fun get_depth_remaining(d: &DelegationObject): u8 { d.depth_remaining }
    public fun get_evidence_hash(d: &DelegationObject): &String { &d.evidence_hash }
    public fun get_delegation_type(d: &DelegationObject): u8 { d.delegation_type }
    public fun get_created_at(d: &DelegationObject): u64 { d.created_at }
}
