# oficina-system
Sistema completo para gerenciamento de oficinas mecânicas.

# System Oficina — Distribuidora de Peças Automotivas

> Sistema de gestão backend para distribuidoras de peças automotivas, desenvolvido com Java, Spring Boot e PostgreSQL. Projeto de portfólio com arquitetura em camadas, autenticação JWT e controle de estoque automatizado.

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [Autenticação e Segurança](#autenticação-e-segurança)
- [Endpoints da API](#endpoints-da-api)
- [Como Executar](#como-executar)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Documentação](#documentação)

---

## Sobre o Projeto

O **System Oficina** é um sistema de gestão desenvolvido para distribuidoras de peças automotivas. O sistema permite gerenciar o ciclo completo do negócio — desde o cadastro de produtos e fornecedores até o registro de compras e vendas, com controle automático de estoque e histórico de movimentações.

O projeto foi desenvolvido com foco em boas práticas de desenvolvimento backend, incluindo arquitetura em camadas, separação de responsabilidades, validação de dados, tratamento de erros e documentação da API.

---

## Tecnologias

| Tecnologia | Versão | Uso |
|---|---|---|
| Java | 25 LTS | Linguagem principal |
| Spring Boot | 3.5.14 | Framework principal |
| Spring Security | 3.x | Autenticação e autorização |
| Spring Data JPA | 3.x | ORM e persistência |
| PostgreSQL | 17 | Banco de dados |
| Hibernate | 6.x | Mapeamento objeto-relacional |
| JJWT | 0.11.5 | Geração e validação de tokens JWT |
| Lombok | 1.18.x | Redução de código boilerplate |
| Swagger/OpenAPI | 2.3.0 | Documentação da API |
| Maven | 3.x | Gerenciador de dependências |
| Bean Validation | 3.x | Validação de dados de entrada |

---

## Arquitetura

O projeto segue a **Arquitetura em Camadas (Layered Architecture)** com separação clara de responsabilidades:

```
┌─────────────────────────────────────┐
│           Frontend / Cliente        │
└─────────────────┬───────────────────┘
                  │ HTTP / JSON
┌─────────────────▼───────────────────┐
│            Controller               │  → Recebe requisições, valida entrada
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│              Service                │  → Regras de negócio
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│            Repository               │  → Acesso ao banco de dados
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│            PostgreSQL               │  → Persistência dos dados
└─────────────────────────────────────┘
```

### Princípios aplicados

- **SOLID** — cada classe tem responsabilidade única, dependências por abstração
- **DRY** — lógica reutilizável centralizada (ex: `registerMovement`)
- **Separação de camadas** — controller, service, repository e entity independentes
- **DTOs** — nunca expõe entities diretamente na API
- **Padrão de conversão** — `fromEntity()` e `toEntity()` em cada módulo

---

## Funcionalidades

### Autenticação e Controle de Acesso
- Login com email e senha via JWT
- Token Bearer com expiração configurável
- Controle de acesso por roles (admin, gerente, vendedor, estoquista)
- Senhas criptografadas com BCrypt
- Filtro JWT interceptando todas as requisições protegidas

### Gestão de Funcionários
- CRUD completo de funcionários
- Vinculação de roles por funcionário
- Ativação e inativação de cadastros
- Senha criptografada com BCrypt

### Gestão de Clientes
- CRUD completo de clientes
- Suporte a pessoa física (CPF) e jurídica (CNPJ)
- Validação de documento único
- Filtro por status (ativo/inativo)

### Gestão de Fornecedores
- CRUD completo de fornecedores
- Validação de CNPJ único
- Vinculação com produtos

### Gestão de Produtos
- CRUD completo de peças automotivas
- Categorização por tipo (Freio, Motor, Suspensão, etc.)
- Código de peça (`part_number`) e código de barras
- Preço de custo e preço de venda separados
- Unidade de medida: unidade, caixa ou kit

### Gestão de Estoque
- Controle de quantidade atual por produto
- Quantidade mínima configurável por produto
- **Alerta de estoque baixo** — lista produtos abaixo do mínimo
- Histórico completo de movimentações (entrada, saída, ajuste)
- Localização física da peça no depósito

### Gestão de Compras
- Registro de compras vinculadas a fornecedores
- Múltiplos itens por compra
- Fluxo de status: pendente → recebida → cancelada
- **Entrada automática no estoque** ao confirmar o recebimento
- Histórico de movimentação gerado automaticamente

### Gestão de Vendas
- Registro de vendas vinculadas a clientes
- Múltiplos itens por venda
- Múltiplas formas de pagamento por venda (dinheiro, PIX, cartão, boleto, fiado)
- Desconto por item e desconto geral
- Fluxo de status: pendente → finalizada → cancelada
- **Saída automática do estoque** ao finalizar a venda
- **Validação de estoque insuficiente** antes de finalizar

---

## Estrutura do Projeto

```
src/main/java/com/distribuidora/system_oficina/
│
├── auth/
│   ├── controller/
│   │   └── AuthController.java
│   ├── dto/
│   │   ├── LoginRequestDTO.java
│   │   └── LoginResponseDTO.java
│   └── service/
│       └── AuthService.java
│
├── category/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── client/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── employee/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── product/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   │   ├── Product.java
│   │   └── Unit.java          ← Enum: UN, CX, KT
│   ├── repository/
│   └── service/
│
├── purchase/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   │   ├── Purchase.java
│   │   ├── PurchaseItem.java
│   │   └── Status.java        ← Enum: PENDENTE, RECEBIDA, CANCELADA
│   ├── repository/
│   └── service/
│
├── role/
│   ├── entity/
│   └── repository/
│
├── sale/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   │   ├── Sale.java
│   │   ├── SaleItem.java
│   │   └── SalePayment.java
│   ├── repository/
│   └── service/
│
├── stock/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   │   ├── Stock.java
│   │   ├── StockMovement.java
│   │   └── StockMovementType.java  ← Enum: ENTRADA, SAIDA, AJUSTE
│   ├── repository/
│   └── service/
│
├── supplier/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── paymentmethod/
│   ├── entity/
│   └── repository/
│
├── config/
│   └── SecurityConfig.java
│
├── security/
│   ├── JwtService.java
│   ├── JwtFilter.java
│   └── UserDetailsServiceImpl.java
│
└── SystemOficinaApplication.java
```

---

## Banco de Dados

### Modelo de dados — 14 tabelas

```
roles ──────────────────── employees
                               │
              ┌────────────────┼────────────────┐
              │                │                │
            sales          purchases      stock_movements
              │                │                │
      ┌───────┴──────┐    ┌────┴─────┐          │
      │              │    │          │           │
   clients     sale_items purchase_items      products
                    │          │                │
             sale_payments   products      ┌────┴────┐
                    │                      │         │
            payment_methods           categories  suppliers
                                                    │
                                                  stock
```

### Tabelas e responsabilidades

| Tabela | Descrição |
|---|---|
| `roles` | Perfis de acesso (admin, gerente, vendedor, estoquista) |
| `employees` | Funcionários — usuários do sistema |
| `clients` | Clientes da distribuidora (PF e PJ) |
| `suppliers` | Fornecedores de peças |
| `categories` | Categorias de produtos |
| `products` | Catálogo de peças automotivas |
| `stock` | Quantidade atual de cada produto |
| `stock_movements` | Histórico de todas as movimentações |
| `payment_methods` | Formas de pagamento disponíveis |
| `sales` | Cabeçalho das vendas |
| `sale_items` | Itens de cada venda |
| `sale_payments` | Pagamentos de cada venda |
| `purchases` | Cabeçalho das compras |
| `purchase_items` | Itens de cada compra |

### Dados iniciais (seed)

```sql
-- Roles
admin, gerente, vendedor, estoquista

-- Categorias
Freio, Motor, Suspensão, Elétrica, Filtros, Correia, Embreagem, Escapamento

-- Formas de pagamento
Dinheiro, PIX, Cartão de Débito, Cartão de Crédito, Boleto, Fiado
```

---

## Autenticação e Segurança

### Fluxo de autenticação

```
1. POST /auth/login com email e senha
2. Spring Security valida as credenciais via UserDetailsService
3. BCrypt compara a senha com o hash no banco
4. JwtService gera um token assinado com HS256
5. Token retornado no LoginResponseDTO
6. Cliente envia o token no header de toda requisição:
   Authorization: Bearer {token}
7. JwtFilter intercepta e valida o token
8. SecurityContext autentica o usuário
9. Requisição chega ao controller
```

### Rotas liberadas (sem autenticação)

```
POST /auth/login
GET  /swagger-ui/**
GET  /v3/api-docs/**
```

### Rotas protegidas

Todas as outras rotas exigem token JWT válido.

---

## Endpoints da API

### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Autenticação e geração de token |

### Employees
| Método | Rota | Descrição |
|---|---|---|
| GET | `/employees` | Listar funcionários |
| GET | `/employees/{id}` | Buscar por ID |
| POST | `/employees` | Criar funcionário |
| PUT | `/employees/{id}` | Atualizar funcionário |
| DELETE | `/employees/{id}` | Deletar funcionário |

### Clients
| Método | Rota | Descrição |
|---|---|---|
| GET | `/clients` | Listar clientes |
| GET | `/clients/{id}` | Buscar por ID |
| POST | `/clients` | Criar cliente |
| PUT | `/clients/{id}` | Atualizar cliente |
| DELETE | `/clients/{id}` | Deletar cliente |

### Suppliers
| Método | Rota | Descrição |
|---|---|---|
| GET | `/suppliers` | Listar fornecedores |
| GET | `/suppliers/{id}` | Buscar por ID |
| POST | `/suppliers` | Criar fornecedor |
| PUT | `/suppliers/{id}` | Atualizar fornecedor |
| DELETE | `/suppliers/{id}` | Deletar fornecedor |

### Categories
| Método | Rota | Descrição |
|---|---|---|
| GET | `/categories` | Listar categorias |
| GET | `/categories/{id}` | Buscar por ID |
| POST | `/categories` | Criar categoria |
| PUT | `/categories/{id}` | Atualizar categoria |
| DELETE | `/categories/{id}` | Deletar categoria |

### Products
| Método | Rota | Descrição |
|---|---|---|
| GET | `/products` | Listar produtos |
| GET | `/products/{id}` | Buscar por ID |
| POST | `/products` | Criar produto |
| PUT | `/products/{id}` | Atualizar produto |
| DELETE | `/products/{id}` | Deletar produto |

### Stock
| Método | Rota | Descrição |
|---|---|---|
| GET | `/stock` | Listar todo o estoque |
| GET | `/stock/{id}` | Buscar estoque por ID |
| GET | `/stock/low` | Produtos com estoque baixo |
| PATCH | `/stock/{id}` | Ajuste manual de estoque |
| GET | `/stock/movements` | Histórico geral de movimentações |
| GET | `/stock/movements/{productId}` | Histórico de um produto |

### Purchases
| Método | Rota | Descrição |
|---|---|---|
| GET | `/purchases` | Listar compras |
| GET | `/purchases/{id}` | Buscar compra por ID |
| POST | `/purchases` | Registrar nova compra |
| PATCH | `/purchases/{id}/confirm` | Confirmar recebimento → entrada no estoque |
| PATCH | `/purchases/{id}/cancel` | Cancelar compra |

### Sales
| Método | Rota | Descrição |
|---|---|---|
| GET | `/sales` | Listar vendas |
| GET | `/sales/{id}` | Buscar venda por ID |
| POST | `/sales` | Registrar nova venda |
| PATCH | `/sales/{id}/finalize` | Finalizar venda → saída do estoque |
| PATCH | `/sales/{id}/cancel` | Cancelar venda |

---

## Como Executar

### Pré-requisitos

```
Java 25+
Maven 3.x
PostgreSQL 17+
```

### 1. Clone o repositório

```bash
git clone https://github.com/erickdsr/oficina-system.git
cd oficina-system
```

### 2. Crie o banco de dados

```sql
CREATE DATABASE system_oficina;
```

### 3. Execute o script SQL

```bash
psql -U postgres -d system_oficina -f database/distribuidora_mvp.sql
```

### 4. Configure as variáveis de ambiente

Edite o arquivo `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/system_oficina
spring.datasource.username=seu_usuario
spring.datasource.password=sua_senha
jwt.secret=sua_chave_secreta
jwt.expiration=86400000
```

### 5. Execute o projeto

```bash
./mvnw spring-boot:run
```

### 6. Acesse a documentação

```
http://localhost:8080/swagger-ui/index.html
```

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `spring.datasource.url` | URL de conexão com o banco | `jdbc:postgresql://localhost:5432/system_oficina` |
| `spring.datasource.username` | Usuário do PostgreSQL | `postgres` |
| `spring.datasource.password` | Senha do PostgreSQL | `senha123` |
| `jwt.secret` | Chave secreta para assinar o JWT | string aleatória de 32+ caracteres |
| `jwt.expiration` | Tempo de expiração do token em ms | `86400000` (24 horas) |
| `server.port` | Porta do servidor | `8080` |

---

## Documentação

A API é documentada com **Swagger/OpenAPI 3**. Com o projeto rodando, acesse:

```
http://localhost:8080/swagger-ui/index.html
```

Todos os endpoints têm:
- Descrição do que fazem
- Exemplos de entrada e saída
- Códigos de resposta documentados

---

## Autor

**Erick Sousa**

Estudante de Análise e Desenvolvimento de Sistemas na UNIASSELVI, com foco em desenvolvimento backend Java.

[![GitHub](https://img.shields.io/badge/GitHub-erickdsr-black?style=flat&logo=github)](https://github.com/erickdsr)

---

## 📄 Licença

Este projeto está sob a licença MIT.
