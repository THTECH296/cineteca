# CineTeca 🎬

Aplicação de **venda de ingressos de cinema** (CineTeca — Teófilo Otoni/MG): o cliente
escolhe o filme, a sessão e os lugares, paga via **PIX** ou **cartão**, e recebe o
ingresso digital. Inclui um **painel administrativo** completo.

> Redesign moderno e full-stack de um sistema de bilheteria, feito como projeto de portfólio.

## ✨ Funcionalidades

**Cliente**
- Cartaz com banner de destaque, busca e pôsteres reais
- Escolha de sessão (dia/horário) e **mapa de assentos** com ocupação em tempo real
- **Meia-entrada** conforme a Lei 12.933/2013 (estudante, idoso, PCD, etc.)
- Login / cadastro (e-mail + senha, com confirmação) e **foto de perfil**
- **PIX real** (QR Code + copia-e-cola, via AbacatePay) e **cartão** (checkout hospedado)
- Ingresso digital com **download em PDF**

**Admin** (`/admin` — acesso restrito)
- Login isolado do site (sessões independentes)
- CRUD de filmes: nome, pôster (upload), preço, classificação (auto-sugerida), horários
- Painel em tempo real: ingressos vendidos, cancelados, receita e mapa de assentos por sessão

## 🧱 Stack

- **React 19 + TypeScript + Vite**
- **Supabase**: Auth, PostgreSQL (RLS), Storage, Realtime e **Edge Functions** (Deno)
- **AbacatePay**: cobranças PIX e cartão
- **jsPDF** (ingresso) · tipografia Bebas Neue + Manrope

## 🚀 Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu Supabase
npm run dev
```

O backend (schema, Edge Function de pagamento) está em `supabase/`.

## 📁 Estrutura

```
src/
  components/   Telas do fluxo (cartaz, sessão, assentos, pagamento, ingresso)
  admin/        Painel administrativo
  auth/         Contexto de autenticação
  lib/          Cliente Supabase + camada de dados + PIX
supabase/
  functions/pix/   Edge Function (PIX + cartão via AbacatePay)
  schema.sql       Tabelas, RLS e funções
```
