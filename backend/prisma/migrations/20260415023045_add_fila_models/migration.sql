-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "risco" TEXT NOT NULL DEFAULT 'VERDE',
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "unidadeId" TEXT NOT NULL,
    "salaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chamadoEm" TIMESTAMP(3),
    "finalizadoEm" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sala" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'CONSULTA',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "unidadeId" TEXT NOT NULL,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
