# FluentUI Compat DevContainer

This DevContainer provides a consistent development environment for the fluentui-compat project.

## Features

- **Node.js 20 (LTS)** - Matches the CI environment and meets project requirements
- **Rush CLI** - Pre-installed for monorepo management  
- **GitHub CLI** - For Git and GitHub operations
- **PostgreSQL** - Database support for development and testing
- **Dotenv CLI** - Environment variable management with .env file support
- **VS Code Extensions**:
  - TypeScript support with next-generation language features
  - ESLint integration for code quality
  - Prettier for code formatting
  - Jest test runner integration
  - NPM script support
  - Auto-rename tag for React development
  - Path IntelliSense for file imports
  - Node.js Debugger for debugging applications
  - Cypress Test Runner for end-to-end testing
- **Port Forwarding**: Automatically forwards ports 3000 and 8080 for web development

## Automatic Setup

The DevContainer automatically:
1. Installs Rush CLI globally
2. Runs `rush update` to install all dependencies
3. Configures VS Code settings for optimal development
4. Sets up PostgreSQL database service
5. Forwards ports 3000 and 8080 for web development

Note: Dotenv CLI is pre-installed in the base container image.

## Manual Commands

If you need to run setup manually:

```bash
# Install dependencies
rush update

# Build all packages
rush build

# Run tests
cd packages/fluentui-compat
npm test

# Lint code
cd packages/fluentui-compat  
npm run lint
```

## PostgreSQL Database

The DevContainer includes PostgreSQL for database development and testing.

### Accessing PostgreSQL

```bash
# Connect to PostgreSQL as the postgres user
psql -h localhost -U postgres

# Create a new database
createdb -h localhost -U postgres myapp_dev

# Connect to a specific database
psql -h localhost -U postgres -d myapp_dev
```

### Database Configuration

- **Host**: `localhost`
- **Port**: `5432` (default PostgreSQL port)
- **Username**: `postgres`
- **Password**: `postgres` (default)

### Common PostgreSQL Commands

```bash
# List all databases
psql -h localhost -U postgres -l

# Backup a database
pg_dump -h localhost -U postgres myapp_dev > backup.sql

# Restore a database
psql -h localhost -U postgres myapp_dev < backup.sql
```

## Environment Variables

The DevContainer supports environment variable management using `.env` files.

### Setting up .env files

1. Create a `.env` file in your project root:
```bash
# Example .env file
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp_dev
NODE_ENV=development
API_PORT=3000
```

2. Use dotenv-cli to run commands with environment variables:
```bash
# Run a command with .env variables loaded
dotenv -- npm start

# Run tests with .env variables
dotenv -- npm test

# Use a specific .env file
dotenv -e .env.test -- npm test
```

3. Load environment variables in your Node.js application:
```javascript
// Add to the top of your main application file
require('dotenv').config();

// Now you can use process.env.DATABASE_URL, etc.
```

### Environment File Examples

Create different environment files for different stages:

- `.env` - Default environment variables
- `.env.development` - Development-specific variables  
- `.env.test` - Test environment variables
- `.env.production` - Production environment variables (keep secure!)

## Cypress Testing

The DevContainer includes Cypress for end-to-end testing.

### Setting up Cypress

1. Install Cypress in your project:
```bash
cd packages/fluentui-compat
npm install --save-dev cypress
```

2. Initialize Cypress:
```bash
npx cypress open
```

3. Run Cypress tests:
```bash
# Run tests in headless mode
npx cypress run

# Open Cypress test runner
npx cypress open
```

### Cypress Configuration

Create a `cypress.config.js` file in your package:
```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  }
})
```

## Troubleshooting

### Dependencies not installed
If dependencies aren't automatically installed, run:
```bash
rush update
```

### Build issues
Ensure all dependencies are installed, then:
```bash
rush build
```

### VS Code extensions not working
The DevContainer should automatically install extensions. If they're missing:
1. Open Command Palette (Ctrl/Cmd + Shift + P)
2. Run "Developer: Reload Window"

### PostgreSQL connection issues
If you can't connect to PostgreSQL:
1. Ensure the database service is running:
```bash
sudo service postgresql status
```

2. If the service is not running, start it:
```bash
sudo service postgresql start
```

3. Check if you can connect using the default credentials:
```bash
psql -h localhost -U postgres
```

### Port forwarding not working
If ports 3000 or 8080 are not accessible:
1. Check if the application is running on the expected port
2. Verify the port is listed in VS Code's "Ports" panel
3. Try manually forwarding the port in VS Code

### Environment variables not loading
If `.env` files aren't working:
1. Ensure the file is in the correct location (project root)
2. Use `dotenv-cli` to run commands: `dotenv -- npm start`
3. Verify the file has the correct syntax (no spaces around `=`)