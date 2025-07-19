# Aplicativo de Produtividade Mobile

Um aplicativo completo de produtividade inspirado no Microsoft To Do com funcionalidades expandidas do Notion/Obsidian, desenvolvido com React, TypeScript e Firebase.

## ✨ Funcionalidades

### 🔐 Autenticação
- Login/registro com email e senha
- Autenticação com Google
- Perfil de usuário editável
- Logout seguro

### 📋 Gerenciamento de Tarefas
- Criar, editar e excluir tarefas
- Categorias personalizáveis com cores
- Status de tarefas (pendente, em progresso, concluída)
- Prioridades (baixa, média, alta)
- Datas de vencimento
- Subtarefas aninhadas
- Gestos de swipe para ações rápidas
- Filtros e pesquisa

### 📝 Sistema de Notas
- Editor Markdown com preview em tempo real
- Suporte a blocos de código com syntax highlighting
- Tags para organização
- Busca full-text nas notas
- Interface de edição intuitiva
- Toolbar com formatação rápida

### 🎨 Interface Mobile
- Design responsivo mobile-first
- Modo escuro/claro
- Navegação por tabs inferior
- Gestos de swipe
- Animações suaves
- Interface touch-friendly

## 🛠️ Tecnologias Utilizadas

- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Firebase** - Backend as a Service
  - Firestore - Banco de dados
  - Authentication - Autenticação
- **Tailwind CSS** - Estilização
- **Framer Motion** - Animações
- **React Hook Form** - Gerenciamento de formulários
- **React Markdown** - Renderização de Markdown
- **React Syntax Highlighter** - Highlight de código
- **Date-fns** - Manipulação de datas
- **Lucide React** - Ícones

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd productivity-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative Authentication (email/password e Google)
   - Crie um banco Firestore
   - Copie as configurações do projeto

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações do Firebase:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Execute o projeto:
```bash
npm run dev
```

## 🗃️ Estrutura do Banco de Dados (Firestore)

### Coleções

#### users
```typescript
{
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### taskLists
```typescript
{
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### tasks
```typescript
{
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  important: boolean;
  listId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  steps: Step[];
}
```

#### steps (embedded in tasks)
```typescript
{
  id: string;
  title: string;
  completed: boolean;
  orderIndex: number;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### notes
```typescript
{
  id: string;
  title: string;
  content: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  linkedNotes: string[];
}
```

## 🎯 Uso

### Tarefas
1. **Criar tarefa**: Clique no botão "+" na tela de tarefas
2. **Editar tarefa**: Clique no ícone de edição na tarefa
3. **Marcar como concluída**: Clique no círculo ao lado da tarefa
4. **Marcar como importante**: Clique no ícone de estrela
5. **Excluir tarefa**: Deslize para a esquerda e clique no ícone de lixeira
6. **Filtrar tarefas**: Use os filtros por lista e status de conclusão
7. **Adicionar etapas**: Use o formulário de edição para adicionar etapas à tarefa

### Notas
1. **Criar nota**: Clique no botão "+" na tela de notas
2. **Editar nota**: Clique na nota ou no ícone de edição
3. **Adicionar tags**: Use o campo de tags no editor
4. **Preview**: Alterne entre modo edição e preview
5. **Buscar notas**: Use a barra de pesquisa ou filtre por tags

### Perfil
1. **Editar perfil**: Clique em "Editar" na tela de perfil
2. **Alternar tema**: Use o botão de tema na barra superior
3. **Logout**: Clique em "Sair" na tela de perfil

## 🔒 Segurança

- Autenticação obrigatória para todas as funcionalidades
- Regras de segurança do Firestore implementadas
- Dados isolados por usuário
- Validação de entrada nos formulários

## 📱 Responsividade

- Mobile-first design
- Breakpoints para tablet e desktop
- Navegação adaptativa
- Gestos otimizados para touch

## 🚀 Build para Produção

```bash
npm run build
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para support@productivity-app.com ou abra uma issue no GitHub.

---

Desenvolvido com ❤️ usando React e Firebase