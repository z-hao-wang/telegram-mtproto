/* @flow */

declare module 'kefir' {
  declare export type Event<V,E> =
    {type: 'value', value: V} |
    {type: 'error', value: E} |
    {type: 'end', value: void};

  declare export type Emitter<V,E> = {
    value(value: V): boolean;
    event(event: Event<V,E>): boolean;
    error(e: E): boolean;
    end(): void;

    // Deprecated methods
    emit(value: V): boolean;
    emitEvent(event: Event<V,E>): boolean;
  };

  declare export type Subscription = {
    closed: boolean;
    unsubscribe(): void;
  };

  declare export type Observer<V,E> = {
    +value?: (value: V) => void;
    +error?: (err: E) => void;
    +end?: () => void;
  };

  declare export class Observable<+V,+E=*> {
    toProperty(): Property<V,E>;
    toProperty<V2>(getCurrent: () => V2): Property<V|V2,E>;
    changes(): Observable<V,E>;

    observe(obs: Observer<V,E>, ...none: empty[]): Subscription;
    observe(onValue: ?(v: V) => void, onError: ?(err: E) => void, onEnd: ?() => void): Subscription;
    onValue(cb: (v: V) => void): this;
    offValue(cb: (v: V) => void): this;
    onError(cb: (err: E) => void): this;
    offError(cb: (err: E) => void): this;
    onEnd(cb: () => void): this;
    offEnd(cb: () => void): this;
    onAny(cb: (event: Event<V,E>) => void): this;
    offAny(cb: (event: Event<V,E>) => void): this;
    log(name?: string): this;
    offLog(name?: string): this;
    spy(name?: string): this;
    offSpy(name?: string): this;
    setName(name: string): this;
    setName(Observable<any, any>, name: string): this;
    toPromise(PromiseConstructor?: Function): Promise<V>;

    map<V2>(cb: (v: V) => V2): Observable<V2,E>;
    filter(cb?: typeof Boolean): Observable<$NonMaybeType<V>,E>;
    filter(cb: (v: V) => any): Observable<V,E>;
    take(n: number): Observable<V,E>;
    takeWhile(cb?: (v: V) => boolean): Observable<V,E>;
    last(): Observable<V,E>;
    skip(n: number): Observable<V,E>;
    skipWhile(cb?: (v: V) => boolean): Observable<V,E>;
    skipDuplicates(comparator?: (a: V, b: V) => boolean): Observable<V,E>;
    diff(fn?: (prev: V, next: V) => V): Observable<V,E>;
    diff<V2>(fn: (prev: V2, next: V) => V, seed: V2): Observable<V2,E>;
    scan(cb: (prev: V, next: V) => V): Observable<V,E>;
    scan<V2>(cb: (prev: V2, next: V) => V2, seed: V2): Observable<V2,E>;
    flatten(): Observable<any,E>;
    flatten<V2>(transformer: (value: V) => V2[]): Observable<V2,E>;
    delay(n: number): Observable<V,E>;
    throttle(n: number, options?: {leading?: boolean, trailing?: boolean}): Observable<V,E>;
    debounce(n: number, options?: {immediate?: boolean}): Observable<V,E>;
    mapErrors<E2>(fn: (error: E) => E2): Observable<V,E2>;
    filterErrors(fn?: typeof Boolean): Observable<V,$NonMaybeType<E>>;
    filterErrors(fn: (error: E) => any): Observable<V,E>;
    takeErrors(n: number): Observable<V,E>;
    ignoreValues(): Observable<*,E>;
    ignoreErrors(): Observable<V,*>;
    ignoreEnd(): Observable<V,E>;
    beforeEnd<V2>(fn: () => V2): Observable<V|V2,E>;
    slidingWindow(max: number, min?: number): Observable<V[],E>;
    bufferWhile(predicate?: (value: V) => boolean, options?: {flushOnEnd?: boolean}): Observable<V[],E>;
    transduce(transducer: any): Observable<any,E>;
    withHandler<V2,E2>(handler: (emitter: Emitter<V2,E2>, event: Event<V,E>) => void): Observable<V2,E2>;

    combine<V2,E2>(otherObs: Observable<V2,E2>): Observable<[V,V2],E|E2>;
    combine<V2,V3,E2>(otherObs: Observable<V2,E2>, combinator: (v: V, v2: V2) => V3): Observable<V3,E|E2>;
    zip<V2,E2>(otherObs: Observable<V2,E2>): Observable<[V,V2],E|E2>;
    zip<V2,V3,E2>(otherObs: Observable<V2,E2>, combinator: (v: V, v2: V2) => V3): Observable<V3,E|E2>;
    merge<V2,E2>(otherObs: Observable<V2,E2>): Observable<V|V2,E|E2>;
    concat<V2,E2>(otherObs: Observable<V2,E2>): Observable<V|V2,E|E2>;

    flatMap<V2,E2>(transform: (value: V) => Observable<V2,E2>): Observable<V2,E|E2>;
    flatMapLatest<V2,E2>(transform: (value: V) => Observable<V2,E2>): Observable<V2,E|E2>;
    flatMapFirst<V2,E2>(transform: (value: V) => Observable<V2,E2>): Observable<V2,E|E2>;
    flatMapConcat<V2,E2>(transform: (value: V) => Observable<V2,E2>): Observable<V2,E|E2>;
    flatMapConcurLimit<V2,E2>(transform: (value: V) => Observable<V2,E2>, limit: number): Observable<V2,E|E2>;
    flatMapErrors<V2,E2>(transform: (error: E) => Observable<V2,E2>): Observable<V|V2,E2>;

    filterBy(otherObs: Observable<any,any>): Observable<V,E>;
    skipUntilBy(otherObs: Observable<any,any>): Observable<V,E>;
    takeUntilBy(otherObs: Observable<any,any>): Observable<V,E>;
    bufferBy(otherObs: Observable<any,any>, options?: {flushOnEnd?: boolean}): Observable<V[],E>;
    bufferWhileBy(otherObs: Observable<any,any>, options?: {flushOnEnd?: boolean, flushOnChange?: boolean}): Observable<V[],E>;
    sampledBy(otherObs: Observable<any,any>): Observable<V,E>;
    sampledBy<V2,V3>(otherObs: Observable<V2,any>, combinator: (obsValue: V, otherObsValue: V2) => V3): Observable<V3,E>;
    bufferWithTimeOrCount(time: number, count: number, options?: {flushOnEnd: boolean}): Observable<V,E>;
  }

  declare export class Pool<V,E=*> extends Observable<V,E> {
    plug(s: Observable<V,E>): () => void;
  }

  declare export class Stream<+V,+E=*> extends Observable<V,E> {
  }

  declare export class Property<+V,+E=*> extends Observable<V,E> {
  }

  declare export var staticLand: {
    Observable: {
      ap<A,B,E1,E2>(obsF: Observable<(x: A) => B, E1>, obsV: Observable<A, E2>): Observable<B,E1|E2>;
      bimap<V1,E1,V2,E2>(fnE: (x: E1) => E2, fnV: (x: V1) => V2, obs: Observable<V1,E1>): Observable<V2,E2>;
      chain<V,V2,E,E2>(cb: (value: V) => Observable<V2,E2>, s: Observable<V,E>): Observable<V2,E|E2>;
      concat<V1,E1,V2,E2>(obs1: Observable<V1,E1>, obs2: Observable<V2,E2>): Observable<V1|V2,E1|E2>;
      empty(): Observable<*,*>;
      map<V,V2,E>(cb: (value: V) => V2, s: Observable<V,E>): Observable<V2,E>;
      of<V>(value: V): Observable<V,*>;
    };
  };


  declare export function never(): Observable<*>;
  declare export function later<V>(delay: number, value: V): Observable<V,*>;
  declare export function interval<V>(interval: number, value: V): Observable<V,*>;
  declare export function sequentially<V>(interval: number, values: V[]): Observable<V,*>;
  declare export function fromPoll<V>(interval: number, f: () => V): Observable<V,*>;
  declare export function withInterval<V,E>(interval: number, f: (emitter: Emitter<V,E>) => void): Observable<V,E>;
  declare export function fromCallback<V>(f: (cb: (value: V) => void) => void): Observable<V,*>;
  declare export function fromNodeCallback<V,E>(f: (cb: (err: E, value: ?V) => void) => void): Observable<V,E>;
  declare export function fromEvents(target: Object, eventName: string, transformer?: (event: any) => any): Observable<any,*>;
  declare export function stream<V,E>(subscribe: (emitter: Emitter<V,E>) => ?() => void): Observable<V,E>;

  declare export function constant<V>(value: V): Property<V,*>;
  declare export function constantError<E>(err: E): Property<*,E>;
  declare export function fromPromise<V>(promise: Promise<V>): Property<V,any>;

  declare export function fromESObservable(observable: Object): Observable<any,*>;
  declare export function toESObservable(): Object;

  declare function combine<E>(obss: Observable<any,E>[], combinator?: Function): Observable<any,E>;
  declare function combine<E>(obss: Observable<any,E>[], passiveObss?: Observable<any,E>[], combinator?: Function): Observable<any,E>;
  declare function combine<E>(obss: {[key:string]:Observable<any,E>}, combinator?: Function): Observable<any,E>;
  declare function combine<E>(obss: {[key:string]:Observable<any,E>}, passiveObss?: {[key:string]:Observable<any,E>}, combinator?: Function): Observable<any,E>;
  declare export var combine: typeof combine

  declare function zip<V,E>(obss: Observable<V,E>[]): Observable<Array<V>,E>;
  declare function zip<E>(obss: Observable<any,E>[], combinator: Function): Observable<any,E>;
  declare export var zip: typeof zip

  declare export function merge<V,E>(obss: Observable<V,E>[]): Observable<V,E>;
  declare export function concat<V,E>(obss: Observable<V,E>[]): Observable<V,E>;

  declare export function pool(): Pool<*,*>;
  declare export function repeat<V,E>(fn: (i: number) => ?Observable<V,E>): Observable<V,E>;
  declare export default typeof pool
  // declare export default typeof Kefir;
}
