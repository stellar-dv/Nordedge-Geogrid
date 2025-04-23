import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the server
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to execute SQL queries
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  // Convert template literal to SQL query with parameters
  let query = strings[0]
  const params = []

  for (let i = 0; i < values.length; i++) {
    params.push(values[i])
    query += `$${i + 1}` + (strings[i + 1] || "")
  }

  try {
    const { data, error } = await supabase.rpc("execute_sql", { query, params })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("SQL query error:", error)
    throw error
  }
}
