'use strict';

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

export default function(initialState, { requireType = true } = {}) {
    const store = {
        initialState,
        state: initialState,
        listeners: []
    };

    let enumeratingListeners = false;
    let nextListeners = null;
    let nextNotifications = [];

    const getNextListeners = () => {
        if (nextListeners === null) {
            nextListeners = store.listeners.slice();
        }
        return nextListeners;
    }
        
    store.subscribe = (listener) => {
        const listeners = enumeratingListeners ? getNextListeners() : store.listeners;
        listeners.push(listener);
        
        let subscribed = true;

        return () => {
            if (!subscribed) return;

            const listeners = enumeratingListeners ? getNextListeners() : store.listeners;
            const index = listeners.indexOf(listener);
            listeners.splice(index, 1);
            
            subscribed = false;
        };
    }
    
    store.setState = (arg1, arg2, arg3) => {
        const state = getStateFromArgs(arg1, arg2, arg3);
        setStateImpl(state);
    }

    store.resetState = (arg1, arg2, arg3) => {
        const state = getStateFromArgs(arg1, arg2, arg3);
        setStateImpl(state, true);
    }

    function setStateImpl(stateChanges, reset = false) {
        if (requireType && !stateChanges.type) throw new Error('Missing \'type\' parameter in state changes.');

        const previousState = store.state;
        store.state = reducer(reset ? initialState : store.state, stateChanges);
    
        if (enumeratingListeners) {
            nextNotifications.push([previousState, store.state, stateChanges]);
            return;
        }

        notifyListeners(previousState, store.state, stateChanges);

        if (nextNotifications.length !== 0) {
            for (let i = 0;; i++) {
                let args = nextNotifications[i];
                if (args === undefined) break;
                notifyListeners(args[0], args[1], args[2]);
            }
    
            nextNotifications.length = 0;
        }
    }

    function notifyListeners(previousState, state, stateChanges) {
        enumeratingListeners = true;
        for (let listener of store.listeners) {
            listener(previousState, store.state, stateChanges);
        }
        enumeratingListeners = false;

        if (nextListeners) {
            store.listeners = nextListeners;
            nextListeners = null;
        }
    }

    // for compability with redux
    store.getState = () => store.state;
    store.dispatch = store.setState;

    return store;
}

function getStateFromArgs(arg1, arg2, arg3) {
    let state;
    if (typeof arg1 === 'string') {
        const type = arg1;
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