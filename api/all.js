export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://dry-craft-qt3g.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req;
    
    // Route handling
    if (url === '/api/all' || url === '/api/all/health') {
        res.status(200).json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            service: 'Dry Craft API - All endpoints'
        });
        return;
    }
    
    if (url === '/api/all/posts' && req.method === 'GET') {
        res.status(200).json([
            { id: 1, title: 'Sample Post', content: 'This is a sample post' }
        ]);
        return;
    }
    
    if (url === '/api/all/users' && req.method === 'GET') {
        res.status(200).json([
            { id: 1, username: 'sampleuser', email: 'user@example.com' }
        ]);
        return;
    }
    
    res.status(404).json({ error: 'Endpoint not found' });
}
