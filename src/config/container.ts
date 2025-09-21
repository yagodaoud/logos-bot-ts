import 'reflect-metadata';
import { container } from 'tsyringe';
import { Client, GatewayIntentBits } from 'discord.js';

// Infrastructure
import { Database } from '@infrastructure/config/Database';
import { PrismaGuildRepository } from '@infrastructure/persistence/PrismaGuildRepository';
import { PrismaUserRepository } from '@infrastructure/persistence/PrismaUserRepository';
import { PrismaPlaylistRepository } from '@infrastructure/persistence/PrismaPlaylistRepository';
import { RedisCacheService } from '@infrastructure/cache/RedisCacheService';
import { DiscordService } from '@infrastructure/discord/DiscordService';
import { MoonlinkMusicService } from '@infrastructure/music/MoonlinkMusicService';

// Application
import { PlayMusicUseCase } from '@application/use-cases/music/PlayMusicUseCase';
import { ManageQueueUseCase } from '@application/use-cases/music/ManageQueueUseCase';
import { CreatePlaylistUseCase } from '@application/use-cases/playlist/CreatePlaylistUseCase';
import { ManageGuildUseCase } from '@application/use-cases/guild/ManageGuildUseCase';

// Presentation
import { CommandHandler } from '@presentation/discord/CommandHandler';
import { PlayCommand } from '@presentation/commands/music/PlayCommand';
import { QueueCommand } from '@presentation/commands/music/QueueCommand';
import { CreatePlaylistCommand } from '@presentation/commands/playlist/CreatePlaylistCommand';

// Register singletons
container.register('PrismaClient', {
    useFactory: () => Database.getInstance()
});
container.register('DiscordClient', {
    useFactory: () => new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.MessageContent
        ]
    })
});

// Register repositories
container.register('IGuildRepository', {
    useClass: PrismaGuildRepository
});

container.register('IUserRepository', {
    useClass: PrismaUserRepository
});

container.register('IPlaylistRepository', {
    useClass: PrismaPlaylistRepository
});

// Register services
container.register('ICacheService', {
    useClass: RedisCacheService
});

container.register('IDiscordService', {
    useClass: DiscordService
});

container.register('IMusicService', {
    useClass: MoonlinkMusicService
});

// Register use cases
container.register('PlayMusicUseCase', {
    useClass: PlayMusicUseCase
});

container.register('ManageQueueUseCase', {
    useClass: ManageQueueUseCase
});

container.register('CreatePlaylistUseCase', {
    useClass: CreatePlaylistUseCase
});

container.register('ManageGuildUseCase', {
    useClass: ManageGuildUseCase
});

// Register commands
container.register('PlayCommand', {
    useClass: PlayCommand
});

container.register('QueueCommand', {
    useClass: QueueCommand
});

container.register('CreatePlaylistCommand', {
    useClass: CreatePlaylistCommand
});

// Register command handler
container.register('CommandHandler', {
    useClass: CommandHandler
});

export { container };
