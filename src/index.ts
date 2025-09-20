import dotenv from 'dotenv';
import { DiscordBot } from '@presentation/discord/DiscordBot';

// Load environment variables
dotenv.config();

// Create and start the bot
const bot = new DiscordBot();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
});

// Start the bot
bot.start().catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});
