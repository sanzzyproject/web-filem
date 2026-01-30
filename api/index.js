const Viu = require('../lib/Viu');
const viuApp = new Viu();

module.exports = async (req, res) => {
    // CORS Wajib agar tidak error di browser
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action, query, id } = req.query;

    try {
        let result;
        switch (action) {
            case 'home':
                result = await viuApp.home();
                break;
            case 'search':
                result = await viuApp.search(query);
                break;
            case 'detail':
                result = await viuApp.detail(id);
                break;
            case 'stream':
                result = await viuApp.stream(id);
                break;
            default:
                return res.status(400).json({ error: 'Action required' });
        }
        res.status(200).json(result);
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message });
    }
};
