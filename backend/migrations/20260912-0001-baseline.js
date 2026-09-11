// Baseline migration placeholder. Most schema changes in this project are
// handled by Mongoose's implicit sync; use migrations for data backfills,
// destructive schema changes and index rebuilds that must run exactly once.
const TAG = '20260912-0001-baseline';

async function up(db) {
  // Example:
  // await db.collection('users').updateMany(
  //   { legacyField: { $exists: true } },
  //   { $rename: { legacyField: 'newField' } }
  // );
}

async function down(db) {}

module.exports = { id: TAG, up, down };
