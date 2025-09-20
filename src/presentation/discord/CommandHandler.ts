import { Collection, CacheType, ChatInputCommandInteraction } from 'discord.js';
import { injectable } from 'tsyringe';
import { PlayCommand } from '../commands/music/PlayCommand';
import { QueueCommand } from '../commands/music/QueueCommand';
import { CreatePlaylistCommand } from '../commands/playlist/CreatePlaylistCommand';

export interface Command {
    data: any;
    execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void>;
}

@injectable()
export class CommandHandler {
    private commands: Collection<string, Command> = new Collection();

    constructor(
        private playCommand: PlayCommand,
        private queueCommand: QueueCommand,
        private createPlaylistCommand: CreatePlaylistCommand
    ) {
        this.registerCommands();
    }

    private registerCommands(): void {
        this.commands.set(this.playCommand.data.name, this.playCommand);
        this.commands.set(this.queueCommand.data.name, this.queueCommand);
        this.commands.set(this.createPlaylistCommand.data.name, this.createPlaylistCommand);
    }

    public getCommands(): Collection<string, Command> {
        return this.commands;
    }

    public async handleCommand(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const command = this.commands.get(interaction.commandName);
        if (!command) {
            await interaction.reply('Command not found.');
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply('An error occurred while executing the command.');
            }
        }
    }
}
