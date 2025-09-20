import { Track } from './Playlist';

export class MusicQueue {
    constructor(
        public readonly guildId: string,
        public readonly tracks: Track[],
        public readonly currentTrackIndex: number,
        public readonly isLooping: boolean,
        public readonly isShuffled: boolean,
        public readonly volume: number,
        public readonly isPlaying: boolean,
        public readonly isPaused: boolean
    ) { }

    addTrack(track: Track): MusicQueue {
        return new MusicQueue(
            this.guildId,
            [...this.tracks, track],
            this.currentTrackIndex,
            this.isLooping,
            this.isShuffled,
            this.volume,
            this.isPlaying,
            this.isPaused
        );
    }

    addTracks(tracks: Track[]): MusicQueue {
        return new MusicQueue(
            this.guildId,
            [...this.tracks, ...tracks],
            this.currentTrackIndex,
            this.isLooping,
            this.isShuffled,
            this.volume,
            this.isPlaying,
            this.isPaused
        );
    }

    removeTrack(index: number): MusicQueue {
        const newTracks = this.tracks.filter((_, i) => i !== index);
        const newCurrentIndex = index < this.currentTrackIndex
            ? this.currentTrackIndex - 1
            : this.currentTrackIndex;

        return new MusicQueue(
            this.guildId,
            newTracks,
            newCurrentIndex,
            this.isLooping,
            this.isShuffled,
            this.volume,
            this.isPlaying,
            this.isPaused
        );
    }

    shuffle(): MusicQueue {
        const shuffledTracks = [...this.tracks];
        const currentTrack = this.tracks[this.currentTrackIndex];

        if (!currentTrack) {
            return this;
        }

        // Remove current track from shuffle
        shuffledTracks.splice(this.currentTrackIndex, 1);

        // Shuffle the rest
        for (let i = shuffledTracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = shuffledTracks[i];
            if (temp && shuffledTracks[j]) {
                shuffledTracks[i] = shuffledTracks[j];
                shuffledTracks[j] = temp;
            }
        }

        // Put current track back at the beginning
        shuffledTracks.unshift(currentTrack);

        return new MusicQueue(
            this.guildId,
            shuffledTracks,
            0,
            this.isLooping,
            true,
            this.volume,
            this.isPlaying,
            this.isPaused
        );
    }

    setVolume(volume: number): MusicQueue {
        return new MusicQueue(
            this.guildId,
            this.tracks,
            this.currentTrackIndex,
            this.isLooping,
            this.isShuffled,
            Math.max(0, Math.min(100, volume)),
            this.isPlaying,
            this.isPaused
        );
    }

    play(): MusicQueue {
        return new MusicQueue(
            this.guildId,
            this.tracks,
            this.currentTrackIndex,
            this.isLooping,
            this.isShuffled,
            this.volume,
            true,
            false
        );
    }

    pause(): MusicQueue {
        return new MusicQueue(
            this.guildId,
            this.tracks,
            this.currentTrackIndex,
            this.isLooping,
            this.isShuffled,
            this.volume,
            false,
            true
        );
    }

    next(): MusicQueue {
        const nextIndex = this.currentTrackIndex + 1;
        if (nextIndex >= this.tracks.length) {
            return new MusicQueue(
                this.guildId,
                this.tracks,
                0,
                this.isLooping,
                this.isShuffled,
                this.volume,
                false,
                false
            );
        }

        return new MusicQueue(
            this.guildId,
            this.tracks,
            nextIndex,
            this.isLooping,
            this.isShuffled,
            this.volume,
            this.isPlaying,
            this.isPaused
        );
    }

    previous(): MusicQueue {
        const prevIndex = this.currentTrackIndex - 1;
        if (prevIndex < 0) {
            return new MusicQueue(
                this.guildId,
                this.tracks,
                this.tracks.length - 1,
                this.isLooping,
                this.isShuffled,
                this.volume,
                this.isPlaying,
                this.isPaused
            );
        }

        return new MusicQueue(
            this.guildId,
            this.tracks,
            prevIndex,
            this.isLooping,
            this.isShuffled,
            this.volume,
            this.isPlaying,
            this.isPaused
        );
    }

    getCurrentTrack(): Track | undefined {
        return this.tracks[this.currentTrackIndex];
    }

    clear(): MusicQueue {
        return new MusicQueue(
            this.guildId,
            [],
            0,
            false,
            false,
            this.volume,
            false,
            false
        );
    }
}
