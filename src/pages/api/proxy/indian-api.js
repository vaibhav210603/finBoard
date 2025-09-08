// Proxy endpoint to handle CORS issues with Indian API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { symbol, exchange, api_key, endpoint } = req.query;

  if (!symbol || !api_key) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_INDIAN_API_BASE_URL;
    let url = `${baseUrl}/${endpoint || 'quote'}`;
    
    const params = new URLSearchParams({
      symbol,
      api_key,
    });

    // Only add exchange for Indian stocks, not for US stocks
    if (exchange && (exchange === 'NSE' || exchange === 'BSE')) {
      params.append('exchange', exchange);
    }

    url += `?${params.toString()}`;

    console.log(`Proxying request to: ${url}`);

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Finance Dashboard)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`API returned non-JSON response: ${contentType}`);
    }

    const data = await response.json();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    
    let errorMessage = 'The Indian API request failed.';
    let errorDetails = 'This might be due to CORS restrictions or API endpoint issues.';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout';
      errorDetails = 'The Indian API is taking too long to respond. Please try again or use a different API provider.';
    } else if (error.message.includes('fetch failed')) {
      errorMessage = 'Network connection failed';
      errorDetails = 'Unable to connect to the Indian API. The service might be down or unreachable.';
    } else if (error.message.includes('non-JSON response')) {
      errorMessage = 'Invalid API response';
      errorDetails = 'The Indian API returned an HTML page instead of data. The endpoint might be incorrect.';
    }
    
    res.status(500).json({ 
      message: errorMessage, 
      error: error.message,
      details: errorDetails,
      fallback: 'Consider using Alpha Vantage or Finnhub instead.'
    });
  }
}
