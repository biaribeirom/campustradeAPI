// URL da sua API backend
const BASE_URL = 'http://localhost:8000';

// Função para listar produtos
export const listarProdutos = async () => {
  try {
    const response = await fetch(`${BASE_URL}/produtos`);
    if (!response.ok) throw new Error('Erro ao buscar produtos');
    return await response.json();
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    throw error;
  }
};

// Função para criar produto
export const criarProduto = async (produto) => {
  try {
    const response = await fetch(`${BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produto)
    });
    
    if (!response.ok) throw new Error('Erro ao criar produto');
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    throw error;
  }
};