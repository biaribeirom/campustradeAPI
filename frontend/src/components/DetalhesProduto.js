import React, { useEffect } from 'react';

const DetalhesProduto = ({ produto, onClose }) => {
  // Fechar modal com tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    
    // Cleanup: remover event listener quando componente for desmontado
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Função para formatar preço
  const formatarPreco = (preco) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  // Função para formatar data
  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Se não há produto, não renderizar nada
  if (!produto) return null;

  return (
    <>
      {/* Backdrop do modal */}
      <div 
        className="modal-backdrop fade show" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="modal fade show d-block" 
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{produto.titulo}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
              />
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-8">
                  <h6>Descrição</h6>
                  <p>{produto.descricao}</p>
                  
                  <h6>Informações</h6>
                  <ul className="list-unstyled">
                    <li><strong>Preço:</strong> {formatarPreco(produto.preco)}</li>
                    <li><strong>Categoria:</strong> {produto.categoria}</li>
                    <li><strong>Vendedor:</strong> {produto.vendedor}</li>
                    {produto.data_criacao && (
                      <li><strong>Publicado em:</strong> {formatarData(produto.data_criacao)}</li>
                    )}
                  </ul>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-body text-center">
                      <h3 className="text-primary">{formatarPreco(produto.preco)}</h3>
                      <button className="btn btn-success btn-lg w-100 mb-2">
                        Tenho Interesse
                      </button>
                      <button className="btn btn-outline-primary w-100">
                        Contatar Vendedor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DetalhesProduto;