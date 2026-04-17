# ========================================
# Backend SisSaúde360
# ========================================
FROM node:20-slim

# Instala dependências do sistema (Prisma + pg_isready para healthcheck)
RUN apt-get update -y && \
    apt-get install -y openssl postgresql-client && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copia arquivos de dependências primeiro (melhor cache do Docker)
COPY package*.json ./
COPY prisma ./prisma/

# 2. Instala dependências
RUN npm ci --omit=dev && \
    npx prisma generate

# 3. Instala devDependencies separadamente (precisa de ts-node-dev para dev)
COPY . .
RUN npm install

# 4. Copia e configura o entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]