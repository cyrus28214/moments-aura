# Moments Aura

![Moments Aura Banner](docs/banner.png)

**Moments Aura** is a AI-powered, modern and self-hosted photo management solution built for performance and user experience. It combines a high-performance Rust backend with a sleek, responsive React frontend to help you organize, edit, and rediscover your precious memories.

>  **Note**: This project is currently under active development.

## ✨ Features

- **High Performance**: Built with Rust (Axum) and highly optimized for speed.
- **Smart Management**:
  - Auto-extract EXIF data (Date, Camera, Lens, etc.).
  - **AI-Powered Tagging**: Automatically tag photos using local/cloud AI models.
  - Manual tagging and batch operations.
- **Rich Editing**: Built-in image editor for adjustments (Brightness, Contrast, Saturation) without destructive changes.
- **Mobile First**: Fully responsive design with mobile-optimized navigation (Drawers) and adaptive grids.
- **Advanced Search**: Filter photos by date, tags, and metadata.
- **Docker Ready**: Easy deployment with Docker Compose / Podman.
- **Dark Mode**: Beautiful dark/light mode support.

## 🛠️ Tech Stack

- **Backend**: Rust, Axum, SQLx, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Infrastructure**: Docker, Nginx

## 🚀 Getting Started

### Prerequisites

- **Docker** / **Podman** (for containerized deployment)
- **Rust** & **Node.js** (for local development)
- **PostgreSQL** (for database)

### 📦 Production Deployment

The Easiest way to run Moments Aura is using Docker Compose / Podman Compose.

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/moments-aura.git
   cd moments-aura
   ```

2. **Configure Environment**
   Edit `compose.yaml` and `config.toml` (if needed).
   
   ```bash
   # Example Environment Variables in compose.yaml
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=yourpassword
   JWT_SECRET=supersecretkey
   ```

3. **Start the Service**
   ```bash
   # Using Podman
   podman-compose up -d --build
   
   # Using Docker
   docker-compose up -d --build
   ```

4. **Access**
   Open your browser and navigate to `http://localhost`.

### 💻 Local Development

#### Backend

1. **Setup Database**
   ```bash
   # Start Postgres
   sudo systemctl start postgresql
   
   # Create DB & Tables
   cargo sqlx database create
   cargo sqlx migrate run
   ```

2. **Run Server**
   ```bash
   # Check config.toml first!
   RUST_LOG=info cargo run
   ```

#### Frontend

1. **Install Dependencies**
   ```bash
   cd frontend
   pnpm install
   ```

2. **Start Dev Server**
   ```bash
   pnpm dev
   ```

## ⚙️ Configuration

Key configuration options in `config.toml` and environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | - |
| `JWT_SECRET` | Secret for session tokens | - |
| `DASHBOARD_API_KEY` | Admin API Key (if applicable) | - |
| `RUST_LOG` | Log level (info, debug, trace) | `info` |

## 🗺️ Roadmap

- [x] AI Tag Recommendations
- [x] Mobile Responsiveness
- [ ] Favorite
- [ ] Trash
- [ ] Enhanced Editing
- [ ] Landing Page
- [ ] Albums