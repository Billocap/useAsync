import { PropsWithChildren } from "react";
type AsyncFunction<T> = (...args: any[]) => Promise<T>;
interface WithRenderProps<T> {
    render?: (value?: T) => any;
}
type StateComponent<T = undefined> = (props: PropsWithChildren<WithRenderProps<T>>) => JSX.Element;
interface AsyncControl<T> {
    value: T | null;
    reason: any;
    trigger: (...args: any[]) => Promise<T> | undefined;
    cancel: () => void;
    idle: () => void;
    resolve: (value: T | Promise<T>) => void;
    reject: (reason: any) => void;
    Idle: StateComponent;
    Pending: StateComponent;
    Unknown: StateComponent;
    Fulfilled: StateComponent<T>;
    Rejected: StateComponent<any>;
    Settled: StateComponent;
}
/** An object containing any custom settings that you want to apply. */
interface HookOptions {
    /** If the `value` and `reason` should be persistent. If they are they don't become `null` of `default` when the hook is `idle` or `pending`. */
    persistent?: boolean;
    /** An object containing the **default values** to be used when that information isn't available, these values will work as placeholders. */
    defaults?: {
        /** The default value to be used. */
        value?: any;
        /** The default error message to be used. */
        reason?: any;
    };
}
/**
 * Wraps a `async function` and gives you more control over its `Promise`.
 *
 * @param callback Wrapped function.
 */
declare function useAsync<T>(callback: AsyncFunction<T>): AsyncControl<T>;
declare function useAsync<T>(callback: AsyncFunction<T>, args: any[]): AsyncControl<T>;
declare function useAsync<T>(callback: AsyncFunction<T>, options: HookOptions): AsyncControl<T>;
declare function useAsync<T>(callback: AsyncFunction<T>, args: any[], options: HookOptions): AsyncControl<T>;
export default useAsync;
