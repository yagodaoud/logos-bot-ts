export interface IDiscordService {
    sendMessage(channelId: string, content: string, embeds?: any[]): Promise<void>;
    sendEmbed(channelId: string, embed: any): Promise<void>;
    sendError(channelId: string, message: string): Promise<void>;
    sendSuccess(channelId: string, message: string): Promise<void>;
    sendWarning(channelId: string, message: string): Promise<void>;
    sendInfo(channelId: string, message: string): Promise<void>;
    joinVoiceChannel(guildId: string, channelId: string): Promise<void>;
    leaveVoiceChannel(guildId: string): Promise<void>;
    isInVoiceChannel(guildId: string): Promise<boolean>;
    getVoiceChannelId(guildId: string): Promise<string | null>;
    hasPermission(guildId: string, userId: string, permission: string): Promise<boolean>;
    getGuildMember(guildId: string, userId: string): Promise<any>;
    getGuild(guildId: string): Promise<any>;
}
