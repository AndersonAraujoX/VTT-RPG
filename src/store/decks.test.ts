import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, Deck, Card } from './gameStore';

describe('Card Deck System', () => {
    beforeEach(() => {
        useGameStore.setState({ decks: [], hands: {} });
    });

    it('should add and remove decks', () => {
        const deck: Deck = {
            id: 'deck1',
            name: 'Test Deck',
            cards: [{ id: 'c1', label: 'Ace', typeId: 'c1' }],
            discard: []
        };

        useGameStore.getState().addDeck(deck);
        expect(useGameStore.getState().decks.length).toBe(1);
        expect(useGameStore.getState().decks[0].name).toBe('Test Deck');

        useGameStore.getState().removeDeck('deck1');
        expect(useGameStore.getState().decks.length).toBe(0);
    });

    it('should draw a card to a player hand', () => {
        const deck: Deck = {
            id: 'deck1',
            name: 'Test Deck',
            cards: [{ id: 'c1', label: 'Ace', typeId: 'c1' }, { id: 'c2', label: 'King', typeId: 'c2' }],
            discard: []
        };
        useGameStore.getState().addDeck(deck);

        useGameStore.getState().drawCard('deck1', 'player1');

        const state = useGameStore.getState();
        expect(state.decks[0].cards.length).toBe(1);
        expect(state.hands['player1']).toBeDefined();
        expect(state.hands['player1'].length).toBe(1);
        expect(state.hands['player1'][0].id).toBe('c1');
    });

    it('should discard a card from hand to discard pile', () => {
        const deck: Deck = {
            id: 'deck1',
            name: 'Test Deck',
            cards: [{ id: 'deck1-c1', label: 'Ace', typeId: 'c1' }],
            discard: []
        };
        useGameStore.getState().addDeck(deck);
        useGameStore.getState().drawCard('deck1', 'player1');

        let state = useGameStore.getState();
        expect(state.hands['player1'].length).toBe(1);
        expect(state.decks[0].discard.length).toBe(0);

        useGameStore.getState().discardCard('player1', 'deck1-c1');

        state = useGameStore.getState();
        expect(state.hands['player1'].length).toBe(0);
        expect(state.decks[0].discard.length).toBe(1);
        expect(state.decks[0].discard[0].id).toBe('deck1-c1');
    });

    it('should shuffle discard pile into deck', () => {
        const deck: Deck = {
            id: 'deck1',
            name: 'Test Deck',
            cards: [{ id: 'c2', label: 'King', typeId: 'c2' }],
            discard: [{ id: 'c1', label: 'Ace', typeId: 'c1' }]
        };
        useGameStore.getState().addDeck(deck);

        useGameStore.getState().shuffleDeck('deck1');

        const state = useGameStore.getState();
        expect(state.decks[0].discard.length).toBe(0);
        expect(state.decks[0].cards.length).toBe(2);
        // order is random, so we just check length
    });
});
