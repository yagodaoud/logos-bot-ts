import { injectable, inject } from 'tsyringe';
import { MoonlinkManager } from 'moonlink.js';
import { Client } from 'discord.js';
import { IMusicService } from '@domain/interfaces/services/IMusicService';
import { ICacheService } from '@domain/interfaces/services/ICacheService';
import { MusicQueue } from '@domain/entities/MusicQueue';
import { Track } from '@domain/entities/Playlist';

@injectable()
export class MoonlinkMusicService implements IMusicService {
    private moonlink: MoonlinkManager;

    constructor(
        @inject('ICacheService') private cacheService: ICacheService,
        @inject('DiscordClient') private discordClient: Client
    ) {
        this.moonlink = new MoonlinkManager([{
            host: process.env['LAVALINK_HOST'] || 'localhost',
            port: parseInt(process.env['LAVALINK_PORT'] || '2333'),
            password: process.env['LAVALINK_PASSWORD'] || 'youshallnotpass',
            secure: false
        }], {
            client: this.discordClient,
        }, (guildId: string, payload: any) => {
            const guild = this.discordClient.guilds.cache.get(guildId);
            if (guild) {
                guild.shard.send(payload);
            }
        });

        this.setupEventListeners();
    }

    async getQueue(guildId: string): Promise<MusicQueue | null> {
        const queueData = await this.cacheService.get<MusicQueue>(`queue:${guildId}`);
        return queueData;
    }

    async setQueue(guildId: string, queue: MusicQueue): Promise<void> {
        await this.cacheService.set(`queue:${guildId}`, queue, 3600); // 1 hour TTL
    }

    async addTrack(guildId: string, track: Track): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) {
            const newQueue = new MusicQueue(guildId, [track], 0, false, false, 50, false, false);
            await this.setQueue(guildId, newQueue);
        } else {
            const updatedQueue = queue.addTrack(track);
            await this.setQueue(guildId, updatedQueue);
        }
    }

    async addTracks(guildId: string, tracks: Track[]): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) {
            const newQueue = new MusicQueue(guildId, tracks, 0, false, false, 50, false, false);
            await this.setQueue(guildId, newQueue);
        } else {
            const updatedQueue = queue.addTracks(tracks);
            await this.setQueue(guildId, updatedQueue);
        }
    }

    async removeTrack(guildId: string, index: number): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) return;

        const updatedQueue = queue.removeTrack(index);
        await this.setQueue(guildId, updatedQueue);
    }

    async clearQueue(guildId: string): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) return;

        const clearedQueue = queue.clear();
        await this.setQueue(guildId, clearedQueue);
    }

    async play(guildId: string): Promise<void> {
        const player = this.moonlink.players.get(guildId);
        if (!player) return;

        const queue = await this.getQueue(guildId);
        if (!queue || queue.tracks.length === 0) return;

        const currentTrack = queue.getCurrentTrack();
        if (!currentTrack) return;

        try {
            await player.play({
                track: {
                    encoded: currentTrack.url,
                    info: {
                        title: currentTrack.title,
                        author: currentTrack.author,
                        length: currentTrack.duration,
                        identifier: currentTrack.id,
                        uri: currentTrack.url,
                        isStream: false,
                        isSeekable: true,
                        position: 0
                    }
                }
            });

            const playingQueue = queue.play();
            await this.setQueue(guildId, playingQueue);
        } catch (error) {
            console.error('Error playing track:', error);
        }
    }

    async pause(guildId: string): Promise<void> {
        const player = this.moonlink.players.get(guildId);
        if (!player) return;

        await player.pause();

        const queue = await this.getQueue(guildId);
        if (queue) {
            const pausedQueue = queue.pause();
            await this.setQueue(guildId, pausedQueue);
        }
    }

    async stop(guildId: string): Promise<void> {
        const player = this.moonlink.players.get(guildId);
        if (!player) return;

        await player.stop();

        const queue = await this.getQueue(guildId);
        if (queue) {
            const stoppedQueue = queue.clear();
            await this.setQueue(guildId, stoppedQueue);
        }
    }

    async skip(guildId: string): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) return;

        const nextQueue = queue.next();
        await this.setQueue(guildId, nextQueue);

        if (nextQueue.tracks.length > 0) {
            await this.play(guildId);
        } else {
            await this.stop(guildId);
        }
    }

    async previous(guildId: string): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) return;

        const prevQueue = queue.previous();
        await this.setQueue(guildId, prevQueue);
        await this.play(guildId);
    }

    async setVolume(guildId: string, volume: number): Promise<void> {
        const player = this.moonlink.players.get(guildId);
        if (!player) return;

        await player.setVolume(volume);

        const queue = await this.getQueue(guildId);
        if (queue) {
            const volumeQueue = queue.setVolume(volume);
            await this.setQueue(guildId, volumeQueue);
        }
    }

    async shuffle(guildId: string): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) return;

        const shuffledQueue = queue.shuffle();
        await this.setQueue(guildId, shuffledQueue);
    }

    async setLoop(guildId: string, isLooping: boolean): Promise<void> {
        const queue = await this.getQueue(guildId);
        if (!queue) return;

        // Note: This would need to be implemented in the MusicQueue entity
        // For now, we'll just update the queue state
        const updatedQueue = new MusicQueue(
            queue.guildId,
            queue.tracks,
            queue.currentTrackIndex,
            isLooping,
            queue.isShuffled,
            queue.volume,
            queue.isPlaying,
            queue.isPaused
        );
        await this.setQueue(guildId, updatedQueue);
    }

    async searchTracks(query: string): Promise<Track[]> {
        try {
            const searchResults = await this.moonlink.search(query);

            if (!searchResults || !searchResults.tracks) {
                return [];
            }

            return searchResults.tracks.map((track: any) => ({
                id: track.info.identifier,
                title: track.info.title,
                author: track.info.author,
                duration: track.info.length,
                url: track.track,
                thumbnail: track.info.artworkUrl,
                requesterId: '', // Will be set when adding to queue
                addedAt: new Date()
            }));
        } catch (error) {
            console.error('Error searching tracks:', error);
            return [];
        }
    }

    async getTrackInfo(_url: string): Promise<Track | null> {
        try {
            // Note: Moonlink decode method might not be available in this version
            // This is a placeholder implementation
            return null;
        } catch (error) {
            console.error('Error getting track info:', error);
            return null;
        }
    }

    private setupEventListeners(): void {
        this.moonlink.on('trackStart', (player, track) => {
            console.log(`Track started: ${track.info.title} in guild ${player.guildId}`);
        });

        this.moonlink.on('trackEnd', (player, track) => {
            console.log(`Track ended: ${track.info.title} in guild ${player.guildId}`);
            // Auto-skip to next track
            this.skip(player.guildId);
        });

        this.moonlink.on('trackError', (player, _track, error) => {
            console.error(`Track error in guild ${player.guildId}:`, error);
        });

        this.moonlink.on('queueEnd', (player) => {
            console.log(`Queue ended in guild ${player.guildId}`);
        });
    }
}
