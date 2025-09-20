# Logos Bot - Clean Architecture Discord Bot

A scalable Discord bot built with TypeScript, Clean Architecture principles, Moonlink.js for music, and Prisma for database management.

## 🏗️ Architecture

This bot follows Clean Architecture principles with clear separation of concerns:

- **Domain Layer**: Business entities, use case interfaces, and repository contracts
- **Application Layer**: Use case implementations orchestrating domain logic
- **Infrastructure Layer**: Discord.js adapter, database persistence (Prisma), caching (Redis), external APIs
- **Presentation Layer**: Discord command/event handlers

## 🚀 Features

- **Music Commands**: Play, pause, skip, queue management, volume control
- **Playlist Management**: Create, manage, and share playlists
- **Guild Management**: Server-specific settings and configuration
- **Scalable Design**: Horizontal scaling support with Redis pub/sub
- **Type Safety**: Full TypeScript with strict mode
- **Dependency Injection**: Using tsyringe for clean dependency management

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis server
- Lavalink server (for music functionality)
- Discord Bot Token

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd logos-bot-ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   DATABASE_URL=postgresql://username:password@localhost:5432/logos_bot_db
   REDIS_URL=redis://localhost:6379
   LAVALINK_HOST=localhost
   LAVALINK_PORT=2333
   LAVALINK_PASSWORD=your_lavalink_password
   ```

4. **Set up the database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

## 🎵 Music Setup

This bot requires a Lavalink server for music functionality:

1. **Download Lavalink**
   - Download from [Lavalink releases](https://github.com/lavalink-devs/Lavalink/releases)
   - Place `Lavalink.jar` in your project directory

2. **Create application.yml**
   ```yaml
   server:
     port: 2333
   lavalink:
     plugins:
       - dependency: "com.github.topi314:lavasrc-plugin:4.0.0"
         repository: "https://maven.topi.wtf/releases"
   metrics:
     prometheus:
       enabled: false
   ```

3. **Run Lavalink**
   ```bash
   java -jar Lavalink.jar
   ```

## 🚀 Running the Bot

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── domain/                 # Domain layer
│   ├── entities/          # Business entities
│   └── interfaces/        # Repository and service contracts
├── application/           # Application layer
│   └── use-cases/        # Business logic implementations
├── infrastructure/       # Infrastructure layer
│   ├── persistence/      # Database implementations
│   ├── cache/           # Redis implementations
│   ├── discord/         # Discord.js adapters
│   └── music/           # Music service implementations
├── presentation/         # Presentation layer
│   ├── commands/        # Discord slash commands
│   └── discord/         # Discord bot setup
├── config/              # Configuration
│   └── container.ts     # Dependency injection setup
└── index.ts            # Application entry point
```

## 🎮 Commands

### Music Commands
- `/play <query>` - Play music from search query or URL
- `/queue show` - Show current music queue
- `/queue skip` - Skip current track
- `/queue pause` - Pause music
- `/queue resume` - Resume music
- `/queue stop` - Stop music and clear queue
- `/queue shuffle` - Shuffle the queue
- `/queue clear` - Clear the queue
- `/queue volume <level>` - Set volume (0-100)

### Playlist Commands
- `/createplaylist <name> [description] [public]` - Create a new playlist

## 🔧 Configuration

### Guild Settings
The bot stores guild-specific settings in the database:
- Music settings (volume, queue size, etc.)
- Moderation settings (log channels, auto-moderation, etc.)

### Redis Configuration
Redis is used for:
- Music queue state management
- Caching frequently accessed data
- Pub/sub for multi-instance synchronization

## 🚀 Scaling

This bot is designed for horizontal scaling:

1. **Multiple Instances**: Run multiple bot instances behind a load balancer
2. **Redis Pub/Sub**: Instances communicate via Redis for state synchronization
3. **Database**: Shared PostgreSQL database for persistent data
4. **Lavalink Clustering**: Use multiple Lavalink nodes for music processing

## 🧪 Development

### Adding New Features

1. **Domain Layer**: Define entities and interfaces
2. **Application Layer**: Implement use cases
3. **Infrastructure Layer**: Create concrete implementations
4. **Presentation Layer**: Add Discord commands/events

### Example: Adding a Moderation Feature

1. Create `ModerationLog` entity in domain
2. Define `IModerationRepository` interface
3. Implement use cases for moderation actions
4. Create Prisma repository implementation
5. Add Discord slash commands

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub.
