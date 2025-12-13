const request = require('supertest');
const app = require('../server');
const db = require('../db');

describe('Audit Log API', () => {
  let testUserId;
  const testUser = {
    name: 'Audit Test User',
    email: `audit-test-${Date.now()}@example.com`
  };

  // Create a test user to generate audit logs
  beforeAll(async () => {
    const response = await request(app)
      .post('/api/users')
      .send(testUser);
    testUserId = response.body.user.id;
  });

  // Cleanup after all tests
  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email LIKE $1', ['audit-test-%@example.com']);
  });

  describe('GET /api/audit', () => {
    it('should return audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('logs');
      expect(Array.isArray(response.body.logs)).toBe(true);
      expect(response.body.count).toBe(response.body.logs.length);
    });

    it('should include required audit log fields', async () => {
      const response = await request(app)
        .get('/api/audit')
        .expect('Content-Type', /json/)
        .expect(200);

      if (response.body.logs.length > 0) {
        const log = response.body.logs[0];
        expect(log).toHaveProperty('id');
        expect(log).toHaveProperty('action');
        expect(log).toHaveProperty('entity_type');
        expect(log).toHaveProperty('entity_id');
        expect(log).toHaveProperty('user_name');
        expect(log).toHaveProperty('user_email');
        expect(log).toHaveProperty('changes');
        expect(log).toHaveProperty('ip_address');
        expect(log).toHaveProperty('created_at');
      }
    });

    it('should log CREATE action for new user', async () => {
      const response = await request(app)
        .get('/api/audit')
        .expect(200);

      const userCreateLog = response.body.logs.find(
        log => log.action === 'CREATE' &&
               log.entity_type === 'user' &&
               log.user_email === testUser.email
      );

      expect(userCreateLog).toBeDefined();
      expect(userCreateLog.entity_id).toBe(testUserId);
      expect(userCreateLog.user_name).toBe(testUser.name);
    });

    it('should log UPDATE action when user is modified', async () => {
      const updatedData = {
        name: 'Audit Test User Updated',
        email: testUser.email
      };

      await request(app)
        .put(`/api/users/${testUserId}`)
        .send(updatedData);

      const response = await request(app)
        .get('/api/audit')
        .expect(200);

      const updateLog = response.body.logs.find(
        log => log.action === 'UPDATE' &&
               log.entity_type === 'user' &&
               log.entity_id === testUserId
      );

      expect(updateLog).toBeDefined();
      expect(updateLog.changes).toBeDefined();

      const changes = typeof updateLog.changes === 'string'
        ? JSON.parse(updateLog.changes)
        : updateLog.changes;

      expect(changes).toHaveProperty('before');
      expect(changes).toHaveProperty('after');
      expect(changes.before.name).toBe(testUser.name);
      expect(changes.after.name).toBe(updatedData.name);
    });

    it('should log DELETE action when user is deleted', async () => {
      await request(app)
        .delete(`/api/users/${testUserId}`)
        .expect(200);

      const response = await request(app)
        .get('/api/audit')
        .expect(200);

      const deleteLog = response.body.logs.find(
        log => log.action === 'DELETE' &&
               log.entity_type === 'user' &&
               log.entity_id === testUserId
      );

      expect(deleteLog).toBeDefined();
    });

    it('should limit results to 1000 logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .expect(200);

      expect(response.body.logs.length).toBeLessThanOrEqual(1000);
    });
  });
});
