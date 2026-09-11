// Conventional Commits, with the repo's conventional scopes.
// Subject rules (case, no period, imperative) come from the preset; length is
// loosened slightly from the default 100 to keep subjects readable.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['backend', 'frontend', 'tooling', 'docs', 'ci', 'deps']],
    'subject-max-length': [2, 'always', 100],
  },
};
