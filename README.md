# FGE Cotizador Monorepo

Monorepo inicial para la plataforma **FGE Cotizador**, con arquitectura separada para backend y frontend.

> El prototipo original React + Vite se mantiene intacto en la raíz para referencia y futura migración.

## Estructura

- `backend/`: API NestJS (TypeORM + PostgreSQL + Swagger + JWT + Gemini).
- `frontend/`: Aplicación Next.js 14 (App Router + TypeScript + Tailwind).
- `docs/`: documentación técnica del prototipo y lineamientos.

## Requisitos

- Node.js **20+**
- PostgreSQL **15+**
- pgAdmin (opcional)

## Backend (NestJS)

1. Entrar a carpeta backend:
   ```bash
   cd backend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear `.env` desde plantilla:
   ```bash
   cp .env.example .env
   ```
4. Ejecutar en desarrollo:
   ```bash
   npm run start:dev
   ```

API local: `http://localhost:3001`  
Swagger: `http://localhost:3001/api/docs`

## Frontend (Next.js)

1. Entrar a carpeta frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear `.env.local` desde plantilla:
   ```bash
   cp .env.local.example .env.local
   ```
4. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

App local: `http://localhost:3000`


