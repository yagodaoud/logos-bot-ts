import { injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IPlaylistRepository } from '@domain/interfaces/repositories/IPlaylistRepository';
import { Playlist, Track } from '@domain/entities/Playlist';

@injectable()
export class PrismaPlaylistRepository implements IPlaylistRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string): Promise<Playlist | null> {
        const playlist = await this.prisma.playlist.findUnique({
            where: { id }
        });

        if (!playlist) return null;

        return this.mapToDomain(playlist);
    }

    async findByUserId(userId: string): Promise<Playlist[]> {
        const playlists = await this.prisma.playlist.findMany({
            where: { userId }
        });

        return playlists.map(playlist => this.mapToDomain(playlist));
    }

    async findByGuildId(guildId: string): Promise<Playlist[]> {
        const playlists = await this.prisma.playlist.findMany({
            where: { guildId }
        });

        return playlists.map(playlist => this.mapToDomain(playlist));
    }

    async findByUserIdAndGuildId(userId: string, guildId: string): Promise<Playlist[]> {
        const playlists = await this.prisma.playlist.findMany({
            where: {
                userId,
                guildId
            }
        });

        return playlists.map(playlist => this.mapToDomain(playlist));
    }

    async create(playlist: Playlist): Promise<Playlist> {
        const created = await this.prisma.playlist.create({
            data: {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
                userId: playlist.userId,
                guildId: playlist.guildId,
                tracks: JSON.stringify(playlist.tracks),
                isPublic: playlist.isPublic,
                createdAt: playlist.createdAt,
                updatedAt: playlist.updatedAt
            }
        });

        return this.mapToDomain(created);
    }

    async update(playlist: Playlist): Promise<Playlist> {
        const updated = await this.prisma.playlist.update({
            where: { id: playlist.id },
            data: {
                name: playlist.name,
                description: playlist.description,
                tracks: JSON.stringify(playlist.tracks),
                isPublic: playlist.isPublic,
                updatedAt: playlist.updatedAt
            }
        });

        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.playlist.delete({
            where: { id }
        });
    }

    async findPublicPlaylists(guildId: string): Promise<Playlist[]> {
        const playlists = await this.prisma.playlist.findMany({
            where: {
                guildId,
                isPublic: true
            }
        });

        return playlists.map(playlist => this.mapToDomain(playlist));
    }

    private mapToDomain(playlist: any): Playlist {
        return new Playlist(
            playlist.id,
            playlist.name,
            playlist.description,
            playlist.userId,
            playlist.guildId,
            JSON.parse(playlist.tracks) as Track[],
            playlist.isPublic,
            playlist.createdAt,
            playlist.updatedAt
        );
    }
}
