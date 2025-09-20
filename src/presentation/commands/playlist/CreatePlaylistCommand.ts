import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { CreatePlaylistUseCase } from '@application/use-cases/playlist/CreatePlaylistUseCase';
import { IDiscordService } from '@domain/interfaces/services/IDiscordService';

@injectable()
export class CreatePlaylistCommand {
    public data = new SlashCommandBuilder()
        .setName('createplaylist')
        .setDescription('Create a new playlist')
        .addStringOption((option: any) =>
            option
                .setName('name')
                .setDescription('Name of the playlist')
                .setRequired(true)
        )
        .addStringOption((option: any) =>
            option
                .setName('description')
                .setDescription('Description of the playlist')
                .setRequired(false)
        )
        .addBooleanOption((option: any) =>
            option
                .setName('public')
                .setDescription('Make the playlist public')
                .setRequired(false)
        );

    constructor(
        @inject('CreatePlaylistUseCase') private createPlaylistUseCase: CreatePlaylistUseCase,
        @inject('IDiscordService') private discordService: IDiscordService
    ) { }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        if (!interaction.guildId || !interaction.user.id) {
            await interaction.reply('This command can only be used in a server.');
            return;
        }

        const name = interaction.options.get('name')?.value as string;
        const description = interaction.options.get('description')?.value as string || '';
        const isPublic = interaction.options.get('public')?.value as boolean || false;

        if (!name) {
            await interaction.reply('Please provide a name for the playlist.');
            return;
        }

        await interaction.deferReply();

        try {
            const result = await this.createPlaylistUseCase.execute({
                name,
                description,
                userId: interaction.user.id,
                guildId: interaction.guildId,
                isPublic
            });

            if (result.success) {
                const embed = {
                    color: 0x00ff00,
                    title: '✅ Playlist Created',
                    description: result.message,
                    fields: [
                        {
                            name: 'Name',
                            value: name,
                            inline: true
                        },
                        {
                            name: 'Description',
                            value: description || 'No description',
                            inline: true
                        },
                        {
                            name: 'Visibility',
                            value: isPublic ? 'Public' : 'Private',
                            inline: true
                        }
                    ],
                    timestamp: new Date().toISOString()
                };

                await this.discordService.sendEmbed(interaction.channelId, embed);
                await interaction.editReply({ content: 'Playlist created successfully!' });
            } else {
                await this.discordService.sendError(interaction.channelId, result.message);
                await interaction.editReply({ content: 'Failed to create playlist.' });
            }
        } catch (error) {
            console.error('Error in CreatePlaylistCommand:', error);
            await this.discordService.sendError(interaction.channelId, 'An unexpected error occurred.');
            await interaction.editReply({ content: 'An error occurred while creating the playlist.' });
        }
    }
}
