export const userRoles = ['Admin', 'Generator', 'Organization', 'Gatherer'] as const
export type UserRole = (typeof userRoles)[number]

export const requestStatuses = ['Pending', 'Assigned', 'InProgress', 'Completed', 'Cancelled'] as const
export type RequestStatus = (typeof requestStatuses)[number]
export type ServiceStatus = RequestStatus

export const gathererTypes = ['Independent', 'Company', 'Recycler'] as const
export type GathererType = (typeof gathererTypes)[number]

export const verificationStatuses = ['Pending', 'Verified', 'Rejected'] as const
export type VerificationStatus = (typeof verificationStatuses)[number]

export const measurementUnits = ['Kg', 'Unit', 'Liters'] as const
export type MeasurementUnit = (typeof measurementUnits)[number]

export const residueCategories = ['Recyclable', 'Organic', 'General'] as const
export type ResidueCategory = (typeof residueCategories)[number]

export const organizationTypes = ['EducationalInstitution', 'Company', 'Restaurant', 'FoodIndustry', 'Other'] as const
export type OrganizationType = (typeof organizationTypes)[number]

export const subscriptionPlans = ['Basic', 'Plan49', 'Plan99', 'Plan179'] as const
export type SubscriptionPlan = (typeof subscriptionPlans)[number]

export const labels = {
  role: { Admin: 'Administrador', Generator: 'Hogar', Organization: 'Organización', Gatherer: 'Recolector' },
  status: {
    Pending: 'Pendiente',
    Assigned: 'Asignada',
    InProgress: 'En camino',
    Completed: 'Completada',
    Cancelled: 'Cancelada',
  },
  gathererType: { Independent: 'Independiente', Company: 'Empresa', Recycler: 'Reciclador' },
  verification: { Pending: 'En revisión', Verified: 'Verificado', Rejected: 'Rechazado' },
  unit: { Kg: 'kg', Unit: 'unidades', Liters: 'litros' },
  category: { Recyclable: 'Reciclable', Organic: 'Orgánico', General: 'General' },
  organizationType: {
    EducationalInstitution: 'Institución educativa',
    Company: 'Empresa',
    Restaurant: 'Restaurante',
    FoodIndustry: 'Industria alimentaria',
    Other: 'Otro',
  },
  plan: { Basic: 'Básico', Plan49: 'Plan S/ 49', Plan99: 'Plan S/ 99', Plan179: 'Plan S/ 179' },
} as const satisfies Record<string, Record<string, string>>

/** Mirrors CollectRequestStatusRules in the backend so the UI only offers valid transitions. */
export const allowedTransitions: Record<RequestStatus, readonly RequestStatus[]> = {
  Pending: ['Assigned', 'Cancelled'],
  Assigned: ['InProgress', 'Pending', 'Cancelled'],
  InProgress: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
}

export const isFinalStatus = (status: RequestStatus) => allowedTransitions[status].length === 0
