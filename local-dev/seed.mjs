// Seeds the LOCAL database through the real API, signing in as each account like the apps do.
// Usage: node seed.mjs [baseUrl]   (default http://localhost:5145)
// The API cannot create administrators, so the admin signs up as a household and is promoted
// with psql (PGBIN and the database below can be overridden with environment variables).
import { execFileSync } from 'node:child_process'

const BASE = process.argv[2] ?? 'http://localhost:5145'
const PASSWORD = 'TrackTrash2026!'
const PSQL = `${process.env.PGBIN ?? 'D:\\DevTools\\postgres\\pgsql\\bin'}\\psql.exe`
const DB = ['-h', 'localhost', '-p', process.env.PGPORT ?? '54329', '-U', 'postgres', '-d', process.env.PGDATABASE ?? 'tracktrash_db']

async function call(method, path, body, token) {
  const res = await fetch(`${BASE}/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

const day = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const places = {
  cercado: ['Calle Mercaderes 214', 'Frente a la Plaza de Armas', 'Cercado', -16.3989, -71.5369],
  yanahuara: ['Av. Ejercito 710', 'Cerca al Mirador de Yanahuara', 'Yanahuara', -16.3902, -71.5469],
  cayma: ['Av. Cayma 1020', 'Costado del mercado', 'Cayma', -16.3665, -71.5456],
  cerroColorado: ['Av. Aviacion 2210', 'Paradero Cerro Colorado', 'Cerro Colorado', -16.3784, -71.5736],
  sachaca: ['Calle Los Andes 130', 'Cerca a la plaza principal', 'Sachaca', -16.4206, -71.5622],
  socabaya: ['Av. Socabaya 455', 'Frente al parque', 'Socabaya', -16.4578, -71.5303],
  paucarpata: ['Av. Kennedy 1560', 'Al lado del grifo', 'Paucarpata', -16.4284, -71.5082],
  miraflores: ['Av. Mariscal Castilla 880', 'Cerca al colegio', 'Miraflores', -16.3908, -71.5192],
}

/** Signs up, signs in and, for households and organizations, saves the address. */
async function account(firstName, lastName, email, roleId, place, phone) {
  const userId = await call('POST', 'User', { firstName, lastName, email, password: PASSWORD, roleId: roleId === 'Admin' ? 'Generator' : roleId, phone })
  if (roleId === 'Admin') execFileSync(PSQL, [...DB, '-c', `update users set role_id = 1 where user_id = ${userId}`])
  const { accessToken: token } = await call('POST', 'Auth/Login', { email, password: PASSWORD })
  let locationId = null
  if (place && roleId !== 'Gatherer') {
    const [address, reference, district, latitude, longitude] = places[place]
    locationId = await call('POST', 'Location', { address, reference, district, province: 'Arequipa', department: 'Arequipa', latitude, longitude }, token)
    await call('PUT', `User/${userId}`, { firstName, lastName, phone, roleId, locationId, isActive: true }, token)
  }
  return { userId, token, locationId }
}

const admin = await account('Carlos', 'Flores', 'admin@tracktrash.pe', 'Admin', 'cercado', '954000001')
const lucia = await account('Lucia', 'Mamani', 'lucia@correo.pe', 'Generator', 'yanahuara', '954000002')
const diego = await account('Diego', 'Quispe', 'diego@correo.pe', 'Generator', 'cayma', '954000003')
const rosa = await account('Rosa', 'Huaman', 'rosa@correo.pe', 'Generator', 'miraflores', '954000004')
const picanteria = await account('Julio', 'Valdivia', 'picanteria@correo.pe', 'Organization', 'cercado', '954000005')
const colegio = await account('Marta', 'Cornejo', 'colegio@correo.pe', 'Organization', 'cerroColorado', '954000006')
const elmer = await account('Elmer', 'Condori', 'elmer@recicla.pe', 'Gatherer', null, '954000007')
const ana = await account('Ana', 'Paredes', 'ana@ecoarequipa.pe', 'Gatherer', null, '954000008')
const pedro = await account('Pedro', 'Ccama', 'pedro@recicla.pe', 'Gatherer', null, '954000009')
const sofia = await account('Sofia', 'Rivera', 'sofia@recicla.pe', 'Gatherer', null, '954000010')

picanteria.organizationId = await call('POST', 'Organization', { userId: picanteria.userId, businessName: 'Picanteria La Nueva Palomino', taxId: '20456789012', organizationTypeId: 'Restaurant', locationId: picanteria.locationId, subscriptionPlanId: 'Plan49' }, picanteria.token)
colegio.organizationId = await call('POST', 'Organization', { userId: colegio.userId, businessName: 'I.E. Independencia Americana', taxId: '20123456789', organizationTypeId: 'EducationalInstitution', locationId: colegio.locationId, subscriptionPlanId: 'Plan99' }, colegio.token)

// Catalog seeded by the backend script 04_seed_residue_types.sql, looked up by name.
const catalog = await call('GET', 'ResidueType', null, admin.token)
const type = (name) => {
  const found = catalog.find((item) => item.name === name)
  if (!found) throw new Error(`Residue type "${name}" not found. Run database/04_seed_residue_types.sql first.`)
  return found.residueTypeId
}

const gatherers = [
  [elmer, 'Independent', 'Recolector independiente con triciclo de carga. Zona sur.', 'DNI-45120987', true, ['Papel', 'Cartón', 'Plástico PET']],
  [ana, 'Company', 'EcoArequipa SAC. Camioneta y personal uniformado.', 'RUC-20601234567', true, ['Papel', 'Cartón', 'Plástico PET', 'Vidrio', 'Aluminio']],
  [pedro, 'Recycler', 'Centro de acopio y reciclaje de plasticos y metales.', 'DNI-29876543', true, ['Plástico PET', 'Plástico HDPE', 'Aluminio', 'Metal ferroso']],
  [sofia, 'Independent', 'Recolectora de papel y carton en Sachaca y Yanahuara.', 'DNI-40112233', false, ['Papel', 'Cartón']],
]
for (const [g, gathererTypeId, description, verificationDocument, verified, materials] of gatherers) {
  g.gathererId = await call('POST', 'Gatherer', { userId: g.userId, gathererTypeId, description, verificationDocument }, g.token)
  if (verified) {
    await call('PUT', `Gatherer/${g.gathererId}`, { gathererId: g.gathererId, gathererTypeId, description, verificationDocument, verificationStatusId: 'Verified', isActive: true }, admin.token)
  }
  await call('PUT', 'Gatherer/me/residue-types', { residueTypeIds: materials.map(type) }, g.token)
}

const points = [
  ['Punto Verde Plaza de Armas', 'Jorge Salas', '054-210001', 'cercado', 'Lun a Sab 8:00 - 18:00', 'Acopio de papel, plastico y vidrio.'],
  ['Centro de Acopio Yanahuara', 'Carmen Ruiz', '054-210002', 'yanahuara', 'Lun a Vie 9:00 - 17:00', 'Atiende residuos reciclables del distrito.'],
  ['EcoPunto Cayma', 'Luis Torres', '054-210003', 'cayma', 'Lun a Sab 8:00 - 16:00', 'Latas, botellas y carton.'],
  ['Reciclaje Paucarpata', 'Martin Apaza', '054-210004', 'paucarpata', 'Lun a Dom 7:00 - 19:00', 'Compra directa de metales y plasticos.'],
  ['Acopio Cerro Colorado', 'Silvia Quispe', '054-210005', 'cerroColorado', 'Mar a Sab 9:00 - 15:00', 'Punto de entrega para instituciones educativas.'],
  ['Eco Socabaya', 'Raul Mendoza', '054-210006', 'socabaya', 'Lun a Vie 8:00 - 17:00', 'Vidrio y metales.'],
]
for (const [name, managerName, phone, place, openingHours, description] of points) {
  const [address, reference, district, latitude, longitude] = places[place]
  const locationId = await call('POST', 'Location', { address, reference, district, province: 'Arequipa', department: 'Arequipa', latitude, longitude }, admin.token)
  await call('POST', 'CollectionPoint', { name, managerName, phone, locationId, openingHours, description }, admin.token)
}

/** Creates a request and optionally walks it through application, acceptance, pickup and rating. */
async function request(owner, dayOffset, time, observations, items, flow) {
  const id = await call('POST', 'CollectRequest', {
    organizationId: owner.organizationId ?? null, locationId: owner.locationId,
    scheduledDate: day(dayOffset), scheduledTime: time, observations,
    details: items.map(([name, qty]) => ({ residueTypeId: type(name), estimatedQuantity: qty, unitId: 'Kg' })),
  }, owner.token)
  if (!flow) return id
  await call('POST', `CollectRequest/${id}/applications`, null, flow.gatherer.token)
  if (flow.stage === 'applied') return id
  const [application] = await call('GET', `CollectRequest/${id}/applications`, null, owner.token)
  await call('POST', `CollectRequest/${id}/applications/${application.applicationId}/accept`, null, owner.token)
  if (flow.stage === 'assigned') return id
  const service = (await call('GET', `CollectRequest/${id}/full`, null, owner.token)).pickupService.pickupServiceId
  await call('PATCH', `PickupService/${service}/status`, { newStatusId: 'InProgress' }, flow.gatherer.token)
  if (flow.stage === 'progress') return id
  for (const [name, qty] of items) {
    await call('POST', 'RecoveredMaterial', { pickupServiceId: service, residueTypeId: type(name), quantity: Number((qty * 0.92).toFixed(2)), unitId: 'Kg' }, flow.gatherer.token)
  }
  await call('PATCH', `PickupService/${service}/status`, { newStatusId: 'Completed' }, flow.gatherer.token)
  if (flow.score) await call('POST', 'Grade', { pickupServiceId: service, userId: owner.userId, score: flow.score, comment: flow.comment }, owner.token)
  return id
}

await request(lucia, 1, '09:00:00', 'Tocar el timbre dos veces.', [['Papel', 12], ['Plástico PET', 5]])
await request(lucia, 3, '15:30:00', 'Cajas en la cochera.', [['Cartón', 18]], { gatherer: elmer, stage: 'applied' })
await request(diego, 2, '10:00:00', null, [['Aluminio', 8], ['Plástico PET', 4]])
await request(rosa, 4, '08:30:00', 'Preguntar por Rosa en porteria.', [['Papel', 25]])
await request(picanteria, 2, '16:00:00', 'Entrada por la puerta lateral.', [['Vidrio', 30], ['Plástico PET', 15]], { gatherer: ana, stage: 'assigned' })
await request(colegio, 1, '11:00:00', 'Campana de reciclaje escolar.', [['Papel', 60], ['Plástico PET', 22]], { gatherer: elmer, stage: 'progress' })
await request(diego, 5, '09:30:00', null, [['Plástico HDPE', 6]], { gatherer: pedro, stage: 'completed', score: 5, comment: 'Puntual y muy amable.' })
await request(lucia, 6, '14:00:00', null, [['Cartón', 18]], { gatherer: elmer, stage: 'completed', score: 4, comment: 'Buen servicio, llego un poco tarde.' })
await request(picanteria, 7, '10:00:00', null, [['Vidrio', 45], ['Aluminio', 12]], { gatherer: ana, stage: 'completed', score: 5, comment: 'Excelente coordinacion con la empresa.' })
await request(colegio, 8, '09:00:00', null, [['Papel', 80], ['Plástico PET', 35]], { gatherer: ana, stage: 'completed', score: 5, comment: 'Recojo ordenado y con constancia.' })
await request(rosa, 9, '17:00:00', null, [['Plástico PET', 9]], { gatherer: pedro, stage: 'completed', score: 4 })
const cancelled = await request(diego, 10, '12:00:00', 'Ya no es necesario.', [['Vidrio', 10]])
await call('PATCH', `CollectRequest/${cancelled}/status`, { newStatusId: 'Cancelled', observations: 'Cancelado por el usuario.' }, diego.token)

console.log('Seed complete. Password for every account:', PASSWORD)
try {
  console.log(await call('GET', 'Indicator/general', null, admin.token))
} catch (error) {
  console.log('Indicators unavailable (load local-dev/01_views.sql):', error.message)
}
