import { useMemo } from 'react'
import { useLocations, useResidueTypes, useUsers } from '@/api/hooks'
import type { Location, ResidueType, User } from '@/api/schemas'

/**
 * The backend returns identifiers only, so screens join them on the client.
 * These maps are cheap to build and share the cached catalog queries.
 */
export function useLookups(options: { users?: boolean } = {}) {
  const locations = useLocations()
  const residueTypes = useResidueTypes()
  const users = useUsers(options.users ?? false)

  const locationById = useMemo(() => new Map<number, Location>(locations.data?.map((item) => [item.locationId, item])), [locations.data])
  const residueById = useMemo(() => new Map<number, ResidueType>(residueTypes.data?.map((item) => [item.residueTypeId, item])), [residueTypes.data])
  const userById = useMemo(() => new Map<number, User>(users.data?.map((item) => [item.userId, item])), [users.data])

  return {
    locationById,
    residueById,
    userById,
    isPending: locations.isPending || residueTypes.isPending || (options.users === true && users.isPending),
    error: locations.error ?? residueTypes.error ?? users.error,
  }
}
