# ========================================
# Frontend SisSaúde360 — Multi-stage Build
# ========================================

# === STAGE 1: Build ===
FROM node:20-slim AS builder

WORKDIR /app

# Copia dependências primeiro (melhor cache)
COPY package*.json ./
RUN npm ci

# Copia código fonte e builda
COPY . .

# A URL da API é injetada em build-time
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# === STAGE 2: Serve com Nginx ===
FROM nginx:alpine

# Remove config padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia config customizada
COPY nginx.conf /etc/nginx/conf.d/

# Copia build do React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
