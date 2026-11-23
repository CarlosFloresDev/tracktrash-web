import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { ApiError } from '@/lib/http'
import {
  collectionPointsApi,
  gatherersApi,
  gradesApi,
  indicatorsApi,
  locationsApi,
  organizationsApi,
  pickupServicesApi,
  recoveredMaterialsApi,
  requestDetailsApi,
  requestsApi,
  residueTypesApi,
  usersApi,
} from './endpoints'

export const keys = {
  users: ['users'] as const,
  locations: ['locations'] as const,
  requests: ['requests'] as const,
  requestDetails: ['request-details'] as const,
  request: (id: number) => ['requests', id] as const,
  requestHistory: (id: number) => ['requests', id, 'history'] as const,
  userRequests: (userId: number) => ['requests', 'user', userId] as const,
  pendingRequests: ['requests', 'pending'] as const,
  services: ['services'] as const,
  gathererServices: (id: number) => ['services', 'gatherer', id] as const,
  materials: (serviceId: number) => ['materials', serviceId] as const,
  allMaterials: ['materials'] as const,
  grades: ['grades'] as const,
  gathererGrades: ['gatherer-grades'] as const,
  gatherers: ['gatherers'] as const,
  organizations: ['organizations'] as const,
  residueTypes: ['residue-types'] as const,
  collectionPoints: ['collection-points'] as const,
  indicators: ['indicators'] as const,
}

/** A 404 from "get by owner" endpoints means "no profile yet", not a failure. */
const noRetryOnClientError = (count: number, error: Error) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2

const defaults = { retry: noRetryOnClientError }

export const useUsers = (enabled = true) => useQuery({ queryKey: keys.users, queryFn: usersApi.list, enabled, ...defaults })
export const useLocations = () => useQuery({ queryKey: keys.locations, queryFn: locationsApi.list, ...defaults })
export const useResidueTypes = () =>
  useQuery({ queryKey: keys.residueTypes, queryFn: residueTypesApi.list, staleTime: 5 * 60_000, ...defaults })
export const useCollectionPoints = () =>
  useQuery({ queryKey: keys.collectionPoints, queryFn: collectionPointsApi.list, staleTime: 60_000, ...defaults })
export const useGatherers = () => useQuery({ queryKey: keys.gatherers, queryFn: gatherersApi.list, ...defaults })
export const useOrganizations = () => useQuery({ queryKey: keys.organizations, queryFn: organizationsApi.list, ...defaults })

export const useAllRequests = () => useQuery({ queryKey: keys.requests, queryFn: requestsApi.list, ...defaults })
export const usePendingRequests = () =>
  useQuery({ queryKey: keys.pendingRequests, queryFn: requestsApi.pending, ...defaults })
export const useUserRequests = (userId: number | undefined) =>
  useQuery({
    queryKey: keys.userRequests(userId ?? 0),
    queryFn: () => requestsApi.byUser(userId!),
    enabled: userId !== undefined,
    ...defaults,
  })
export const useRequestFull = (id: number) =>
  useQuery({ queryKey: keys.request(id), queryFn: () => requestsApi.full(id), ...defaults })
export const useRequestHistory = (id: number) =>
  useQuery({ queryKey: keys.requestHistory(id), queryFn: () => requestsApi.history(id), ...defaults })

export const useAllRequestDetails = () =>
  useQuery({ queryKey: keys.requestDetails, queryFn: requestDetailsApi.list, ...defaults })

/** Resolves to `null` (not an error) when the user has not rated that service yet. */
export const useMyGrade = (serviceId: number | undefined, userId: number) =>
  useQuery({
    queryKey: [...keys.grades, serviceId, userId],
    enabled: serviceId !== undefined,
    ...defaults,
    queryFn: async () => {
      try {
        return await gradesApi.byServiceAndUser(serviceId!, userId)
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })

export const useServices = () => useQuery({ queryKey: keys.services, queryFn: pickupServicesApi.list, ...defaults })
export const useGathererServices = (gathererId: number | undefined) =>
  useQuery({
    queryKey: keys.gathererServices(gathererId ?? 0),
    queryFn: () => pickupServicesApi.byGatherer(gathererId!),
    enabled: gathererId !== undefined,
    ...defaults,
  })
export const useServiceMaterials = (serviceId: number | undefined) =>
  useQuery({
    queryKey: keys.materials(serviceId ?? 0),
    queryFn: () => recoveredMaterialsApi.byService(serviceId!),
    enabled: serviceId !== undefined,
    ...defaults,
  })
export const useAllMaterials = () =>
  useQuery({ queryKey: keys.allMaterials, queryFn: recoveredMaterialsApi.list, ...defaults })
export const useGrades = () => useQuery({ queryKey: keys.grades, queryFn: gradesApi.list, ...defaults })
export const useGathererGrades = () =>
  useQuery({ queryKey: keys.gathererGrades, queryFn: gradesApi.gathererGrades, ...defaults })

export const useGeneralIndicators = () =>
  useQuery({ queryKey: [...keys.indicators, 'general'], queryFn: indicatorsApi.general, ...defaults })
export const useResiduesByType = () =>
  useQuery({ queryKey: [...keys.indicators, 'residues'], queryFn: indicatorsApi.residuesByType, ...defaults })
export const useGathererRatings = () =>
  useQuery({ queryKey: [...keys.indicators, 'ratings'], queryFn: indicatorsApi.gathererRatings, ...defaults })

/**
 * Wraps a mutation so that the listed query prefixes are refreshed after it succeeds.
 * Every workflow in the product touches requests, services and indicators together.
 */
export function useInvalidatingMutation<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  invalidate: readonly QueryKey[] = [keys.requests, keys.requestDetails, keys.services, keys.allMaterials, keys.grades, keys.indicators],
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
  })
}
