/**
 * PortTrack API tests — Jest + Supertest against an in-memory MongoDB.
 * Run: npm test
 */
process.env.JWT_SECRET = 'test-secret-for-jest'

const request = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongod
let app
let adminToken, importerToken, exporterToken
let shipId, shipmentId, containerId, trackingId, importerId

beforeAll(async () => {
  // Pin a mongod version compatible with the bundled mongodb driver
  mongod = await MongoMemoryServer.create({ binary: { version: '7.0.14' } })
  process.env.MONGODB_URI = mongod.getUri()
  app = require('../app')
  // Pass the os adapter explicitly: the driver's dynamic import('os') does not
  // work inside Jest's CommonJS environment, which would drop client metadata.
  await mongoose.connect(process.env.MONGODB_URI, { runtimeAdapters: { os: require('os') } })

  const User = require('../models/User')
  await User.create({
    name: 'Port Officer',
    email: 'admin@test.demo',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
  })
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('Auth', () => {
  test('register importer returns user + token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Rahim Traders', email: 'importer@test.demo', password: 'secret1', role: 'importer' })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.role).toBe('importer')
    importerId = res.body._id
  })

  test('register rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Shorty', email: 'short@test.demo', password: '123', role: 'importer' })
    expect(res.status).toBe(400)
  })

  test('register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Copy', email: 'importer@test.demo', password: 'secret1', role: 'exporter' })
    expect(res.status).toBe(400)
  })

  test('login works for admin/importer/exporter', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dhaka Textiles', email: 'exporter@test.demo', password: 'secret1', role: 'exporter' })

    const a = await request(app).post('/api/auth/login').send({ email: 'admin@test.demo', password: 'admin123' })
    const i = await request(app).post('/api/auth/login').send({ email: 'importer@test.demo', password: 'secret1' })
    const e = await request(app).post('/api/auth/login').send({ email: 'exporter@test.demo', password: 'secret1' })
    expect(a.status).toBe(200)
    expect(i.status).toBe(200)
    expect(e.status).toBe(200)
    adminToken = a.body.token
    importerToken = i.body.token
    exporterToken = e.body.token
  })

  test('login rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.demo', password: 'wrong' })
    expect(res.status).toBe(401)
  })

  test('protected route rejects missing token', async () => {
    const res = await request(app).get('/api/ships')
    expect(res.status).toBe(401)
  })
})

describe('Ships', () => {
  test('importer cannot create a ship (403)', async () => {
    const res = await request(app)
      .post('/api/ships')
      .set('Authorization', `Bearer ${importerToken}`)
      .send({ name: 'MV Test', imo: 'IMO0000001', company: 'Test Lines', arrivalDate: '2026-12-01', departureDate: '2026-12-05', dockNumber: 'D-1' })
    expect(res.status).toBe(403)
  })

  test('admin creates a ship', async () => {
    const res = await request(app)
      .post('/api/ships')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'MV Test', imo: 'IMO0000001', company: 'Test Lines', arrivalDate: '2026-12-01', departureDate: '2026-12-05', dockNumber: 'D-1' })
    expect(res.status).toBe(201)
    shipId = res.body._id
  })

  test('ship list is visible to logged-in users', async () => {
    const res = await request(app).get('/api/ships').set('Authorization', `Bearer ${importerToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('Shipments & containers', () => {
  test('importer registers a shipment; container auto-created as Booked', async () => {
    const res = await request(app)
      .post('/api/shipments')
      .set('Authorization', `Bearer ${importerToken}`)
      .send({
        type: 'import', containerId: 'TEST-100-1', goodsType: 'Electronics',
        origin: 'Shenzhen, China', destination: 'Chattogram Port', ship: shipId, weight: 12000,
      })
    expect(res.status).toBe(201)
    expect(res.body.shipment.trackingId).toMatch(/^PT-\d{4}-\d{4}$/)
    expect(res.body.container.currentStatus).toBe('Booked')
    shipmentId = res.body.shipment._id
    containerId = res.body.container._id
    trackingId = res.body.shipment.trackingId
  })

  test('exporter does not see importer cargo', async () => {
    const res = await request(app).get('/api/shipments').set('Authorization', `Bearer ${exporterToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  test('admin sees all shipments', async () => {
    const res = await request(app).get('/api/shipments').set('Authorization', `Bearer ${adminToken}`)
    expect(res.body).toHaveLength(1)
  })

  test('importer cannot update container status (403)', async () => {
    const res = await request(app)
      .put(`/api/containers/${containerId}/status`)
      .set('Authorization', `Bearer ${importerToken}`)
      .send({ status: 'Loaded' })
    expect(res.status).toBe(403)
  })

  test('admin updates status; owner gets a notification', async () => {
    const res = await request(app)
      .put(`/api/containers/${containerId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Loaded' })
    expect(res.status).toBe(200)
    expect(res.body.currentStatus).toBe('Loaded')
    expect(res.body.statusHistory.length).toBeGreaterThanOrEqual(2)

    const notes = await request(app).get('/api/notifications').set('Authorization', `Bearer ${importerToken}`)
    expect(notes.status).toBe(200)
    expect(notes.body.unreadCount).toBe(1)
    expect(notes.body.notifications[0].trackingId).toBe(trackingId)
  })

  test('public tracking by tracking ID and by container ID', async () => {
    const byTracking = await request(app).get(`/api/track/${trackingId}`)
    expect(byTracking.status).toBe(200)
    expect(byTracking.body.container.currentStatus).toBe('Loaded')

    const byContainer = await request(app).get('/api/track/TEST-100-1')
    expect(byContainer.status).toBe(200)
    expect(byContainer.body.shipment.trackingId).toBe(trackingId)
  })

  test('public tracking returns 404 for unknown ID', async () => {
    const res = await request(app).get('/api/track/PT-2026-9999')
    expect(res.status).toBe(404)
  })

  test('dashboard counts are role-filtered', async () => {
    const admin = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${adminToken}`)
    expect(admin.body.totalShips).toBe(1)
    expect(admin.body.totalShipments).toBe(1)
    expect(admin.body.importCount).toBe(1)

    const exporter = await request(app).get('/api/dashboard').set('Authorization', `Bearer ${exporterToken}`)
    expect(exporter.body.totalShipments).toBe(0)
  })
})

describe('User management (admin)', () => {
  test('non-admin cannot list users (403)', async () => {
    const res = await request(app).get('/api/users?all=1').set('Authorization', `Bearer ${importerToken}`)
    expect(res.status).toBe(403)
  })

  test('admin lists all users', async () => {
    const res = await request(app).get('/api/users?all=1').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(3)
  })

  test('admin resets importer password; new password logs in', async () => {
    const res = await request(app)
      .put(`/api/users/${importerId}/password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'newpass1' })
    expect(res.status).toBe(200)

    const login = await request(app).post('/api/auth/login').send({ email: 'importer@test.demo', password: 'newpass1' })
    expect(login.status).toBe(200)
  })

  test('admin cannot delete an admin account', async () => {
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`)
    const res = await request(app).delete(`/api/users/${me.body._id}`).set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
  })
})
