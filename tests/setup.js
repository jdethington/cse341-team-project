import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import mongoose from 'mongoose';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

const connectionString = inject('MONGODB_TEST_URI');

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });
  await mongoose.connect(connectionString, { dbName: 'kizuna-rail-test' });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await mongoose.disconnect();
  await closeDb();
});
