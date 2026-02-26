import React, { useState } from 'react';
import { useGameStore, type Macro } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { v4 as uuidv4 } from 'uuid';

export const MacroBar: React.FC = () => {
    const macros = useGameStore(s => s.macros);
    const addMacro = useGameStore(s => s.addMacro);
    const removeMacro = useGameStore(s => s.removeMacro);
    const myId = useGameStore(s => s.myId);
    const username = useGameStore(s => s.username);

    const [isEditing, setIsEditing] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newCommand, setNewCommand] = useState('');

    const handleExecute = (macro: Macro) => {
        // Evaluate macro command (mostly for rolls)
        if (macro.command.startsWith('/roll ')) {
            const formula = macro.command.replace('/roll ', '').trim();
            // Basic dice parsing (e.g. 1d20+5). Real parsing is done in ChatBox usually,
            // but for simplicity we will fake a roll or use a simple logic here if we don't extract the dice parser.
            // A better way is to send the raw command to chat and let chat parse it, 
            // but chat is a generic component. We will publish a system message or a roll.

            // Let's implement a rudimentary dice parser here just to make the macro work without refactoring ChatBox.
            const match = formula.match(/(\d+)d(\d+)(.*?)([\+\-]\d+)?$/);
            if (match) {
                const num = parseInt(match[1]) || 1;
                const faces = parseInt(match[2]) || 20;
                const modifierStr = match[4] || '';
                const modifier = parseInt(modifierStr) || 0;

                let sum = 0;
                const rolls = [];
                for (let i = 0; i < num; i++) {
                    const r = Math.floor(Math.random() * faces) + 1;
                    rolls.push(r);
                    sum += r;
                }
                const total = sum + modifier;

                const rollData = {
                    formula,
                    result: total,
                    details: `[${rolls.join(', ')}] ${modifierStr}`
                };

                const msg = {
                    id: uuidv4(),
                    senderId: myId,
                    senderName: username,
                    timestamp: Date.now(),
                    content: `${macro.label} (${formula})`,
                    type: 'roll' as const,
                    rollData
                };

                networkManager.sendAction('CHAT_MESSAGE', msg);
                useGameStore.getState().addChatMessage(msg);
            } else {
                // If it doesn't parse as a roll, just send it as text
                const msg = {
                    id: uuidv4(),
                    senderId: myId,
                    senderName: username,
                    timestamp: Date.now(),
                    content: `[Macro: ${macro.label}] ${macro.command}`,
                    type: 'text' as const
                };
                networkManager.sendAction('CHAT_MESSAGE', msg);
                useGameStore.getState().addChatMessage(msg);
            }
        } else {
            const msg = {
                id: uuidv4(),
                senderId: myId,
                senderName: username,
                timestamp: Date.now(),
                content: `[Macro: ${macro.label}] ${macro.command}`,
                type: 'text' as const
            };
            networkManager.sendAction('CHAT_MESSAGE', msg);
            useGameStore.getState().addChatMessage(msg);
        }
    };

    const handleSave = () => {
        if (!newLabel || !newCommand) return;
        addMacro({
            id: uuidv4(),
            label: newLabel,
            command: newCommand
        });
        setNewLabel('');
        setNewCommand('');
        setIsEditing(false);
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-gray-900 border-t border-gray-700 pointer-events-auto">
            <span className="text-gray-500 text-xs font-bold uppercase mr-2">Macros</span>

            {macros.map(m => (
                <div key={m.id} className="group relative flex items-center">
                    <button
                        onClick={() => handleExecute(m)}
                        className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-purple-300 font-mono text-sm rounded border border-gray-600 transition-colors"
                        title={m.command}
                    >
                        {m.label}
                    </button>
                    <button
                        onClick={() => removeMacro(m.id)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        ×
                    </button>
                </div>
            ))}

            {isEditing ? (
                <div className="flex gap-2 items-center bg-gray-800 p-1 rounded border border-gray-600 ml-2">
                    <input
                        type="text"
                        placeholder="Label (e.g. Attack)"
                        className="bg-gray-900 px-2 py-1 text-xs rounded w-24 text-white"
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Cmd (e.g. /roll 1d20+5)"
                        className="bg-gray-900 px-2 py-1 text-xs rounded w-32 text-white"
                        value={newCommand}
                        onChange={e => setNewCommand(e.target.value)}
                    />
                    <button onClick={handleSave} className="text-green-400 hover:text-green-300 px-2 text-xs font-bold">✓</button>
                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-300 px-2 text-xs">✕</button>
                </div>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 border-dashed rounded text-gray-400"
                    title="Add Macro"
                >
                    +
                </button>
            )}
        </div>
    );
};
