import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { PlayMusicUseCase } from '@application/use-cases/music/PlayMusicUseCase';
import { IDiscordService } from '@domain/interfaces/services/IDiscordService';

@injectable()
export class PlayCommand {
    public data = new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from a search query or URL')
        .addStringOption((option: any) =>
            option
                .setName('query')
                .setDescription('Search query or URL to play')
                .setRequired(true)
        );

    constructor(
        @inject('PlayMusicUseCase') private playMusicUseCase: PlayMusicUseCase,
        @inject('IDiscordService') private discordService: IDiscordService
    ) { }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        if (!interaction.guildId || !interaction.user.id) {
            await interaction.reply('This command can only be used in a server.');
            return;
        }

        const query = interaction.options.get('query')?.value as string;
        if (!query) {
            await interaction.reply('Please provide a search query or URL.');
            return;
        }

        await interaction.deferReply();

        try {
            const result = await this.playMusicUseCase.execute({
                guildId: interaction.guildId,
                channelId: interaction.channelId,
                userId: interaction.user.id,
                query
            });

            if (result.success) {
                const embed = {
                    color: 0x00ff00,
                    title: '🎵 Now Playing',
                    description: result.message,
                    fields: result.queueLength ? [
                        {
                            name: 'Queue Length',
                            value: result.queueLength.toString(),
                            inline: true
                        }
                    ] : [],
                    timestamp: new Date().toISOString()
                };

                await this.discordService.sendEmbed(interaction.channelId, embed);
                await interaction.editReply({ content: 'Music started!' });
            } else {
                await this.discordService.sendError(interaction.channelId, result.message);
                await interaction.editReply({ content: 'Failed to play music.' });
            }
        } catch (error) {
            console.error('Error in PlayCommand:', error);
            await this.discordService.sendError(interaction.channelId, 'An unexpected error occurred.');
            await interaction.editReply({ content: 'An error occurred while processing your request.' });
        }
    }
}
