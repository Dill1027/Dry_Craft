export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle auth routes based on query parameter
    const { route } = req.query;
    
    if (route === 'login' && req.method === 'POST') {
        const { username, password } = req.body || {};
        
        if (username && password) {
            res.status(200).json({
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: 1,
                    username: username,
                    email: username + '@example.com'
                }
            });
        } else {
            res.status(400).json({ error: 'Username and password are required' });
        }
    } else if (route === 'register' && req.method === 'POST') {
        const { username, email, password } = req.body || {};
        
        if (username && email && password) {
            res.status(201).json({
                token: 'mock-jwt-token-' + Date.now(),
                user: {
                    id: Date.now(),
                    username: username,
                    email: email
                }
            });
        } else {
            res.status(400).json({ error: 'Username, email, and password are required' });
        }
    } else {
        res.status(200).json({ message: 'Auth API is working', availableRoutes: ['login', 'register'] });
    }
}
