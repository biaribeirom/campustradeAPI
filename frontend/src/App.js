import React, { useState, useEffect } from 'react';
import { listarProdutos } from './api';
import ListaProdutos from './components/ListaProdutos';
import FormularioProduto from './components/FormularioProduto';
import DetalhesProduto from './components/DetalhesProduto';
import './App.css';

function App() {
  // Estados da aplicação
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  // Função para carregar produtos da API
  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const produtosData = await listarProdutos();
      setProdutos(produtosData);
    } catch (err) {
      setError('Não foi possível carregar os produtos. Verifique se a API está funcionando.');
      console.error('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar produtos na inicialização
  useEffect(() => {
    carregarProdutos();
  }, []); // Array vazio = executa apenas uma vez

  // Função chamada quando produto é criado
  const handleProdutoCreated = () => {
    setMostrarFormulario(false); // Fechar formulário
    carregarProdutos(); // Recarregar lista
  };

  // Função para abrir detalhes do produto
  const handleProdutoClick = (produto) => {
    setProdutoSelecionado(produto);
  };

  // Função para fechar modal de detalhes
  const handleFecharDetalhes = () => {
    setProdutoSelecionado(null);
  };

  return (
    <div className="App">
      {/* Header da aplicação */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">
            CampusTrade
          </span>
          <div className="navbar-nav ms-auto">
            <button 
              className="btn btn-light"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              {mostrarFormulario ? 'Ver Produtos' : 'Vender Produto'}
            </button>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main className="container my-4">
        {mostrarFormulario ? (
          <FormularioProduto 
            onProdutoCreated={handleProdutoCreated}
            onCancel={() => setMostrarFormulario(false)}
          />
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Produtos Disponíveis</h2>
              <button 
                className="btn btn-outline-primary"
                onClick={carregarProdutos}
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>
            
            <ListaProdutos 
              produtos={produtos}
              loading={loading}
              error={error}
              onProdutoClick={handleProdutoClick}
            />
          </>
        )}
      </main>

      {/* Modal de detalhes (renderiza apenas se produto selecionado) */}
      {produtoSelecionado && (
        <DetalhesProduto 
          produto={produtoSelecionado}
          onClose={handleFecharDetalhes}
        />
      )}
    </div>
  );
}

export default App;