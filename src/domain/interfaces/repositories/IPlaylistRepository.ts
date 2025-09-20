import { Playlist } from '../../entities/Playlist';

export interface IPlaylistRepository {
    findById(id: string): Promise<Playlist | null>;
    findByUserId(userId: string): Promise<Playlist[]>;
    findByGuildId(guildId: string): Promise<Playlist[]>;
    findByUserIdAndGuildId(userId: string, guildId: string): Promise<Playlist[]>;
    create(playlist: Playlist): Promise<Playlist>;
    update(playlist: Playlist): Promise<Playlist>;
    delete(id: string): Promise<void>;
    findPublicPlaylists(guildId: string): Promise<Playlist[]>;
}
