import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PromiseController from "../lib/PromiseController";
function isPromise(object) {
    return object instanceof Promise;
}
var State;
(function (State) {
    State["IDLE"] = "idle";
    State["PENDING"] = "pending";
    State["UNKNOWN"] = "unknown";
    State["FULFILLED"] = "fulfilled";
    State["REJECTED"] = "rejected";
    State["SETTLED"] = "settled";
})(State || (State = {}));
function PromiseState(state) {
    return {
        state,
        get isIdle() {
            return this.state == State.IDLE;
        },
        get isPending() {
            return this.state == State.PENDING;
        },
        get isUnknown() {
            return this.state == State.IDLE || this.state == State.PENDING;
        },
        get isFulfilled() {
            return this.state == State.FULFILLED;
        },
        get isRejected() {
            return this.state == State.REJECTED;
        },
        get isSettled() {
            return this.state == State.FULFILLED || this.state == State.REJECTED;
        }
    };
}
/**
 * Wraps a `async function` and gives you more control over its `Promise`.
 *
 * @param callback Wrapped function.
 */
function useAsync(callback, args, options) {
    const config = useMemo(() => Array.isArray(args) ? options : args, [args, options]);
    const [value, setValue] = useState(config?.defaults?.value ?? null);
    const [reason, setReason] = useState(config?.defaults?.reason ?? null);
    const [state, setState] = useState(PromiseState(State.IDLE));
    const [promise, setPromise] = useState(null);
    const mounted = useRef(false);
    const setData = (value) => {
        if (!mounted.current)
            return;
        if (config) {
            if (config.persistent) {
                if (value === null)
                    return;
                setValue(value);
            }
            else {
                setValue(value ?? (config.defaults.value ?? null));
            }
        }
        else {
            if (value === null)
                return;
            setValue(value);
        }
    };
    const setError = (reason) => {
        if (!mounted.current)
            return;
        if (config) {
            if (config.persistent) {
                if (reason === null)
                    return;
                setReason(reason);
            }
            else {
                setReason(reason ?? (config.defaults.reason ?? null));
            }
        }
        else {
            if (reason === null)
                return;
            setReason(reason);
        }
    };
    const setCycle = (state) => {
        setState(PromiseState(state));
    };
    // #region Handlers
    const onFulfilled = (value) => {
        if (!mounted.current)
            return;
        if (isPromise(value)) {
            setCycle(State.PENDING);
            const promise = new PromiseController((resolve, reject) => {
                value.then(resolve, reject);
            });
            setPromise(promise);
            promise.then(onFulfilled, onRejected);
        }
        else {
            setCycle(State.FULFILLED);
            setData(value);
        }
    };
    const onRejected = (reason) => {
        if (!mounted.current)
            return;
        setCycle(State.REJECTED);
        setError(reason);
    };
    // #endregion
    // #region Controllers
    const trigger = useCallback((...args) => {
        if (!mounted.current)
            return;
        setCycle(State.PENDING);
        const promise = new PromiseController((resolve, reject) => {
            callback(...args).then(resolve, reject);
        });
        setPromise(promise);
        promise.then(onFulfilled, onRejected);
        return promise;
    }, [callback]);
    const resolve = useCallback((value) => {
        if (promise)
            promise.resolve(value);
    }, [promise]);
    const reject = useCallback((reason) => {
        if (promise)
            promise.reject(reason);
    }, [promise]);
    const cancel = useCallback(() => {
        if (!mounted.current && !state.isPending)
            return;
        setCycle(State.IDLE);
        setData(null);
        setError(null);
    }, [state.state]);
    const idle = useCallback(() => {
        if (!mounted.current && !state.isSettled)
            return;
        setCycle(State.IDLE);
        setData(null);
        setError(null);
    }, [state.state]);
    // #endregion
    // #region UI
    const Idle = useCallback(({ render, children }) => {
        if (state.isIdle)
            return render ? render() : children;
        return null;
    }, [state.state]);
    const Pending = useCallback(({ render, children }) => {
        if (state.isPending)
            return render ? render() : children;
        return null;
    }, [state.state]);
    const Unknown = useCallback(({ render, children }) => {
        if (state.isUnknown)
            return render ? render() : children;
        return null;
    }, [state.state]);
    const Fulfilled = useCallback(({ render, children }) => {
        if (state.isFulfilled)
            return render && value ? render(value) : children;
        return null;
    }, [state.state]);
    const Rejected = useCallback(({ render, children }) => {
        if (state.isRejected)
            return render ? render(reason) : children;
        return null;
    }, [state.state]);
    const Settled = useCallback(({ render, children }) => {
        if (state.isSettled)
            return render ? render() : children;
        return null;
    }, [state.state]);
    // #endregion
    useEffect(() => {
        mounted.current = true;
        if (Array.isArray(args))
            trigger(...args);
        return () => {
            mounted.current = false;
        };
    }, []);
    return {
        value, reason,
        trigger, idle, cancel, resolve, reject,
        Idle, Pending, Unknown, Fulfilled, Rejected, Settled
    };
}
export default useAsync;
