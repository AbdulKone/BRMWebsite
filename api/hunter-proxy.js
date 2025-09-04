import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS et validation
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, action, query, limit = 10 } = req.body;
    
    // Validation améliorée
    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    let url;
    let requestBody = null;

    // Construction de l'URL selon l'action
    switch (action) {
      case 'domain-search':
        if (!domain) {
          return res.status(400).json({ error: 'Missing domain parameter for domain-search' });
        }
        url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=${limit}`;
        break;
        
      case 'discover':
        if (!query) {
          return res.status(400).json({ error: 'Missing query parameter for discover' });
        }
        url = `https://api.hunter.io/v2/discover?api_key=${apiKey}&limit=${limit}`;
        // Pour l'API Discover, on utilise POST avec le query dans le body
        requestBody = {
          query: query
        };
        break;
        
      case 'email-finder':
        if (!domain) {
          return res.status(400).json({ error: 'Missing domain parameter for email-finder' });
        }
        const { first_name, last_name, full_name } = req.body;
        if (!first_name && !last_name && !full_name) {
          return res.status(400).json({ error: 'Missing name parameters for email-finder' });
        }
        
        let nameParams = '';
        if (full_name) {
          nameParams = `&full_name=${encodeURIComponent(full_name)}`;
        } else {
          if (first_name) nameParams += `&first_name=${encodeURIComponent(first_name)}`;
          if (last_name) nameParams += `&last_name=${encodeURIComponent(last_name)}`;
        }
        
        url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}${nameParams}&api_key=${apiKey}`;
        break;
        
      case 'email-verifier':
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Missing email parameter for email-verifier' });
        }
        url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`;
        break;
        
      default:
        return res.status(400).json({ error: `Unsupported action: ${action}` });
    }

    // Appel à l'API Hunter.io
    const fetchOptions = {
      method: requestBody ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BRM-Prospection/1.0'
      }
    };

    if (requestBody) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    
    // Gestion des erreurs de l'API Hunter.io
    if (!response.ok) {
      console.error('Hunter.io API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      return res.status(response.status).json({
        error: data.errors?.[0]?.details || data.error || 'Hunter.io API Error',
        hunter_error: data
      });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}