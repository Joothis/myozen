#!/bin/bash
# Healthcare IoT Backend Setup Script

echo "🚀 Setting up Healthcare IoT Backend with Node.js, Express, and MongoDB..."

# Initialize project if package.json doesn't exist
if [ ! -f "package.json" ]; then
  echo "📦 Initializing Node.js project..."
  npm init -y
fi

# Install dependencies
echo "📚 Installing dependencies..."
npm install express mongoose dotenv bcryptjs jsonwebtoken cors helmet express-rate-limit express-validator socket.io mqtt morgan winston mongoose-encryption

# Install dev dependencies
echo "🛠️ Installing development dependencies..."
npm install --save-dev nodemon

# Update package.json scripts
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'start': 'node src/server.js',
  'dev': 'nodemon src/server.js',
  'seed': 'node src/seed/seed.js'
};
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
"

# Create folder structure
echo "🗂️ Creating folder structure..."
mkdir -p src/{config,controllers,middleware,models,routes,services,utils,seed}

# Create .env file
echo "🔐 Creating .env file..."
cat > .env << EOL
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/healthcare_iot
MONGODB_URI_PROD=mongodb://mongodb:27017/healthcare_iot

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Encryption Keys (Change these in production!)
ENCRYPTION_KEY=32_character_encryption_key_here
SIGNING_KEY=32_character_signing_key_here_ok

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=mqttuser
MQTT_PASSWORD=mqttpassword

# Cloud Sync Configuration
CLOUD_SYNC_INTERVAL=300000
EOL

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << EOL
# Dependencies
node_modules/
npm-debug.log
yarn-error.log
yarn-debug.log
package-lock.json

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
build/

# Logs
logs/
*.log

# OS specific
.DS_Store
Thumbs.db

# IDE specific
.idea/
.vscode/
*.swp
*.swo
EOL

# Create Docker files
echo "🐳 Creating Docker files..."
cat > Dockerfile << EOL
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOL

cat > docker-compose.yml << EOL
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/healthcare_iot
    volumes:
      - ./:/usr/src/app
      - /usr/src/app/node_modules
    restart: unless-stopped

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  mongodb_data:
EOL

echo "✅ Setup completed successfully!"
echo "🚀 Run 'npm run dev' to start the development server"
echo "🐳 Run 'docker-compose up' to start with Docker"
