import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the session or user object
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    // Parse the request URL to get the path and method
    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/noteplanning-api', '')
    const method = req.method

    // Route handling
    let response: Response

    switch (true) {
      case path === '/health' && method === 'GET':
        response = await handleHealthCheck()
        break
      
      case path.startsWith('/api/customers') && method === 'GET':
        response = await handleGetCustomers(req, supabaseClient, user)
        break
      
      case path.startsWith('/api/customers') && method === 'POST':
        response = await handleCreateCustomer(req, supabaseClient, user)
        break
      
      case path.startsWith('/api/products') && method === 'GET':
        response = await handleGetProducts(req, supabaseClient, user)
        break
      
      case path.startsWith('/api/videos') && method === 'GET':
        response = await handleGetVideos(req, supabaseClient, user)
        break
      
      case path.startsWith('/api/purchases') && method === 'GET':
        response = await handleGetPurchases(req, supabaseClient, user)
        break
      
      case path.startsWith('/api/purchases') && method === 'POST':
        response = await handleCreatePurchase(req, supabaseClient, user)
        break
      
      case path.startsWith('/api/memberships') && method === 'GET':
        response = await handleGetMemberships(req, supabaseClient, user)
        break
      
      case path.startsWith('/api/abacatepay') && method === 'POST':
        response = await handleAbacatePay(req, supabaseClient, user)
        break
      
      default:
        response = new Response(
          JSON.stringify({ error: 'Route not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    return response

  } catch (error) {
    console.error('Error in Edge Function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Health check endpoint
async function handleHealthCheck(): Promise<Response> {
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'noteplanning-api'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

// Customer endpoints
async function handleGetCustomers(req: Request, supabase: any, user: any): Promise<Response> {
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreateCustomer(req: Request, supabase: any, user: any): Promise<Response> {
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const body = await req.json()
  
  const { data, error } = await supabase
    .from('customers')
    .insert([body])
    .select()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Product endpoints
async function handleGetProducts(req: Request, supabase: any, user: any): Promise<Response> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Video endpoints
async function handleGetVideos(req: Request, supabase: any, user: any): Promise<Response> {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Purchase endpoints
async function handleGetPurchases(req: Request, supabase: any, user: any): Promise<Response> {
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('purchases')
    .select(`
      *,
      customer:customers(*),
      product:products(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreatePurchase(req: Request, supabase: any, user: any): Promise<Response> {
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const body = await req.json()
  
  const { data, error } = await supabase
    .from('purchases')
    .insert([body])
    .select(`
      *,
      customer:customers(*),
      product:products(*)
    `)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Membership endpoints
async function handleGetMemberships(req: Request, supabase: any, user: any): Promise<Response> {
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data, error } = await supabase
    .from('memberships')
    .select(`
      *,
      customer:customers(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// AbacatePay webhook endpoint
async function handleAbacatePay(req: Request, supabase: any, user: any): Promise<Response> {
  const body = await req.json()
  
  // Validate webhook signature if needed
  // const signature = req.headers.get('x-abacatepay-signature')
  
  // Process the webhook
  console.log('AbacatePay webhook received:', body)
  
  // Update purchase status or create new purchase
  if (body.status === 'paid') {
    const { data, error } = await supabase
      .from('purchases')
      .update({ status: 'paid' })
      .eq('external_id', body.external_id)
      .select()

    if (error) {
      console.error('Error updating purchase:', error)
    }
  }

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
