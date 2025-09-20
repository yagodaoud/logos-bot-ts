export class Guild {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly musicSettings: MusicSettings,
        public readonly moderationSettings: ModerationSettings,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) { }

    updateMusicSettings(settings: Partial<MusicSettings>): Guild {
        return new Guild(
            this.id,
            this.name,
            { ...this.musicSettings, ...settings },
            this.moderationSettings,
            this.createdAt,
            new Date()
        );
    }

    updateModerationSettings(settings: Partial<ModerationSettings>): Guild {
        return new Guild(
            this.id,
            this.name,
            this.musicSettings,
            { ...this.moderationSettings, ...settings },
            this.createdAt,
            new Date()
        );
    }
}

export interface MusicSettings {
    defaultVolume: number;
    maxQueueSize: number;
    allowDuplicates: boolean;
    djRoleId?: string;
    autoPlay: boolean;
}

export interface ModerationSettings {
    logChannelId?: string;
    muteRoleId?: string;
    autoModeration: boolean;
    maxWarnings: number;
}
