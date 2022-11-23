declare class PromiseController<T> extends Promise<T> {
    resolve: (value: T) => void;
    reject: (reason?: any) => void;
    constructor(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void);
}
export default PromiseController;
