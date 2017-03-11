#!/bin/sh

# Only run tests on these modules
test_modules="core angular-client"

# Test
for module in ${test_modules}; do
  npm test --prefix modules/${module}
done