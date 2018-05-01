import { Inject, Injectable } from '@angular/core';
import { Action, ScannedActionsSubject } from '@ngrx/store';
import { Observable, Operator, OperatorFunction } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable()
export class Actions<V extends Action> extends Observable<V> {
  constructor(@Inject(ScannedActionsSubject) source?: Observable<V>) {
    super();

    if (source) {
      this.source = source;
    }
  }

  lift<R extends Action>(operator: Operator<V, R>): Observable<R> {
    const observable = new Actions<R>();
    observable.source = this;
    observable.operator = operator;
    return observable;
  }

  ofType<V2 extends V, T extends string>(...allowedTypes: T[]): Actions<V2> {
    return ofType<any, T>(...allowedTypes)(this as Actions<any>) as Actions<V2>;
  }
}

export function ofType<V extends Action, Type extends string>(
  ...types: Type[]
): OperatorFunction<V, Extract<V, { type: Type }>>;
export function ofType(...types: string[]) {
  return function(source: Observable<any>) {
    return source.pipe(filter(action => types.indexOf(action.type) !== -1));
  };
}
