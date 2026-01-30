const Viu = require('../lib/Viu');
const viuApp = new Viu();

module.exports = async (req, res) => {
    // Force CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action, query, id } = req.query;

    try {
        let result;
        // Logic fallback jika Viu instance perlu refresh token
        switch (action) {
            case 'home':
                result = await viuApp.home();
                break;
            case 'search':
                if(!query) throw new Error("Butuh keyword search");
                result = await viuApp.search(query);
                break;
            case 'detail':
                if(!id) throw new Error("Butuh Product ID");
                result = await viuApp.detail(id);
                break;
            case 'stream':
                if(!id) throw new Error("Butuh CCS ID");
                result = await viuApp.stream(id);
                break;
            default:
                return res.status(400).json({ error: 'Action tidak dikenal' });
        }
        
        return res.status(200).json(result);

    } catch (error) {
        console.error("Backend Error:", error);
        return res.status(500).json({ 
            error: true, 
            message: error.message || "Internal Server Error" 
        });
    }
};
