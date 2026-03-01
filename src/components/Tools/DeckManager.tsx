import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Deck, Card } from '../../store/gameStore';
import { networkManager } from '../../services/network';
import { Layers, Plus, RefreshCw, Hand } from 'lucide-react';

const createStandardDeck = (name: string): Deck => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const cards: Card[] = [];
    const deckId = Date.now().toString();

    suits.forEach(suit => {
        values.forEach(val => {
            cards.push({
                id: `${deckId}-${suit}-${val}`,
                typeId: `${val} of ${suit}`,
                label: `${val} of ${suit}`
            });
        });
    });

    cards.push({ id: `${deckId}-joker-1`, typeId: 'Joker', label: 'Joker' });
    cards.push({ id: `${deckId}-joker-2`, typeId: 'Joker', label: 'Joker' });

    return { id: deckId, name, cards, discard: [] };
};

export const DeckManager: React.FC = () => {
    const isHost = useGameStore(s => s.isHost);
    const myId = useGameStore(s => s.myId);
    const decks = useGameStore(s => s.decks);
    const hands = useGameStore(s => s.hands);

    const [isOpen, setIsOpen] = useState(false);

    const myHand = hands[myId] || [];

    const handleCreateDeck = () => {
        const newDeck = createStandardDeck(`Playing Cards ${decks.length + 1}`);
        useGameStore.getState().addDeck(newDeck);
        useGameStore.getState().shuffleDeck(newDeck.id);
        syncState();
    };

    const drawCard = (deckId: string) => {
        useGameStore.getState().drawCard(deckId, myId);
        syncState();
    };

    const shuffle = (deckId: string) => {
        useGameStore.getState().shuffleDeck(deckId);
        syncState();
    };

    const discard = (cardId: string) => {
        useGameStore.getState().discardCard(myId, cardId);
        syncState();
    };

    const syncState = () => {
        const state = useGameStore.getState();
        networkManager.sendAction('SYNC_STATE', { decks: state.decks, hands: state.hands });
    };

    return (
        <div className="absolute bottom-4 left-64 z-40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 bg-gray-900/80 backdrop-blur-md rounded-full text-white shadow-lg border border-white/10 hover:bg-gray-800 transition-colors"
                title="Decks & Hand"
            >
                <Layers size={20} className={myHand.length > 0 ? "text-purple-400" : ""} />
            </button>

            {isOpen && (
                <div className="absolute bottom-16 left-0 w-80 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[600px] text-white">
                    <div className="p-3 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                        <h2 className="font-bold flex items-center gap-2"><Layers size={16} /> Decks & Hand</h2>
                    </div>

                    <div className="p-3 flex-1 overflow-y-auto space-y-4">
                        {/* My Hand Section */}
                        <div>
                            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-1">
                                <Hand size={14} /> My Hand ({myHand.length})
                            </h3>
                            {myHand.length === 0 ? (
                                <p className="text-xs text-gray-500 italic">Empty</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {myHand.map(card => (
                                        <div key={card.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center group flex-col text-center">
                                            <span className="text-xs font-semibold">{card.label}</span>
                                            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => discard(card.id)} className="text-xs text-red-400 hover:text-red-300" title="Discard">
                                                    Discard
                                                </button>
                                                <button onClick={() => { /* Reveal logic later */ }} className="text-xs text-blue-400 hover:text-blue-300" title="Reveal">
                                                    Play
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Available Decks Section */}
                        <div className="border-t border-white/10 pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-bold uppercase text-gray-400">Available Decks</h3>
                                {isHost && (
                                    <button onClick={handleCreateDeck} className="text-xs bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded flex items-center gap-1">
                                        <Plus size={12} /> New Deck
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                {decks.length === 0 ? (
                                    <p className="text-xs text-gray-500 italic">No decks on the table.</p>
                                ) : (
                                    decks.map(deck => (
                                        <div key={deck.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-bold">{deck.name}</div>
                                                <div className="text-xs text-gray-400">Cards: {deck.cards.length} | Discards: {deck.discard.length}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => drawCard(deck.id)}
                                                    disabled={deck.cards.length === 0}
                                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded"
                                                    title="Draw to Hand"
                                                >
                                                    <Hand size={14} />
                                                </button>
                                                {isHost && (
                                                    <button
                                                        onClick={() => shuffle(deck.id)}
                                                        className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded"
                                                        title="Shuffle Discards into Deck"
                                                    >
                                                        <RefreshCw size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
