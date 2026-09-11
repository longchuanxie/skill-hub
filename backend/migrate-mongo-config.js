// migrate-mongo configuration. See `npm run migrate:status` etc.
// The MongoDB connection string comes from MONGODB_URI (loaded via dotenv).
require('dotenv').config();

const config = {
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/skillhub',
    databaseName: undefined, // derived from the url
    options: {},
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useAsync: true,
};

module.exports = config;
