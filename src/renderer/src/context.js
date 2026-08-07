import { createContext, useContext } from 'react'

export const AppContext = createContext({ userDataPath: '', theme: 'dark', toggleTheme: () => {} })
export const useAppContext = () => useContext(AppContext)
