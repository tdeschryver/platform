import {
  Inject,
  Injectable,
  OnDestroy,
  Provider,
  isDevMode,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Action, ActionSerializer } from './models';
import { ACTION_SERIALIZER } from './tokens';

export const INIT = '@ngrx/store/init' as '@ngrx/store/init';

@Injectable()
export class ActionsSubject extends BehaviorSubject<Action>
  implements OnDestroy {
  constructor(@Inject(ACTION_SERIALIZER) private serializer: ActionSerializer) {
    super({ type: INIT });
  }

  next(action: Action): void {
    if (isDevMode()) {
      try {
        if (!this.serializer(action)) {
          throw new Error('Action should be serializable');
        }
      } catch (error) {
        throw error;
      }
    }

    if (typeof action.type === 'undefined') {
      throw new TypeError(`Actions must have a type property`);
    }

    super.next(action);
  }

  complete() {
    /* noop */
  }

  ngOnDestroy() {
    super.complete();
  }
}

export const ACTIONS_SUBJECT_PROVIDERS: Provider[] = [ActionsSubject];
