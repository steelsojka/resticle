modules="core test-client angular-client fetch-client"

# Install
for module in ${modules}; do
  npm install --prefix modules/${module}
done

# Build
for module in ${modules}; do
  npm run build --prefix modules/${module}
done