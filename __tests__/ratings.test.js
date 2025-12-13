const request = require('supertest');
const app = require('../server');
const db = require('../db');

describe('Ratings API', () => {
  const testSong = {
    title: 'Test Song ' + Date.now(),
    artist: 'Test Artist'
  };

  // Cleanup after all tests
  afterAll(async () => {
    await db.query('DELETE FROM song_ratings WHERE song_title LIKE $1', ['Test Song %']);
  });

  describe('POST /api/ratings', () => {
    it('should submit a thumbs up rating', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          title: testSong.title,
          artist: testSong.artist,
          rating: 'up'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Rating submitted successfully');
    });

    it('should submit a thumbs down rating', async () => {
      const newSong = {
        title: 'Test Song Down ' + Date.now(),
        artist: 'Test Artist'
      };

      const response = await request(app)
        .post('/api/ratings')
        .send({
          title: newSong.title,
          artist: newSong.artist,
          rating: 'down'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Rating submitted successfully');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({ title: 'Test Song' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Title, artist, and rating are required');
    });

    it('should return 400 if rating is invalid', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          title: testSong.title,
          artist: testSong.artist,
          rating: 'invalid'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Rating must be either "up" or "down"');
    });

    it('should update rating if user changes their vote', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          title: testSong.title,
          artist: testSong.artist,
          rating: 'down'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Rating updated successfully');
    });

    it('should return 400 if user tries to submit same rating twice', async () => {
      const response = await request(app)
        .post('/api/ratings')
        .send({
          title: testSong.title,
          artist: testSong.artist,
          rating: 'down'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'You have already rated this song');
    });
  });

  describe('GET /api/ratings/:title/:artist', () => {
    it('should return rating counts for a song', async () => {
      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSong.title)}/${encodeURIComponent(testSong.artist)}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('ratings');
      expect(response.body.ratings).toHaveProperty('up');
      expect(response.body.ratings).toHaveProperty('down');
      expect(response.body).toHaveProperty('userRating');
      expect(typeof response.body.ratings.up).toBe('number');
      expect(typeof response.body.ratings.down).toBe('number');
    });

    it('should return zero ratings for unrated song', async () => {
      const newSong = {
        title: 'Unrated Song ' + Date.now(),
        artist: 'Unknown Artist'
      };

      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(newSong.title)}/${encodeURIComponent(newSong.artist)}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.ratings).toEqual({ up: 0, down: 0 });
      expect(response.body.userRating).toBe(null);
    });

    it('should return user rating if user has rated', async () => {
      const response = await request(app)
        .get(`/api/ratings/${encodeURIComponent(testSong.title)}/${encodeURIComponent(testSong.artist)}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('userRating');
      expect(['up', 'down', null]).toContain(response.body.userRating);
    });
  });
});
