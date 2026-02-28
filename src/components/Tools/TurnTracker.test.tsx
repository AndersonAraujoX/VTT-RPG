// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { TurnTracker } from './TurnTracker';
import { useGameStore } from '../../store/gameStore';

// Mock Network
vi.mock('../../services/network', () => ({
    networkManager: {
        sendAction: vi.fn(),
    }
}));

// Mock lucide-react Trash icon
vi.mock('lucide-react', () => ({
    Trash: () => <div data-testid="trash-icon" />
}));

describe('TurnTracker', () => {
    beforeEach(() => {
        // Reset the store
        useGameStore.setState({
            turnOrder: [],
            isHost: true,
            nextTurn: vi.fn(),
            clearInitiative: vi.fn(),
            removeFromInitiative: vi.fn()
        });
    });

    it('returns null and does not crash when turnOrder is empty', () => {
        const { container } = render(<TurnTracker />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null and does not crash when turnOrder is undefined (corrupted save)', () => {
        // Force the corrupted state
        // @ts-ignore
        useGameStore.setState({ turnOrder: undefined });

        const { container, queryByText } = render(<TurnTracker />);

        // Assert it does not crash and renders nothing
        expect(container.firstChild).toBeNull();
        expect(queryByText('Initiative')).toBeNull();
    });
});
