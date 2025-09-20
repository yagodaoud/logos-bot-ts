export class Playlist {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly userId: string,
        public readonly guildId: string,
        public readonly tracks: Track[],
        public readonly isPublic: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) { }

    addTrack(track: Track): Playlist {
        const updatedTracks = [...this.tracks, track];
        return new Playlist(
            this.id,
            this.name,
            this.description,
            this.userId,
            this.guildId,
            updatedTracks,
            this.isPublic,
            this.createdAt,
            new Date()
        );
    }

    removeTrack(trackId: string): Playlist {
        const updatedTracks = this.tracks.filter(track => track.id !== trackId);
        return new Playlist(
            this.id,
            this.name,
            this.description,
            this.userId,
            this.guildId,
            updatedTracks,
            this.isPublic,
            this.createdAt,
            new Date()
        );
    }

    updateDetails(name: string, description: string, isPublic: boolean): Playlist {
        return new Playlist(
            this.id,
            name,
            description,
            this.userId,
            this.guildId,
            this.tracks,
            isPublic,
            this.createdAt,
            new Date()
        );
    }
}

export interface Track {
    id: string;
    title: string;
    author: string;
    duration: number;
    url: string;
    thumbnail?: string;
    requesterId: string;
    addedAt: Date;
}
