-- UniSmart (PostgreSQL). الـ ORM في backend/app/models.py يطابق هذه الجداول.
CREATE TABLE users(id SERIAL PRIMARY KEY, login VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(120) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK(role IN('student','doctor','admin')), password_hash VARCHAR(200) NOT NULL);
CREATE TABLE courses(id SERIAL PRIMARY KEY, code VARCHAR(20) UNIQUE NOT NULL, name VARCHAR(120) NOT NULL, credits INT DEFAULT 3,
  capacity INT NOT NULL, enrolled INT DEFAULT 0 CHECK(enrolled<=capacity), doctor_id INT REFERENCES users(id),
  slot VARCHAR(40) NOT NULL, room VARCHAR(30), status VARCHAR(10) DEFAULT 'OPEN');
CREATE TABLE course_prereqs(course_id INT REFERENCES courses(id), requires_code VARCHAR(20), PRIMARY KEY(course_id,requires_code));
CREATE TABLE enrollments(id SERIAL PRIMARY KEY, student_id INT REFERENCES users(id), course_id INT REFERENCES courses(id),
  status VARCHAR(12) NOT NULL, grade VARCHAR(3), grade_points NUMERIC(3,2));
CREATE TABLE exams(id SERIAL PRIMARY KEY, course_id INT REFERENCES courses(id), title VARCHAR(160), start_time TIMESTAMP, end_time TIMESTAMP,
  duration_minutes INT, attempts_allowed INT DEFAULT 1, security JSON);
CREATE TABLE questions(id SERIAL PRIMARY KEY, exam_id INT REFERENCES exams(id), text TEXT, options JSON, correct INT, topic TEXT);
CREATE TABLE attempts(id SERIAL PRIMARY KEY, exam_id INT REFERENCES exams(id), student_id INT REFERENCES users(id),
  started_at TIMESTAMP, deadline TIMESTAMP, submitted_at TIMESTAMP, status VARCHAR(16), violation_count INT DEFAULT 0, score INT, auto_submitted BOOLEAN DEFAULT FALSE);
CREATE TABLE answers(attempt_id INT REFERENCES attempts(id), question_id INT REFERENCES questions(id), choice INT, PRIMARY KEY(attempt_id,question_id));
CREATE TABLE exam_events(id SERIAL PRIMARY KEY, attempt_id INT REFERENCES attempts(id), event_type VARCHAR(30), at TIMESTAMP DEFAULT now(), meta JSON, ip VARCHAR(45));
CREATE TABLE audit_logs(id SERIAL PRIMARY KEY, user_id INT, action VARCHAR(40), entity VARCHAR(30), entity_id INT, at TIMESTAMP DEFAULT now());
CREATE TABLE settings(key VARCHAR(40) PRIMARY KEY, value VARCHAR(200));
CREATE TABLE student_photos(user_id INT PRIMARY KEY REFERENCES users(id), image BYTEA NOT NULL, mime VARCHAR(20) NOT NULL,
  descriptor TEXT, set_by INT NOT NULL REFERENCES users(id), set_at TIMESTAMP DEFAULT now());
CREATE TABLE attendance(id SERIAL PRIMARY KEY, student_id INT REFERENCES users(id), course_id INT REFERENCES courses(id), at TIMESTAMP DEFAULT now(),
  status VARCHAR(10) NOT NULL, method VARCHAR(10) DEFAULT 'FACE', confidence REAL);
CREATE TABLE notifications(id SERIAL PRIMARY KEY, user_id INT REFERENCES users(id), role VARCHAR(10), cat VARCHAR(12) NOT NULL, title TEXT NOT NULL,
  prio VARCHAR(8) DEFAULT 'normal', read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT now());
CREATE TABLE assignments(id SERIAL PRIMARY KEY, course_id INT REFERENCES courses(id), title VARCHAR(160) NOT NULL,
  kind VARCHAR(12) DEFAULT 'assignment', due_at TIMESTAMP NOT NULL);
CREATE TABLE submissions(assignment_id INT REFERENCES assignments(id), student_id INT REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT now(), score REAL, PRIMARY KEY(assignment_id,student_id));
