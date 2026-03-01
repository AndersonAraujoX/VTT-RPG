import { useEffect, useState } from 'react';
import { MapBoard } from './components/MapBoard';
import { ChatBox } from './components/Chat/ChatBox';
import { TurnTracker } from './components/Tools/TurnTracker';
import { networkManager } from './services/network';
import { useGameStore } from './store/gameStore';

import { CharacterSheetModal } from './components/UI/CharacterSheetModal';
import { MacroBar } from './components/Tools/MacroBar';
import { Jukebox } from './components/Tools/Jukebox';
import { HandoutViewer } from './components/UI/HandoutViewer';
import { diceService } from './services/diceService';
import { Compendium } from './components/Tools/Compendium';
import { AVChat } from './components/Chat/AVChat';
import { DrawingTools } from './components/Tools/DrawingTools';
import { GMSettings } from './components/Tools/GMSettings';
import { SceneManager } from './components/Tools/SceneManager';
import { AssetLibrary } from './components/Tools/AssetLibrary';
import { SaveLoadMenu } from './components/Tools/SaveLoadMenu';
import { processImageUpload } from './utils/imageHandler';

export function App() {
  const [targetPeerId, setTargetPeerId] = useState('');
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const myId = useGameStore(s => s.myId);
  const setIdentity = useGameStore(s => s.setIdentity);
  const activeLayer = useGameStore(s => s.activeLayer);
  const setActiveLayer = useGameStore(s => s.setActiveLayer);

  useEffect(() => {
    // Initialize Network
    networkManager.initialize().then((id) => {
      setIdentity(id, true); // Default to host until joined
    }).catch(console.error);

    // Initialize 3D Dice Box
    diceService.init().catch(console.error);
  }, []);

  const handleJoin = () => {
    if (targetPeerId) {
      setIdentity(myId, false);
      networkManager.connectToHost(targetPeerId);
    }
  };

  const handleAddTestToken = () => {
    // Debug: Add random token
    const t = {
      id: Date.now().toString(),
      x: 3,
      y: 3,
      size: 1,
      image: '',
      label: 'Hero',
      stats: { hp: 20, maxHp: 20, ac: 14 }
    };
    networkManager.sendAction('ADD_TOKEN', t);
  };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen bg-black text-white overflow-hidden font-sans">
      {/* 3D Dice Canvas Container */}
      <div id="dice-box-container" className="fixed inset-0 pointer-events-none z-[100]"></div>

      {/* Main Map Area (Edge to Edge) */}
      <div className="absolute inset-0 z-0">
        <MapBoard onEditToken={setEditingTokenId} />
        <AVChat />
      </div>

      {/* Modern UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">

        {/* Top-Left: Network & Quick Settings */}
        <div className="absolute top-4 left-4 flex flex-col gap-3 pointer-events-auto">

          {/* Header Panel */}
          <div className="bg-gray-900/60 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-4 w-72">
            <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-3 drop-shadow-sm">
              VTT RPG
            </h1>

            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">My ID</span>
                <code
                  className="block mt-1 p-2 bg-black/50 rounded-lg select-all text-xs break-all cursor-pointer hover:bg-black/80 transition-colors border border-white/5"
                  title="Click to Copy"
                  onClick={() => navigator.clipboard.writeText(myId)}
                >
                  {myId}
                </code>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Host ID..."
                  className="flex-1 px-3 py-1.5 bg-black/50 rounded-lg border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  value={targetPeerId}
                  onChange={(e) => setTargetPeerId(e.target.value)}
                />
                <button
                  onClick={handleJoin}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs font-bold shadow-lg transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* GM Tools Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full py-2 bg-gray-900/60 backdrop-blur-lg border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-800/80 transition-all shadow-xl"
          >
            {menuOpen ? 'Hide GM Tools' : 'Show GM Tools'}
          </button>

          {/* Collapsible GM Tools Panel */}
          {menuOpen && (
            <div className="bg-gray-900/60 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-4 w-72 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-3">
              <DrawingTools />
              <div className="h-px bg-white/10 w-full my-1"></div>
              <GMSettings />
              <div className="h-px bg-white/10 w-full my-1"></div>
              <SceneManager />
              <AssetLibrary />

              {useGameStore.getState().isHost && (
                <>
                  <div className="h-px bg-white/10 w-full my-1"></div>
                  <Compendium />
                </>
              )}

              <div className="h-px bg-white/10 w-full my-1"></div>
              <Jukebox />
              <SaveLoadMenu />

              <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg text-[10px] text-yellow-200/70 text-center">
                Net: {networkManager.hostConnection ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Turn Tracker */}
        <div className="absolute top-4 right-4 flex flex-col gap-3 items-end pointer-events-auto">
          <TurnTracker />
        </div>

        {/* Bottom Center: Player/Interaction Toolbar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-gray-900/70 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl pointer-events-auto">

          {/* Layer Controls */}
          <div className="flex bg-black/40 p-1 rounded-xl">
            <button
              onClick={() => setActiveLayer('token')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeLayer === 'token' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Objects
            </button>
            <button
              onClick={() => setActiveLayer('map')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeLayer === 'map' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Map Layer
            </button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-2"></div>

          {/* Quick Actions */}
          <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-colors text-sm font-medium">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upload Map
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await processImageUpload(file, true);
                  networkManager.sendAction('UPDATE_MAP', { url });
                  useGameStore.getState().updateMap({ url });
                }
                e.target.value = '';
              }}
            />
          </label>

          <label className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-colors text-sm font-medium">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Add Token
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const imgUrl = await processImageUpload(file, false);
                  const t = {
                    id: Date.now().toString(),
                    x: 3,
                    y: 3,
                    size: 1,
                    image: imgUrl,
                    label: 'Token',
                    stats: { hp: 10, maxHp: 10, ac: 10 },
                    ownerId: useGameStore.getState().myId
                  };
                  useGameStore.getState().addToken(t);
                  networkManager.sendAction('ADD_TOKEN', t);
                }
                e.target.value = '';
              }}
            />
          </label>

          <button
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors text-sm font-medium"
            onClick={handleAddTestToken}
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Test Token
          </button>
        </div>

        {/* Bottom Right: Chat & Macros */}
        <div className="absolute bottom-24 right-4 w-80 h-[60vh] flex flex-col gap-2 pointer-events-auto">
          {/* We wrap the existing ChatBox in a glass container. Since ChatBox is currently rigid, 
              we might need to tweak ChatBox itself next, but we can start here. */}
          <div className="flex-1 bg-gray-900/60 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <ChatBox />
          </div>
        </div>

        {/* Macro Bar above the bottom edge but aligned with the chat or bottom center */}
        <div className="absolute bottom-6 right-4 pointer-events-auto">
          <div className="bg-gray-900/60 backdrop-blur-lg border border-white/10 rounded-2xl p-2 shadow-2xl">
            <MacroBar />
          </div>
        </div>

      </div>

      {/* Modals & Popups */}
      <HandoutViewer />

      {editingTokenId && (
        <CharacterSheetModal
          tokenId={editingTokenId}
          onClose={() => setEditingTokenId(null)}
        />
      )}
    </div>
  );
}

export default App;
