import { createContext, useContext, useState, useCallback } from 'react'

const FavoritesContext = createContext(null)

const initialFavorites = []

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(initialFavorites)

  const addFavorite = useCallback((molecule) => {
    setFavorites((prev) => {
      // Avoid simple duplicate by id if provided
      if (molecule.id && prev.some((m) => m.id === molecule.id)) return prev
      const id = molecule.id ?? `fav-${Date.now()}`
      return [...prev, { ...molecule, id }]
    })
  }, [])

  const removeFavorite = useCallback((id) => {
    setFavorites((prev) => prev.filter((m) => m.id !== id))
  }, [])

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}

