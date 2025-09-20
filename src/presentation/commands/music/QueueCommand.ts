import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction } from 'discord.js';
import { injectable, inject } from 'tsyringe';
import { ManageQueueUseCase } from '@application/use-cases/music/ManageQueueUseCase';
import { IMusicService } from '@domain/interfaces/services/IMusicService';
import { IDiscordService } from '@domain/interfaces/services/IDiscordService';

@injectable()
export class QueueCommand {
    public data = new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Manage the music queue')
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('show')
                .setDescription('Show the current queue')
        )
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('skip')
                .setDescription('Skip the current track')
        )
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('pause')
                .setDescription('Pause the music')
        )
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('resume')
                .setDescription('Resume the music')
        )
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('stop')
                .setDescription('Stop the music and clear the queue')
        )
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('shuffle')
                .setDescription('Shuffle the queue')
        )
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('clear')
                .setDescription('Clear the queue')
        )
        .addSubcommand((subcommand: any) =>
            subcommand
                .setName('volume')
                .setDescription('Set the volume')
                .addIntegerOption((option: any) =>
                    option
                        .setName('level')
                        .setDescription('Volume level (0-100)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(100)
                )
        );

    constructor(
        @inject('ManageQueueUseCase') private manageQueueUseCase: ManageQueueUseCase,
        @inject('IMusicService') private musicService: IMusicService,
        @inject('IDiscordService') private discordService: IDiscordService
    ) { }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        if (!interaction.guildId || !interaction.user.id) {
            await interaction.reply('This command can only be used in a server.');
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'show') {
            await this.showQueue(interaction);
            return;
        }

        await interaction.deferReply();

        try {
            let action: any = { type: subcommand };

            if (subcommand === 'volume') {
                const level = interaction.options.get('level')?.value as number;
                action = { type: 'setVolume', volume: level };
            }

            const result = await this.manageQueueUseCase.execute({
                guildId: interaction.guildId,
                userId: interaction.user.id,
                action
            });

            if (result.success) {
                await this.discordService.sendSuccess(interaction.channelId, result.message);
                await interaction.editReply({ content: 'Queue updated!' });
            } else {
                await this.discordService.sendError(interaction.channelId, result.message);
                await interaction.editReply({ content: 'Failed to update queue.' });
            }
        } catch (error) {
            console.error('Error in QueueCommand:', error);
            await this.discordService.sendError(interaction.channelId, 'An unexpected error occurred.');
            await interaction.editReply({ content: 'An error occurred while processing your request.' });
        }
    }

    private async showQueue(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        try {
            const queue = await this.musicService.getQueue(interaction.guildId!);

            if (!queue || queue.tracks.length === 0) {
                await this.discordService.sendInfo(interaction.channelId, 'The queue is empty.');
                await interaction.reply('Queue is empty.');
                return;
            }

            const currentTrack = queue.getCurrentTrack();
            const queueList = queue.tracks.slice(0, 10).map((track, index) => {
                const isCurrent = index === queue.currentTrackIndex;
                const prefix = isCurrent ? '🎵' : `${index + 1}.`;
                return `${prefix} **${track.title}** by ${track.author}`;
            }).join('\n');

            const embed = {
                color: 0x0099ff,
                title: '🎵 Music Queue',
                description: queueList,
                fields: [
                    {
                        name: 'Current Track',
                        value: currentTrack ? `**${currentTrack.title}** by ${currentTrack.author}` : 'None',
                        inline: false
                    },
                    {
                        name: 'Queue Length',
                        value: queue.tracks.length.toString(),
                        inline: true
                    },
                    {
                        name: 'Volume',
                        value: `${queue.volume}%`,
                        inline: true
                    },
                    {
                        name: 'Status',
                        value: queue.isPlaying ? (queue.isPaused ? '⏸️ Paused' : '▶️ Playing') : '⏹️ Stopped',
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString()
            };

            await this.discordService.sendEmbed(interaction.channelId, embed);
            await interaction.reply('Queue displayed!');
        } catch (error) {
            console.error('Error showing queue:', error);
            await this.discordService.sendError(interaction.channelId, 'Failed to show queue.');
            await interaction.reply('An error occurred while showing the queue.');
        }
    }
}
