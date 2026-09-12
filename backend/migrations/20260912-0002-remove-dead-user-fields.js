// Removes the dead 2FA / login-history / password-expiry fields dropped
// from the User schema (they were defined but never wired to any API).
const TAG = '20260912-0002-remove-dead-user-fields';

async function up(db) {
  await db.collection('users').updateMany(
    {
      $or: [
        { twoFactorSecret: { $exists: true } },
        { loginHistory: { $exists: true } },
        { passwordExpiresAt: { $exists: true } },
        { lastPasswordChange: { $exists: true } },
        { isTwoFactorEnabled: { $exists: true } },
      ],
    },
    {
      $unset: {
        twoFactorSecret: '',
        loginHistory: '',
        passwordExpiresAt: '',
        lastPasswordChange: '',
        isTwoFactorEnabled: '',
      },
    },
  );
}

async function down(db) {}

module.exports = { id: TAG, up, down };
