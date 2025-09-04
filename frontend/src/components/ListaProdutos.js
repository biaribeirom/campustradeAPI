import React from 'react';
import ProdutoCard from './ProdutoCard';

const ListaProdutos = ({ produtos, loading, error, onProdutoClick }) => {
  // Se está carregando, mostrar spinner
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-3">Carregando produtos...</p>
      </div>
    );
  }

  // Se houver erro, mostrar mensagem
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <strong>Erro!</strong> {error}
      </div>
    );
  }

  // Se lista estiver vazia
  if (produtos.length === 0) {
    return (
      <div className="alert alert-info" role="alert">
        <strong>Nenhum produto encontrado.</strong> 
        Seja o primeiro a cadastrar um produto!
      </div>
    );
  }

  // Renderizar lista de produtos
  return (
    <div className="container">
      <div className="row">
        {produtos.map((produto) => (
          <ProdutoCard 
            key={produto.id} 
            produto={produto} 
            onClick={onProdutoClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ListaProdutos;