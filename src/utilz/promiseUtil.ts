export class PromiseUtil {

    // Waits for all promises to complete
    public static allSettled<T>(promises: Promise<T>[]): Promise<PromiseResult<T>[]> {
        let wrappedPromises = promises.map(p => {
            return Promise.resolve(p)
                .then(
                    val => new PromiseResult(PromiseResultType.SUCCESS, val, null),
                    err => new PromiseResult(PromiseResultType.FAILED, null, err));
        });
        return Promise.all(wrappedPromises);
    }

    public static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static createDeferred<T>(rejectTimeout: number = 0,
                                    resolveTimeout: number = 0): DeferredPromise<T> {
        let deferred = new DeferredPromise<T>();
        deferred.promise = new Promise<T>((resolve, reject) => {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        if (rejectTimeout > 0) {
            setTimeout(function () {
                deferred.reject();
            }, rejectTimeout);
        }
        if (resolveTimeout > 0) {
            setTimeout(function () {
                deferred.resolve();
            }, resolveTimeout);
        }
        return deferred;
    }


}

export enum PromiseResultType {
    FAILED = -1,
    RUNNING = 0,
    SUCCESS = 1
}

export class PromiseResult<T> {
    private _status: PromiseResultType = PromiseResultType.RUNNING;
    private _val: T;
    private _err: any;

    constructor(status: number, val: T, err: any) {
        this._status = status;
        this._val = val;
        this._err = err;
    }

    public isFullfilled(): boolean {
        return this._status == PromiseResultType.SUCCESS;
    }

    public isSuccess(): boolean {
        return this._status == PromiseResultType.SUCCESS;
    }

    public isRejected(): boolean {
        return this._status == PromiseResultType.FAILED;
    }

    public isRunning(): boolean {
        return this._status == PromiseResultType.RUNNING;
    }

    get status(): PromiseResultType {
        return this._status;
    }

    get val(): T {
        return this._val;
    }

    get err(): any {
        return this._err;
    }
}

export class DeferredPromise<T> {
    promise: Promise<T>;
    resolve: Function;
    reject: Function;
}

