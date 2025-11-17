FROM node:18-alpine

WORKDIR /app/user-service

# COPY ONLY the package.json first (important!)
COPY user-service/package*.json ./

# Also copy common-utils package.json to install dependencies correctly
COPY common-utils/package*.json ./common-utils/

# Now copy actual service code
COPY user-service .

# Copy common-utils (actual code)
COPY common-utils ./common-utils

# Install dependencies (this prevents idealTree errors)
RUN npm install

EXPOSE 4001

CMD ["npm", "start"]