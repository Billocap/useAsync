import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react"

import PromiseController from "./lib/PromiseController"
import useStateController from "./hooks/useStateController"

type AsyncFunction<T> = (...args: any[]) => Promise<T>

interface WithRenderProps<T> {
  render?: (value?: T) => any
}

type StateComponent<T = undefined> = (props: PropsWithChildren<WithRenderProps<T>>) => JSX.Element

function isPromise<T>(object: any): object is Promise<T> {
  return object instanceof Promise
}

interface AsyncControl<T> {
  value: T | null,
  reason: any,
  trigger: (...args: any[]) => Promise<T> | undefined,
  cancel: () => void,
  idle: () => void,
  resolve: (value: T | Promise<T>) => void,
  reject: (reason: any) => void,
  Idle: StateComponent,
  Pending: StateComponent,
  Unknown: StateComponent,
  Fulfilled: StateComponent<T>,
  Rejected: StateComponent<any>,
  Settled: StateComponent
}

/** An object containing any custom settings that you want to apply. */
interface HookOptions {
  /** If the `value` and `reason` should be persistent. If they are they don't become `null` of `default` when the hook is `idle` or `pending`. */
  persistent?: boolean,
  /** An object containing the **default values** to be used when that information isn't available, these values will work as placeholders. */
  defaults?: {
    /** The default value to be used. */
    value?: any,
    /** The default error message to be used. */
    reason?: any
  }
}

/**
 * Wraps a `async function` and gives you more control over its `Promise`.
 * 
 * @param callback Wrapped function.
 */
function useAsync<T>(callback: AsyncFunction<T>): AsyncControl<T>
function useAsync<T>(callback: AsyncFunction<T>, args: any[]): AsyncControl<T>
function useAsync<T>(callback: AsyncFunction<T>, options: HookOptions): AsyncControl<T>
function useAsync<T>(callback: AsyncFunction<T>, args: any[], options: HookOptions): AsyncControl<T>

/**
 * Wraps a `async function` and gives you more control over its `Promise`.
 * 
 * @param callback Wrapped function.
 */
function useAsync<T>(callback: AsyncFunction<T>, args?: any[] | HookOptions, options?: HookOptions) {
  const config = useMemo(() => Array.isArray(args) ? options : args, [args, options])
  
  const [value, setValue] = useState<T | null>(config?.defaults?.value ?? null)
  const [reason, setReason] = useState<any>(config?.defaults?.reason ?? null)
  const [promise, setPromise] = useState<PromiseController<T> | null>(null)

  const state = useStateController()

  const mounted = useRef(false)

  const setData = (value: T | null) => {
    if (!mounted.current) return
    
    if (config) {
      if (config.persistent) {
        if (value === null && state.isUnknown) return

        setValue(value)
      } else {
        setValue(value ?? (config.defaults?.value ?? null))
      }
    } else {
      if (value === null && state.isUnknown) return

      setValue(value)
    }
  }

  const setError = (reason: any) => {
    if (!mounted.current) return

    if (config) {
      if (config.persistent) {
        if (reason === null) return

        setReason(reason)
      } else {
        setReason(reason ?? (config.defaults?.reason ?? null))
      }
    } else {
      if (reason === null) return
      
      setReason(reason)
    }
  }

  // #region Handlers
  const onFulfilled = (value: T | Promise<T>) => {
    if (!mounted.current) return

    if (isPromise(value)) {
      state.pending()

      const promise = new PromiseController<T>((resolve, reject) => {
        value.then(resolve, reject)
      })

      setPromise(promise)

      promise.then(onFulfilled, onRejected)
    } else {
      state.fulfilled()

      setData(value)
    }
  }

  const onRejected = (reason: any) => {
    if (!mounted.current) return

    state.rejected()

    setError(reason)
  }
  // #endregion

  // #region Controllers
  const trigger = useCallback((...args: any[]) => {
    if (!mounted.current) return
    
    state.pending()

    const promise = new PromiseController<T>((resolve, reject) => {
      callback(...args).then(resolve, reject)
    })

    setPromise(promise)

    setData(null)
    setError(null)

    promise.then(onFulfilled, onRejected)

    return promise
  }, [callback])

  const resolve = useCallback((value: T) => {
    if (promise) promise.resolve(value)
  }, [promise])

  const reject = useCallback((reason: any) => {
    if (promise) promise.reject(reason)
  }, [promise])

  const cancel = useCallback(() => {
    if (!mounted.current && !state.isPending) return

    state.idle()

    setPromise(null)

    promise?.reject(null)

    setData(null)
    setError(null)
  }, [state.value])

  const idle = useCallback(() => {
    if (!mounted.current && !state.isSettled) return

    state.idle()

    setPromise(null)

    setData(null)
    setError(null)
  }, [state.value])
  // #endregion

  // #region UI
  const Idle = useCallback<StateComponent>(({ render, children }) => {
    if (state.isIdle) return render ? render() : children

    return null
  }, [state.value])

  const Pending = useCallback<StateComponent>(({ render, children }) => {
    if (state.isPending) return render ? render() : children

    return null
  }, [state.value])

  const Unknown = useCallback<StateComponent>(({ render, children }) => {
    if (state.isUnknown) return render ? render() : children

    return null
  }, [state.value])

  const Fulfilled = useCallback<StateComponent<T>>(({ render, children }) => {
    if (state.isFulfilled) return render && value ? render(value) : children

    return null
  }, [state.value])

  const Rejected = useCallback<StateComponent<any>>(({ render, children }) => {
    if (state.isRejected) return render ? render(reason) : children

    return null
  }, [state.value])

  const Settled = useCallback<StateComponent>(({ render, children }) => {
    if (state.isSettled) return render ? render() : children

    return null
  }, [state.value])
  // #endregion

  useEffect(() => {
    mounted.current = true

    if (Array.isArray(args)) trigger(...args)

    return () => {
      mounted.current = false
    }
  }, [])

  return {
    value, reason,
    trigger, idle, cancel, resolve, reject,
    Idle, Pending, Unknown, Fulfilled, Rejected, Settled
  }
}

export default useAsync
