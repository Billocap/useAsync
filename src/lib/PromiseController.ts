class PromiseController<T> extends Promise<T> {
  public resolve: (value: T) => void
  public reject: (reason?: any) => void

  constructor(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void) {
    let _resolve, _reject

    super((resolve, reject) => {
      executor(resolve, reject)

      _resolve = resolve
      _reject = reject
    })

    this.resolve = _resolve ?? (_ => {})
    this.reject = _reject ?? (_ => {})
  }
}

export default PromiseController
