#!/bin/sh
set -e

echo "⏳ Aguardando o PostgreSQL ficar disponível..."

# Aguarda o PostgreSQL aceitar conexões (máximo 30 segundos)
RETRIES=30
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "  PostgreSQL não disponível ainda. Tentando novamente em 1s... ($RETRIES restantes)"
  RETRIES=$((RETRIES - 1))
  sleep 1
done

if [ $RETRIES -eq 0 ]; then
  echo "❌ Não foi possível conectar ao PostgreSQL após 30 segundos."
  exit 1
fi

echo "✅ PostgreSQL disponível!"

echo "🔄 Executando migrations..."
npx prisma migrate deploy

echo "🌱 Executando seeds..."
node prisma/seed.js || echo "⚠️  Seed falhou (pode já ter sido executado)"

echo "🚀 Iniciando servidor..."
exec "$@"
