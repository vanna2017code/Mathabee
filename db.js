import sqlite3 from "sqlite3";
export const db = new sqlite3.Database("./mathabee.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      name TEXT,
      teacherId INTEGER,
      code TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS enrollments (
      userId INTEGER,
      classId INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY,
      type TEXT,
      playerA INTEGER,
      playerB INTEGER,
      questions TEXT,
      scoreA TEXT,
      scoreB TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      userId INTEGER,
      classId INTEGER,
      score INTEGER,
      timeTaken INTEGER,
      createdAt TEXT
    )
  `);

  db.run(`CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER,
  grade INTEGER,
  score INTEGER,
  total INTEGER,
  startedAt TEXT,
  finishedAt TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS assessment_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessmentId INTEGER,
  question TEXT,
  correctAnswer TEXT,
  studentAnswer TEXT
)`);
});
