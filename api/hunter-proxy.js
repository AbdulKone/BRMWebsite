import crypto from 'crypto';

export default async function handler(req, res) {
  // CORS et validation
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, action } = req.body;
    
    // Validation
    if (!domain || !action) {
      return res.status(400).json({ error: 'Missing domain or action' });
    }

    // Appel sécurisé à Hunter.io
    const apiKey = process.env.HUNTER_API_KEY; // Sans préfixe VITE_
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}