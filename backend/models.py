from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

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

# Categorias permitidas
CATEGORIAS_VALIDAS = ["Livros", "Eletrônicos", "Móveis", "Roupas", "Esportes", "Outros"]
