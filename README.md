# VTT RPG - Virtual Tabletop

A modern, fast, and feature-rich Virtual Tabletop (VTT) designed for Tabletop Role-Playing Games (TTRPGs). Built with React, TypeScript, Vite, and PixiJS, this application leverages WebRTC for seamless, serverless Peer-to-Peer (P2P) real-time state synchronization.

## ✨ Features

- **Serverless P2P Multiplayer:** Uses WebRTC (PeerJS) to connect players directly to the GM (Host) with minimal latency and zero backend configuration.
- **Dynamic Lighting & Vision:** Real-time raycasting engine for line-of-sight computations based on walls and light sources.
- **Fog of War:** GM-controlled hidden areas that can be manually revealed using brush tools.
- **Advanced Map & Token Layering:** Native drag-and-drop system from your OS directly onto the canvas. Separate interaction layers prevent accidental movement of map tiles while adjusting tokens.
- **Token Management:** Token HP bars, status rings (auras), and visibility toggling.
- **Drawing & AoE Templates:** Freehand drawing, measuring rulers with waypoints, and specialized Area of Effect (AoE) templates (Cone, Cube, Circle) that snap to the grid.
- **Interactive Walls & Doors:** GMs can draw walls to block vision and toggle doors open/closed for dynamic line-of-sight updates.
- **3D Physics Dice Roller:** Integrated 3D dice physics engine (Babylon.js) that renders rolls on the screen for everyone.
- **Initiative Turn Tracker:** Automated turn order sorting with chat-based syntax (e.g., `/init 1d20+2`).
- **Chat & Macros:** Built-in chat box with dice rolling support and customizable macro bar for quick actions.
- **Handouts & Jukebox:** Share full-screen images/puzzles and sync background audio across all connected clients.
- **Save & Load:** Export the current game state to a `.json` file and restore campaigns seamlessly.

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Canvas Rendering Engine:** PixiJS (v8)
- **3D Engine (Dice):** Babylon.js + Ammo.js
- **State Management:** Zustand
- **Networking:** PeerJS (WebRTC)
- **Styling:** Tailwind CSS

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vtt-rpg
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## 🎮 How to Play

1. **Host a Game:** The first player (usually the GM) simply loads the app. The system automatically assigns a unique **Peer ID**.
2. **Share the ID:** The GM shares this ID with the players.
3. **Join a Game:** Players input the GM's Peer ID in the "Join" bar and connect. All state (map, tokens, chat) will instantly synchronize.
4. **Drag & Drop:** Drag an image from your computer onto the screen to create a map or a token instantly!

---
*Built for adventurers, by adventurers.*
