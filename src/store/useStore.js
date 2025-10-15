import create from 'zustand'

// localStorage key used to persist small UI settings
const STORAGE_KEY = 'fastnet:settings'

/**
 * readInitial
 * - Read persisted settings from localStorage (if available) and provide defaults.
 * - This keeps theme and sidebar collapse state across reloads for developer convenience.
 */
function readInitial(){
  if(typeof window === 'undefined') return { theme: 'light', sidebarOpen: true }
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    if(!raw) return { theme: 'light', sidebarOpen: true }
    const parsed = JSON.parse(raw)
    return {
      theme: parsed.theme ?? 'light',
      sidebarOpen: parsed.sidebarOpen ?? true
    }
  }catch(e){
    console.warn('failed to read settings', e)
    return { theme: 'light', sidebarOpen: true }
  }
}

/**
 * Global Zustand store
 * - Holds small UI state: theme, sidebar open/close and a placeholder `user` object.
 * - Persisted to localStorage on change so the UI restores between reloads.
 * - For larger apps, split stores into domain-specific slices and avoid writing on every small change.
 */
export const useStore = create((set, get)=>{
  const initial = readInitial()
  const store = {
    theme: initial.theme,
    // sidebar open/collapsed state
    sidebarOpen: initial.sidebarOpen,
    toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
    toggleTheme: ()=> set(state => ({theme: get().theme === 'light' ? 'dark' : 'light'})),
    user: {name: 'Admin'},
    setUser: (u) => set({user: u})
  }

  // Simple toast API for lightweight notifications used across the app
  store.toasts = []
  store.addToast = (message, type = 'info', ttl = 4000) => {
    const id = Math.random().toString(36).slice(2,9)
    set(state => ({ toasts: [{ id, message, type }, ...(state.toasts || [])] }))
    if(ttl > 0){
      setTimeout(()=>{
        try{ useStore.getState().removeToast(id) }catch(e){}
      }, ttl)
    }
    return id
  }
  store.removeToast = (id) => set(state => ({ toasts: (state.toasts || []).filter(t=>t.id !== id) }))

  // subscribe to changes and persist
  // simple approach: write on each change (works fine for a small demo app)
  setTimeout(()=>{
    useStore.subscribe((state)=>{
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: state.theme, sidebarOpen: state.sidebarOpen }))
      }catch(e){
        // ignore write failures
      }
    })
  }, 0)

  return store
})
