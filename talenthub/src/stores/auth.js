import { reactive } from 'vue'
import { supabase } from '@/supabase'

// All state in one place — makes reset trivial
function defaultState() {
  return {
    user:    null,
    profile: null,
    loading: true,
  }
}

export const auth = reactive({
  ...defaultState(),

  async init() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        this.user = session.user
        await this.fetchProfile()
      }
    } catch (e) {
      console.warn('Auth init error:', e)
    }
    this.loading = false

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // ✅ Full reset on logout — no stale data remains
        Object.assign(this, defaultState(), { loading: false })
        return
      }
      this.user = session.user
      await this.fetchProfile()
    })
  },

  async fetchProfile() {
    if (!this.user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.user.id)
        .maybeSingle()
      if (!error) this.profile = data
    } catch (e) {
      console.warn('Profile fetch error:', e)
    }
  },

  // ✅ Admin check from env var — not hardcoded email in source code
  get isAdmin() {
    return this.user?.email === import.meta.env.VITE_ADMIN_EMAIL
  },

  get isEmployer() {
    return this.profile?.role === 'employer'
  },

  // ✅ Call this on logout — resets everything cleanly
  async logout() {
    await supabase.auth.signOut()
    // onAuthStateChange SIGNED_OUT event handles the state reset above
  }
})
