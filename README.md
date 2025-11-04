# Sistema de Gerenciamento de Alunos e Monitores

## Descrição do Projeto
Este projeto é uma plataforma para gerenciamento de alunos e monitores em cursos e disciplinas, incluindo sistema de matchmaking para recomendar monitores compatíveis com alunos.  
O sistema possui funcionalidades de cadastro, autenticação, associação de disciplinas e cursos, e visualização de compatibilidade entre alunos e monitores.

---

## Tecnologias Utilizadas

**Backend**
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT para autenticação
- Bcrypt para criptografia de senhas

**Frontend**
- React.js
- React Router Dom
- Axios
- React Hook Form
- Zod para validação de formulários
- React Toastify para notificações

---

## Funcionalidades

### Autenticação
- Registro e login de usuários.
- Proteção de rotas via token JWT.
- Consulta de dados do usuário logado.

### Alunos
- Cadastro de perfil de aluno.
- Associação a cursos e disciplinas.
- Busca de monitores compatíveis com base em disciplinas.
- Visualização de compatibilidade e disciplinas em comum com cada monitor.

### Monitores
- Cadastro de perfil de monitor.
- Associação a cursos e disciplinas.
- Visualização do próprio perfil.
- Não participam do sistema de matchmaking.

### Matchmaking
- Algoritmo simples que calcula compatibilidade entre aluno e monitores com base em disciplinas em comum.
- Endpoint para listar monitores compatíveis.

### Administração de Cursos e Disciplinas
- Cadastro e listagem de cursos.
- Cadastro e listagem de disciplinas.
- Associação de cursos e disciplinas a alunos e monitores.

---

## Estrutura do Banco de Dados (Prisma)

- `user` → Usuários do sistema (alunos e monitores).
- `aluno` → Perfil de aluno, vinculado a cursos e disciplinas.
- `monitor` → Perfil de monitor, vinculado a cursos e disciplinas.
- `curso` → Cursos disponíveis.
- `disciplina` → Disciplinas disponíveis.
- `alunoDisciplina` / `monitorDisciplina` → Tabelas de relacionamento.
- Prisma facilita migrações, consultas e relacionamentos complexos.

---

## Endpoints Principais

### Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registro de usuário |
| POST | `/auth/login` | Login e geração de token |
| GET  | `/auth/me` | Consulta de usuário logado (token) |

### Aluno
| Método | Rota | Descrição |
|--------|------|-----------|
| GET  | `/aluno/usuario/:usuarioId` | Retorna dados do aluno |
| POST | `/aluno` | Cria cadastro do aluno com cursos e disciplinas |
| GET  | `/aluno/check` | Verifica se o usuário já é aluno (token) |
| POST | `/aluno/:id/disciplinas` | Associa disciplinas ao aluno |

### Monitor
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/monitor` | Cria cadastro de monitor com cursos e disciplinas |
| GET  | `/monitor/check` | Verifica se o usuário já é monitor (token) |
| POST | `/monitor/:id/disciplinas` | Associa disciplinas ao monitor |

### Matchmaking
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/match/:alunoId` | Retorna lista de monitores compatíveis com o aluno |

---

## Frontend

- Componentes principais:
  - `AlunoPage.jsx` → Tela de busca de monitores compatíveis.
  - `MonitorCadastro.jsx` → Tela de cadastro de monitor.
- Integração com backend via **Axios**.
- Validação de formulário com **Zod**.
- Feedback de ações com **React-Toastify**.
- Navegação com **React Router Dom**.
