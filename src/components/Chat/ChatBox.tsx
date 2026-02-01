import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, type ChatMessage } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { v4 as uuidv4 } from 'uuid';
import { Send, Scroll } from 'lucide-react';
import { rollDice } from '../../utils/dice';

export const ChatBox: React.FC = () => {
    const [input, setInput] = useState('');
    const messages = useGameStore(s => s.chat);
    const myName = useGameStore(s => s.username);
    const myId = useGameStore(s => s.myId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        let msg: ChatMessage = {
            id: uuidv4(),
            senderId: myId,
            senderName: myName,
            timestamp: Date.now(),
            content: input,
            type: 'text'
        };

        if (input.startsWith('/roll ')) {
            const formula = input.replace('/roll ', '').trim();
            const result = rollDice(formula);

            if (result) {
                msg.type = 'roll';
                msg.rollData = {
                    formula: formula,
                    result: result.total,
                    details: `[${result.rolls.join(', ')}] ${result.mod ? (result.mod > 0 ? '+' + result.mod : result.mod) : ''}`
                };
                msg.content = `rolled ${formula} = ${result.total}`;
            } else {
                msg.type = 'system';
                msg.content = 'Invalid dice formula. Use format like 1d20+5';
            }
        }

        networkManager.sendAction('ADD_CHAT', msg);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 w-80">
            <div className="p-3 border-b border-gray-700 bg-gray-800 font-bold text-gray-200 flex items-center gap-2">
                <Scroll size={18} /> Chat & Logs
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                    <div key={m.id} className={`text-sm ${m.type === 'system' ? 'text-yellow-400 italic' : ''}`}>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span className="font-bold text-blue-400">{m.senderName}</span>
                            <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>

                        {m.type === 'roll' ? (
                            <div className="bg-gray-800 p-2 rounded border border-gray-700">
                                <div className="font-mono text-lg font-bold text-green-400">{m.rollData?.result}</div>
                                <div className="text-xs text-gray-400">{m.rollData?.formula} ({m.rollData?.details})</div>
                            </div>
                        ) : (
                            <div className="text-gray-300 break-words">{m.content}</div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
                <input
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="/roll 1d20 or message..."
                />
                <button
                    onClick={handleSend}
                    className="bg-blue-600 hover:bg-blue-500 rounded px-3 py-1 flex items-center justify-center text-white"
                >
                    <Send size={16} />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-1 p-2 bg-gray-800 border-t border-gray-700">
                {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                    <button
                        key={d}
                        onClick={() => { setInput(`/roll 1${d}`); handleSend(); }}
                        className="bg-gray-700 hover:bg-gray-600 text-xs py-1 rounded text-gray-300"
                    >
                        {d}
                    </button>
                ))}
            </div>
        </div>
    );
};
