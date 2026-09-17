module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': 'off'
  },
  overrides: [
    {
      files: ['api/**/*.js', '*.cjs', 'vite.config.js', 'postcss.config.js', 'tailwind.config.js'],
      env: {
        node: true,
        browser: false
      }
    },
    {
      files: ['public/custom-sw.js'],
      env: {
        serviceworker: true
      }
    }
  ]
};
