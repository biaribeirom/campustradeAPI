# Configuração de Variáveis de Ambiente para Deploy

## Por que usar variáveis de ambiente?

**Problema**: URL da API é diferente em cada ambiente:
- Desenvolvimento: `http://localhost:8000`
- Produção: `https://campustrade-api.azurewebsites.net`

**Solução**: Usar variáveis de ambiente que mudam automaticamente baseado no contexto.

---

## Frontend: Configuração React

### 1. Atualizar frontend/src/api.js

```javascript
// Detectar ambiente automaticamente
const getApiUrl = () => {
  // Produção: usar variável de ambiente ou URL padrão
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'https://campustrade-api.azurewebsites.net';
  }
  
  // Desenvolvimento: sempre localhost
  return 'http://localhost:8000';
};

const BASE_URL = getApiUrl();

// Resto do código permanece igual
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
```

### 2. Criar arquivos de ambiente

**frontend/.env.development** (desenvolvimento local):
```env
REACT_APP_API_URL=http://localhost:8000
```

**frontend/.env.production** (build para produção):
```env
REACT_APP_API_URL=https://campustrade-api-seunome.azurewebsites.net
```

### 3. Como React usa as variáveis

React automaticamente:
- Usa `.env.development` quando executa `npm start`
- Usa `.env.production` quando executa `npm run build`
- Ignora variáveis que não começam com `REACT_APP_`

---

## Backend: Configuração FastAPI

### 1. Atualizar CORS para múltiplos ambientes

No seu `backend/main.py`:

```python
import os
from fastapi.middleware.cors import CORSMiddleware

# Detectar URLs permitidas baseado no ambiente
def get_allowed_origins():
    if os.getenv("WEBSITE_INSTANCE_ID"):  # Azure App Service
        return [
            "https://campustrade.azurestaticapps.net",  # Produção
            "http://localhost:3000"  # Para testes locais
        ]
    else:  # Desenvolvimento local
        return ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Deploy: Configurar no Azure

### Frontend (Azure Static Web Apps)

**Opção 1: Via Portal Azure**
1. Acesse Azure Static Web Apps
2. Configuration → Environment variables
3. Adicione:
   - Name: `REACT_APP_API_URL`
   - Value: `https://campustrade-api-seunome.azurewebsites.net`

**Opção 2: Via arquivo de configuração**

Crie `frontend/staticwebapp.config.json`:
```json
{
  "environmentVariables": {
    "REACT_APP_API_URL": "https://campustrade-api-seunome.azurewebsites.net"
  }
}
```

### Backend (Azure App Service)

**Via Portal Azure:**
1. Acesse App Service
2. Configuration → Application settings
3. Adicione variáveis necessárias:
   - `DATABASE_URL`: String de conexão do banco
   - `FRONTEND_URL`: `https://campustrade.azurestaticapps.net`

---

## Workflow Completo

### Desenvolvimento Local
```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload
# Usa: http://localhost:8000

# Terminal 2: Frontend
cd frontend
npm start
# Usa: REACT_APP_API_URL=http://localhost:8000 (automático)
```

### Build para Produção
```bash
cd frontend

# Build automático com variáveis de produção
npm run build
# Usa: REACT_APP_API_URL do .env.production

# Deploy manual (se necessário)
az staticwebapp deploy --name campustrade --source ./build
```

---

## Verificação

### Como testar se funciona:

**Desenvolvimento:**
```javascript
// No console do navegador (F12):
console.log('API URL:', process.env.REACT_APP_API_URL);
// Deve mostrar: http://localhost:8000
```

**Produção:**
```javascript
// No console do site deployado:
console.log('API URL:', process.env.REACT_APP_API_URL);
// Deve mostrar: https://campustrade-api-seunome.azurewebsites.net
```

---

## Segurança

### Variáveis expostas no frontend

**IMPORTANTE**: Variáveis `REACT_APP_*` são públicas no navegador.

**Seguro para frontend:**
- URLs de APIs públicas
- Chaves de APIs públicas (ex: Google Maps)
- Configurações de UI

**NÃO colocar no frontend:**
- Senhas de banco de dados
- Chaves secretas de APIs
- Tokens de autenticação de servidor

### Para dados sensíveis (backend apenas)

Use variáveis sem `REACT_APP_`:
```python
# backend/main.py
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")  # Não vai para frontend
```

---

## Atualizar .gitignore

Adicione ao .gitignore:
```
# Variáveis de ambiente locais
frontend/.env.local
frontend/.env.development.local
frontend/.env.test.local
frontend/.env.production.local

backend/.env
```

**Commitar no Git:**
- ✅ `.env.development` e `.env.production` (URLs são públicas)
- ❌ `.env.local` ou arquivos com senhas

---

## Resumo do Fluxo

1. **Código detecta ambiente automaticamente**
2. **Desenvolvimento**: Usa localhost automaticamente
3. **Build**: Aplica variáveis de produção
4. **Deploy**: Azure configura variáveis específicas da nuvem
5. **Resultado**: URLs corretas em cada ambiente sem código duplicado