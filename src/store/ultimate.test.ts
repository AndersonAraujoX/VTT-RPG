import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, type TextItem, type Token } from './gameStore';

describe('GameStore - Ultimate Modules', () => {
    beforeEach(() => {
        // Reset store state before each test
        useGameStore.setState({
            tokens: [],
            texts: [],
            activeTool: 'pan',
            myId: 'user1',
            isHost: true
        });
    });

    describe('Map Text Tool', () => {
        it('should add a text item', () => {
            const store = useGameStore.getState();
            const newText: TextItem = {
                id: 'text1',
                x: 100,
                y: 100,
                text: 'Hello World',
                color: '#ffffff',
                fontSize: 24
            };

            store.addText(newText);

            expect(useGameStore.getState().texts.length).toBe(1);
            expect(useGameStore.getState().texts[0].text).toBe('Hello World');
        });

        it('should remove a text item', () => {
            const store = useGameStore.getState();
            const newText: TextItem = {
                id: 'text1',
                x: 100,
                y: 100,
                text: 'Hello World',
                color: '#ffffff',
                fontSize: 24
            };

            store.addText(newText);
            useGameStore.getState().removeText('text1');

            expect(useGameStore.getState().texts.length).toBe(0);
        });

        it('should clear all texts', () => {
            const store = useGameStore.getState();
            store.addText({ id: 't1', x: 0, y: 0, text: 'A', color: '#fff', fontSize: 12 });
            store.addText({ id: 't2', x: 10, y: 10, text: 'B', color: '#fff', fontSize: 12 });

            useGameStore.getState().clearTexts();

            expect(useGameStore.getState().texts.length).toBe(0);
        });
    });

    describe('Text Tool State', () => {
        it('should set active tool to text', () => {
            useGameStore.getState().setActiveTool('text');
            expect(useGameStore.getState().activeTool).toBe('text');
        });
    });

    describe('Auras', () => {
        it('should add an aura to a token', () => {
            const token: Token = { id: 't1', x: 0, y: 0, size: 1, image: '' };
            useGameStore.getState().addToken(token);

            useGameStore.getState().updateToken('t1', {
                auras: [{ id: 'a1', radius: 10, color: '#ff0000' }]
            });

            const updatedToken = useGameStore.getState().tokens[0];
            expect(updatedToken.auras?.length).toBe(1);
            expect(updatedToken.auras?.[0].radius).toBe(10);
        });
    });
});
