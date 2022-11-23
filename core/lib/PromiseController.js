class PromiseController extends Promise {
    resolve;
    reject;
    constructor(executor) {
        let _resolve, _reject;
        super((resolve, reject) => {
            executor(resolve, reject);
            _resolve = resolve;
            _reject = reject;
        });
        this.resolve = _resolve ?? (_ => { });
        this.reject = _reject ?? (_ => { });
    }
}
export default PromiseController;
