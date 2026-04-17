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

echo "🔄 Executando migrations (Prisma)..."
if npx prisma migrate deploy; then
  echo "✅ Migrations aplicadas com sucesso!"
else
  echo "⚠️  Falha ao aplicar migrations formais. Tentando 'db push' para sincronizar o banco..."
  npx prisma db push --accept-data-loss
  echo "✅ Banco de dados sincronizado via db push!"
fi

echo "🌱 Executando seeds..."
if node prisma/seed.js; then
  echo "✅ Seeds executados com sucesso!"
else
  echo "⚠️  Seed falhou ou já foi executado. Continuando..."
fi

echo "🚀 Iniciando servidor..."
exec "$@"
