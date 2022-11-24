import { useMemo, useState } from "react"

export enum State {
  IDLE,
  PENDING,
  FULFILLED,
  REJECTED
}

function useStateController(initialState?: keyof typeof State) {
  const [state, setState] = useState(initialState ? State[initialState] : State.IDLE)

  const controller = useMemo(() => {
    return {
      get value() {
        return state
      },
      get isIdle() {
        return state == State.IDLE
      },
      get isPending() {
        return state == State.PENDING
      },
      get isUnknown() {
        return state == State.IDLE || state == State.PENDING
      },
      get isFulfilled() {
        return state == State.FULFILLED
      },
      get isRejected() {
        return state == State.REJECTED
      },
      get isSettled() {
        return state == State.FULFILLED || state == State.REJECTED
      },
      pending() {
        setState(State.PENDING)
      },
      fulfilled() {
        setState(State.FULFILLED)
      },
      rejected() {
        setState(State.REJECTED)
      },
      idle() {
        setState(State.IDLE)
      }
    }
  }, [state])

  return controller
}

export default useStateController
