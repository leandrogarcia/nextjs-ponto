# Sistema de Ponto

Controle de ponto em Next.js (App Router) + Firebase Authentication + Cloud Firestore.

- **root**: criado na instalação; cadastra apenas o primeiro gerente.
- **gerencia**: administra usuários, jornadas semanais e relatórios (CSV/PDF).
- **funcionario**: marca entrada/saída (horário do servidor) e consulta o próprio histórico.

Fuso: `America/Sao_Paulo`. Horas esperadas por dia útil = jornada semanal ÷ 5 (segunda a sexta).

## Desenvolvimento local (emuladores, sem credenciais)

Requer Node 22 (fixado em `.nvmrc` e em `engines`) e Java 21+ (para o emulador do Firestore).

```bash
nvm use               # Node 22
npm install
npm run dev:emulators   # emuladores Auth/Firestore + next dev com .env.emulator
```

Abra http://localhost:3000/install e use o segredo `segredo-local` (definido em `.env.emulator`).

## Testes

```bash
npm test                # unitários (autorização, validações, horas, saldo, CSV)
npm run test:emulators  # integração com os emuladores (instalação, usuários, marcações, regras)
npm run lint && npm run typecheck && npm run build
```

## Variáveis de ambiente

Veja `.env.example`.

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Configuração web do app Firebase |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Conta de serviço do Admin SDK |
| `INSTALL_SECRET` | Segredo exigido em `/install` |
| `PUNCH_MIN_INTERVAL_SECONDS` | Intervalo mínimo entre marcações (padrão 60) |

## Deploy (Vercel + Firebase)

1. No Firebase: crie o projeto, ative **Authentication > E-mail/senha** e o **Firestore** (região de preferência `southamerica-east1`).
2. Publique regras e índices: `npx firebase deploy --only firestore:rules,firestore:indexes --project <id>`.
3. Gere uma chave de conta de serviço (Configurações > Contas de serviço) e registre um app Web para obter a configuração pública.
4. Na Vercel, importe o repositório e configure as variáveis acima (em `FIREBASE_PRIVATE_KEY`, cole a chave com `\n`). A Vercel usa o Node 22 definido em `engines` no `package.json`.
5. Após o deploy, acesse `/install` com o `INSTALL_SECRET`, crie o root e, com ele, o primeiro gerente.

A instalação só roda uma vez (trava `settings/install-lock`). Todas as escritas passam pelos Route Handlers; as regras do Firestore negam qualquer escrita do cliente.
