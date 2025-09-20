import { Client, GatewayIntentBits, Events } from 'discord.js';
import { container } from '@config/container';
import { CommandHandler } from './CommandHandler';
import { Database } from '@infrastructure/config/Database';

export class DiscordBot {
    private client: Client;
    private commandHandler: CommandHandler;

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.MessageContent
            ]
        });

        this.commandHandler = container.resolve(CommandHandler);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.client.once(Events.ClientReady, async (readyClient) => {
            console.log(`Bot is ready! Logged in as ${readyClient.user.tag}`);

            // Register slash commands
            await this.registerSlashCommands();

            // Connect to database
            await Database.connect();
        });

        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this.commandHandler.handleCommand(interaction);
            }
        });

        this.client.on(Events.Error, (error) => {
            console.error('Discord client error:', error);
        });

        this.client.on(Events.Warn, (warning) => {
            console.warn('Discord client warning:', warning);
        });
    }

    private async registerSlashCommands(): Promise<void> {
        try {
            const commands = this.commandHandler.getCommands();
            const commandData = Array.from(commands.values()).map(command => command.data.toJSON());

            // Register commands globally (you might want to register them per guild for testing)
            await this.client.application?.commands.set(commandData);

            console.log(`Registered ${commandData.length} slash commands`);
        } catch (error) {
            console.error('Error registering slash commands:', error);
        }
    }

    public async start(): Promise<void> {
        try {
            const token = process.env['DISCORD_TOKEN'];
            if (!token) {
                throw new Error('DISCORD_TOKEN environment variable is required');
            }

            await this.client.login(token);
        } catch (error) {
            console.error('Failed to start Discord bot:', error);
            process.exit(1);
        }
    }

    public async stop(): Promise<void> {
        try {
            await Database.disconnect();
            await this.client.destroy();
            console.log('Discord bot stopped');
        } catch (error) {
            console.error('Error stopping Discord bot:', error);
        }
    }
}
