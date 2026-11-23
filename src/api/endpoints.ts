import { z } from 'zod'
import { request } from '@/lib/http'
import type {
  GathererType,
  MeasurementUnit,
  OrganizationType,
  RequestStatus,
  ResidueCategory,
  SubscriptionPlan,
  UserRole,
  VerificationStatus,
} from './enums'
import {
  collectionPointSchema,
  collectRequestDetailSchema,
  collectRequestSchema,
  gathererGradeSchema,
  gathererRatingSchema,
  gathererSchema,
  generalIndicatorSchema,
  gradeSchema,
  locationSchema,
  organizationSchema,
  pickupServiceSchema,
  recoveredMaterialSchema,
  requestDetailSchema,
  requestHistorySchema,
  residuesByTypeSchema,
  residueTypeSchema,
  userSchema,
} from './schemas'

async function get<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  return schema.parse(await request<unknown>(path))
}

const list = <S extends z.ZodType>(schema: S) => z.array(schema)

/** Creation endpoints answer with the new identifier. */
const create = (path: string, body: unknown) => request<number>(path, { method: 'POST', body })
const update = (path: string, body: unknown) => request<number>(path, { method: 'PUT', body })
const patch = (path: string, body: unknown) => request<number>(path, { method: 'PATCH', body })
const remove = (path: string) => request<void>(path, { method: 'DELETE' })

export const usersApi = {
  list: () => get('User', list(userSchema)),
  byId: (id: number) => get(`User/${id}`, userSchema),
  byEmail: (email: string) => get(`User/email/${encodeURIComponent(email)}`, userSchema),
  create: (body: {
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    password: string
    roleId: UserRole
    locationId?: number | null
  }) => create('User', body),
  update: (
    id: number,
    body: { firstName: string; lastName: string; phone?: string | null; roleId: UserRole; locationId?: number | null; isActive: boolean },
  ) => update(`User/${id}`, body),
  changePassword: (id: number, body: { currentPassword: string; newPassword: string }) =>
    request<boolean>(`User/${id}/password`, { method: 'PUT', body }),
  deactivate: (id: number) => remove(`User/${id}`),
}

export const locationsApi = {
  list: () => get('Location', list(locationSchema)),
  byId: (id: number) => get(`Location/${id}`, locationSchema),
  create: (body: {
    address: string
    reference?: string | null
    district: string
    province?: string | null
    department?: string | null
    latitude?: number | null
    longitude?: number | null
  }) => create('Location', body),
}

export const requestsApi = {
  list: () => get('CollectRequest', list(collectRequestSchema)),
  pending: () => get('CollectRequest/pending', list(collectRequestSchema)),
  byUser: (userId: number) => get(`CollectRequest/user/${userId}`, list(collectRequestSchema)),
  full: (id: number) => get(`CollectRequest/${id}/full`, collectRequestDetailSchema),
  create: (body: {
    userId: number
    organizationId?: number | null
    locationId: number
    scheduledDate: string
    scheduledTime: string
    observations?: string | null
  }) => create('CollectRequest', body),
  update: (
    id: number,
    body: { locationId: number; scheduledDate: string; scheduledTime: string; observations?: string | null },
  ) => update(`CollectRequest/${id}`, body),
  changeStatus: (id: number, body: { newStatusId: RequestStatus; changedByUserId?: number | null; observations?: string | null }) =>
    patch(`CollectRequest/${id}/status`, body),
  history: (id: number) => get(`RequestHistory/collect-request/${id}`, list(requestHistorySchema)),
}

export const requestDetailsApi = {
  list: () => get('RequestDetail', list(requestDetailSchema)),
  byRequest: (id: number) => get(`RequestDetail/collect-request/${id}`, list(requestDetailSchema)),
  create: (body: {
    collectRequestId: number
    residueTypeId: number
    estimatedQuantity: number
    unitId: MeasurementUnit
    observations?: string | null
  }) => create('RequestDetail', body),
}

export const pickupServicesApi = {
  list: () => get('PickupService', list(pickupServiceSchema)),
  byGatherer: (gathererId: number) => get(`PickupService/gatherer/${gathererId}`, list(pickupServiceSchema)),
  byRequest: (requestId: number) => get(`PickupService/collect-request/${requestId}`, pickupServiceSchema),
  create: (body: {
    collectRequestId: number
    gathererId: number
    commissionPercentage: number
    observations?: string | null
    assignedByUserId?: number | null
  }) => create('PickupService', body),
  changeStatus: (id: number, body: { newStatusId: RequestStatus; changedByUserId?: number | null; observations?: string | null }) =>
    patch(`PickupService/${id}/status`, body),
}

export const recoveredMaterialsApi = {
  list: () => get('RecoveredMaterial', list(recoveredMaterialSchema)),
  byService: (serviceId: number) => get(`RecoveredMaterial/pickup-service/${serviceId}`, list(recoveredMaterialSchema)),
  create: (body: {
    pickupServiceId: number
    residueTypeId: number
    quantity: number
    unitId: MeasurementUnit
    collectionPointId?: number | null
    observations?: string | null
  }) => create('RecoveredMaterial', body),
}

export const gradesApi = {
  list: () => get('Grade', list(gradeSchema)),
  byServiceAndUser: (serviceId: number, userId: number) =>
    get(`Grade/pickup-service/${serviceId}/user/${userId}`, gradeSchema),
  create: (body: { pickupServiceId: number; userId: number; score: number; comment?: string | null }) =>
    create('Grade', body),
  gathererGrades: () => get('GathererGrade', list(gathererGradeSchema)),
}

export const gatherersApi = {
  list: () => get('Gatherer', list(gathererSchema)),
  byUser: (userId: number) => get(`Gatherer/user/${userId}`, gathererSchema),
  create: (body: { userId: number; gathererTypeId: GathererType; description?: string | null; verificationDocument?: string | null }) =>
    create('Gatherer', body),
  update: (
    id: number,
    body: {
      gathererTypeId: GathererType
      description?: string | null
      verificationDocument?: string | null
      verificationStatusId: VerificationStatus
      isActive: boolean
    },
  ) => update(`Gatherer/${id}`, body),
}

export const organizationsApi = {
  list: () => get('Organization', list(organizationSchema)),
  byUser: (userId: number) => get(`Organization/user/${userId}`, organizationSchema),
  create: (body: {
    userId: number
    businessName: string
    taxId?: string | null
    organizationTypeId: OrganizationType
    locationId?: number | null
    subscriptionPlanId: SubscriptionPlan
  }) => create('Organization', body),
}

export const residueTypesApi = {
  list: () => get('ResidueType', list(residueTypeSchema)),
  create: (body: {
    name: string
    residueCategoryId: ResidueCategory
    description?: string | null
    isRecyclable: boolean
    classificationInstructions?: string | null
  }) => create('ResidueType', body),
  update: (
    id: number,
    body: {
      name: string
      residueCategoryId: ResidueCategory
      description?: string | null
      isRecyclable: boolean
      classificationInstructions?: string | null
      isActive: boolean
    },
  ) => update(`ResidueType/${id}`, body),
}

export const collectionPointsApi = {
  list: () => get('CollectionPoint', list(collectionPointSchema)),
  create: (body: {
    name: string
    managerName?: string | null
    phone?: string | null
    locationId: number
    openingHours?: string | null
    description?: string | null
  }) => create('CollectionPoint', body),
  update: (
    id: number,
    body: {
      name: string
      managerName?: string | null
      phone?: string | null
      locationId: number
      openingHours?: string | null
      description?: string | null
      isActive: boolean
    },
  ) => update(`CollectionPoint/${id}`, body),
}

export const indicatorsApi = {
  general: () => get('Indicator/general', generalIndicatorSchema),
  residuesByType: () => get('Indicator/residues-by-type', list(residuesByTypeSchema)),
  gathererRatings: () => get('Indicator/gatherer-ratings', list(gathererRatingSchema)),
}
