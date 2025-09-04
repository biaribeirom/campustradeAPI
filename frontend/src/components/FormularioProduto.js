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