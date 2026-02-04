/**
 * filepath: api/config.js
 * GET /api/config
 * 
 * Returns public configuration needed by frontend.
 * 
 * Response:
 * {
 *   supabase: {
 *     url: string,
 *     anonKey: string
 *   },
 *   environment: string,
 *   version: string
 * }
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      success: true,
      config: {
        supabase: {
          url: process.env.SUPABASE_URL,
          anonKey: process.env.SUPABASE_ANON_KEY,
        },
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0',
        apiBaseUrl: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000',
      },
    });
  } catch (error) {
    console.error('Error fetching config:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch configuration',
    });
  }
}
