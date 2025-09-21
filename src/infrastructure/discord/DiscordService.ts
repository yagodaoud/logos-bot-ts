import { injectable, inject } from 'tsyringe';
import { Client, EmbedBuilder, VoiceChannel, GuildMember, Guild } from 'discord.js';
import {
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus,
    createAudioPlayer,
    AudioPlayer
} from '@discordjs/voice';
import { IDiscordService } from '@domain/interfaces/services/IDiscordService';

@injectable()
export class DiscordService implements IDiscordService {
    private voiceConnections: Map<string, VoiceConnection> = new Map();
    private audioPlayers: Map<string, AudioPlayer> = new Map();

    constructor(@inject('DiscordClient') private client: Client) { }

    async sendMessage(channelId: string, content: string, embeds?: any[]): Promise<void> {
        const channel = await this.client.channels.fetch(channelId);
        if (!channel?.isTextBased()) return;

        try {
            await (channel as any).send({
                content,
                embeds: embeds?.map(embed => new EmbedBuilder(embed))
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async sendEmbed(channelId: string, embed: any): Promise<void> {
        const channel = await this.client.channels.fetch(channelId);
        if (!channel?.isTextBased()) return;

        try {
            await (channel as any).send({
                embeds: [new EmbedBuilder(embed)]
            });
        } catch (error) {
            console.error('Error sending embed:', error);
        }
    }

    async sendError(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0xff0000,
            title: '❌ Error',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async sendSuccess(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0x00ff00,
            title: '✅ Success',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async sendWarning(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0xffaa00,
            title: '⚠️ Warning',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async sendInfo(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0x0099ff,
            title: 'ℹ️ Info',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async joinVoiceChannel(guildId: string, channelId: string): Promise<void> {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId) as VoiceChannel;

            if (!channel?.isVoiceBased()) {
                throw new Error('Channel is not a voice channel');
            }

            // Check if already connected to a voice channel in this guild
            const existingConnection = this.voiceConnections.get(guildId);
            if (existingConnection) {
                await this.leaveVoiceChannel(guildId);
            }

            // Create voice connection
            const connection = joinVoiceChannel({
                channelId: channelId,
                guildId: guildId,
                adapterCreator: guild.voiceAdapterCreator as any,
            });

            // Set up connection event handlers
            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log(`Successfully connected to voice channel ${channelId} in guild ${guildId}`);
            });

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                console.log(`Disconnected from voice channel in guild ${guildId}`);
                this.voiceConnections.delete(guildId);
                this.audioPlayers.delete(guildId);
            });

            connection.on('error', (error) => {
                console.error(`Voice connection error in guild ${guildId}:`, error);
                this.voiceConnections.delete(guildId);
                this.audioPlayers.delete(guildId);
            });

            // Store the connection
            this.voiceConnections.set(guildId, connection);

            // Create and store audio player for this guild
            const audioPlayer = createAudioPlayer();
            this.audioPlayers.set(guildId, audioPlayer);
            connection.subscribe(audioPlayer);

        } catch (error) {
            console.error(`Error joining voice channel ${channelId} in guild ${guildId}:`, error);
            throw error;
        }
    }

    async leaveVoiceChannel(guildId: string): Promise<void> {
        try {
            const connection = this.voiceConnections.get(guildId);
            const audioPlayer = this.audioPlayers.get(guildId);

            if (audioPlayer) {
                audioPlayer.stop();
                this.audioPlayers.delete(guildId);
            }

            if (connection) {
                connection.destroy();
                this.voiceConnections.delete(guildId);
                console.log(`Left voice channel in guild ${guildId}`);
            } else {
                console.log(`Not connected to any voice channel in guild ${guildId}`);
            }
        } catch (error) {
            console.error(`Error leaving voice channel in guild ${guildId}:`, error);
            // Clean up even if there was an error
            this.voiceConnections.delete(guildId);
            this.audioPlayers.delete(guildId);
        }
    }

    async isInVoiceChannel(guildId: string): Promise<boolean> {
        try {
            const connection = this.voiceConnections.get(guildId);
            if (!connection) {
                return false;
            }

            // Check if the connection is in a ready state
            return connection.state.status === VoiceConnectionStatus.Ready;
        } catch (error) {
            console.error(`Error checking voice channel status in guild ${guildId}:`, error);
            return false;
        }
    }

    async getVoiceChannelId(guildId: string): Promise<string | null> {
        try {
            const connection = this.voiceConnections.get(guildId);
            if (!connection) {
                return null;
            }

            // Check if the connection is ready and has a channel
            if (connection.state.status === VoiceConnectionStatus.Ready) {
                return connection.joinConfig.channelId;
            }

            return null;
        } catch (error) {
            console.error(`Error getting voice channel ID in guild ${guildId}:`, error);
            return null;
        }
    }

    async hasPermission(guildId: string, userId: string, permission: string): Promise<boolean> {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            const member = await guild.members.fetch(userId);

            // Check if member has the specified permission
            return member.permissions.has(permission as any);
        } catch {
            return false;
        }
    }

    async getGuildMember(guildId: string, userId: string): Promise<GuildMember | null> {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            return await guild.members.fetch(userId);
        } catch (ex: any) {
            return null;
        }
    }

    async getGuild(guildId: string): Promise<Guild | null> {
        try {
            return await this.client.guilds.fetch(guildId);
        } catch {
            return null;
        }
    }

    // Additional voice utility methods
    async getVoiceConnection(guildId: string): Promise<VoiceConnection | null> {
        return this.voiceConnections.get(guildId) || null;
    }

    async getAudioPlayer(guildId: string): Promise<AudioPlayer | null> {
        return this.audioPlayers.get(guildId) || null;
    }

    async isVoiceConnectionReady(guildId: string): Promise<boolean> {
        const connection = this.voiceConnections.get(guildId);
        return connection?.state.status === VoiceConnectionStatus.Ready || false;
    }

    async getVoiceConnectionStatus(guildId: string): Promise<VoiceConnectionStatus | null> {
        const connection = this.voiceConnections.get(guildId);
        return connection?.state.status || null;
    }
}
