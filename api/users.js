const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('drycraft');
    cachedDb = db;
    return db;
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ALLOWED_ORIGINS || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const db = await connectToDatabase();
        
        if (req.method === 'GET') {
            // Get all users
            const users = await db.collection('users').find({}).project({ password: 0 }).toArray();
            res.status(200).json(users);
        } else if (req.method === 'POST') {
            // Create new user
            const user = req.body;
            
            // Check if user already exists
            const existingUser = await db.collection('users').findOne({ username: user.username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            
            const result = await db.collection('users').insertOne(user);
            res.status(201).json({ id: result.insertedId, ...user, password: undefined });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
