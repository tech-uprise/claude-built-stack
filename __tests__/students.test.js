const request = require('supertest');
const app = require('../server');
const db = require('../db');

describe('Students API', () => {
  let testStudentId;
  const testStudent = {
    name: 'Test Student',
    email: `student-test-${Date.now()}@example.com`,
    grade: 'Junior',
    major: 'Computer Science'
  };

  // Cleanup after all tests
  afterAll(async () => {
    // Delete test students created during tests
    await db.query('DELETE FROM students WHERE email LIKE $1', ['student-test-%@example.com']);
  });

  describe('POST /api/students', () => {
    it('should create a new student', async () => {
      const response = await request(app)
        .post('/api/students')
        .send(testStudent)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Student registered successfully');
      expect(response.body.student).toHaveProperty('id');
      expect(response.body.student).toHaveProperty('name', testStudent.name);
      expect(response.body.student).toHaveProperty('email', testStudent.email);
      expect(response.body.student).toHaveProperty('grade', testStudent.grade);
      expect(response.body.student).toHaveProperty('major', testStudent.major);
      expect(response.body.student).toHaveProperty('created_at');

      testStudentId = response.body.student.id;
    });

    it('should create a student without major (optional field)', async () => {
      const studentNoMajor = {
        name: 'Test Student No Major',
        email: `student-test-nomajor-${Date.now()}@example.com`,
        grade: 'Freshman'
      };

      const response = await request(app)
        .post('/api/students')
        .send(studentNoMajor)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.student).toHaveProperty('major', null);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/students')
        .send({ name: 'Test Student' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Name, email, and grade are required');
    });

    it('should return 409 if email already exists', async () => {
      const response = await request(app)
        .post('/api/students')
        .send(testStudent)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Email already exists');
    });
  });

  describe('GET /api/students', () => {
    it('should return all students', async () => {
      const response = await request(app)
        .get('/api/students')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('students');
      expect(Array.isArray(response.body.students)).toBe(true);
      expect(response.body.count).toBe(response.body.students.length);
    });
  });

  describe('GET /api/students/:id', () => {
    it('should return a specific student by id', async () => {
      const response = await request(app)
        .get(`/api/students/${testStudentId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.student).toHaveProperty('id', testStudentId);
      expect(response.body.student).toHaveProperty('name', testStudent.name);
      expect(response.body.student).toHaveProperty('email', testStudent.email);
      expect(response.body.student).toHaveProperty('grade', testStudent.grade);
    });

    it('should return 404 for non-existent student', async () => {
      const response = await request(app)
        .get('/api/students/999999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Student not found');
    });

    it('should return 400 for invalid student id', async () => {
      const response = await request(app)
        .get('/api/students/invalid')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Invalid student ID');
    });
  });

  describe('PUT /api/students/:id', () => {
    it('should update an existing student', async () => {
      const updatedData = {
        name: 'Updated Test Student',
        email: testStudent.email,
        grade: 'Senior',
        major: 'Software Engineering'
      };

      const response = await request(app)
        .put(`/api/students/${testStudentId}`)
        .send(updatedData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Student updated successfully');
      expect(response.body.student).toHaveProperty('name', updatedData.name);
      expect(response.body.student).toHaveProperty('grade', updatedData.grade);
      expect(response.body.student).toHaveProperty('major', updatedData.major);
    });

    it('should return 404 for non-existent student', async () => {
      const response = await request(app)
        .put('/api/students/999999')
        .send({ name: 'Test', email: 'test@example.com', grade: 'Junior' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Student not found');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .put(`/api/students/${testStudentId}`)
        .send({ name: 'Test' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Name, email, and grade are required');
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('should delete an existing student', async () => {
      const response = await request(app)
        .delete(`/api/students/${testStudentId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Student deleted successfully');
      expect(response.body.student).toHaveProperty('id', testStudentId);
    });

    it('should return 404 when deleting non-existent student', async () => {
      const response = await request(app)
        .delete('/api/students/999999')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Student not found');
    });

    it('should return 400 for invalid student id', async () => {
      const response = await request(app)
        .delete('/api/students/invalid')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message', 'Invalid student ID');
    });
  });
});
