import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PromiseController from "./lib/PromiseController";
import useStateController from "./hooks/useStateController";
function isPromise(object) {
    return object instanceof Promise;
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
    const [promise, setPromise] = useState(null);
    const state = useStateController();
    const mounted = useRef(false);
    const setData = (value) => {
        if (!mounted.current)
            return;
        if (config) {
            if (config.persistent) {
                if (value === null && state.isUnknown)
                    return;
                setValue(value);
            }
            else {
                setValue(value ?? (config.defaults?.value ?? null));
            }
        }
        else {
            if (value === null && state.isUnknown)
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
                setReason(reason ?? (config.defaults?.reason ?? null));
            }
        }
        else {
            if (reason === null)
                return;
            setReason(reason);
        }
    };
    // #region Handlers
    const onFulfilled = (value) => {
        if (!mounted.current)
            return;
        if (isPromise(value)) {
            state.pending();
            const promise = new PromiseController((resolve, reject) => {
                value.then(resolve, reject);
            });
            setPromise(promise);
            promise.then(onFulfilled, onRejected);
        }
        else {
            state.fulfilled();
            setData(value);
        }
    };
    const onRejected = (reason) => {
        if (!mounted.current)
            return;
        state.rejected();
        setError(reason);
    };
    // #endregion
    // #region Controllers
    const trigger = useCallback((...args) => {
        if (!mounted.current)
            return;
        state.pending();
        const promise = new PromiseController((resolve, reject) => {
            callback(...args).then(resolve, reject);
        });
        setPromise(promise);
        setData(null);
        setError(null);
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
        state.idle();
        setPromise(null);
        promise?.reject(null);
        setData(null);
        setError(null);
    }, [state.value]);
    const idle = useCallback(() => {
        if (!mounted.current && !state.isSettled)
            return;
        state.idle();
        setPromise(null);
        setData(null);
        setError(null);
    }, [state.value]);
    // #endregion
    // #region UI
    const Idle = useCallback(({ render, children }) => {
        if (state.isIdle)
            return render ? render() : children;
        return null;
    }, [state.value]);
    const Pending = useCallback(({ render, children }) => {
        if (state.isPending)
            return render ? render() : children;
        return null;
    }, [state.value]);
    const Unknown = useCallback(({ render, children }) => {
        if (state.isUnknown)
            return render ? render() : children;
        return null;
    }, [state.value]);
    const Fulfilled = useCallback(({ render, children }) => {
        if (state.isFulfilled)
            return render && value ? render(value) : children;
        return null;
    }, [state.value]);
    const Rejected = useCallback(({ render, children }) => {
        if (state.isRejected)
            return render ? render(reason) : children;
        return null;
    }, [state.value]);
    const Settled = useCallback(({ render, children }) => {
        if (state.isSettled)
            return render ? render() : children;
        return null;
    }, [state.value]);
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
