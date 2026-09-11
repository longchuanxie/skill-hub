import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Align JWT secrets across test-signed tokens and app verification before
// any test module (and therefore the app) is imported.
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
// Keep rate limiting off so high-volume integration tests never see 429s.
process.env.RATE_LIMIT_ENABLED = 'false';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
