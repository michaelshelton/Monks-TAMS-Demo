import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query
  
  // Build the target URL to your backend
  const targetUrl = `http://34.216.9.25:8000/${Array.isArray(path) ? path.join('/') : path}`
  
  // Add query parameters if they exist
  const queryParams = new URLSearchParams(req.query as any).toString()
  const fullTargetUrl = queryParams ? `${targetUrl}?${queryParams}` : targetUrl
  
  try {
    // Forward the request to your backend
    const response = await fetch(fullTargetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Forward any other headers that might be needed
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        ...(req.headers['x-api-key'] && { 'X-API-Key': req.headers['x-api-key'] as string }),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    })
    
    // Get the response data
    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }
    
    // Forward the response status and headers
    res.status(response.status)
    
    // Forward important headers from the backend
    const headersToForward = ['content-type', 'x-paging-count', 'x-paging-limit', 'x-paging-nextkey', 'x-paging-prevkey', 'x-paging-firstkey', 'x-paging-lastkey', 'x-paging-timerange', 'x-paging-reverseorder', 'link']
    
    headersToForward.forEach(header => {
      const value = response.headers.get(header)
      if (value) {
        res.setHeader(header, value)
      }
    })
    
    // Send the response
    if (typeof data === 'string') {
      res.send(data)
    } else {
      res.json(data)
    }
    
  } catch (error) {
    console.error('Proxy request failed:', error)
    res.status(500).json({ 
      error: 'Proxy request failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      targetUrl: fullTargetUrl
    })
  }
}

// Handle preflight OPTIONS requests for CORS
export async function OPTIONS(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  res.status(200).end()
}
