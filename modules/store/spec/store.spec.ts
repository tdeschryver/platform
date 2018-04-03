import * as ngCore from '@angular/core'; // so we can use the `spyOn` method
import { TestBed } from '@angular/core/testing';
import { hot } from 'jasmine-marbles';
import { take } from 'rxjs/operators';
import * as utils from '../src/utils';
import {
  ActionsSubject,
  ReducerManager,
  Store,
  StoreModule,
  select,
  ActionSerializer,
  ACTION_SERIALIZER,
} from '../';
import {
  counterReducer,
  INCREMENT,
  DECREMENT,
  RESET,
  Increment,
  Decrement,
  Reset,
} from './fixtures/counter';
import Spy = jasmine.Spy;
import any = jasmine.any;

interface TestAppSchema {
  counter1: number;
  counter2: number;
  counter3: number;
  counter4?: number;
}

describe('ngRx Store', () => {
  let store: Store<TestAppSchema>;
  let dispatcher: ActionsSubject;

  function setup(
    initialState: any = { counter1: 0, counter2: 1 },
    reducers: any = {
      counter1: counterReducer,
      counter2: counterReducer,
      counter3: counterReducer,
    }
  ) {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot(reducers, { initialState })],
    });

    store = TestBed.get(Store);
    dispatcher = TestBed.get(ActionsSubject);
  }

  describe('initial state', () => {
    it('should handle an initial state object', (done: any) => {
      setup();

      store.pipe(take(1)).subscribe({
        next(val) {
          expect(val).toEqual({ counter1: 0, counter2: 1, counter3: 0 });
        },
        error: done,
        complete: done,
      });
    });

    it('should handle an initial state function', (done: any) => {
      setup(() => ({ counter1: 0, counter2: 5 }));

      store.pipe(take(1)).subscribe({
        next(val) {
          expect(val).toEqual({ counter1: 0, counter2: 5, counter3: 0 });
        },
        error: done,
        complete: done,
      });
    });

    function testInitialState(feature?: string) {
      store = TestBed.get(Store);
      dispatcher = TestBed.get(ActionsSubject);

      const actionSequence = '--a--b--c--d--e--f--g';
      const stateSequence = 'i-w-----x-----y--z---';
      const actionValues = {
        a: Increment(),
        b: { type: 'OTHER' },
        c: Reset(),
        d: { type: 'OTHER' }, // reproduces https://github.com/ngrx/platform/issues/880 because state is falsey
        e: Increment(),
        f: Increment(),
        g: { type: 'OTHER' },
      };
      const counterSteps = hot(actionSequence, actionValues);
      counterSteps.subscribe(action => store.dispatch(action));

      const counterStateWithString = feature
        ? (store as any).select(feature, 'counter1')
        : store.select('counter1');

      const counter1Values = { i: 1, w: 2, x: 0, y: 1, z: 2 };

      expect(counterStateWithString).toBeObservable(
        hot(stateSequence, counter1Values)
      );
    }

    it('should reset to initial state when undefined (root ActionReducerMap)', () => {
      TestBed.configureTestingModule({
        imports: [
          StoreModule.forRoot(
            { counter1: counterReducer },
            { initialState: { counter1: 1 } }
          ),
        ],
      });

      testInitialState();
    });

    it('should reset to initial state when undefined (feature ActionReducer)', () => {
      TestBed.configureTestingModule({
        imports: [
          StoreModule.forRoot({}),
          StoreModule.forFeature('counter1', counterReducer, {
            initialState: 1,
          }),
        ],
      });

      testInitialState();
    });

    it('should reset to initial state when undefined (feature ActionReducerMap)', () => {
      TestBed.configureTestingModule({
        imports: [
          StoreModule.forRoot({}),
          StoreModule.forFeature(
            'feature1',
            { counter1: counterReducer },
            { initialState: { counter1: 1 } }
          ),
        ],
      });

      testInitialState('feature1');
    });
  });

  describe('basic store actions', () => {
    beforeEach(() => setup());

    it('should provide an Observable Store', () => {
      expect(store).toBeDefined();
    });

    it('should freeze state and action on dispatch', () => {
      const spy = spyOn(utils, 'freeze');
      store.dispatch(Increment());
      expect(spy).toHaveBeenCalledWith({
        counter1: 0,
        counter2: 1,
        counter3: 0,
      });
      expect(spy).toHaveBeenCalledWith(Increment());
    });

    it("shouldn't freeze state and action when not in dev mode", () => {
      turnDevModeOff();
      const spy = spyOn(utils, 'freeze');
      store.dispatch(Increment());
      expect(spy).not.toHaveBeenCalled();
    });

    const actionSequence = '--a--b--c--d--e';
    const actionValues = {
      a: Increment(),
      b: Increment(),
      c: Decrement(),
      d: Reset(),
      e: Increment(),
    };

    it('should let you select state with a key name', () => {
      const counterSteps = hot(actionSequence, actionValues);

      counterSteps.subscribe(action => store.dispatch(action));

      const counterStateWithString = store.pipe(select('counter1'));

      const stateSequence = 'i-v--w--x--y--z';
      const counter1Values = { i: 0, v: 1, w: 2, x: 1, y: 0, z: 1 };

      expect(counterStateWithString).toBeObservable(
        hot(stateSequence, counter1Values)
      );
    });

    it('should let you select state with a selector function', () => {
      const counterSteps = hot(actionSequence, actionValues);

      counterSteps.subscribe(action => store.dispatch(action));

      const counterStateWithFunc = store.pipe(select(s => s.counter1));

      const stateSequence = 'i-v--w--x--y--z';
      const counter1Values = { i: 0, v: 1, w: 2, x: 1, y: 0, z: 1 };

      expect(counterStateWithFunc).toBeObservable(
        hot(stateSequence, counter1Values)
      );
    });

    it('should correctly lift itself', () => {
      const result = store.pipe(select('counter1'));

      expect(result instanceof Store).toBe(true);
    });

    it('should increment and decrement counter1', () => {
      const counterSteps = hot(actionSequence, actionValues);

      counterSteps.subscribe(action => store.dispatch(action));

      const counterState = store.pipe(select('counter1'));

      const stateSequence = 'i-v--w--x--y--z';
      const counter1Values = { i: 0, v: 1, w: 2, x: 1, y: 0, z: 1 };

      expect(counterState).toBeObservable(hot(stateSequence, counter1Values));
    });

    it('should increment and decrement counter1 using the dispatcher', () => {
      const counterSteps = hot(actionSequence, actionValues);

      counterSteps.subscribe(action => dispatcher.next(action));

      const counterState = store.pipe(select('counter1'));

      const stateSequence = 'i-v--w--x--y--z';
      const counter1Values = { i: 0, v: 1, w: 2, x: 1, y: 0, z: 1 };

      expect(counterState).toBeObservable(hot(stateSequence, counter1Values));
    });

    it('should increment and decrement counter2 separately', () => {
      const counterSteps = hot(actionSequence, actionValues);

      counterSteps.subscribe(action => store.dispatch(action));

      const counter1State = store.pipe(select('counter1'));
      const counter2State = store.pipe(select('counter2'));

      const stateSequence = 'i-v--w--x--y--z';
      const counter2Values = { i: 1, v: 2, w: 3, x: 2, y: 0, z: 1 };

      expect(counter2State).toBeObservable(hot(stateSequence, counter2Values));
    });

    it('should implement the observer interface forwarding actions and errors to the dispatcher', () => {
      spyOn(dispatcher, 'next');
      spyOn(dispatcher, 'error');

      store.next(<any>1);
      store.error(2);

      expect(dispatcher.next).toHaveBeenCalledWith(1);
      expect(dispatcher.error).toHaveBeenCalledWith(2);
    });

    it('should not be completable', () => {
      const storeSubscription = store.subscribe();
      const dispatcherSubscription = dispatcher.subscribe();

      store.complete();
      dispatcher.complete();

      expect(storeSubscription.closed).toBe(false);
      expect(dispatcherSubscription.closed).toBe(false);
    });

    it('should complete if the dispatcher is destroyed', () => {
      const storeSubscription = store.subscribe();
      const dispatcherSubscription = dispatcher.subscribe();

      dispatcher.ngOnDestroy();

      expect(dispatcherSubscription.closed).toBe(true);
    });
  });

  describe(`add/remove reducers`, () => {
    let addReducerSpy: Spy;
    let removeReducerSpy: Spy;
    const key = 'counter4';

    beforeEach(() => {
      setup();
      const reducerManager = TestBed.get(ReducerManager);
      addReducerSpy = spyOn(reducerManager, 'addReducer').and.callThrough();
      removeReducerSpy = spyOn(
        reducerManager,
        'removeReducer'
      ).and.callThrough();
    });

    it(`should delegate add/remove to ReducerManager`, () => {
      store.addReducer(key, counterReducer);
      expect(addReducerSpy).toHaveBeenCalledWith(key, counterReducer);

      store.removeReducer(key);
      expect(removeReducerSpy).toHaveBeenCalledWith(key);
    });

    it(`should work with added / removed reducers`, () => {
      store.addReducer(key, counterReducer);
      store.pipe(take(1)).subscribe(val => {
        expect(val.counter4).toBe(0);
      });

      store.removeReducer(key);
      store.dispatch(Increment());
      store.pipe(take(1)).subscribe(val => {
        expect(val.counter4).toBeUndefined();
      });
    });
  });

  describe('action serialization', () => {
    class FooBar {}
    const notSeriazables = (): any[] => [
      new FooBar(),
      new Date(),
      [1, 2, 3],
      null,
      () => {},
    ];

    it('should provide a default serializer', () => {
      setup();
      const serializer = TestBed.get(ACTION_SERIALIZER);
      expect(serializer).toBeDefined();
    });

    it("should throw an error when an action isn't serializable", () => {
      setup();

      // test for now, remove when we're at NgRx 7 and uncomment the expect underneath
      const spy = spyOn(console, 'warn').and.callThrough();
      notSeriazables().forEach(p => {
        spy.calls.reset();
        expect(() => store.dispatch(p)).toThrowError();
        expect(spy).toHaveBeenCalled();

        // expect(() => store.dispatch(p)).toThrowError(
        //   'Actions must be plain objects.'
        // );
      });
    });

    it('should be possible to provide a custom serializer', (done: any) => {
      TestBed.configureTestingModule({
        imports: [
          StoreModule.forRoot(
            {},
            {
              serializer: (action: any) => {
                expect(action).toEqual(Increment());
                done();
                return true;
              },
            }
          ),
        ],
      });

      store = TestBed.get(Store);
      store.dispatch(Increment());
    });

    it('should be possible to turn off serialization checks', () => {
      TestBed.configureTestingModule({
        imports: [
          StoreModule.forRoot(
            {},
            {
              serializer: null,
            }
          ),
        ],
      });

      store = TestBed.get(Store);

      // test for now, remove when we're at NgRx 7 and uncomment the expect underneath
      const spy = spyOn(console, 'warn').and.callThrough();
      expect(() => store.dispatch(notSeriazables()[0])).toThrowError(
        'Actions must have a type property'
      );
      expect(spy).not.toHaveBeenCalled();

      // expect(() => store.dispatch(notSeriazables()[0])).not.toThrowError(
      //   'Actions must be plain objects.'
      // );
    });

    it("shouldn't check if an action is serializable in prod mode", () => {
      setup();
      turnDevModeOff();

      // test for now, remove when we're at NgRx 7 and uncomment the expect underneath
      const spy = spyOn(console, 'warn').and.callThrough();
      expect(() => store.dispatch(notSeriazables()[0])).toThrowError(
        'Actions must have a type property'
      );
      expect(spy).not.toHaveBeenCalled();

      // expect(() => store.dispatch(notSeriazables()[0])).not.toThrowError(
      //   'Actions must be plain objects.'
      // );
    });
  });
});

function turnDevModeOff() {
  spyOn(ngCore, 'isDevMode').and.returnValue(false);
}
