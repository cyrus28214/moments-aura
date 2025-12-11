# === 阶段 1: 编译构建 (Builder) ===
FROM docker.io/rust:1.91-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

COPY Cargo.toml Cargo.lock ./

RUN mkdir src && echo "fn main() {}" > src/main.rs

RUN cargo build --release

RUN rm -rf src

COPY src ./src

COPY .sqlx .

ENV SQLX_OFFLINE=true
RUN cargo build --release

# === 阶段 2: 生产运行 (Runner) ===
FROM docker.io/debian:12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y libssl-dev ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/moments_aura ./server

COPY deploy/config.prod.toml ./config.toml

EXPOSE 8080

CMD ["./server"]