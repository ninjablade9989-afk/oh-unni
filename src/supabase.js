import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://aougswsaqcmbdkagxawv.supabase.co'
const supabaseAnonKey = 'sb_publishable_pXd9lQR2M0EHk2ltKcPUow_F11RdJhU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseStorage = {
  async get(key, shared = false) {
    if (!shared) {
      const value = localStorage.getItem(key)
      return value ? { value } : null
    }
    
    try {
      const roomId = key.replace('phase10:room:', '')
      const { data, error } = await supabase
        .from('rooms')
        .select('data')
        .eq('id', roomId)
        .single()
      
      if (error || !data) return null
      return { value: data.data }
    } catch (error) {
      console.error('Error getting room:', error)
      return null
    }
  },
  
  async set(key, value, shared = false) {
    if (!shared) {
      localStorage.setItem(key, value)
      return true
    }
    
    try {
      const roomId = key.replace('phase10:room:', '')
      const { error } = await supabase
        .from('rooms')
        .upsert({ 
          id: roomId, 
          data: value,
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Error saving room:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Error saving room:', error)
      return false
    }
  }
}

export function subscribeToRoom(roomId, onUpdate) {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      },
      (payload) => {
        if (payload.new && payload.new.data) {
          try {
            const updatedRoom = JSON.parse(payload.new.data)
            onUpdate(updatedRoom)
          } catch (error) {
            console.error('Error parsing room data:', error)
          }
        }
      }
    )
    .subscribe()
  
  return () => {
    channel.unsubscribe()
  }
}