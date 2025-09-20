import { MusicQueue } from '../../entities/MusicQueue';
import { Track } from '../../entities/Playlist';

export interface IMusicService {
    getQueue(guildId: string): Promise<MusicQueue | null>;
    setQueue(guildId: string, queue: MusicQueue): Promise<void>;
    addTrack(guildId: string, track: Track): Promise<void>;
    addTracks(guildId: string, tracks: Track[]): Promise<void>;
    removeTrack(guildId: string, index: number): Promise<void>;
    clearQueue(guildId: string): Promise<void>;
    play(guildId: string): Promise<void>;
    pause(guildId: string): Promise<void>;
    stop(guildId: string): Promise<void>;
    skip(guildId: string): Promise<void>;
    previous(guildId: string): Promise<void>;
    setVolume(guildId: string, volume: number): Promise<void>;
    shuffle(guildId: string): Promise<void>;
    setLoop(guildId: string, isLooping: boolean): Promise<void>;
    searchTracks(query: string): Promise<Track[]>;
    getTrackInfo(url: string): Promise<Track | null>;
}
