# Guia Completo: Azure SQL Server + Migração CampusTrade

**Problema:** Ambiente acadêmico com firewall restrito  
**Solução:** SQLite local + Azure SQL em produção + código híbrido  
**Resultado:** Desenvolvimento local sem problemas + produção na nuvem

---

## Índice
1. [Criar Azure SQL Server](#1-criar-azure-sql-server)
2. [Configurar Acesso (Apenas para Azure)](#2-configurar-acesso-apenas-para-azure)  
3. [Solução para Ambiente Acadêmico](#3-solução-para-ambiente-acadêmico)
4. [Migração do Código](#4-migração-do-código)
5. [Testes e Deploy](#5-testes-e-deploy)

---

## 1. Criar Azure SQL Server

### Passo 1.1: Criar SQL Server via Portal Azure

1. **Acesse o Portal Azure:** https://portal.azure.com
2. **Clique em "Create a resource"**
3. **Procure por "SQL Database"** e selecione
4. **Clique em "Create"**

### Passo 1.2: Configurar o Servidor

**Aba "Basics":**
```
Subscription: Azure for Students
Resource Group: rg-campustrade (mesmo do App Service)
Database name: campustrade
Server: Create new
```

**Configuração do Servidor:**
```
Server name: campustrade-sql-server (deve ser único)
Location: Brazil South
Authentication method: Use SQL authentication
Server admin login: campusadmin
Password: CampusTrade@2024 (use uma senha forte)
```

**Configuração do Database:**
```
Compute + storage: Configure database
Service tier: DTU-based → Basic
DTU: 5 DTUs (suficiente para desenvolvimento)
Storage: 2 GB (padrão do Basic)
Backup storage redundancy: Locally-redundant backup storage
```

> Tier Basic: Nível gratuito/mais barato, ideal para projetos acadêmicos

### Passo 1.3: Configuração de Rede

**Aba "Networking":**
```
Connectivity method: Public endpoint
Firewall rules:
☑️ Allow Azure services and resources to access this server
☑️ Add current client IP address
```

### Passo 1.4: Finalizar Criação

1. **Clique "Review + create"**
2. **Aguarde a criação (5-10 minutos)**
3. **Anote as informações:**
   - Server name: `campustrade-sql-server.database.windows.net`
   - Database: `campustrade`
   - Username: `campusadmin`
   - Password: `CampusTrade@2024`

---

## 2. Configurar Acesso (Apenas para Azure)

### Configuração Automática
Durante a criação do SQL Database, certifique-se que está marcado:
```
☑️ Allow Azure services and resources to access this server
```

**Isso é suficiente!** O App Service conseguirá conectar automaticamente sem necessidade de configurações adicionais de firewall.

---

## 3. Solução para Ambiente Acadêmico

### Configuração Híbrida

**Estratégia:**
- **Local:** SQLite (sem necessidade de rede)
- **Azure:** SQL Server (apenas em produção)
- **Código:** Detecta ambiente automaticamente

**Funcionamento:**
O sistema identifica automaticamente onde está executando e usa o banco apropriado para cada ambiente.

---

## 4. Migração do Código

### Passo 4.1: Atualizar requirements.txt

```txt
fastapi
uvicorn[standard]
sqlalchemy
python-dotenv
# Para desenvolvimento local (SQLite)
# Para Azure SQL Server
pyodbc
```

**Conceitos das Bibliotecas:**

- **SQLAlchemy:** ORM (Object-Relational Mapping) que permite trabalhar com bancos de dados usando objetos Python ao invés de SQL puro
- **python-dotenv:** Carrega variáveis de ambiente de arquivos .env para configuração
- **pyodbc:** Driver para conectar Python com SQL Server/Azure SQL

### Passo 4.2: Criar database.py (Híbrido)

**Conceito: Configuração Híbrida de Banco de Dados**

Primeiro, vamos entender o que é um ORM (Object-Relational Mapping). O SQLAlchemy é um ORM que permite trabalhar com bancos de dados usando objetos Python ao invés de escrever SQL diretamente. Isso torna o código mais legível e portável entre diferentes tipos de banco.

#### Parte 1: Imports e Detecção de Ambiente

```python
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()
```

**Explicação dos imports:**
- `create_engine`: Estabelece conexão com o banco de dados
- `declarative_base`: Cria classe base para definir modelos/tabelas
- `sessionmaker`: Factory para criar sessões de banco (transações)
- `load_dotenv()`: Carrega variáveis de ambiente do arquivo .env

#### Parte 2: Função de Detecção de Ambiente

```python
def get_database_url():
    """Retorna URL do banco baseado no ambiente"""
    
    # Se está no Azure (produção)
    if os.getenv("WEBSITE_INSTANCE_ID"):
        return os.getenv("DATABASE_URL", 
            "mssql+pyodbc://campusadmin:CampusTrade%402024@campustrade-sql-server.database.windows.net/campustrade?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes"
        )
    
    # Se DATABASE_URL está definida (configuração manual)
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    
    # Desenvolvimento local (SQLite)
    return "sqlite:///./campustrade_local.db"

DATABASE_URL = get_database_url()
print(f"Usando banco: {DATABASE_URL.split('@')[0]}@***" if '@' in DATABASE_URL else DATABASE_URL)
```

**Por que esta abordagem funciona:**
- `WEBSITE_INSTANCE_ID` é uma variável automaticamente definida pelo Azure App Service
- No ambiente local (faculdade), usamos SQLite que não precisa de rede
- Em produção (Azure), usamos SQL Server para persistência robusta

#### Parte 3: Configuração do Engine SQLAlchemy

```python
# Configuração do SQLAlchemy
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

**Conceitos importantes:**
- **Engine**: Representa a conexão com o banco de dados
- **Session**: Representa uma "conversa" com o banco (similar a uma transação)
- **check_same_thread=False**: Necessário para SQLite em aplicações web
- **echo=True**: Mostra as queries SQL no console (útil para debug)

#### Parte 4: Definição do Modelo de Dados

```python
class ProdutoTable(Base):
    __tablename__ = "produtos"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(100), nullable=False)
    descricao = Column(String(500), nullable=False)
    preco = Column(Float, nullable=False)
    categoria = Column(String(50), nullable=False)
    vendedor = Column(String(50), nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
```

**Mapeamento Objeto-Relacional:**
- Cada classe Python representa uma tabela no banco
- Cada atributo `Column()` representa uma coluna na tabela
- `primary_key=True`: Define chave primária
- `nullable=False`: Campo obrigatório
- `default=datetime.utcnow`: Valor padrão automático

#### Parte 5: Funções Utilitárias

```python
def create_tables():
    """Cria as tabelas no banco de dados"""
    try:
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas com sucesso!")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")

def get_db():
    """Dependency para sessões do FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Conceito de Dependency Injection:**
- `get_db()` usa `yield` para criar uma sessão por requisição
- O `finally` garante que a conexão seja fechada mesmo se houver erro
- FastAPI gerencia automaticamente o ciclo de vida da sessão

#### Parte 6: População de Dados Iniciais

```python
def populate_initial_data():
    """Popula dados iniciais apenas no ambiente local"""
    if not DATABASE_URL.startswith("sqlite"):
        return
    
    db = SessionLocal()
    try:
        # Verificar se já tem dados
        count = db.query(ProdutoTable).count()
        if count > 0:
            print(f"Banco já possui {count} produtos")
            return
        
        # Dados iniciais para desenvolvimento
        produtos_iniciais = [
            ProdutoTable(
                titulo="Livro de Algoritmos - Thomas Cormen",
                descricao="Livro completo sobre algoritmos e estruturas de dados. Usado mas em ótimo estado.",
                preco=120.00,
                categoria="Livros",
                vendedor="João Silva"
            ),
            ProdutoTable(
                titulo="Calculadora HP 12C",
                descricao="Calculadora financeira em perfeitas condições. Inclui manual e case.",
                preco=180.00,
                categoria="Eletrônicos",
                vendedor="Maria Santos"
            ),
            ProdutoTable(
                titulo="Mesa de Estudos",
                descricao="Mesa de madeira 1,20m x 60cm, perfeita para estudos. Muito conservada.",
                preco=150.00,
                categoria="Móveis",
                vendedor="Pedro Costa"
            )
        ]
        
        db.add_all(produtos_iniciais)
        db.commit()
        print("Dados iniciais criados!")
        
    except Exception as e:
        print(f"Erro ao popular dados: {e}")
    finally:
        db.close()
```

**Ciclo de Vida dos Dados:**
- `db.query().count()`: Executa uma query para contar registros
- `db.add_all()`: Adiciona múltiplos objetos à sessão
- `db.commit()`: Persiste as mudanças no banco
- Dados iniciais só são criados localmente para não interferir com produção

### Passo 4.3: Atualizar models.py

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Modelos Pydantic (mantém os existentes)
class Produto(BaseModel):
    id: Optional[int] = None
    titulo: str
    descricao: str
    preco: float
    categoria: str
    vendedor: str
    data_criacao: Optional[datetime] = None
    
    class Config:
        orm_mode = True  # Para conversão SQLAlchemy -> Pydantic

class ProdutoCreate(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=100, description="Título do produto")
    descricao: str = Field(..., min_length=10, max_length=500, description="Descrição detalhada")
    preco: float = Field(..., gt=0, le=50000, description="Preço em reais (máximo R$ 50.000)")
    categoria: str = Field(..., description="Categoria do produto")
    vendedor: str = Field(..., min_length=2, max_length=50, description="Nome do vendedor")

class ProdutoUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=3, max_length=100)
    descricao: Optional[str] = Field(None, min_length=10, max_length=500)
    preco: Optional[float] = Field(None, gt=0, le=50000)
    categoria: Optional[str] = None
    vendedor: Optional[str] = Field(None, min_length=2, max_length=50)

CATEGORIAS_VALIDAS = ["Livros", "Eletrônicos", "Móveis", "Roupas", "Esportes", "Outros"]
```

**Conceitos Pydantic:**

- **BaseModel:** Classe base para definir estruturas de dados com validação automática
- **Field():** Define validações específicas para cada campo
- **orm_mode = True:** Permite converter objetos SQLAlchemy diretamente para Pydantic
- **Optional:** Indica campos opcionais na estrutura

### Passo 4.4: Atualizar main.py (Nova Versão Completa)

**Conceito: API RESTful com Persistência de Dados**

Agora vamos criar uma API completa que integra o FastAPI com SQLAlchemy. A API seguirá padrões REST e usará dependency injection para gerenciar conexões com banco de dados.

#### Parte 1: Imports e Configuração Inicial

```python
from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, ProdutoTable, create_tables, populate_initial_data
from models import Produto, ProdutoCreate, CATEGORIAS_VALIDAS
from typing import List, Optional
import os

app = FastAPI(
    title="CampusTrade API", 
    version="2.0.0 (SQL)",
    description="Marketplace Universitário com persistência SQL"
)
```

**Dependency Injection no FastAPI:**
- `Depends(get_db)`: FastAPI automaticamente chama `get_db()` para cada requisição
- A sessão é criada, usada e fechada automaticamente
- Permite transações por requisição de forma transparente

#### Parte 2: Evento de Inicialização

```python
@app.on_event("startup")
async def startup_event():
    """Inicializar banco de dados"""
    create_tables()
    populate_initial_data()
    
    # Log do ambiente
    if os.getenv("WEBSITE_INSTANCE_ID"):
        print("Executando no Azure App Service")
    else:
        print("Executando localmente")
```

**Eventos do FastAPI:**
- `on_event("startup")`: Executado uma vez quando a aplicação inicia
- Ideal para configurações que precisam acontecer antes da API aceitar requisições
- Garante que tabelas existam antes de qualquer operação

#### Parte 3: Endpoint de Status

```python
@app.get("/")
def root():
    ambiente = "Azure" if os.getenv("WEBSITE_INSTANCE_ID") else "Local"
    return {
        "message": "CampusTrade API - Marketplace Universitário", 
        "ambiente": ambiente,
        "versao": "2.0.0 (SQL)",
        "banco": "SQL Server" if not os.getenv("DATABASE_URL", "").startswith("sqlite") else "SQLite"
    }
```

**Padrão de Informação de Status:**
- Endpoint útil para verificar se API está online
- Mostra informações do ambiente para debug
- Permite identificar qual banco está sendo usado

#### Parte 4: Operações CRUD - Listagem

```python
@app.get("/produtos", response_model=List[Produto])
def listar_produtos(db: Session = Depends(get_db)):
    """Listar todos os produtos"""
    produtos = db.query(ProdutoTable).order_by(ProdutoTable.data_criacao.desc()).all()
    return produtos
```

**Query Building com SQLAlchemy:**
- `db.query(ProdutoTable)`: Inicia uma consulta na tabela produtos
- `order_by()`: Adiciona ordenação SQL
- `all()`: Executa a query e retorna todos resultados
- `response_model=List[Produto]`: Valida e serializa a resposta

#### Parte 5: Operações CRUD - Criação

```python
@app.post("/produtos", response_model=Produto, status_code=201)
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db)):
    """Criar novo produto"""
    # Validar categoria
    if produto.categoria not in CATEGORIAS_VALIDAS:
        raise HTTPException(
            status_code=422, 
            detail=f"Categoria inválida. Use uma destas: {', '.join(CATEGORIAS_VALIDAS)}"
        )
    
    # Criar produto no banco
    db_produto = ProdutoTable(
        titulo=produto.titulo,
        descricao=produto.descricao,
        preco=produto.preco,
        categoria=produto.categoria,
        vendedor=produto.vendedor
    )
    
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto
```

**Ciclo de Persistência:**
- `ProdutoTable(...)`: Cria objeto Python (ainda não no banco)
- `db.add()`: Adiciona objeto à sessão (preparação)
- `db.commit()`: Persiste mudanças no banco (INSERT SQL)
- `db.refresh()`: Recarrega objeto com dados do banco (ID, timestamps)

#### Parte 6: Operações CRUD - Busca por ID

```python
@app.get("/produtos/{produto_id}", response_model=Produto)
def buscar_produto(produto_id: int, db: Session = Depends(get_db)):
    """Buscar produto por ID"""
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto
```

**Filtragem e Tratamento de Erros:**
- `filter()`: Adiciona condição WHERE à query
- `first()`: Retorna primeiro resultado ou None
- `HTTPException`: Padrão FastAPI para retornar erros HTTP

#### Parte 7: Operações CRUD - Atualização

```python
@app.put("/produtos/{produto_id}", response_model=Produto)
def atualizar_produto(produto_id: int, produto_atualizado: ProdutoCreate, db: Session = Depends(get_db)):
    """Atualizar produto completo"""
    # Buscar produto existente
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Validar categoria
    if produto_atualizado.categoria not in CATEGORIAS_VALIDAS:
        raise HTTPException(
            status_code=422, 
            detail=f"Categoria inválida. Use uma destas: {', '.join(CATEGORIAS_VALIDAS)}"
        )
    
    # Atualizar campos
    produto.titulo = produto_atualizado.titulo
    produto.descricao = produto_atualizado.descricao
    produto.preco = produto_atualizado.preco
    produto.categoria = produto_atualizado.categoria
    produto.vendedor = produto_atualizado.vendedor
    
    db.commit()
    db.refresh(produto)
    return produto
```

**Padrão de Atualização:**
- Buscar objeto existente primeiro
- Modificar atributos do objeto Python
- `commit()` persiste as mudanças (UPDATE SQL)
- Não precisa `add()` pois objeto já está na sessão

#### Parte 8: Operações CRUD - Remoção

```python
@app.delete("/produtos/{produto_id}")
def deletar_produto(produto_id: int, db: Session = Depends(get_db)):
    """Remover produto"""
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db.delete(produto)
    db.commit()
    return {"message": "Produto removido com sucesso"}
```

**Operação de Deleção:**
- `db.delete()`: Marca objeto para remoção
- `commit()`: Executa DELETE SQL
- Retorna confirmação em formato JSON

#### Parte 9: Busca Avançada com Filtros

```python
@app.get("/produtos/buscar", response_model=List[Produto])
def buscar_produtos(
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    termo: Optional[str] = Query(None, min_length=2, description="Buscar no título ou descrição"),
    preco_min: Optional[float] = Query(None, ge=0, description="Preço mínimo"),
    preco_max: Optional[float] = Query(None, ge=0, description="Preço máximo"),
    db: Session = Depends(get_db)
):
    """Buscar produtos com filtros"""
    query = db.query(ProdutoTable)
    
    # Filtrar por categoria
    if categoria:
        if categoria not in CATEGORIAS_VALIDAS:
            raise HTTPException(
                status_code=422, 
                detail=f"Categoria inválida. Use uma destas: {', '.join(CATEGORIAS_VALIDAS)}"
            )
        query = query.filter(ProdutoTable.categoria == categoria)
    
    # Filtrar por termo de busca
    if termo:
        query = query.filter(
            (ProdutoTable.titulo.contains(termo)) | 
            (ProdutoTable.descricao.contains(termo))
        )
    
    # Filtrar por preço
    if preco_min is not None:
        query = query.filter(ProdutoTable.preco >= preco_min)
    
    if preco_max is not None:
        query = query.filter(ProdutoTable.preco <= preco_max)
    
    return query.order_by(ProdutoTable.data_criacao.desc()).all()
```

**Query Building Dinâmica:**
- Query é construída incrementalmente
- `contains()`: LIKE SQL para busca parcial
- `|`: Operador OR em SQLAlchemy
- `is not None`: Diferencia None de 0 em filtros numéricos

#### Parte 10: Endpoints Utilitários

```python
@app.get("/categorias")
def listar_categorias():
    """Listar categorias disponíveis"""
    return {
        "categorias": CATEGORIAS_VALIDAS,
        "total": len(CATEGORIAS_VALIDAS)
    }

@app.get("/produtos/estatisticas")
def estatisticas_produtos(db: Session = Depends(get_db)):
    """Estatísticas dos produtos"""
    # Total de produtos
    total = db.query(ProdutoTable).count()
    
    if total == 0:
        return {
            "total_produtos": 0,
            "preco_medio": 0,
            "categoria_mais_popular": None,
            "produtos_por_categoria": {}
        }
    
    # Preço médio
    preco_medio = db.query(func.avg(ProdutoTable.preco)).scalar() or 0
    
    # Produtos por categoria
    categorias = db.query(
        ProdutoTable.categoria, 
        func.count(ProdutoTable.id).label('count')
    ).group_by(ProdutoTable.categoria).all()
    
    produtos_por_categoria = {cat.categoria: cat.count for cat in categorias}
    categoria_mais_popular = max(produtos_por_categoria, key=produtos_por_categoria.get) if produtos_por_categoria else None
    
    return {
        "total_produtos": total,
        "preco_medio": round(float(preco_medio), 2),
        "categoria_mais_popular": categoria_mais_popular,
        "produtos_por_categoria": produtos_por_categoria
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Funções Agregadas SQL:**
- `func.avg()`: Função AVG do SQL via SQLAlchemy
- `func.count()`: Função COUNT com label personalizado
- `group_by()`: Agrupamento para estatísticas por categoria
- `scalar()`: Extrai valor único de resultado agregado
        ProdutoTable.categoria, 
        func.count(ProdutoTable.id).label('count')
    ).group_by(ProdutoTable.categoria).all()
    
    produtos_por_categoria = {cat.categoria: cat.count for cat in categorias}
    categoria_mais_popular = max(produtos_por_categoria, key=produtos_por_categoria.get) if produtos_por_categoria else None
    
    return {
        "total_produtos": total,
        "preco_medio": round(float(preco_medio), 2),
        "categoria_mais_popular": categoria_mais_popular,
        "produtos_por_categoria": produtos_por_categoria
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Funções Agregadas SQL:**
- `func.avg()`: Função AVG do SQL via SQLAlchemy
- `func.count()`: Função COUNT com label personalizado
- `group_by()`: Agrupamento para estatísticas por categoria
- `scalar()`: Extrai valor único de resultado agregadoProdutoTable.categoria, 
        func.count(ProdutoTable.id).label('count')
    ).group_by(ProdutoTable.categoria).all()
    
    produtos_por_categoria = {cat.categoria: cat.count for cat in categorias}
    categoria_mais_popular = max(produtos_por_categoria, key=produtos_por_categoria.get) if produtos_por_categoria else None
    
    return {
        "total_produtos": total,
        "preco_medio": round(float(preco_medio), 2),
        "categoria_mais_popular": categoria_mais_popular,
        "produtos_por_categoria": produtos_por_categoria
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Conceitos FastAPI com SQLAlchemy:**

- **Depends(get_db):** Injeção de dependência para obter sessão do banco
- **db.query():** Constrói consultas SQL usando objetos Python
- **filter():** Adiciona condições WHERE à consulta
- **order_by():** Define ordenação dos resultados
- **func.avg(), func.count():** Funções agregadas SQL
- **db.add(), db.commit(), db.refresh():** Operações de persistência

### Passo 4.5: Criar .env para configurações

```env
# Para forçar uso do Azure SQL mesmo localmente (apenas para teste)
# DATABASE_URL=mssql+pyodbc://campusadmin:CampusTrade%402024@campustrade-sql-server.database.windows.net/campustrade?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes

# Deixe comentado para usar SQLite localmente
```

---

## 5. Testes e Deploy

### Passo 5.1: Testar Localmente (SQLite)

```bash
# 1. Instalar dependências
pip install -r requirements.txt

# 2. Executar aplicação
uvicorn main:app --reload

# 3. Verificar
# - Acesse: http://localhost:8000
# - Deve mostrar: "banco": "SQLite"
# - Arquivo campustrade_local.db será criado
```

### Passo 5.2: Configurar Azure App Service

**No Portal Azure:**
1. **Vá para seu App Service**
2. **Configuration → Application Settings**
3. **Adicione:**

```
Name: DATABASE_URL
Value: mssql+pyodbc://campusadmin:CampusTrade%402024@campustrade-sql-server.database.windows.net/campustrade?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes
```

### Passo 5.3: Deploy

```bash
# Via VS Code
# 1. Ctrl+Shift+P
# 2. Azure App Service: Deploy to Web App
# 3. Selecionar sua aplicação
# 4. Aguardar deploy
```

### Passo 5.4: Verificar Deploy

1. **Acesse sua URL do Azure**
2. **Deve mostrar:** `"banco": "SQL Server"`
3. **Teste endpoints:** `/produtos`, `/categorias`

---

## Resumo da Solução

### Vantagens desta Abordagem:

1. **Desenvolvimento sem problemas:** SQLite local
2. **Produção robusta:** Azure SQL Server  
3. **Código único:** Detecta ambiente automaticamente
4. **Fácil teste:** Dados iniciais criados automaticamente
5. **Compatível com firewall:** Não depende de conexão externa local

### Fluxo de Trabalho:

```
Desenvolvimento Local (Faculdade):
├── SQLite (campustrade_local.db)
├── Dados de teste automáticos
├── Sem necessidade de internet
└── Funciona mesmo com firewall restrito

Deploy Azure:
├── Detecta ambiente automaticamente  
├── Conecta no Azure SQL Server
├── Mesma API, banco diferente
└── Dados persistem entre deploys
```

### Resultado Final:

- **Localmente:** `"banco": "SQLite"` 
- **Azure:** `"banco": "SQL Server"`
- **Código:** Idêntico nos dois ambientes
- **Dados:** Persistem em produção, teste local

**Perfeito para ambiente acadêmico com restrições de rede!**