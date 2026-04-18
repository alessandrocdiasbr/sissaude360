# SisSaúde360

O SisSaúde360 é uma plataforma completa para gestão de saúde, integrando backend em Node.js com Prisma e frontend em React com TypeScript, tudo rodando em containers Docker.

## 🚀 Como Iniciar o Sistema (Docker)

Siga os passos abaixo para subir todo o ambiente (Banco de Dados, Backend e Frontend):

### 1. Pré-requisitos
Certifique-se de ter o **Docker** e o **Docker Compose** instalados em sua máquina.

### 2. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto copiando o exemplo:

```bash
cp .env.example .env
```

*(Opcional: Ajuste as variáveis no arquivo `.env` se necessário, como senhas do banco de dados ou portas).*

### 3. Iniciar os Containers
Execute o comando abaixo na raiz do projeto:

```bash
docker compose up --build
```

Este comando irá:
- Baixar a imagem do PostgreSQL 15.
- Construir a imagem do Backend e executar as migrações do banco.
- Construir a imagem do Frontend (React + Vite) e servir via Nginx.

### 4. Acesso ao Sistema
Após a finalização do build e inicialização, acesse:

- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)

---

## 🔑 Credenciais de Acesso (Login)

Utilize as credenciais abaixo para entrar no sistema após a inicialização:

- **E-mail:** admin@sissaude360.local
- **Senha:** Admin@360

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Vite, Nginx.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL 15.
- **Infra:** Docker & Docker Compose.
