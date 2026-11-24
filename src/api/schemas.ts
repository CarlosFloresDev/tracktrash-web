import { z } from 'zod'
import {
  gathererTypes,
  measurementUnits,
  organizationTypes,
  requestStatuses,
  residueCategories,
  subscriptionPlans,
  userRoles,
  verificationStatuses,
} from './enums'

const id = z.number().int()
const date = z.string()

export const userSchema = z.object({
  userId: id,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  roleId: z.enum(userRoles),
  locationId: id.nullable(),
  isActive: z.boolean(),
  createdAt: date,
  updatedAt: date,
})

export const locationSchema = z.object({
  locationId: id,
  address: z.string(),
  reference: z.string().nullable(),
  district: z.string(),
  province: z.string().nullable(),
  department: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: date,
})

export const collectRequestSchema = z.object({
  collectRequestId: id,
  userId: id,
  organizationId: id.nullable(),
  locationId: id,
  requestedAt: date,
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  statusId: z.enum(requestStatuses),
  observations: z.string().nullable(),
  updatedAt: date,
})

export const requestDetailSchema = z.object({
  requestDetailId: id,
  collectRequestId: id,
  residueTypeId: id,
  estimatedQuantity: z.number(),
  unitId: z.enum(measurementUnits),
  observations: z.string().nullable(),
})

export const pickupServiceSchema = z.object({
  pickupServiceId: id,
  collectRequestId: id,
  gathererId: id,
  assignedAt: date,
  startedAt: date.nullable(),
  completedAt: date.nullable(),
  statusId: z.enum(requestStatuses),
  commissionPercentage: z.number(),
  observations: z.string().nullable(),
})

export const collectRequestDetailSchema = z.object({
  request: collectRequestSchema,
  location: locationSchema,
  details: z.array(requestDetailSchema),
  pickupService: pickupServiceSchema.nullable(),
})

export const requestHistorySchema = z.object({
  requestHistoryId: id,
  collectRequestId: id,
  userId: id.nullable(),
  previousStatusId: z.enum(requestStatuses).nullable(),
  newStatusId: z.enum(requestStatuses),
  observations: z.string().nullable(),
  createdAt: date,
})

export const organizationSchema = z.object({
  organizationId: id,
  userId: id,
  businessName: z.string(),
  taxId: z.string().nullable(),
  organizationTypeId: z.enum(organizationTypes),
  locationId: id.nullable(),
  subscriptionPlanId: z.enum(subscriptionPlans),
  isActive: z.boolean(),
  createdAt: date,
})

export const residueTypeSchema = z.object({
  residueTypeId: id,
  name: z.string(),
  residueCategoryId: z.enum(residueCategories),
  description: z.string().nullable(),
  isRecyclable: z.boolean(),
  classificationInstructions: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: date,
})

export const gathererSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gathererId: id,
  userId: id,
  gathererTypeId: z.enum(gathererTypes),
  description: z.string().nullable(),
  verificationDocument: z.string().nullable(),
  verificationStatusId: z.enum(verificationStatuses),
  isActive: z.boolean(),
  createdAt: date,
  supportedResidueTypes: z.array(residueTypeSchema).optional(),
})

export const collectionPointSchema = z.object({
  collectionPointId: id,
  name: z.string(),
  managerName: z.string().nullable(),
  phone: z.string().nullable(),
  locationId: id,
  openingHours: z.string().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: date,
})

export const recoveredMaterialSchema = z.object({
  recoveredMaterialId: id,
  pickupServiceId: id,
  residueTypeId: id,
  quantity: z.number(),
  unitId: z.enum(measurementUnits),
  collectionPointId: id.nullable(),
  createdAt: date,
  observations: z.string().nullable(),
})

export const gradeSchema = z.object({
  gradeId: id,
  pickupServiceId: id,
  userId: id,
  score: z.number().int(),
  comment: z.string().nullable(),
  createdAt: date,
})

export const gathererGradeSchema = z.object({
  gathererGradeId: id,
  gathererId: id,
  gradeId: id,
})

export const generalIndicatorSchema = z.object({
  totalUsers: z.number(),
  totalOrganizations: z.number(),
  verifiedGatherers: z.number(),
  totalRequests: z.number(),
  completedRequests: z.number(),
  completedServices: z.number(),
  recoveredKilograms: z.number(),
})

export const residuesByTypeSchema = z.object({
  residueTypeId: id.nullable(),
  residueType: z.string().nullable(),
  category: z.string().nullable(),
  unit: z.string().nullable(),
  recoveredQuantity: z.number(),
})

export const gathererRatingSchema = z.object({
  gathererId: id.nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  averageScore: z.number(),
  totalGrades: z.number(),
})

export type User = z.infer<typeof userSchema>
export type Location = z.infer<typeof locationSchema>
export type CollectRequest = z.infer<typeof collectRequestSchema>
export type RequestDetail = z.infer<typeof requestDetailSchema>
export type PickupService = z.infer<typeof pickupServiceSchema>
export type CollectRequestFull = z.infer<typeof collectRequestDetailSchema>
export type RequestHistory = z.infer<typeof requestHistorySchema>
export type Gatherer = z.infer<typeof gathererSchema>
export type Organization = z.infer<typeof organizationSchema>
export type ResidueType = z.infer<typeof residueTypeSchema>
export type CollectionPoint = z.infer<typeof collectionPointSchema>
export type RecoveredMaterial = z.infer<typeof recoveredMaterialSchema>
export type Grade = z.infer<typeof gradeSchema>
export type GathererGrade = z.infer<typeof gathererGradeSchema>
export type GeneralIndicator = z.infer<typeof generalIndicatorSchema>
export type ResiduesByType = z.infer<typeof residuesByTypeSchema>
export type GathererRating = z.infer<typeof gathererRatingSchema>
