export class User {
    constructor(
        public readonly id: string,
        public readonly username: string,
        public readonly discriminator: string,
        public readonly avatar?: string,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date()
    ) { }

    updateProfile(username: string, discriminator: string, avatar?: string): User {
        return new User(
            this.id,
            username,
            discriminator,
            avatar,
            this.createdAt,
            new Date()
        );
    }
}
