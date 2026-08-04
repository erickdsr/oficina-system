<div align="center">

# GarageOS

### ERP web para gestão de distribuidoras e oficinas automotivas

Sistema full stack para gerenciamento de clientes, fornecedores, produtos, estoque, compras, vendas, funcionários e movimentações operacionais.

![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/Licença-MIT-green?style=for-the-badge)

</div>

---

## Sobre o projeto

O **GarageOS** é um ERP web desenvolvido para centralizar as principais operações de uma distribuidora ou oficina automotiva.

O sistema permite controlar cadastros, produtos, estoque, compras, vendas, funcionários, formas de pagamento e movimentações operacionais por meio de uma interface administrativa responsiva.

O projeto foi desenvolvido como portfólio full stack, com foco em:

- arquitetura organizada por domínio;
- separação de responsabilidades;
- autenticação e autorização;
- segurança de APIs REST;
- regras de negócio transacionais;
- persistência relacional;
- integração entre frontend e backend;
- conteinerização com Docker;
- experiência de uso em sistemas administrativos.

---

## Status

**Versão atual:** `v1.0.0`

O GarageOS encontra-se funcional e com os principais módulos concluídos.

A versão atual contempla:

- autenticação;
- controle de permissões;
- cadastros administrativos;
- compras;
- vendas;
- estoque;
- movimentações;
- dashboard;
- documentação da API;
- execução com Docker.

---

## Principais funcionalidades

### Autenticação e segurança

- Login com e-mail e senha;
- autenticação baseada em JWT;
- senhas criptografadas com BCrypt;
- expiração configurável do token;
- proteção de rotas no backend;
- proteção de páginas e ações no frontend;
- controle de acesso baseado em perfis;
- tratamento de sessões expiradas;
- configuração de CORS por variável de ambiente.

### Dashboard

- Métricas operacionais;
- vendas do dia;
- vendas do mês;
- ticket médio;
- quantidade de clientes cadastrados;
- compras realizadas no período;
- produtos com estoque baixo;
- produtos inativos;
- vendas pendentes;
- gráficos de desempenho;
- últimas vendas;
- alertas operacionais;
- atualização manual dos dados.

### Clientes

- Cadastro de pessoa física e jurídica;
- CPF e CNPJ;
- telefone e e-mail;
- endereço completo;
- filtros por estado e cidade;
- visualização detalhada;
- edição de dados;
- ativação e inativação;
- validações de campos;
- tratamento de registros relacionados.

### Fornecedores

- Cadastro e atualização de fornecedores;
- informações de contato;
- endereço;
- consulta detalhada;
- ativação e inativação;
- associação com produtos e compras.

### Funcionários

- Cadastro de funcionários;
- vinculação a perfis de acesso;
- edição e visualização;
- ativação e inativação;
- avatar com iniciais;
- gerenciamento de permissões conforme o cargo.

### Categorias

- Cadastro de categorias de produtos;
- edição e consulta;
- controle de status;
- exclusão ou desativação segura quando houver dependências.

### Produtos

- Cadastro de produtos e peças;
- número da peça;
- descrição;
- categoria;
- fornecedor;
- unidade de medida;
- preço de custo;
- preço de venda;
- controle de status;
- vínculo automático com estoque;
- consulta e edição;
- validações de valores e relacionamentos.

### Estoque

- Controle individual por produto;
- quantidade disponível;
- estoque mínimo;
- identificação de estoque baixo;
- entradas e saídas automáticas;
- histórico de alterações;
- prevenção de operações inconsistentes.

### Movimentações de estoque

- Registro de entradas;
- registro de saídas;
- histórico de movimentações;
- identificação da origem da operação;
- associação com compras e vendas;
- consulta por tipo e período;
- reversão de movimentações quando aplicável.

### Compras

- Cadastro de compras;
- vinculação com fornecedor;
- inclusão de múltiplos itens;
- cálculo automático dos totais;
- controle de status;
- recebimento da compra;
- entrada automática no estoque;
- cancelamento;
- reversão segura de estoque;
- prevenção de recebimento duplicado;
- consulta detalhada.

### Vendas

- Cadastro de vendas;
- vinculação com cliente;
- inclusão de múltiplos produtos;
- quantidade e preço por item;
- aplicação de descontos;
- seleção da forma de pagamento;
- cálculo automático do total;
- controle de status;
- finalização da venda;
- baixa automática do estoque;
- cancelamento;
- reversão segura das movimentações;
- prevenção de finalização duplicada;
- validação de estoque disponível.

### Formas de pagamento

- Cadastro de formas de pagamento;
- associação com vendas;
- controle de status;
- consulta e edição.

### Exclusão e desativação segura

O sistema avalia relacionamentos antes de remover registros.

Dependendo da entidade e das dependências existentes, o GarageOS pode:

- realizar a exclusão;
- impedir a operação;
- desativar o registro;
- preservar o histórico relacionado.

---

## Perfis de acesso

O sistema possui controle de acesso baseado em perfis.

| Perfil | Responsabilidade principal |
|---|---|
| `ADMIN` | Acesso administrativo completo |
| `MANAGER` | Gestão operacional e acompanhamento do sistema |
| `SALESPERSON` | Operações relacionadas a clientes e vendas |
| `STOCK` | Produtos, estoque e movimentações |
| `BUYER` | Fornecedores e compras |

As permissões são validadas no backend pelo Spring Security. O frontend também utiliza as permissões para controlar a exibição de páginas, botões e ações.

> A segurança efetiva permanece no backend. A ocultação de elementos no frontend serve apenas como apoio à experiência do usuário.

---

## Tecnologias

### Backend

- Java 21;
- Spring Boot 3.5.x;
- Spring Web;
- Spring Security;
- Spring Data JPA;
- Hibernate;
- PostgreSQL;
- JWT com JJWT;
- BCrypt;
- Bean Validation;
- Swagger/OpenAPI;
- JUnit 5;
- Mockito;
- Maven.

### Frontend

- React;
- TypeScript;
- Vite;
- React Router;
- Axios;
- Recharts;
- Lucide React;
- Sonner;
- CSS responsivo;
- componentes reutilizáveis;
- Context API;
- hooks personalizados.

### Infraestrutura

- Docker;
- Docker Compose;
- PostgreSQL 17;
- Nginx para servir o frontend;
- variáveis de ambiente;
- healthchecks;
- volumes persistentes.

---

## Arquitetura

O backend está organizado por domínio. Cada módulo concentra suas próprias entidades, DTOs, controllers, services, repositories e regras de negócio.

```text
garageos/
├── backend/
│   ├── database/
│   │   └── distribuidora_mvp.sql
│   │
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── .../
│   │   │   │       ├── auth/
│   │   │   │       ├── category/
│   │   │   │       ├── client/
│   │   │   │       ├── config/
│   │   │   │       ├── deletion/
│   │   │   │       ├── employee/
│   │   │   │       ├── paymentMethod/
│   │   │   │       ├── product/
│   │   │   │       ├── purchase/
│   │   │   │       ├── role/
│   │   │   │       ├── sale/
│   │   │   │       ├── security/
│   │   │   │       ├── stock/
│   │   │   │       └── supplier/
│   │   │   │
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   │
│   │   └── test/
│   │
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── tests/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── compose.dev.yml
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
