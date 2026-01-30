const Viu = require('../lib/Viu');

// Inisialisasi instance Viu
// Catatan: Di serverless, instance mungkin di-reset tiap request, 
// tapi class Viu kamu sudah handle auto-login jika token null.
const viuApp = new Viu();

module.exports = async (req, res) => {
    // Setup CORS agar bisa diakses dari frontend mana saja
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

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
                if (!query) throw new Error("Query dibutuhkan");
                result = await viuApp.search(query);
                break;
            case 'detail':
                if (!id) throw new Error("Product ID dibutuhkan");
                result = await viuApp.detail(id);
                break;
            case 'stream':
                if (!id) throw new Error("CCS Product ID dibutuhkan");
                result = await viuApp.stream(id);
                break;
            default:
                return res.status(400).json({ error: 'Action tidak valid (home, search, detail, stream)' });
        }

        res.status(200).json(result);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
