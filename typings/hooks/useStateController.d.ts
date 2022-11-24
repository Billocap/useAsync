export declare enum State {
    IDLE = 0,
    PENDING = 1,
    FULFILLED = 2,
    REJECTED = 3
}
declare function useStateController(initialState?: keyof typeof State): {
    readonly value: State;
    readonly isIdle: boolean;
    readonly isPending: boolean;
    readonly isUnknown: boolean;
    readonly isFulfilled: boolean;
    readonly isRejected: boolean;
    readonly isSettled: boolean;
    pending(): void;
    fulfilled(): void;
    rejected(): void;
    idle(): void;
};
export default useStateController;
