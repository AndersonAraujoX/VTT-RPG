import { useEffect, useState } from 'react';
import { MapBoard } from './components/MapBoard';
import { ChatBox } from './components/Chat/ChatBox';
import { TurnTracker } from './components/Tools/TurnTracker';
import { networkManager } from './services/network';
import { useGameStore } from './store/gameStore';

function App() {
  const [targetPeerId, setTargetPeerId] = useState('');
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

            <div className="mt-4 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-xs text-yellow-200">
              <p>Debug Info:</p>
              <p>Connected: {networkManager.hostConnection ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          <MapBoard />

          {/* HUD Overlays */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="pointer-events-auto p-4">
              <TurnTracker />
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Chat */}
      <ChatBox />
    </div>
  );
}

export default App;
