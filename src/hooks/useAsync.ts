import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react"

import PromiseController from "../lib/PromiseController"

type AsyncFunction<T> = (...args: any[]) => Promise<T>

interface WithRenderProps<T> {
  render?: (value?: T) => any
}

type StateComponent<T = undefined> = (props: PropsWithChildren<WithRenderProps<T>>) => JSX.Element

function isPromise<T>(object: any): object is Promise<T> {
  return object instanceof Promise
}

enum State {
  IDLE = "idle",
  PENDING = "pending",
  UNKNOWN = "unknown",
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
  SETTLED = "settled"
}

interface AsyncControl<T> {
  value: T | null,
  reason: any,
  trigger: (...args: any[]) => Promise<T> | undefined,
  cancel: () => void,
  resolve: (value: T | Promise<T>) => void,
  reject: (reason: any) => void,
  Idle: StateComponent,
  Pending: StateComponent,
  Unknown: StateComponent,
  Fulfilled: StateComponent<T>,
  Rejected: StateComponent<any>,
  Settled: StateComponent
}

function PromiseState(state: State) {
  return {
    state,
    get isIdle() {
      return this.state == State.IDLE
    },
    get isPending() {
      return this.state == State.PENDING
    },
    get isUnknown() {
      return this.state == State.IDLE || this.state == State.PENDING
    },
    get isFulfilled() {
      return this.state == State.FULFILLED
    },
    get isRejected() {
      return this.state == State.REJECTED
    },
    get isSettled() {
      return this.state == State.FULFILLED || this.state == State.REJECTED
    }
  }
}

interface HookOptions {
  persistent: boolean,
  defaults: {
    value: any,
    reason: any
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

  const [state, setState] = useState(PromiseState(State.PENDING))
  const [promise, setPromise] = useState<PromiseController<T> | null>(null)

  const mounted = useRef(false)

  const setData = (value: T | null) => {
    if (!mounted.current) return
    
    if (config) {
      if (config.persistent) {
        if (value === null) return

        setValue(value)
      } else {
        setValue(value ?? (config.defaults.value ?? null))
      }
    } else {
      if (value === null) return

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
        setReason(reason ?? (config.defaults.reason ?? null))
      }
    } else {
      if (reason === null) return
      
      setReason(reason)
    }
  }

  const setCycle = (state: State) => {
    setState(PromiseState(state))
  }

  // #region Handlers
  const onFulfilled = (value: T | Promise<T>) => {
    if (!mounted.current) return

    if (isPromise(value)) {
      setCycle(State.PENDING)

      const promise = new PromiseController<T>((resolve, reject) => {
        value.then(resolve, reject)
      })

      setPromise(promise)

      promise.then(onFulfilled, onRejected)
    } else {
      setCycle(State.FULFILLED)

      setData(value)
    }
  }

  const onRejected = (reason: any) => {
    if (!mounted.current) return

    setCycle(State.REJECTED)

    setError(reason)
  }
  // #endregion

  // #region Controllers
  const trigger = useCallback((...args: any[]) => {
    if (!mounted.current) return
    
    setCycle(State.PENDING)

    const promise = new PromiseController<T>((resolve, reject) => {
      callback(...args).then(resolve, reject)
    })

    setPromise(promise)

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

    setCycle(State.IDLE)

    setData(null)
    setError(null)
  }, [state.state])

  const idle = useCallback(() => {
    if (!mounted.current && !state.isSettled) return

    setCycle(State.IDLE)

    setData(null)
    setError(null)
  }, [state.state])
  // #endregion

  // #region UI
  const Idle = useCallback<StateComponent>(({ render, children }) => {
    if (state.isIdle) return render ? render() : children

    return null
  }, [state.state])

  const Pending = useCallback<StateComponent>(({ render, children }) => {
    if (state.isPending) return render ? render() : children

    return null
  }, [state.state])

  const Unknown = useCallback<StateComponent>(({ render, children }) => {
    if (state.isUnknown) return render ? render() : children

    return null
  }, [state.state])

  const Fulfilled = useCallback<StateComponent<T>>(({ render, children }) => {
    if (state.isFulfilled) return render && value ? render(value) : children

    return null
  }, [state.state])

  const Rejected = useCallback<StateComponent<any>>(({ render, children }) => {
    if (state.isRejected) return render ? render(reason) : children

    return null
  }, [state.state])

  const Settled = useCallback<StateComponent>(({ render, children }) => {
    if (state.isSettled) return render ? render() : children

    return null
  }, [state.state])
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
