from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

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

# Configuração do SQLAlchemy
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ProdutoTable(Base):
    __tablename__ = "produtos"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(100), nullable=False)
    descricao = Column(String(500), nullable=False)
    preco = Column(Float, nullable=False)
    categoria = Column(String(50), nullable=False)
    vendedor = Column(String(50), nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)

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

