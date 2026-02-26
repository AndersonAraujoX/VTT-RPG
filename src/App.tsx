import { useEffect, useState } from 'react';
import { MapBoard } from './components/MapBoard';
import { ChatBox } from './components/Chat/ChatBox';
import { TurnTracker } from './components/Tools/TurnTracker';
import { networkManager } from './services/network';
import { useGameStore, type SavedAsset } from './store/gameStore';

import { CharacterSheetModal } from './components/UI/CharacterSheetModal';
import { MacroBar } from './components/Tools/MacroBar';
import { Jukebox } from './components/Tools/Jukebox';
import { HandoutViewer } from './components/UI/HandoutViewer';

function App() {
  const [targetPeerId, setTargetPeerId] = useState('');
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [newSceneName, setNewSceneName] = useState('');
  const myId = useGameStore(s => s.myId);
  const setIdentity = useGameStore(s => s.setIdentity);

  useEffect(() => {
    // Initialize Network
    networkManager.initialize().then((id) => {
      setIdentity(id, true); // Default to host until joined
    }).catch(console.error);
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

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden font-sans">
      {/* Sidebar / Tools */}
      <div className="w-64 bg-gray-800 flex flex-col border-r border-gray-700 z-10 shadow-xl">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
            VTT RPG
          </h1>

          {/* Network Status */}
          <div className="p-3 bg-gray-700 rounded-lg text-sm">
            <div className="mb-2">
              <span className="text-gray-400">My ID:</span>
              <code
                className="block mt-1 p-1 bg-black rounded select-all text-xs break-all cursor-pointer hover:bg-gray-900"
                title="Click to Copy"
                onClick={() => navigator.clipboard.writeText(myId)}
              >
                {myId}
              </code>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Host ID to join..."
                className="flex-1 px-2 py-1 bg-gray-900 rounded border border-gray-600 text-xs text-white"
                value={targetPeerId}
                onChange={(e) => setTargetPeerId(e.target.value)}
              />
              <button
                onClick={handleJoin}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Tools Menu */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-xs font-bold uppercase text-gray-500 mb-2">Tools</h2>
          <div className="flex flex-col gap-2">
            <label className="text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors cursor-pointer block">
              <span>Upload Map</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string;
                      networkManager.sendAction('UPDATE_MAP', { url });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            <label className="text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors cursor-pointer block">
              <span>Add Token (Image)</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const imgUrl = ev.target?.result as string;
                      const t = {
                        id: Date.now().toString(),
                        x: 3,
                        y: 3,
                        size: 1,
                        image: imgUrl,
                        label: 'Token',
                        stats: { hp: 10, maxHp: 10, ac: 10 }
                      };
                      networkManager.sendAction('ADD_TOKEN', t);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            <button
              className="text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              onClick={handleAddTestToken}
            >
              Add Basic Token
            </button>

            {/* Drawing Tools */}
            <div className="mt-4 p-2 bg-gray-900 border border-gray-700 rounded-lg space-y-2">
              <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center justify-between">
                ✏️ Drawing Tools
                <button
                  onClick={() => {
                    useGameStore.getState().clearDrawings();
                    networkManager.sendAction('SYNC_STATE', { drawings: [] });
                  }}
                  className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded hover:bg-red-800"
                >
                  Clear All
                </button>
              </h3>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => useGameStore.getState().setActiveTool('pan')}
                  className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().activeTool === 'pan' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  ✋ Pan
                </button>
                <button
                  onClick={() => useGameStore.getState().setActiveTool('draw')}
                  className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().activeTool === 'draw' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  ✏️ Draw
                </button>
              </div>

              <h4 className="text-[10px] font-bold text-gray-400 mt-2 mb-1 uppercase">AoE Templates</h4>
              <div className="flex gap-1">
                <button
                  onClick={() => useGameStore.getState().setActiveTool('circle')}
                  className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().activeTool === 'circle' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  ⭕ Circle
                </button>
                <button
                  onClick={() => useGameStore.getState().setActiveTool('cone')}
                  className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().activeTool === 'cone' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  📐 Cone
                </button>
                <button
                  onClick={() => useGameStore.getState().setActiveTool('cube')}
                  className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().activeTool === 'cube' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  ⬛ Cube
                </button>
              </div>

              {useGameStore.getState().activeTool !== 'pan' && (
                <div className="flex gap-2 items-center mt-2">
                  <input
                    type="color"
                    value={useGameStore.getState().toolColor}
                    onChange={(e) => useGameStore.getState().setToolColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={useGameStore.getState().toolThickness}
                    onChange={(e) => useGameStore.getState().setToolThickness(parseInt(e.target.value))}
                    className="flex-1"
                  />
                </div>
              )}
              <p className="text-[10px] text-gray-500 mt-1">Hold <kbd className="bg-gray-800 px-1 rounded">Alt</kbd> and drag for Ruler.</p>
            </div>

            {useGameStore.getState().isHost && (
              <label className="text-left px-3 py-2 bg-indigo-900/50 hover:bg-indigo-800 rounded text-sm transition-colors cursor-pointer block border border-indigo-700 font-bold">
                <span>📜 Share Handout</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const url = ev.target?.result as string;
                        useGameStore.getState().setHandout(url);
                        networkManager.sendAction('SYNC_STATE', { handout: url });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}

            {useGameStore.getState().isHost && (
              <div className="mt-4 p-2 bg-gray-900 border border-gray-700 rounded-lg space-y-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
                  🌫️ Fog of War
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newState = !useGameStore.getState().map.fogEnabled;
                      useGameStore.getState().toggleFog(newState);
                      networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                    }}
                    className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().map.fogEnabled ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'
                      }`}
                  >
                    {useGameStore.getState().map.fogEnabled ? 'Disable Fog' : 'Enable Fog'}
                  </button>
                  <button
                    onClick={() => {
                      useGameStore.getState().resetFog();
                      networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                    }}
                    className="flex-1 text-xs py-1 rounded font-bold bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    Reset Vision
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">Hold <kbd className="bg-gray-800 px-1 rounded">Shift</kbd> and drag on map to reveal areas.</p>
              </div>
            )}

            {/* Dynamic Lighting Controls */}
            {useGameStore.getState().isHost && (
              <div className="mt-4 p-2 bg-gray-900 border border-yellow-700 rounded-lg space-y-2 flex flex-col">
                <h3 className="text-xs font-bold uppercase text-yellow-500 flex items-center justify-between">
                  💡 Dynamic Lighting
                  <button
                    onClick={() => {
                      useGameStore.getState().clearWalls();
                      networkManager.sendAction('SYNC_STATE', { walls: [] });
                    }}
                    className="text-[10px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded hover:bg-red-800"
                  >
                    Clear Walls
                  </button>
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newState = !useGameStore.getState().map.dynamicLightingEnabled;
                      useGameStore.getState().toggleDynamicLighting(newState);
                      networkManager.sendAction('SYNC_STATE', { map: useGameStore.getState().map });
                    }}
                    className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().map.dynamicLightingEnabled ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-green-700 hover:bg-green-600 text-white'
                      }`}
                  >
                    {useGameStore.getState().map.dynamicLightingEnabled ? 'Disable Lighting' : 'Enable Lighting'}
                  </button>
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => useGameStore.getState().setActiveTool('wall')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().activeTool === 'wall' ? 'bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    🧱 Draw Walls
                  </button>
                  <button
                    onClick={() => useGameStore.getState().setActiveTool('door')}
                    className={`flex-1 text-xs py-1 rounded font-bold ${useGameStore.getState().activeTool === 'door' ? 'bg-amber-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    🚪 Draw Door
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">Lines drawn will block vision for all tokens.</p>
              </div>
            )}

            {/* GM Tools: Scene Manager */}
            {useGameStore.getState().isHost && (
              <div className="mt-4 p-2 bg-gray-900 border border-purple-700 rounded-lg space-y-2">
                <h3 className="text-xs font-bold uppercase text-purple-400">🗺️ Scene Manager</h3>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="New Scene Name..."
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white"
                    value={newSceneName}
                    onChange={(e) => setNewSceneName(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!newSceneName.trim()) return;
                      useGameStore.getState().saveScene(newSceneName.trim());
                      setNewSceneName('');
                      // The new scene list syncs automatically if we send state
                      const state = useGameStore.getState();
                      networkManager.sendAction('SYNC_STATE', { scenes: state.scenes, activeSceneId: state.activeSceneId });
                    }}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                  {useGameStore.getState().scenes.map(scene => (
                    <button
                      key={scene.id}
                      onClick={() => {
                        useGameStore.getState().loadScene(scene.id);
                        const state = useGameStore.getState();
                        networkManager.sendAction('SYNC_STATE', {
                          activeSceneId: state.activeSceneId,
                          map: state.map,
                          tokens: state.tokens,
                          drawings: state.drawings,
                          walls: state.walls
                        });
                      }}
                      className={`text-left px-2 py-1 text-xs rounded transition-colors truncate ${useGameStore.getState().activeSceneId === scene.id ? 'bg-purple-800 font-bold' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      {scene.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* GM Tools: Favorite Assets Library */}
            {useGameStore.getState().isHost && (
              <div className="mt-4 p-2 bg-gray-900 border border-emerald-700 rounded-lg space-y-2">
                <h3 className="text-xs font-bold uppercase text-emerald-400 flex justify-between items-center">
                  📚 Asset Library
                  <label className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded hover:bg-emerald-600 cursor-pointer">
                    + Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const imgUrl = ev.target?.result as string;
                            const asset: SavedAsset = {
                              id: Date.now().toString(),
                              name: file.name.split('.')[0],
                              imageUrl: imgUrl,
                              defaultSize: 1
                            };
                            useGameStore.getState().addSavedAsset(asset);
                            networkManager.sendAction('SYNC_STATE', { savedAssets: useGameStore.getState().savedAssets });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </h3>
                {useGameStore.getState().savedAssets.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic">No saved assets. Upload images to create a quick-drop library.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {useGameStore.getState().savedAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="relative group cursor-pointer"
                      >
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-full aspect-square object-cover rounded hover:ring-2 ring-emerald-500 transition-all"
                          title={`Click to drop ${asset.name}`}
                          onClick={() => {
                            const t = {
                              id: Date.now().toString(),
                              x: Math.floor(useGameStore.getState().map.offsetX / -50) + 3, // drop near view center roughly
                              y: Math.floor(useGameStore.getState().map.offsetY / -50) + 3,
                              size: asset.defaultSize,
                              image: asset.imageUrl,
                              label: asset.name,
                              stats: { hp: 10, maxHp: 10, ac: 10 }
                            };
                            networkManager.sendAction('ADD_TOKEN', t);
                          }}
                        />
                        <button
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex"
                          onClick={(e) => {
                            e.stopPropagation();
                            useGameStore.getState().removeSavedAsset(asset.id);
                            networkManager.sendAction('SYNC_STATE', { savedAssets: useGameStore.getState().savedAssets });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs text-yellow-200">
              <p>Debug Info:</p>
              <p>Connected: {networkManager.hostConnection ? 'Yes' : 'No'}</p>
            </div>

            <Jukebox />

            <div className="border-t border-gray-700 my-2 pt-2 space-y-2">
              <button
                className="w-full text-left px-3 py-2 bg-green-900/50 hover:bg-green-800 rounded text-sm transition-colors text-green-100 flex items-center gap-2"
                onClick={() => {
                  const state = useGameStore.getState();
                  const data = {
                    tokens: state.tokens,
                    map: state.map,
                    chat: state.chat,
                    turnOrder: state.turnOrder,
                    version: 1
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `vtt-save-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                💾 Save Campaign
              </button>

              <label className="w-full text-left px-3 py-2 bg-blue-900/50 hover:bg-blue-800 rounded text-sm transition-colors text-blue-100 flex items-center gap-2 cursor-pointer block">
                <span>📂 Load Campaign</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const json = JSON.parse(ev.target?.result as string);
                        if (json.version === 1) {
                          // Sync state via network so all peers get the loaded game
                          networkManager.sendAction('SYNC_STATE', json);
                          alert('Campaign loaded successfully!');
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Failed to load save file.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          <MapBoard onEditToken={setEditingTokenId} />

          {/* HUD Overlays */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="pointer-events-auto p-4 flex flex-col items-start gap-4">
              <TurnTracker />
            </div>
          </div>
        </div>

        {/* Macro Bar at the bottom of the map area */}
        <MacroBar />
      </div>

      {/* Right Sidebar - Chat */}
      <ChatBox />

      {/* Modals */}
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
