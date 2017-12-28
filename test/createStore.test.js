'use strict';

import createStore from '../src/createStore';

describe('createStore', () => {
    it('should create store with initial state', () => {
        let initialState = { test: { counter: 0 } };
        let store = createStore(initialState);

        expect(store.getState()).toEqual(initialState);
    });
    
    it('should allow to disable type', () => {
        let initialState = { test: { counter: 0 } };
        let store = createStore(initialState, { requireType: false });

        store.setState({ test: { counter: 1 } });
    });
});

describe('setState', () => {
    it('should set state', () => {
        let initialState = {
            test: {
                counter: 0,
                items: {}
            }
        };
        let store = createStore(initialState);
        let newItems = { '0': 'hello' };

        store.setState({
            type: 'TEST_1',
            test: { items: newItems }
        });

        expect(store.getState()).toEqual({
            test: {
                counter: 0,
                items: newItems
            }
        });

        store.setState('TEST_2', { test: { counter: 66 } });

        expect(store.getState()).toEqual({
            test: {
                counter: 66,
                items: newItems
            }
        });

        store.setState('TEST_3', 'test', { counter: 80 });

        expect(store.getState().test.counter).toEqual(80);
    });
    
    it('should not allow to add new root properties', () => {
        let initialState = { test: { counter: 0 } };
        let store = createStore(initialState);

        expect(() => {
            store.setState({
                type: 'TEST',
                newRoot: { counter: 0 }
            });
        }).toThrow();
    });
    
    it('should allow set state in a listener', () => {
        let store = createStore({ test: { counter: 0 } });
        let parametersBefore = [];
        let parametersAfter = [];
        let statesBefore = [];
        let statesAfter = [];
        let stateChanged = jest.fn();

        store.subscribe((oldState, state, changes) => {
            stateChanged('before');
            parametersBefore.push({ oldState, state, changes });
            statesBefore.push(store.state);
            
            if (store.getState().test.counter === 1) {
                store.setState({ type: 'TEST', test: { counter: 2 } });
            }

            stateChanged('after');
            parametersAfter.push({ oldState, state, changes });
            statesAfter.push(store.state);
        });

        store.setState({ type: 'TEST', test: { counter: 1 } });
        
        expect(stateChanged.mock.calls).toEqual([['before'], ['after'], ['before'], ['after']]);

        expect(parametersBefore.length).toBe(2);
        expect(parametersBefore).toEqual(parametersAfter);
        expect(parametersBefore[0].oldState.test.counter).toBe(0);
        expect(parametersBefore[0].state.test.counter).toBe(1);
        expect(parametersBefore[0].changes.test.counter).toBe(1);
        expect(parametersBefore[1].oldState.test.counter).toBe(1);
        expect(parametersBefore[1].state.test.counter).toBe(2);
        expect(parametersBefore[1].changes.test.counter).toBe(2);

        expect(statesBefore.length).toBe(2);
        expect(statesBefore[0].test.counter).toBe(1);
        expect(statesBefore[1].test.counter).toBe(2);

        expect(statesAfter.length).toBe(2);
        expect(statesAfter[0].test.counter).toBe(2);
        expect(statesAfter[1].test.counter).toBe(2);
    });
    
    it('should throw exception without type', () => {
        let store = createStore({ test: { counter: 0 } });
    
        expect(() => {
            store.setState({ test: { counter: 1 } });
        }).toThrow();
    });
});

describe('resetState', () => {
    it('should reset state', () => {
        let initialState = { test: { counter: 0 } };
        let store = createStore(initialState);

        store.setState({
            type: 'TEST',
            test: { counter: 27 }
        });
        store.resetState({ type: 'RESET_STATE' });

        expect(store.getState()).toEqual(initialState);
    });
});

describe('subscribe', () => {
    it('should subscribe', () => {
        let initialState = { test: { counter: 0 } };
        let store = createStore(initialState);
        let newState = {
            type: 'TEST',
            test: { counter: 1 }
        };

        store.subscribe((prev, state, changes) => {
            expect(prev).toEqual(initialState);
            expect(state).toEqual({ test: { counter: 1 }});
            expect(changes).toBe(newState);
        });

        store.setState(newState);
    });

    it('should unsubscribe', () => {
        let store = createStore({ test: { counter: 0 } });
        let onChange = jest.fn();

        let unsubscribe = store.subscribe(onChange);
        unsubscribe();

        store.setState('TEST', { test: { counter: 27 } });

        expect(onChange).not.toBeCalled();
    });

    it('unsubscribe multiple times shouldn\'t throw exception', () => {
        let store = createStore({ test: { counter: 0 } });

        let unsubscribe = store.subscribe(() => {});

        unsubscribe();
        unsubscribe();
        unsubscribe();
    });

    it('should allow subscribe in a listener', () => {
        let store = createStore({ test: { counter: 0 } });
        let onChange = jest.fn();

        store.subscribe(() => {
            store.subscribe(() => onChange());
            onChange();
        });

        store.setState({ type: 'TEST1', test: { counter: 1 } });
        store.setState({ type: 'TEST2', test: { counter: 2 } });

        expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('should allow unsubscribe in a listener', () => {
        let store = createStore({ test: { counter: 0 } });
        let onChange = jest.fn();

        let unsubscribe = store.subscribe(() => {
            unsubscribe();
            onChange();
        });

        store.setState({ type: 'TEST1', test: { counter: 1 } });
        store.setState({ type: 'TEST2', test: { counter: 2 } });

        expect(onChange).toHaveBeenCalledTimes(1);
    });
});