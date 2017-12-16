'use strict';

import createStore from '../src/createStore';

describe('createStore', () => {
    it('should create store with initial state', () => {
        let initialState = { test: { counter: 0 } };
        let store = createStore(initialState);

        expect(store.getState()).toEqual(initialState);
    });

    it('should allow to set custom reducer', () => {
        let initialState = { test: { counter: 0 } };
        let reducerFn = jest.fn();
        let reducer = (oldState, newState) => {
            reducerFn();
            return { ...newState };
        };
        
        let store = createStore(initialState, { reducer });
        let newState = { test1: {} };
        store.setState('TEST_REDUCER', newState);

        expect(reducerFn).toBeCalled();
        expect(store.state).toEqual(newState);
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
    
    it('should not allow set state in a listener', () => {
        let store = createStore({ test: { counter: 0 } });

        let unsubscribe = store.subscribe(() => {
            expect(() => {
                store.setState({ type: 'TEST', test: { counter: 2 } });        
            }).toThrow();
        });

        store.setState({ type: 'TEST', test: { counter: 1 } });
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

    it('should not allow subscribe in a listener', () => {
        let store = createStore({ test: { counter: 0 } });

        store.subscribe(() => {
            expect(() => {
                store.subscribe(() => {});
            }).toThrow();
        });

        store.setState({ type: 'TEST', test: { counter: 1 } });
    });

    it('should not allow unsubscribe in a listener', () => {
        let store = createStore({ test: { counter: 0 } });

        let unsubscribe = store.subscribe(() => {
            expect(() => {
                unsubscribe();
            }).toThrow();
        });

        store.setState({ type: 'TEST', test: { counter: 1 } });
    });
});