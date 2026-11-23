// Seeds the LOCAL database through the real API so passwords are hashed by the backend itself.
// Usage: node seed.mjs [baseUrl]   (default http://localhost:5145)
const BASE = process.argv[2] ?? 'http://localhost:5145'
const PASSWORD = 'TrackTrash2026!'

async function call(method, path, body) {
  const res = await fetch(`${BASE}/api/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}
const post = (p, b) => call('POST', p, b)

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
  jlbyr: ['Av. Jose Luis Bustamante 301', 'Paradero Zamacola', 'Jose Luis Bustamante y Rivero', -16.4172, -71.5251],
  characato: ['Calle Real 90', 'Plaza de Characato', 'Characato', -16.4772, -71.4872],
}
const loc = {}
for (const [key, [address, reference, district, latitude, longitude]] of Object.entries(places)) {
  loc[key] = await post('Location', { address, reference, district, province: 'Arequipa', department: 'Arequipa', latitude, longitude })
}

const user = (firstName, lastName, email, roleId, location, phone) =>
  post('User', { firstName, lastName, email, password: PASSWORD, roleId, locationId: loc[location], phone })

const admin = await user('Carlos', 'Flores', 'admin@tracktrash.pe', 'Admin', 'cercado', '954000001')
const lucia = await user('Lucia', 'Mamani', 'lucia@correo.pe', 'Generator', 'yanahuara', '954000002')
const diego = await user('Diego', 'Quispe', 'diego@correo.pe', 'Generator', 'cayma', '954000003')
const rosa = await user('Rosa', 'Huaman', 'rosa@correo.pe', 'Generator', 'miraflores', '954000004')
const picanteria = await user('Julio', 'Valdivia', 'picanteria@correo.pe', 'Organization', 'cercado', '954000005')
const colegio = await user('Marta', 'Cornejo', 'colegio@correo.pe', 'Organization', 'cerroColorado', '954000006')
const gUser1 = await user('Elmer', 'Condori', 'elmer@recicla.pe', 'Gatherer', 'paucarpata', '954000007')
const gUser2 = await user('Ana', 'Paredes', 'ana@ecoarequipa.pe', 'Gatherer', 'socabaya', '954000008')
const gUser3 = await user('Pedro', 'Ccama', 'pedro@recicla.pe', 'Gatherer', 'jlbyr', '954000009')
const gUser4 = await user('Sofia', 'Rivera', 'sofia@recicla.pe', 'Gatherer', 'sachaca', '954000010')

const orgPicanteria = await post('Organization', { userId: picanteria, businessName: 'Picanteria La Nueva Palomino', taxId: '20456789012', organizationTypeId: 'Restaurant', locationId: loc.cercado, subscriptionPlanId: 'Plan49' })
const orgColegio = await post('Organization', { userId: colegio, businessName: 'I.E. Independencia Americana', taxId: '20123456789', organizationTypeId: 'EducationalInstitution', locationId: loc.cerroColorado, subscriptionPlanId: 'Plan99' })

const gatherers = [
  [gUser1, 'Independent', 'Recolector independiente con triciclo de carga. Zona sur.', 'DNI-45120987', true],
  [gUser2, 'Company', 'EcoArequipa SAC. Camioneta y personal uniformado.', 'RUC-20601234567', true],
  [gUser3, 'Recycler', 'Centro de acopio y reciclaje de plasticos y metales.', 'DNI-29876543', true],
  [gUser4, 'Independent', 'Recolectora de papel y carton en Sachaca y Yanahuara.', 'DNI-40112233', false],
]
const gIds = []
for (const [userId, gathererTypeId, description, verificationDocument, verified] of gatherers) {
  const id = await post('Gatherer', { userId, gathererTypeId, description, verificationDocument })
  gIds.push(id)
  if (verified) {
    await call('PUT', `Gatherer/${id}`, { gathererTypeId, description, verificationDocument, verificationStatusId: 'Verified', isActive: true })
  }
}
const [g1, g2, g3] = gIds

const types = {}
const residues = [
  ['Papel y carton', 'Recyclable', true, 'Cajas, periodicos y cuadernos', 'Limpios, secos y sin restos de comida.'],
  ['Plastico PET', 'Recyclable', true, 'Botellas de agua y gaseosa', 'Enjuagar, aplastar y retirar la tapa.'],
  ['Vidrio', 'Recyclable', true, 'Botellas y frascos', 'Separar por color y avisar si hay piezas rotas.'],
  ['Metal y latas', 'Recyclable', true, 'Latas de bebidas y conservas', 'Limpias y sin restos peligrosos.'],
  ['Tetra Pak', 'Recyclable', true, 'Envases de leche y jugo', 'Enjuagar y aplastar.'],
  ['Aceite usado', 'General', false, 'Aceite de cocina usado', 'Guardar en botella cerrada y no mezclar con agua.'],
  ['Residuos organicos', 'Organic', false, 'Restos de comida y poda', 'Separar de los reciclables para compostaje.'],
]
for (const [name, residueCategoryId, isRecyclable, description, classificationInstructions] of residues) {
  types[name] = await post('ResidueType', { name, residueCategoryId, isRecyclable, description, classificationInstructions })
}

const points = [
  ['Punto Verde Plaza de Armas', 'Jorge Salas', '054-210001', 'cercado', 'Lun a Sab 8:00 - 18:00', 'Acopio de papel, plastico y vidrio.'],
  ['Centro de Acopio Yanahuara', 'Carmen Ruiz', '054-210002', 'yanahuara', 'Lun a Vie 9:00 - 17:00', 'Atiende residuos reciclables del distrito.'],
  ['EcoPunto Cayma', 'Luis Torres', '054-210003', 'cayma', 'Lun a Sab 8:00 - 16:00', 'Latas, botellas y carton.'],
  ['Reciclaje Paucarpata', 'Martin Apaza', '054-210004', 'paucarpata', 'Lun a Dom 7:00 - 19:00', 'Compra directa de metales y plasticos.'],
  ['Acopio Cerro Colorado', 'Silvia Quispe', '054-210005', 'cerroColorado', 'Mar a Sab 9:00 - 15:00', 'Punto de entrega para instituciones educativas.'],
  ['Eco Socabaya', 'Raul Mendoza', '054-210006', 'socabaya', 'Lun a Vie 8:00 - 17:00', 'Aceite usado y Tetra Pak.'],
]
for (const [name, managerName, phone, l, openingHours, description] of points) {
  await post('CollectionPoint', { name, managerName, phone, locationId: loc[l], openingHours, description })
}

async function request(userId, organizationId, location, dayOffset, time, observations, items, flow) {
  const id = await post('CollectRequest', { userId, organizationId, locationId: loc[location], scheduledDate: day(dayOffset), scheduledTime: time, observations })
  for (const [type, qty, unit] of items) {
    await post('RequestDetail', { collectRequestId: id, residueTypeId: types[type], estimatedQuantity: qty, unitId: unit ?? 'Kg' })
  }
  if (!flow) return id
  const service = await post('PickupService', { collectRequestId: id, gathererId: flow.gatherer, commissionPercentage: 10, assignedByUserId: admin })
  if (flow.stage === 'assigned') return id
  await call('PATCH', `PickupService/${service}/status`, { newStatusId: 'InProgress', changedByUserId: flow.by })
  if (flow.stage === 'progress') return id
  for (const [type, qty, unit] of items) {
    if (unit === 'Liters') continue
    await post('RecoveredMaterial', { pickupServiceId: service, residueTypeId: types[type], quantity: Number((qty * 0.92).toFixed(2)), unitId: 'Kg' })
  }
  await call('PATCH', `PickupService/${service}/status`, { newStatusId: 'Completed', changedByUserId: flow.by })
  if (flow.score) await post('Grade', { pickupServiceId: service, userId, score: flow.score, comment: flow.comment })
  return id
}

await request(lucia, null, 'yanahuara', 1, '09:00:00', 'Tocar el timbre dos veces.', [['Papel y carton', 12], ['Plastico PET', 5]])
await request(lucia, null, 'yanahuara', 3, '15:30:00', 'Cajas en la cochera.', [['Vidrio', 18]])
await request(diego, null, 'cayma', 2, '10:00:00', null, [['Metal y latas', 8], ['Plastico PET', 4]])
await request(rosa, null, 'miraflores', 4, '08:30:00', 'Preguntar por Rosa en porteria.', [['Papel y carton', 25]])
await request(picanteria, orgPicanteria, 'cercado', 2, '16:00:00', 'Entrada por la puerta lateral.', [['Aceite usado', 20, 'Liters'], ['Vidrio', 30], ['Plastico PET', 15]], { gatherer: g2, stage: 'assigned' })
await request(colegio, orgColegio, 'cerroColorado', 1, '11:00:00', 'Campana de reciclaje escolar.', [['Papel y carton', 60], ['Plastico PET', 22]], { gatherer: g1, stage: 'progress', by: gUser1 })
await request(diego, null, 'cayma', 5, '09:30:00', null, [['Tetra Pak', 6]], { gatherer: g3, stage: 'completed', by: gUser3, score: 5, comment: 'Puntual y muy amable.' })
await request(lucia, null, 'yanahuara', 6, '14:00:00', null, [['Papel y carton', 18]], { gatherer: g1, stage: 'completed', by: gUser1, score: 4, comment: 'Buen servicio, llego un poco tarde.' })
await request(picanteria, orgPicanteria, 'cercado', 7, '10:00:00', null, [['Vidrio', 45], ['Metal y latas', 12]], { gatherer: g2, stage: 'completed', by: gUser2, score: 5, comment: 'Excelente coordinacion con la empresa.' })
await request(colegio, orgColegio, 'cerroColorado', 8, '09:00:00', null, [['Papel y carton', 80], ['Plastico PET', 35]], { gatherer: g2, stage: 'completed', by: gUser2, score: 5, comment: 'Recojo ordenado y con constancia.' })
await request(rosa, null, 'miraflores', 9, '17:00:00', null, [['Plastico PET', 9]], { gatherer: g3, stage: 'completed', by: gUser3, score: 4 })
const cancelled = await request(diego, null, 'cayma', 10, '12:00:00', 'Ya no es necesario.', [['Vidrio', 10]])
await call('PATCH', `CollectRequest/${cancelled}/status`, { newStatusId: 'Cancelled', changedByUserId: diego, observations: 'Cancelado por el usuario.' })

console.log('Seed complete. Password for every account:', PASSWORD)
console.log(await call('GET', 'Indicator/general'))
