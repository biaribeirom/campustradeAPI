import React from 'react';

const ProdutoCard = ({ produto, onClick }) => {
  // Função para formatar preço em moeda brasileira
  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  return (
    <div className="col-md-4 mb-3">
      <div 
        className="card h-100" 
        onClick={() => onClick(produto)}
        style={{ cursor: 'pointer' }}
      >
        <div className="card-body">
          <h5 className="card-title">{produto.titulo}</h5>
          <p className="card-text">{produto.descricao}</p>
          <p className="card-text">
            <strong>{formatarPreco(produto.preco)}</strong>
          </p>
          <span className="badge bg-primary">{produto.categoria}</span>
          <br />
          <small className="text-muted">Vendedor: {produto.vendedor}</small>
        </div>
      </div>
    </div>
  );
};

export default ProdutoCard;