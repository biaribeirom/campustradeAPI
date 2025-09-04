# Guia Completo: Frontend React para CampusTrade

**Disciplina:** Projeto de Cloud  
**Aulas:** 10-11 (Frontend moderno: React e integração com APIs)  
**Objetivo:** Criar interface web que consuma a API FastAPI desenvolvida anteriormente

---

## Estrutura do Projeto

Você já tem um projeto backend funcionando. Vamos reorganizar para facilitar o deploy:

**Estrutura atual (problemática para deploy):**
```
campustrade/ (seu projeto atual)
├── main.py                    
├── models.py
├── database.py
├── requirements.txt
├── test_api.http
└── README.md
```

**Nova estrutura (deploy seletivo):**
```
campustrade/ (reorganizado)
├── backend/                   # Backend movido para cá
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── requirements.txt
│   └── test_api.http
├── frontend/                  # Frontend novo
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

### Reorganizar projeto existente:

**Windows (Command Prompt):**
```cmd
REM Na pasta do seu projeto atual:

REM 1. Criar pasta backend
mkdir backend

REM 2. Mover arquivos existentes
move main.py backend\
move models.py backend\
move database.py backend\
move requirements.txt backend\
move test_*.http backend\

REM 3. Verificar estrutura
dir
```

**Linux/Mac:**
```bash
# Na pasta do seu projeto atual:

# 1. Criar pasta backend
mkdir backend

# 2. Mover arquivos existentes
mv main.py models.py database.py requirements.txt backend/
mv test_*.http backend/

# 3. Verificar estrutura
ls -la
```

**Para executar backend após reorganização:**

**Windows:**
```cmd
REM Ativar ambiente (na raiz)
venv\Scripts\activate

REM Executar backend
cd backend
uvicorn main:app --reload
```

**Linux/Mac:**
```bash
# Ativar ambiente (na raiz)
source venv/bin/activate

# Executar backend
cd backend
uvicorn main:app --reload
```

Agora o deploy do backend apontará apenas para `/backend` e não copiará a pasta frontend.

---

## Introdução aos Arquivos React

**`src/api.js`**: Centraliza toda comunicação com o backend. Contém funções para buscar, criar e atualizar produtos via HTTP.

**`src/App.js`**: Componente principal que gerencia o estado global e coordena todos os outros componentes. É o "cérebro" da aplicação.

**`src/components/ProdutoCard.js`**: Componente pequeno que representa um produto individual em formato card. Reutilizável na lista.

**`src/components/ListaProdutos.js`**: Componente responsável por exibir a lista completa de produtos em grid, incluindo estados de carregamento e erro.

**`src/components/FormularioProduto.js`**: Componente que contém o formulário para criar novos produtos, com validação e envio para API.

**`src/components/DetalhesProduto.js`**: Modal que exibe informações detalhadas de um produto quando o usuário clica nele.

---

## Conceitos Fundamentais: useState e useEffect

### useState: Gerenciamento de Estado

Estado armazena dados que podem mudar ao longo do tempo dentro de um componente. Quando o estado muda, o React automaticamente re-renderiza o componente para refletir a mudança.

**Sintaxe básica:**
```javascript
import { useState } from 'react';

const [estado, setEstado] = useState(valorInicial);
```

**Exemplo prático:**
```javascript
const [contador, setContador] = useState(0); // Inicializa com 0

// Para alterar o estado:
setContador(contador + 1); // Incrementa
setContador(0); // Define valor específico
```

**Tipos de estado comuns:**
```javascript
// String
const [nome, setNome] = useState('');

// Number
const [idade, setIdade] = useState(0);

// Boolean
const [ativo, setAtivo] = useState(false);

// Array
const [produtos, setProdutos] = useState([]);

// Object
const [usuario, setUsuario] = useState({
  nome: '',
  email: ''
});
```

**Atualizando arrays e objetos:**
```javascript
// ERRADO: mutar o estado diretamente
produtos.push(novoProduto); // ❌ Não funciona

// CORRETO: criar novo array/objeto
setProdutos([...produtos, novoProduto]); // ✅ Funciona
setProdutos(produtos => [...produtos, novoProduto]); // ✅ Alternativa

// Para objetos:
setUsuario({
  ...usuario,
  nome: 'Novo Nome'
});
```

### useEffect: Efeitos Colaterais

useEffect executa código "depois" da renderização do componente para operações como:
- Chamadas para APIs
- Event listeners
- Timers

**Três padrões principais:**

**1. Executar uma vez (na criação do componente):**
```javascript
useEffect(() => {
  // Buscar dados da API quando componente aparece
  buscarProdutos();
}, []); // Array vazio = uma vez só
```

**2. Executar quando algo específico muda:**
```javascript
useEffect(() => {
  // Executar quando 'categoria' mudar
  filtrarPorCategoria();
}, [categoria]); // Re-executa se categoria mudar
```

**3. Executar e limpar (cleanup):**
```javascript
useEffect(() => {
  // Adicionar listener
  document.addEventListener('click', minhaFuncao);
  
  // Remover listener quando componente sair da tela
  return () => {
    document.removeEventListener('click', minhaFuncao);
  };
}, []);
```

**Exemplo prático - carregar produtos:**

```javascript
function App() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  useEffect(() => {
    async function buscarDados() {
      setCarregando(true);
      try {
        const dados = await listarProdutos();
        setProdutos(dados);
      } catch (erro) {
        console.error('Erro:', erro);
      }
      setCarregando(false);
    }
    
    buscarDados();
  }, []); // Executa uma vez quando App aparece
  
  if (carregando) return <p>Carregando...</p>;
  return <div>{produtos.map(...)}</div>;
}
```

---

## ETAPA 1: Setup Inicial (15 minutos)

### Passo 1.1: Criar frontend no projeto existente

No terminal, na pasta do seu projeto (onde está o main.py):

```bash
# Criar projeto React dentro da pasta atual
npx create-react-app frontend

# Entrar na pasta frontend
cd frontend

# Instalar dependências
npm install axios bootstrap
```

### Passo 1.2: Configurar Bootstrap

Edite `frontend/src/index.js`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; // Adicione esta linha
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Passo 1.3: Testar se funciona

```bash
# Executar o frontend (dentro da pasta frontend)
npm start
```

O navegador deve abrir em `http://localhost:3000`.

---

## ETAPA 2: Configurar Comunicação com API (10 minutos)

### Passo 2.1: Criar arquivo de API

Crie `frontend/src/api.js`:

```javascript
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
```

### Passo 2.2: Configurar CORS no backend

No seu `main.py` existente, adicione:

```python
from fastapi.middleware.cors import CORSMiddleware

# Depois da linha app = FastAPI(...):
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Reinicie o backend:
```bash
uvicorn main:app --reload
```

---

## ETAPA 3: Criar Componentes (40 minutos)

### Passo 3.1: Criar pasta components

```bash
# Dentro da pasta frontend/src:
mkdir components
```

### Passo 3.2: Componente ProdutoCard

Crie `frontend/src/components/ProdutoCard.js`:

```javascript
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
```

### Passo 3.3: Componente ListaProdutos

Crie `frontend/src/components/ListaProdutos.js`:

```javascript
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
```

### Passo 3.4: Componente FormularioProduto

Crie `frontend/src/components/FormularioProduto.js`:

```javascript
import React, { useState } from 'react';
import { criarProduto } from '../api';

const FormularioProduto = ({ onProdutoCreated, onCancel }) => {
  // Estado para dados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    preco: '',
    categoria: '',
    vendedor: ''
  });

  // Estado para controlar se está enviando
  const [loading, setLoading] = useState(false);
  
  // Estado para erros
  const [errors, setErrors] = useState({});

  // Lista de categorias (deve ser igual ao backend)
  const categorias = ['Livros', 'Eletrônicos', 'Móveis', 'Roupas', 'Esportes', 'Outros'];

  // Função para atualizar campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando usuário digita
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Função para validar formulário
  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.titulo.trim()) {
      novosErros.titulo = 'Título é obrigatório';
    } else if (formData.titulo.length < 3) {
      novosErros.titulo = 'Título deve ter pelo menos 3 caracteres';
    }

    if (!formData.descricao.trim()) {
      novosErros.descricao = 'Descrição é obrigatória';
    } else if (formData.descricao.length < 10) {
      novosErros.descricao = 'Descrição deve ter pelo menos 10 caracteres';
    }

    if (!formData.preco) {
      novosErros.preco = 'Preço é obrigatório';
    } else if (parseFloat(formData.preco) <= 0) {
      novosErros.preco = 'Preço deve ser maior que zero';
    }

    if (!formData.categoria) {
      novosErros.categoria = 'Categoria é obrigatória';
    }

    if (!formData.vendedor.trim()) {
      novosErros.vendedor = 'Nome do vendedor é obrigatório';
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Função para enviar formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    
    try {
      // Converter preço para número
      const produtoParaEnviar = {
        ...formData,
        preco: parseFloat(formData.preco)
      };

      await criarProduto(produtoParaEnviar);
      
      // Limpar formulário após sucesso
      setFormData({
        titulo: '',
        descricao: '',
        preco: '',
        categoria: '',
        vendedor: ''
      });
      
      alert('Produto criado com sucesso!');
      onProdutoCreated(); // Notificar componente pai para atualizar lista
      
    } catch (error) {
      alert('Erro ao criar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h4>Cadastrar Novo Produto</h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="titulo" className="form-label">Título</label>
            <input
              type="text"
              className={`form-control ${errors.titulo ? 'is-invalid' : ''}`}
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ex: Livro de Cálculo I"
            />
            {errors.titulo && <div className="invalid-feedback">{errors.titulo}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="descricao" className="form-label">Descrição</label>
            <textarea
              className={`form-control ${errors.descricao ? 'is-invalid' : ''}`}
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows="3"
              placeholder="Descreva o estado do produto, características, etc."
            />
            {errors.descricao && <div className="invalid-feedback">{errors.descricao}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="preco" className="form-label">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`form-control ${errors.preco ? 'is-invalid' : ''}`}
              id="preco"
              name="preco"
              value={formData.preco}
              onChange={handleChange}
              placeholder="0.00"
            />
            {errors.preco && <div className="invalid-feedback">{errors.preco}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="categoria" className="form-label">Categoria</label>
            <select
              className={`form-select ${errors.categoria ? 'is-invalid' : ''}`}
              id="categoria"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.categoria && <div className="invalid-feedback">{errors.categoria}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="vendedor" className="form-label">Seu nome</label>
            <input
              type="text"
              className={`form-control ${errors.vendedor ? 'is-invalid' : ''}`}
              id="vendedor"
              name="vendedor"
              value={formData.vendedor}
              onChange={handleChange}
              placeholder="Como você quer aparecer para os compradores"
            />
            {errors.vendedor && <div className="invalid-feedback">{errors.vendedor}</div>}
          </div>

          <div className="d-grid gap-2 d-md-flex justify-content-md-end">
            <button 
              type="button" 
              className="btn btn-secondary me-md-2" 
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Criando...
                </>
              ) : (
                'Criar Produto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioProduto;
```

### Passo 3.5: Componente DetalhesProduto

Crie `frontend/src/components/DetalhesProduto.js`:

```javascript
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
```

---

## ETAPA 4: Componente Principal App.js (20 minutos)

### Passo 4.1: Substituir App.js completamente

Substitua todo o conteúdo de `frontend/src/App.js`:

```javascript
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
```

---

## ETAPA 5: Estilos e Visual (10 minutos)

### Passo 5.1: Atualizar App.css

Substitua o conteúdo de `frontend/src/App.css`:

```css
.App {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* Melhorar aparência dos cards */
.card {
  transition: transform 0.2s ease-in-out;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Navbar customizada */
.navbar-brand {
  font-weight: bold;
  font-size: 1.5rem;
}

/* Estilo para o modal backdrop */
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}

/* Melhorar botões */
.btn {
  border-radius: 6px;
  font-weight: 500;
}

/* Cards de produto com altura uniforme */
.card.h-100 {
  display: flex;
  flex-direction: column;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-text:last-of-type {
  margin-top: auto;
}
```

---

## ETAPA 6: Teste Completo (15 minutos)

### Passo 6.1: Executar backend e frontend

**Terminal 1 (backend):**
```bash
# Na raiz do projeto
uvicorn main:app --reload
```

**Terminal 2 (frontend):**
```bash
# Na pasta frontend
cd frontend
npm start
```

### Passo 6.2: Testar funcionalidades

1. Acesse `http://localhost:3000`
2. Deve carregar lista de produtos do backend
3. Clique em "Vender Produto" para abrir formulário
4. Preencha e envie um produto
5. Clique em um produto para ver detalhes

### Passo 6.3: Problemas comuns

**Erro CORS**: Adicione CORS no backend se não funcionou
**Lista vazia**: Verifique se backend tem produtos
**Erro 404**: Confirme se backend está rodando na porta 8000

---

## Git e Versionamento

### Atualizar .gitignore

Adicione ao seu `.gitignore` existente:

```
# Frontend
frontend/node_modules/
frontend/build/
frontend/.env.local
```

### Commits organizados

```bash
# Mudanças no backend
git add main.py models.py database.py
git commit -m "backend: adicionar validação de categoria"

# Mudanças no frontend
git add frontend/
git commit -m "frontend: implementar interface React"

# Mudanças que afetam ambos
git add .
git commit -m "feat: integrar frontend com backend via API"
```


## Resultado Final

Ao concluir esta etapa você terá:

- Interface web completa funcionando
- Backend e frontend no mesmo repositório GitHub
- Sistema de desenvolvimento local simples


## Comandos de Desenvolvimento

### Para trabalhar no projeto diariamente:

**Opção 1: Dois terminais separados**
```bash
# Terminal 1: Backend
uvicorn main:app --reload

# Terminal 2: Frontend  
cd frontend && npm start
```

**Opção 2: Script unificado (opcional)**

Crie arquivo `dev.py` na raiz:

```python
import subprocess
import sys
from threading import Thread

def run_backend():
    subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--reload"])

def run_frontend():
    subprocess.run(["npm", "start"], cwd="frontend")

if __name__ == "__main__":
    backend_thread = Thread(target=run_backend)
    backend_thread.start()
    run_frontend()
```

Execute: `python dev.py`

---

## Troubleshooting

### Problemas comuns:

**Frontend não carrega produtos:**
- Verifique se backend está rodando (http://localhost:8000)
- Teste endpoint direto no navegador: http://localhost:8000/produtos
- Veja erros no console do navegador (F12)

**Erro de CORS:**
- Confirme que adicionou CORSMiddleware no main.py
- Reinicie o backend após adicionar CORS
- URL do frontend deve ser exatamente http://localhost:3000

**Formulário não funciona:**
- Verifique se todos campos estão preenchidos
- Abra DevTools (F12) → Network para ver requisição
- Confirme que API POST /produtos funciona no backend

**Modal não abre:**
- Verifique se produto tem propriedade 'id'
- Console deve mostrar objeto produto quando clicado

---

## Estrutura Final

Após implementação completa:

```
campustrade/
├── main.py                    # Backend FastAPI
├── models.py
├── database.py
├── requirements.txt
├── test_api.http
├── frontend/                  # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ListaProdutos.js
│   │   │   ├── ProdutoCard.js
│   │   │   ├── FormularioProduto.js
│   │   │   └── DetalhesProduto.js
│   │   ├── api.js
│   │   ├── App.js
│   │   └── App.css
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

## Conceitos React Aprendidos

**Hooks essenciais:**
- useState: Gerenciar dados que mudam
- useEffect: Executar código em momentos específicos

**Padrões React:**
- Props: Passar dados entre componentes
- Event handling: Responder a cliques e mudanças
- Conditional rendering: Mostrar UI baseado no estado
- List rendering: Transformar arrays em componentes

**Integração com APIs:**
- Fetch API: Fazer requisições HTTP
- Async/await: Lidar com operações assíncronas
- Error handling: Tratar erros de rede


