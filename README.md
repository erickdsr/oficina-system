# GarageOS

GarageOS e um ERP web para gestao de distribuidora/oficina automotiva. O sistema cobre cadastros, estoque, compras, vendas, movimentacoes e dashboard operacional.

## Objetivo

O projeto foi construido como portfolio full stack com foco em arquitetura em camadas, autenticacao JWT, controle de permissoes, persistencia em PostgreSQL e interface administrativa responsiva.

## Funcionalidades

- Autenticacao com JWT e senha criptografada com BCrypt
- Controle de acesso por perfis: ADMIN, MANAGER, SALESPERSON, STOCK e BUYER
- Dashboard com metricas, graficos, ultimas vendas e alertas operacionais
- CRUD de clientes, fornecedores, funcionarios, categorias e produtos
- Controle de estoque por produto
- Historico de movimentacoes de estoque
- Compras com recebimento e entrada automatica no estoque
- Vendas com pagamentos, descontos e baixa automatica de estoque ao finalizar
- Exclusao/desativacao segura de registros com dependencias
- API documentada com Swagger/OpenAPI

## Tecnologias

### Backend

- Java 21
- Spring Boot 3.5.x
- Spring Security
- Spring Data JPA / Hibernate
- PostgreSQL
- JWT com JJWT
- Bean Validation
- Swagger/OpenAPI
- JUnit 5 e Mockito
- Maven

### Frontend

- React
- TypeScript
- Vite
- Axios
- React Router
- Recharts
- Sonner
- Lucide React

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL 17
- Nginx para servir o frontend em producao

## Estrutura

```text
backend/
  database/                 Script SQL de apoio
  src/main/java/...          Modulos por dominio
    auth/                    Login e DTOs de autenticacao
    category/                Categorias
    client/                  Clientes
    config/                  Security, erros globais e compatibilidade de schema
    deletion/                Exclusao/desativacao com dependencias
    employee/                Funcionarios
    paymentMethod/           Formas de pagamento
    product/                 Produtos
    purchase/                Compras
    role/                    Perfis
    sale/                    Vendas
    security/                JWT e UserDetails
    stock/                   Estoque e movimentacoes
    supplier/                Fornecedores
  src/test/                  Testes unitarios e integracao

frontend/
  src/components/            Componentes comuns e layout
  src/context/               Contexto de autenticacao
  src/hooks/                 Hooks por modulo
  src/pages/                 Telas do sistema
  src/services/              Cliente HTTP e services da API
  src/types/                 Tipos TypeScript
  src/utils/                 Formatadores, permissoes e helpers
  tests/                     Testes do frontend
```

## Pre-requisitos

- Docker e Docker Compose
- Node.js 22+ para desenvolvimento frontend local
- Java 21 e Maven para desenvolvimento backend local
- PostgreSQL 17 se rodar sem Docker

## Variaveis de ambiente

Crie um arquivo `.env` na raiz a partir de `.env.example`.

```env
JWT_SECRET=change-me-use-a-long-random-secret-with-at-least-32-characters
JWT_EXPIRATION=86400000
ADMIN_EMAIL=admin@garageos.local
ADMIN_PASSWORD=change-me
ADMIN_NAME=Administrador
ADMIN_PHONE=11999999999
```

O backend tambem aceita:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/system_oficina
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Nunca publique um `.env` real no GitHub.

## Executar com Docker

### Producao/local simples

```bash
docker-compose up --build
```

URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html

### Desenvolvimento com hot reload

```bash
docker-compose -f compose.dev.yml up --build
```

URLs:

- Frontend Vite: http://localhost:3000
- Backend Spring Boot: http://localhost:8080
- PostgreSQL: localhost:5432

Para parar sem apagar dados:

```bash
docker-compose -f compose.dev.yml down
```

Evite `down -v` se quiser preservar o banco.

## Executar localmente sem Docker

### Backend

```bash
cd backend
mvn spring-boot:run
```

Configure as variaveis `SPRING_DATASOURCE_*`, `JWT_SECRET` e credenciais do admin antes de iniciar.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Por padrao, o frontend usa `VITE_API_URL` ou `http://localhost:8080`.

## Testes e qualidade

### Backend

```bash
cd backend
mvn test
```

### Frontend

```bash
cd frontend
npm run lint
npm test
npm run build
```

## Banco de dados

O projeto usa Hibernate com `spring.jpa.hibernate.ddl-auto=update` e possui um script SQL de apoio em:

```text
backend/database/distribuidora_mvp.sql
```

Para um deploy real, recomenda-se evoluir para migrations versionadas, como Flyway ou Liquibase.

## Seguranca

- Senhas sao armazenadas com BCrypt
- JWT e assinado por segredo configurado via ambiente
- CORS e configuravel por `app.cors.allowed-origins` / `APP_CORS_ALLOWED_ORIGINS`
- Swagger fica publico no ambiente atual para facilitar avaliacao do portfolio
- Regras de permissao sao aplicadas no Spring Security e tambem no frontend

## Usuario inicial

O usuario admin inicial e criado somente quando `ADMIN_EMAIL` e `ADMIN_PASSWORD` estiverem configurados. Altere a senha antes de qualquer publicacao real.

## Licenca

Este projeto esta sob a licenca MIT. Veja [LICENSE](LICENSE).

## Autor

Erick Sousa

GitHub: https://github.com/erickdsr
