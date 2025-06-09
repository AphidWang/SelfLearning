import request from 'supertest'
import { app } from '../src/index'

describe('POST /api/auth/login', () => {
  it('logs in demo student account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo-student@example.com', password: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('student')
    expect(res.body.token).toBeDefined()
  })
})
