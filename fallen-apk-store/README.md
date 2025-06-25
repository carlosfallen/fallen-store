# 📱 APK Store - Umbrel Community App

Servidor web elegante para distribuição de APKs na sua rede local com interface moderna inspirada no iOS.

## ✨ Características

- **Interface moderna**: Design glassmorphism com efeitos de blur
- **Grid responsivo**: Layout adaptativo para diferentes dispositivos  
- **Download direto**: Clique e baixe APKs diretamente no navegador
- **Ícones automáticos**: Detecção inteligente de ícones baseada no nome do app
- **Zero configuração**: Adicione APKs na pasta e eles aparecem automaticamente

## 🚀 Instalação

### Para Umbrel

1. Copie todos os arquivos para sua pasta de apps da comunidade
2. Construa a imagem Docker:
```bash
docker-compose build
```

3. Execute o container:
```bash
docker-compose up -d
```

### Desenvolvimento Local

1. Instale as dependências:
```bash
npm install
```

2. Execute em modo desenvolvimento:
```bash
npm run dev
```

3. Para produção:
```bash
npm run build
npm start
```

## 📁 Estrutura de Arquivos

```
apk-store/
├── public/
│   └── apks/              # Coloque seus APKs aqui
├── src/
│   ├── App.jsx           # Componente principal React
│   ├── App.css           # Estilos glassmorphism
│   └── main.jsx          # Entry point
├── server.js             # Servidor Express
├── package.json          # Dependências
├── vite.config.js        # Configuração Vite
├── Dockerfile            # Container Docker
├── docker-compose.yml    # Orquestração
└── umbrel-app.yml        # Configuração Umbrel
```

## 🎯 Como Usar

1. **Adicionar APKs**: Coloque arquivos `.apk` na pasta `public/apks/`
2. **Acessar**: Navegue para `http://localhost:5174`
3. **Baixar**: Clique em qualquer app para baixar
4. **Gerenciar**: APKs são listados automaticamente

## 🎨 Design

- **Fundo**: Gradiente animado com efeitos de blur
- **Cards**: Glassmorphism com animações suaves
- **Ícones**: Emojis automáticos baseados no nome do app
- **Responsivo**: Funciona em desktop, tablet e mobile
- **Tema**: Inspirado no iOS com elementos modernos

## 🔧 Configuração

### Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 5174)
- `NODE_ENV`: Ambiente de execução

### Personalização

Para personalizar ícones, edite a função `getAppIcon()` no `server.js`:

```javascript
const icons = {
  whatsapp: '💬',
  telegram: '✈️',
  // Adicione mais...
};
```

## 📊 API Endpoints

- `GET /api/apks` - Lista todos os APKs disponíveis
- `POST /api/upload` - Upload de novos APKs
- `GET /apks/:filename` - Download direto de APK

## 🐳 Docker

Para construir a imagem Docker:

```bash
docker build -t apk-store .
```

Para executar:

```bash
docker run -p 5174:5174 -
