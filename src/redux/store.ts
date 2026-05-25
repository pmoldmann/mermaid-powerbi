
import { configureStore } from '@reduxjs/toolkit'

import optionsReducer from './slice';

export const store = configureStore({
    reducer: {
        options: optionsReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false
    }),
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch