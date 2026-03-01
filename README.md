# VTT RPG - Virtual Tabletop

Um Virtual Tabletop (VTT) moderno, rápido e rico em recursos, projetado para jogos de RPG de mesa (TTRPGs). Construído com React, TypeScript, Vite e PixiJS, este aplicativo utiliza WebRTC para uma sincronização de estado em tempo real, Peer-to-Peer (P2P), sem a necessidade de um servidor centralizado.

## ✨ Recursos

- **Multiplayer P2P sem Servidor:** Usa WebRTC (PeerJS) para conectar jogadores diretamente ao Mestre (Host) com latência mínima e configuração backend zero.
- **Iluminação Dinâmica e Visão:** Motor de raycasting em tempo real para cálculos de linha de visão baseados em paredes e fontes de luz.
- **Fog of War (Névoa de Guerra):** Áreas ocultas controladas pelo GM que podem ser reveladas manualmente usando ferramentas de pincel.
- **Camadas Avançadas de Mapa e Token:** Sistema nativo de arrastar e soltar (drag-and-drop) do seu sistema operacional direto para o canvas. Camadas de interação separadas previnem o movimento acidental de tiles do mapa enquanto você ajusta os tokens.
- **Gerenciamento de Tokens:** Barras de HP dos tokens, anéis de status (auras) e alternância de visibilidade.
- **Desenho e Templates de AoE:** Desenho livre, réguas de medição com waypoints, e templates especializados para Área de Efeito (AoE) (Cone, Cubo, Círculo) que se alinham à grade.
- **Paredes e Portas Interativas:** Os GMs podem desenhar paredes para bloquear a visão e alternar portas (abertas/fechadas) para atualizações dinâmicas de linha de visão.
- **Rolo de Dados em 3D com Física:** Motor de física 3D integrado para dados (Babylon.js) que renderiza rolagens na tela para todos.
- **Rastreador de Turnos / Iniciativa:** Ordenação automática dos turnos usando comandos no chat (ex., `/init 1d20+2`).
- **Chat e Macros:** Caixa de chat integrada com suporte a rolagem de dados e barra de macros customizável para ações rápidas.
- **Handouts e Jukebox:** Compartilhe imagens/quebra-cabeças em tela cheia e sincronize áudio de fundo para todos os clientes conectados.
- **Salvar e Carregar:** Exporte o estado atual do jogo para um arquivo `.json` e restaure campanhas perfeitamente.

## 🛠️ Tecnologias Utilizadas

- **Framework:** React 19 + TypeScript
- **Ferramenta de Build:** Vite
- **Motor de Renderização 2D:** PixiJS (v8)
- **Motor 3D (Dados):** Babylon.js + Ammo.js
- **Gerenciamento de Estado:** Zustand
- **Rede / Conexão:** PeerJS (WebRTC)
- **Estilização:** Tailwind CSS

## 🚀 Como Começar

### Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado (versão 18 ou superior recomendada).

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd vtt-rpg
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Construa para produção:
```bash
npm run build
```

## 🎮 Como Jogar

1. **Seja o Host de um Jogo:** O primeiro jogador (geralmente o GM) simplesmente abre o aplicativo. O sistema automaticamente cria um **Peer ID** único.
2. **Compartilhe o ID:** O GM copia e compartilha esse ID com os jogadores.
3. **Junte-se ao Jogo:** Os jogadores inserem o Peer ID do GM na barra "Join" e se conectam. Todo o estado (mapa, tokens, chat) vai ser sincronizado instantaneamente.
4. **Arrastar e Soltar:** Arraste uma imagem do seu computador e solte na tela para criar um mapa ou um token na mesma hora!

---
*Feito para aventureiros, por aventureiros.*
