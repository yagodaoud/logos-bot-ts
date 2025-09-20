import { User } from '../../entities/User';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByDiscordId(discordId: string): Promise<User | null>;
    create(user: User): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    findAll(): Promise<User[]>;
}
