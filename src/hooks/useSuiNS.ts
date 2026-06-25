import { useQuery } from '@tanstack/react-query'
import { resolveSuiNSName, resolveSuiNSAddress, resolveMultipleAddresses } from '@/lib/suins'

// Resolve single address to name
export function useSuiNSName(address: string | null | undefined) {
  return useQuery({
    queryKey: ['suins-name', address],
    queryFn: () => resolveSuiNSName(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 10, // cache 10 minutes
  })
}

// Resolve .sui name to address
export function useSuiNSAddress(name: string | null | undefined) {
  return useQuery({
    queryKey: ['suins-address', name],
    queryFn: () => resolveSuiNSAddress(name!),
    enabled: !!name && name.endsWith('.sui'),
    staleTime: 1000 * 60 * 10,
  })
}

// Resolve multiple addresses to names at once
export function useSuiNSNames(addresses: string[]) {
  return useQuery({
    queryKey: ['suins-names', addresses.join(',')],
    queryFn: () => resolveMultipleAddresses(addresses),
    enabled: addresses.length > 0,
    staleTime: 1000 * 60 * 10,
  })
}
