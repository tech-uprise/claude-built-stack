const request = require('supertest');
const app = require('../server');

describe('Health Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return status ok with timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/test-db', () => {
    it('should successfully connect to database', async () => {
      const response = await request(app)
        .get('/api/test-db')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Database connection successful');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('current_time');
    });
  });
});
