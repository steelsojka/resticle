#!/bin/sh

modules="core test-client angular-client fetch-client"

# Only run tests on these modules
test_modules="core"

# Install
for module in ${modules}; do
  npm install --prefix modules/${module}
done

# Build
for module in ${modules}; do
  npm run build --prefix modules/${module}
done

# Test
for module in ${test_modules}; do
  npm test --prefix modules/${module}
done