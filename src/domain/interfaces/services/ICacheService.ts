export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    publish(channel: string, message: string): Promise<void>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
}
