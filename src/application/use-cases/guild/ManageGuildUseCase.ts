import { injectable, inject } from 'tsyringe';
import { IGuildRepository } from '@domain/interfaces/repositories/IGuildRepository';
import { Guild, MusicSettings, ModerationSettings } from '@domain/entities/Guild';

export interface CreateGuildRequest {
    discordId: string;
    name: string;
}

export interface UpdateMusicSettingsRequest {
    guildId: string;
    settings: Partial<MusicSettings>;
}

export interface UpdateModerationSettingsRequest {
    guildId: string;
    settings: Partial<ModerationSettings>;
}

export interface ManageGuildResponse {
    success: boolean;
    message: string;
    guild?: Guild;
}

@injectable()
export class ManageGuildUseCase {
    constructor(
        @inject('IGuildRepository') private guildRepository: IGuildRepository
    ) { }

    async createGuild(request: CreateGuildRequest): Promise<ManageGuildResponse> {
        try {
            const existingGuild = await this.guildRepository.findByDiscordId(request.discordId);
            if (existingGuild) {
                return {
                    success: false,
                    message: 'Guild already exists in the database.'
                };
            }

            const defaultMusicSettings: MusicSettings = {
                defaultVolume: 50,
                maxQueueSize: 100,
                allowDuplicates: true,
                autoPlay: false
            };

            const defaultModerationSettings: ModerationSettings = {
                autoModeration: false,
                maxWarnings: 3
            };

            const guild = new Guild(
                this.generateId(),
                request.name,
                defaultMusicSettings,
                defaultModerationSettings,
                new Date(),
                new Date()
            );

            const createdGuild = await this.guildRepository.create(guild);

            return {
                success: true,
                message: 'Guild created successfully.',
                guild: createdGuild
            };
        } catch (error) {
            console.error('Error in ManageGuildUseCase.createGuild:', error);
            return {
                success: false,
                message: 'An error occurred while creating the guild.'
            };
        }
    }

    async updateMusicSettings(request: UpdateMusicSettingsRequest): Promise<ManageGuildResponse> {
        try {
            const guild = await this.guildRepository.findById(request.guildId);
            if (!guild) {
                return {
                    success: false,
                    message: 'Guild not found.'
                };
            }

            const updatedGuild = guild.updateMusicSettings(request.settings);
            const savedGuild = await this.guildRepository.update(updatedGuild);

            return {
                success: true,
                message: 'Music settings updated successfully.',
                guild: savedGuild
            };
        } catch (error) {
            console.error('Error in ManageGuildUseCase.updateMusicSettings:', error);
            return {
                success: false,
                message: 'An error occurred while updating music settings.'
            };
        }
    }

    async updateModerationSettings(request: UpdateModerationSettingsRequest): Promise<ManageGuildResponse> {
        try {
            const guild = await this.guildRepository.findById(request.guildId);
            if (!guild) {
                return {
                    success: false,
                    message: 'Guild not found.'
                };
            }

            const updatedGuild = guild.updateModerationSettings(request.settings);
            const savedGuild = await this.guildRepository.update(updatedGuild);

            return {
                success: true,
                message: 'Moderation settings updated successfully.',
                guild: savedGuild
            };
        } catch (error) {
            console.error('Error in ManageGuildUseCase.updateModerationSettings:', error);
            return {
                success: false,
                message: 'An error occurred while updating moderation settings.'
            };
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
