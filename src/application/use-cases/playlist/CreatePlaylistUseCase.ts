import { injectable, inject } from 'tsyringe';
import { IPlaylistRepository } from '@domain/interfaces/repositories/IPlaylistRepository';
import { Playlist } from '@domain/entities/Playlist';

export interface CreatePlaylistRequest {
    name: string;
    description: string;
    userId: string;
    guildId: string;
    isPublic: boolean;
}

export interface CreatePlaylistResponse {
    success: boolean;
    message: string;
    playlist?: Playlist;
}

@injectable()
export class CreatePlaylistUseCase {
    constructor(
        @inject('IPlaylistRepository') private playlistRepository: IPlaylistRepository
    ) { }

    async execute(request: CreatePlaylistRequest): Promise<CreatePlaylistResponse> {
        try {
            // Check if playlist name already exists for this user in this guild
            const existingPlaylists = await this.playlistRepository.findByUserIdAndGuildId(
                request.userId,
                request.guildId
            );

            const nameExists = existingPlaylists.some(
                playlist => playlist.name.toLowerCase() === request.name.toLowerCase()
            );

            if (nameExists) {
                return {
                    success: false,
                    message: 'A playlist with this name already exists in this server.'
                };
            }

            // Create new playlist
            const playlist = new Playlist(
                this.generateId(),
                request.name,
                request.description,
                request.userId,
                request.guildId,
                [],
                request.isPublic,
                new Date(),
                new Date()
            );

            const createdPlaylist = await this.playlistRepository.create(playlist);

            return {
                success: true,
                message: `Playlist "${request.name}" created successfully!`,
                playlist: createdPlaylist
            };
        } catch (error) {
            console.error('Error in CreatePlaylistUseCase:', error);
            return {
                success: false,
                message: 'An error occurred while creating the playlist.'
            };
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
