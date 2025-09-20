import { injectable, inject } from 'tsyringe';
import { IMusicService } from '@domain/interfaces/services/IMusicService';
import { IDiscordService } from '@domain/interfaces/services/IDiscordService';
import { ICacheService } from '@domain/interfaces/services/ICacheService';
import { Track } from '@domain/entities/Playlist';
import { MusicQueue } from '@domain/entities/MusicQueue';

export interface PlayMusicRequest {
    guildId: string;
    channelId: string;
    userId: string;
    query: string;
}

export interface PlayMusicResponse {
    success: boolean;
    message: string;
    track?: Track;
    queueLength?: number;
}

@injectable()
export class PlayMusicUseCase {
    constructor(
        @inject('IMusicService') private musicService: IMusicService,
        @inject('IDiscordService') private discordService: IDiscordService,
        @inject('ICacheService') private cacheService: ICacheService
    ) { }

    async execute(request: PlayMusicRequest): Promise<PlayMusicResponse> {
        try {
            // Check if user is in a voice channel
            const userVoiceChannel = await this.getUserVoiceChannel(request.guildId, request.userId);
            if (!userVoiceChannel) {
                return {
                    success: false,
                    message: 'You need to be in a voice channel to play music!'
                };
            }

            // Join voice channel if not already connected
            await this.discordService.joinVoiceChannel(request.guildId, userVoiceChannel);

            // Search for tracks
            const tracks = await this.musicService.searchTracks(request.query);
            if (tracks.length === 0) {
                return {
                    success: false,
                    message: 'No tracks found for your search query.'
                };
            }

            // Get current queue
            let queue = await this.musicService.getQueue(request.guildId);
            if (!queue) {
                queue = new MusicQueue(request.guildId, [], 0, false, false, 50, false, false);
            }

            // Add tracks to queue
            const trackToPlay = tracks[0];
            if (!trackToPlay) {
                return {
                    success: false,
                    message: 'No track found to play.'
                };
            }

            const updatedQueue = queue.addTrack(trackToPlay);
            await this.musicService.setQueue(request.guildId, updatedQueue);

            // Start playing if not already playing
            if (!queue.isPlaying) {
                await this.musicService.play(request.guildId);
            }

            // Publish queue update to other instances
            await this.cacheService.publish(
                `music:queue:${request.guildId}`,
                JSON.stringify(updatedQueue)
            );

            return {
                success: true,
                message: `Now playing: **${trackToPlay.title}** by ${trackToPlay.author}`,
                track: trackToPlay,
                queueLength: updatedQueue.tracks.length
            };
        } catch (error) {
            console.error('Error in PlayMusicUseCase:', error);
            return {
                success: false,
                message: 'An error occurred while trying to play music.'
            };
        }
    }

    private async getUserVoiceChannel(guildId: string, userId: string): Promise<string | null> {
        try {
            const member = await this.discordService.getGuildMember(guildId, userId);
            return member?.voice?.channelId || null;
        } catch {
            return null;
        }
    }
}
