'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { School } from '@/lib/types'

interface AuthContextType {
  user: User | null
  schoolId: string | null
  role: string | null
  isSuperAdmin: boolean
  schoolName: string | null
  schools: School[]
  loading: boolean
  setSchoolId: (id: string) => void
  refetchSchools: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  schoolId: null,
  role: null,
  isSuperAdmin: false,
  schoolName: null,
  schools: [],
  loading: true,
  setSchoolId: () => { },
  refetchSchools: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadSchools() {
    try {
      const { data } = await (supabase
        .from('schools') as any)
        .select('*')
        .order('name')
      if (data && data.length > 0) {
        setSchools(data as any)
        return data as any
      }

      // Fallback: If client query returns empty (e.g. due to RLS policies), fetch via admin dashboard API
      const res = await fetch('/api/admin/dashboard', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.schoolsInfo) {
          const mappedSchools: School[] = json.schoolsInfo.map((s: any) => ({
            id: s.id,
            name: s.name,
            logo_url: s.logo_url,
            created_at: s.created_at,
          }))
          setSchools(mappedSchools)
          return mappedSchools
        }
      }
    } catch (err) {
      console.error('Error fetching schools:', err)
    }
    return []
  }

  // Refresh helper
  async function refetchSchools() {
    await loadSchools()
  }

  useEffect(() => {
    async function initSession() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        if (currentUser) {
          const fetchedSchools = await loadSchools()
          const role = currentUser.user_metadata?.role || null
          const schoolId = currentUser.user_metadata?.school_id || null

          if (role === 'super_admin') {
            // Retrieve active school from localStorage or cookie
            let storedId = null
            if (typeof window !== 'undefined') {
              storedId = localStorage.getItem('super_admin_active_school_id')
            }

            const activeId = storedId || fetchedSchools[0]?.id || null
            if (activeId) {
              setActiveSchoolId(activeId)
              if (typeof window !== 'undefined') {
                localStorage.setItem('super_admin_active_school_id', activeId)
                document.cookie = `super_admin_active_school_id=${activeId}; path=/; max-age=31536000; SameSite=Lax`
                fetch('/api/auth/active-school', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ schoolId: activeId }),
                }).catch(() => { })
              }
              const found = fetchedSchools.find((s: any) => s.id === activeId)
              setSchoolName(found ? found.name : 'Super Admin')
            } else {
              setSchoolName('Super Admin')
            }
          } else if (schoolId) {
            setActiveSchoolId(schoolId)
            const found = fetchedSchools.find((s: any) => s.id === schoolId)
            setSchoolName(found ? found.name : null)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
      } finally {
        setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const fetchedSchools = await loadSchools()
        const role = currentUser.user_metadata?.role || null
        const schoolId = currentUser.user_metadata?.school_id || null

        if (role === 'super_admin') {
          let storedId = null
          if (typeof window !== 'undefined') {
            storedId = localStorage.getItem('super_admin_active_school_id')
          }
          const activeId = storedId || fetchedSchools[0]?.id || null
          if (activeId) {
            setActiveSchoolId(activeId)
            const found = fetchedSchools.find((s: any) => s.id === activeId)
            setSchoolName(found ? found.name : 'Super Admin')
            if (typeof window !== 'undefined') {
              fetch('/api/auth/active-school', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schoolId: activeId }),
              }).catch(() => { })
            }
          }
        } else if (schoolId) {
          setActiveSchoolId(schoolId)
          const found = fetchedSchools.find((s: any) => s.id === schoolId)
          setSchoolName(found ? found.name : null)
        }
      } else {
        setSchools([])
        setActiveSchoolId(null)
        setSchoolName(null)
        if (typeof window !== 'undefined') {
          fetch('/api/auth/active-school', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schoolId: null }),
          }).catch(() => { })
        }
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSetSchoolId(id: string) {
    setActiveSchoolId(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('super_admin_active_school_id', id)
      document.cookie = `super_admin_active_school_id=${id}; path=/; max-age=31536000; SameSite=Lax`
      try {
        await fetch('/api/auth/active-school', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schoolId: id }),
        })
      } catch (err) {
        console.error('Error syncing active school cookie:', err)
      }
    }
    const found = schools.find((s) => s.id === id)
    setSchoolName(found ? found.name : 'Super Admin')
    // Trigger page refresh to make server components re-query with the new cookie
    window.location.reload()
  }

  const role = user?.user_metadata?.role || null
  const isSuperAdmin = role === 'super_admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        schoolId: activeSchoolId,
        role,
        isSuperAdmin,
        schoolName,
        schools,
        loading,
        setSchoolId: handleSetSchoolId,
        refetchSchools,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
