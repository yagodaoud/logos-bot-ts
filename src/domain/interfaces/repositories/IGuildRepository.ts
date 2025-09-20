import { Guild } from '../../entities/Guild';

export interface IGuildRepository {
    findById(id: string): Promise<Guild | null>;
    findByDiscordId(discordId: string): Promise<Guild | null>;
    create(guild: Guild): Promise<Guild>;
    update(guild: Guild): Promise<Guild>;
    delete(id: string): Promise<void>;
    findAll(): Promise<Guild[]>;
}
