from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional
import os
from fastapi.middleware.cors import CORSMiddleware

from models import Produto, ProdutoCreate, ProdutoUpdate, CATEGORIAS_VALIDAS
from database import get_db, ProdutoTable, create_tables, populate_initial_data


app = FastAPI(
    title="CampusTrade API", 
    version="2.0.0 (SQL)",
    description="Marketplace Universitário com persistência SQL"
)

# Depois da linha app = FastAPI(...):
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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



# Base de dados temporária (em memória)
produtos_db = []
next_id = 1

@app.get("/")
def root():
    ambiente = "Azure" if os.getenv("WEBSITE_INSTANCE_ID") else "Local"
    return {
        "message": "CampusTrade API - Marketplace Universitário", 
        "ambiente": ambiente,
        "versao": "2.0.0 (SQL)",
        "banco": "SQL Server" if not os.getenv("DATABASE_URL", "").startswith("sqlite") else "SQLite"
    }

@app.get("/produtos", response_model=List[Produto])
def listar_produtos(db: Session = Depends(get_db)):
    """Listar todos os produtos"""
    produtos = db.query(ProdutoTable).order_by(ProdutoTable.data_criacao.desc()).all()
    return produtos

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

@app.get("/produtos/{produto_id}", response_model=Produto)
def buscar_produto(produto_id: int, db: Session = Depends(get_db)):
    """Buscar produto por ID"""
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

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

@app.delete("/produtos/{produto_id}")
def deletar_produto(produto_id: int, db: Session = Depends(get_db)):
    """Remover produto"""
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db.delete(produto)
    db.commit()
    return {"message": "Produto removido com sucesso"}

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
