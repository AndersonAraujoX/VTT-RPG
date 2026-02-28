// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MacroBar } from './MacroBar';
import { useGameStore } from '../../store/gameStore';

// Mock Network since MacroBar uses networkManager
vi.mock('../../services/network', () => ({
    networkManager: {
        sendAction: vi.fn(),
    }
}));

describe('MacroBar', () => {
    beforeEach(() => {
        // Reset the store to a valid default state first, then force undefined for our test case
        useGameStore.setState({
            macros: [],
            myId: 'test-user',
            username: 'Test User',
            addMacro: vi.fn(),
            removeMacro: vi.fn()
        });
    });

    it('renders without crashing even if macros is undefined in the store (corrupted save)', () => {
        // Force the corrupted state that was causing the crash
        // @ts-ignore
        useGameStore.setState({ macros: undefined });

        // If the component is not resilient, render() will throw an error
        const { getByText } = render(<MacroBar />);

        // Assert the component header renders successfully despite undefined array
        expect(getByText('Macros')).toBeTruthy();
    });
});
