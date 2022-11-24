import { useMemo, useState } from "react";
export var State;
(function (State) {
    State[State["IDLE"] = 0] = "IDLE";
    State[State["PENDING"] = 1] = "PENDING";
    State[State["FULFILLED"] = 2] = "FULFILLED";
    State[State["REJECTED"] = 3] = "REJECTED";
})(State || (State = {}));
function useStateController(initialState) {
    const [state, setState] = useState(initialState ? State[initialState] : State.IDLE);
    const controller = useMemo(() => {
        return {
            get value() {
                return state;
            },
            get isIdle() {
                return state == State.IDLE;
            },
            get isPending() {
                return state == State.PENDING;
            },
            get isUnknown() {
                return state == State.IDLE || state == State.PENDING;
            },
            get isFulfilled() {
                return state == State.FULFILLED;
            },
            get isRejected() {
                return state == State.REJECTED;
            },
            get isSettled() {
                return state == State.FULFILLED || state == State.REJECTED;
            },
            pending() {
                setState(State.PENDING);
            },
            fulfilled() {
                setState(State.FULFILLED);
            },
            rejected() {
                setState(State.REJECTED);
            },
            idle() {
                setState(State.IDLE);
            }
        };
    }, [state]);
    return controller;
}
export default useStateController;
