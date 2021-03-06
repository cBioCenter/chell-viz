// ~bb-viz~
// Data Reducer
// Reducer for a piece of data that must be fetched.
// ~bb-viz~

import { Reducer } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
// tslint:disable-next-line:no-submodule-imports
import { PayloadAction } from 'typesafe-actions/dist/types';

import { createDataActions } from '~bioblocks-viz~/action';
import { ReducerRegistry } from '~bioblocks-viz~/reducer';

export type IDataReducerState<T> = T;

export const DataReducer = <T>(dataset: string, initialState: T, namespace = 'bioblocks'): Reducer => {
  const actions = createDataActions<T>(dataset, namespace);

  return (state: IDataReducerState<T> = initialState, action: ActionType<typeof actions>): IDataReducerState<T> => {
    switch (action.type) {
      case getType(actions.success): {
        return (action as PayloadAction<string, T>).payload;
      }
      case getType(actions.failure): {
        const payload = (action as PayloadAction<string, Error>).payload;
        console.error(payload);

        return initialState;
      }
      default:
        return state;
    }
  };
};

export const createDataReducer = <T>(dataset: string, initialState: T, namespace = 'bioblocks') => {
  const reducer = DataReducer<T>(dataset, initialState, namespace);

  const reducerName = `${namespace}/${dataset}`;
  ReducerRegistry.register(reducerName, reducer);
};
