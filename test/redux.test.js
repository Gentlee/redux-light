import { createStore } from 'redux';

const reducer = (baseState, stateChanges) => {
    const newState = { ...baseState };
    for (let key in stateChanges) { 
        if (key === 'type') continue;
        if (!baseState.hasOwnProperty(key)) {
            throw new Error(`No root property with name '${key}' found in the old state.`);
        }
        newState[key] = { ...baseState[key], ...stateChanges[key] };
    }
    return newState;
};

it('setState on subscribe', () => {
    const store = createStore(reducer, { test: { counter: 0 } });
    const onChange1 = jest.fn();
    const onChange2 = jest.fn();

    let unsubscribe = store.subscribe(() => {
        onChange1();
        expect(onChange2).toHaveBeenCalledTimes(0);
        if (store.getState().test.counter === 1) {
            store.dispatch({ type: 'TEST', test: { counter: 2 } });
        }
        expect(store.getState().test.counter).toBe(2);
        onChange2();
    });

    store.dispatch({ type: 'TEST', test: { counter: 1 } });
    
    expect(store.getState().test.counter).toBe(2);
    expect(onChange1).toHaveBeenCalledTimes(2);
    expect(onChange2).toHaveBeenCalledTimes(2);
});