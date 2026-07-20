const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  const { data, error } = await supabase.from('schools').delete().eq('id', '601f38fe-fe6f-478d-afc0-95dd5c99e1ab').select()
  console.log('Delete result:', data, 'Error:', error)
}
check()
