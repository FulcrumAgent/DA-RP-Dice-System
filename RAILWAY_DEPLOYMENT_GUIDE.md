# Railway Deployment Guide for Dune/DA-RP Dice System Discord Bot

This guide will help you deploy your Discord bot to Railway with a PostgreSQL database for character sheet management.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository with your bot code
- Discord bot token
- Node.js project with TypeScript

## Step 1: Prepare Your Project

### 1.1 Install Required Dependencies

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 1.2 Update package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/bot.js",
    "dev": "ts-node src/bot.ts",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "postinstall": "prisma generate"
  }
}
```

### 1.3 Create Environment Variables File

Create a `.env.example` file:

```env
# Discord Application Configuration
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id_here
GUILD_ID=your_test_guild_id_here_optional

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database

# Bot Configuration
DEBUG_MODE=false
LOG_LEVEL=info
DATA_DIR=data

# Railway Environment (will be set automatically)
NODE_ENV=production
PORT=3000
```

**Note:** Even for global Discord applications, you still need:
- `DISCORD_TOKEN`: The bot token from your Discord Application's "Bot" section
- `CLIENT_ID`: Your Discord Application ID (found in "General Information")
- `GUILD_ID`: Optional - only needed for guild-specific command deployment during development

## Step 2: Set Up Railway Project

### 2.1 Create New Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your Discord bot repository
5. Railway will automatically detect it's a Node.js project

### 2.2 Add PostgreSQL Database

1. In your Railway project dashboard, click "New Service"
2. Choose "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL database automatically
4. Note the connection details (Railway will provide these as environment variables)

## Step 3: Configure Environment Variables

In your Railway project dashboard:

1. Go to your bot service (not the database)
2. Click on "Variables" tab
3. Add the following environment variables:

```
DISCORD_TOKEN=your_actual_discord_bot_token
CLIENT_ID=your_actual_discord_application_client_id
DEBUG_MODE=false
LOG_LEVEL=info
NODE_ENV=production
```

**Important:** 
- Railway automatically provides `DATABASE_URL` when you add a PostgreSQL service
- Get your `DISCORD_TOKEN` from Discord Developer Portal → Your App → Bot → Token
- Get your `CLIENT_ID` from Discord Developer Portal → Your App → General Information → Application ID
- For global commands, you don't need `GUILD_ID` in production

## Step 4: Update Your Bot Code

### 4.1 Update bot.ts to Initialize Database

```typescript
import { databaseService } from './services/database.service';

// Add this to your bot initialization
async function initializeBot() {
  try {
    // Connect to database
    await databaseService.connect();
    console.log('Database connected successfully');
    
    // Your existing bot initialization code
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('Failed to initialize bot:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down bot...');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down bot...');
  await databaseService.disconnect();
  process.exit(0);
});

initializeBot();
```

### 4.2 Replace File-Based Storage

Replace your existing `DataManager` usage with the new `DatabaseService`:

```typescript
// Old way (file-based)
import { DataManager } from './utils/database';
const dataManager = new DataManager();

// New way (PostgreSQL)
import { databaseService } from './services/database.service';

// Example: Save character
const character = await databaseService.createCharacter(characterData);

// Example: Get user characters
const characters = await databaseService.getUserCharacters(userId, guildId);
```

## Step 5: Database Migration

### 5.1 Set Up Prisma

Railway will automatically run `npm run postinstall` which includes `prisma generate`. For the initial database setup, you have two options:

**Option A: Using Prisma Push (Recommended for initial setup)**
Add this to your Railway build command or run manually:
```bash
npx prisma db push
```

**Option B: Using Migrations**
If you prefer migrations, create an initial migration:
```bash
npx prisma migrate dev --name init
```

### 5.2 Railway Build Configuration

In Railway, set your build command to:
```bash
npm run build && npx prisma db push
```

And your start command to:
```bash
npm start
```

## Step 6: Deploy

1. Push your changes to GitHub
2. Railway will automatically trigger a new deployment
3. Monitor the deployment logs in Railway dashboard
4. Once deployed, your bot should be online and connected to PostgreSQL

## Step 7: Verify Deployment

### 7.1 Check Bot Status
- Verify your bot appears online in Discord
- Test a simple command to ensure it's responding

### 7.2 Test Database Connection
- Try creating a character using your bot commands
- Check Railway's PostgreSQL service logs for any connection issues

### 7.3 Monitor Logs
- Use Railway's log viewer to monitor your bot's performance
- Check for any database connection errors or query issues

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure `DATABASE_URL` is properly set (Railway should do this automatically)
   - Check that Prisma schema matches your database structure
   - Verify that `prisma generate` ran successfully

2. **Build Failures**
   - Make sure all TypeScript files compile without errors
   - Ensure all dependencies are listed in `package.json`
   - Check that Prisma schema is valid

3. **Bot Not Responding**
   - Verify `DISCORD_TOKEN` is correctly set
   - Check Railway logs for startup errors
   - Ensure bot has proper permissions in your Discord server

4. **Migration Issues**
   - If using migrations, ensure they run in the correct order
   - For production, use `prisma migrate deploy` instead of `prisma migrate dev`

### Useful Railway Commands

```bash
# View logs
railway logs

# Connect to your database
railway connect

# Run commands in Railway environment
railway run npm run db:push
```

## Database Schema Overview

Your PostgreSQL database includes these main tables:

- `characters` - Main character data with attributes and metadata
- `character_skills` - Character skills (one-to-many)
- `character_drives` - Character drives with statements (one-to-many)
- `character_assets` - Character assets/equipment (one-to-many)
- `character_traits` - Character traits/flaws (one-to-many)
- `npcs` - NPC data with similar structure
- `momentum_pools` - Guild/channel momentum tracking
- `character_creation_sessions` - Temporary character creation state

## Performance Tips

1. **Indexing**: The schema includes indexes on commonly queried fields
2. **Connection Pooling**: Prisma handles connection pooling automatically
3. **Query Optimization**: Use `include` selectively to avoid over-fetching data
4. **Caching**: Consider implementing Redis caching for frequently accessed data

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **Database Access**: Railway PostgreSQL is only accessible from within your Railway project
3. **Input Validation**: Always validate user input before database operations
4. **SQL Injection**: Prisma provides protection against SQL injection by default

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Implement database backups (Railway provides automatic backups)
3. Consider adding Redis for caching if needed
4. Set up CI/CD pipelines for automated testing and deployment
5. Monitor database performance and optimize queries as needed

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Prisma Documentation: [prisma.io/docs](https://prisma.io/docs)
- Discord.js Documentation: [discord.js.org](https://discord.js.org)

For project-specific issues, check the Railway logs and ensure all environment variables are properly configured.
