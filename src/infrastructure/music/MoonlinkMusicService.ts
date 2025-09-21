import { injectable, inject } from 'tsyringe';
import { Manager } from 'moonlink.js';
import { Client } from 'discord.js';
import { IMusicService } from '@domain/interfaces/services/IMusicService';
import { ICacheService } from '@domain/interfaces/services/ICacheService';
import { MusicQueue } from '@domain/entities/MusicQueue';
import { Track } from '@domain/entities/Playlist';

@injectable()
export class MoonlinkMusicService implements IMusicService {
    private moonlink: Manager;

    constructor(
        @inject('ICacheService') private cacheService: ICacheService,
        @inject('DiscordClient') private discordClient: Client
    ) {
        this.moonlink = new Manager({
            nodes: [{
                host: process.env['LAVALINK_HOST'] || 'localhost',
                port: parseInt(process.env['LAVALINK_PORT'] || '2333'),
                password: process.env['LAVALINK_PASSWORD'] || 'youshallnotpass',
                secure: false
            }],
            options: {
                clientName: 'logos-bot-ts'
            },
            sendPayload: (guildId: string, payload: any) => {
                const guild = this.discordClient.guilds.cache.get(guildId);
                if (guild) {
                    guild.shard.send(payload);
                }
            }
        });

        // Initialize Manager with client ID
        this.initializeMoonlink();
        this.setupEventListeners();
    }

    private async initializeMoonlink(): Promise<void> {
        try {
            // Wait for the client to be ready
            if (this.discordClient.user) {
                await this.moonlink.init(this.discordClient.user.id);
                console.log('MoonlinkManager initialized with client ID:', this.discordClient.user.id);
            } else {
                // If client is not ready yet, wait for the ready event
                this.discordClient.once('ready', async () => {
                    if (this.discordClient.user) {
                        await this.moonlink.init(this.discordClient.user.id);
                        console.log('MoonlinkManager initialized with client ID:', this.discordClient.user.id);
                    }
                });
            }
        } catch (error) {
            console.error('Error initializing MoonlinkManager:', error);
        }
    }

    async getQueue(guildId: string): Promise<MusicQueue | null> {
        const queueData = await this.cacheService.get<any>(`queue:${guildId}`);
        if (!queueData) {
            return null;
        }

        // Reconstruct MusicQueue instance from cached data
        return new MusicQueue(
            queueData.guildId,
            queueData.tracks,
            queueData.currentTrackIndex,
            queueData.isLooping,
            queueData.isShuffled,
            queueData.volume,
            queueData.isPlaying,
            queueData.isPaused
        );
    }

    async setQueue(guildId: string, queue: MusicQueue): Promise<void> {
        // Store queue data as plain object for proper serialization
        const queueData = {
            guildId: queue.guildId,
            tracks: queue.tracks,
            currentTrackIndex: queue.currentTrackIndex,
            isLooping: queue.isLooping,
            isShuffled: queue.isShuffled,
            volume: queue.volume,
            isPlaying: queue.isPlaying,
            isPaused: queue.isPaused
        };
        await this.cacheService.set(`queue:${guildId}`, queueData, 3600); // 1 hour TTL
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
                encoded: currentTrack.url
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
            // Check if Manager is properly initialized
            if (!this.moonlink.initialize) {
                console.error('MoonlinkManager not initialized. Make sure the Discord client is ready.');
                return [];
            }

            // Check if there are any connected nodes
            if (!this.moonlink.nodes.hasConnected()) {
                console.error('No connected Lavalink nodes available. Please check your Lavalink server connection.');
                return [];
            }

            console.log('Searching for tracks with query:', query);
            const searchResults = await this.moonlink.search({
                query: query,
                source: 'youtube'
            });
            console.log('Search results:', JSON.stringify(searchResults, null, 2));

            if (!searchResults) {
                console.log('Search returned null/undefined');
                return [];
            }

            if (!searchResults.tracks) {
                console.log('Search results have no tracks property. Full response:', searchResults);
                return [];
            }

            if (!Array.isArray(searchResults.tracks)) {
                console.log('Search results tracks is not an array:', typeof searchResults.tracks, searchResults.tracks);
                return [];
            }

            if (searchResults.tracks.length === 0) {
                console.log('No tracks found for query:', query);
                return [];
            }

            return searchResults.tracks.map((track: any) => ({
                id: track.identifier,
                title: track.title,
                author: track.author,
                duration: track.length,
                url: track.track,
                thumbnail: track.artworkUrl,
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
            console.log(`Track started: ${track.title} in guild ${player.guildId}`);
        });

        this.moonlink.on('trackEnd', (player, track) => {
            console.log(`Track ended: ${track.title} in guild ${player.guildId}`);
            // Auto-skip to next track
            this.skip(player.guildId);
        });

        this.moonlink.on('trackException', (player, _track, exception) => {
            console.error(`Track error in guild ${player.guildId}:`, exception);
        });

        this.moonlink.on('queueEnd', (player) => {
            console.log(`Queue ended in guild ${player.guildId}`);
        });

        // Add node connection event listeners
        this.moonlink.on('nodeConnected', (node) => {
            console.log(`Lavalink node connected: ${node.host}:${node.port}`);
        });

        this.moonlink.on('nodeDisconnect', (node) => {
            console.log(`Lavalink node disconnected: ${node.host}:${node.port}`);
        });

        this.moonlink.on('nodeError', (node, error) => {
            console.error(`Lavalink node error: ${node.host}:${node.port}`, error);
        });

        this.moonlink.on('debug', (message) => {
            console.log('[Moonlink Debug]:', message);
        });
    }
}
