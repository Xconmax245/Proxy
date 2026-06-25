import { SuinsClient } from '@mysten/suins'
import { suiClient } from './sui'

const suinsClient = new SuinsClient({
  client: suiClient as any,
  network: 'testnet',
})

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  return Promise.race([promise, timeout])
}

/**
 * Resolve a .sui name to an address.
 * Returns the address string, or null if the name doesn't exist.
 */
export async function resolveSuiNSAddress(name: string): Promise<string | null> {
  try {
    const result = await withTimeout(
      suinsClient.getNameRecord(name),
      3000
    )
    if (!result) return null
    return result.targetAddress ?? null
  } catch {
    return null
  }
}

/**
 * Resolve an address to its .sui name using the SuiNS reverse registry.
 * Returns the name (e.g. "alice.sui") or null if none is registered.
 */
export async function resolveSuiNSName(address: string): Promise<string | null> {
  try {
    // Attempt 1: getNameRecord (standard client)
    const result = await withTimeout(
      suinsClient.getNameRecord(address),
      1500
    );
    if (result?.name) return result.name;

    // Attempt 2: getOwnedObjects fallback
    const objectsPromise = suiClient.getOwnedObjects({
      owner: address,
      filter: {
        StructType: '0xd22b24490e0bae52676651b4f56660a5ff8022a2f280bf6cb31b7d1a7c0e5edc::suins_registration::SuinsRegistration',
      },
      options: { showContent: true, showDisplay: true },
      limit: 1,
    });
    const objects = await withTimeout(objectsPromise, 1500);
    if (objects && objects.data) {
      for (const obj of objects.data) {
        const display = (obj.data as any)?.display?.data;
        if (display?.name) return display.name as string;
        const fields = (obj.data as any)?.content?.fields;
        if (fields?.domain_name) return fields.domain_name as string;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve multiple addresses to names in parallel.
 * Returns a map of address → name (or address if no name).
 */
export async function resolveMultipleAddresses(
  addresses: string[]
): Promise<Record<string, string>> {
  const unique = [...new Set(addresses)]
  const results: Record<string, string> = {}
  await Promise.all(
    unique.map(async (addr) => {
      const name = await resolveSuiNSName(addr)
      results[addr] = name ?? `${addr.slice(0, 6)}...${addr.slice(-4)}`
    })
  )
  return results
}

/** Format for display — if name exists show "alice.sui", else truncate address */
export function formatIdentity(address: string, name: string | null): string {
  if (name) return name
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/** Check if input is a .sui name */
export function isSuiNSName(input: string): boolean {
  return input.trim().endsWith('.sui')
}

export function formatIdentityForContext(
  address: string,
  name: string | null,
  context: 'card' | 'certificate' | 'terminal' | 'graph'
): string {
  if (name && name.trim().length > 0) return name;
  if (context === 'graph') return `${address.slice(0, 4)}...`;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
