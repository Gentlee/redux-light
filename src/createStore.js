'use strict';

let defaultReducer = (baseState, stateChanges) => {
    let newState = { ...baseState };
    for (let key in stateChanges) {
        if (key === 'type') continue;
        if (!baseState.hasOwnProperty(key)) {
            throw new Error(`No root property with name '${key}' found in the old state.`);
        }
        newState[key] = { ...baseState[key], ...stateChanges[key] };
    }
    return newState;
};

export default function(initialState, { reducer = defaultReducer, requireType = true } = {}) {
    let store = {
        initialState,
        reducer,
        state: initialState,
        listeners: [],
    };

    let enumeratingListeners = false;
        
    store.subscribe = (listener) => {
        if (enumeratingListeners) throw new Error('You can\'t subscribe in state listener.');

        store.listeners.push(listener);
        let subscribed = true;

        return () => {
            if (enumeratingListeners) throw new Error('You can\'t unsubscribe in state listener.');
            if (!subscribed) return;
            
            let index = store.listeners.indexOf(listener);
            store.listeners.splice(index, 1);
            subscribed = false;
        };
    }
    
    store.setState = (arg1, arg2, arg3) => {
        let state = getStateFromArgs(arg1, arg2, arg3);
        setStateImpl(state);
    }

    store.resetState = (arg1, arg2, arg3) => {
        let state = getStateFromArgs(arg1, arg2, arg3);
        setStateImpl(state, true);
    }

    function setStateImpl(stateChanges, reset = false) {
        if (enumeratingListeners) throw new Error('You can\'t set state in state listener.');
        if (requireType && !stateChanges.type) throw new Error('Missing \'type\' parameter in state changes.');

        let previousState = store.state;
        store.state = reducer(reset ? initialState : store.state, stateChanges);
    
        enumeratingListeners = true;
        for (let listener of store.listeners) {
            listener(previousState, store.state, stateChanges);
        }
        enumeratingListeners = false;
    }

    store.getState = () => store.state;

    store.dispatch = store.setState;

    return store;
}

function getStateFromArgs(arg1, arg2, arg3) {
    let state;
    if (typeof arg1 === 'string') {
        let type = arg1;
        if (typeof arg2 === 'string') {
            state = {};
            state[arg2] = arg3;
        } else {
            state = arg2 || {};
        }
        state.type = type;
    } else {
        state = arg1;
    }
    return state;
}