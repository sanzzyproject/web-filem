const API_URL = '/api/index'; // Mengarah ke function Vercel

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });
});

async function loadHome() {
    try {
        const res = await fetch(`${API_URL}?action=home`);
        if(!res.ok) throw new Error("Gagal mengambil data dari server");
        
        const json = await res.json();
        
        // Parsing data yang fleksibel
        let sections = json.section || (Array.isArray(json) ? json : []);
        if (sections.length === 0) throw new Error("Data film kosong");

        // Cari section yang valid
        const validSections = sections.filter(s => s.data && s.data.length > 0);
        if(validSections.length === 0) throw new Error("Tidak ada film ditemukan");

        // Set Hero (Ambil item pertama dari section pertama)
        const heroItem = validSections[0].data[0];
        setupHero(heroItem);

        // Render List
        const container = document.getElementById('sectionsContainer');
        container.innerHTML = '';
        
        validSections.forEach(sec => {
            if(sec.title) {
                const sectionHtml = document.createElement('div');
                sectionHtml.className = 'section';
                
                const cards = sec.data.map(mov => `
                    <div class="card" onclick="openDetail('${mov.product_id}')">
                        <img src="${mov.image_url}" loading="lazy" alt="${mov.title}">
                    </div>
                `).join('');

                sectionHtml.innerHTML = `
                    <div class="section-title">${sec.title}</div>
                    <div class="scroll-row">${cards}</div>
                `;
                container.appendChild(sectionHtml);
            }
        });

        // Switch tampilan dari Loading ke Content
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');

    } catch (err) {
        console.error(err);
        document.getElementById('loader').innerHTML = `
            <div style="padding:40px; text-align:center;">
                <h3>Maaf, Terjadi Kesalahan</h3>
                <p>${err.message}</p>
                <button class="btn btn-play" onclick="location.reload()" style="margin:20px auto;">Coba Lagi</button>
            </div>
        `;
    }
}

function setupHero(movie) {
    document.getElementById('heroImg').src = movie.cover_image_url || movie.image_url;
    document.getElementById('heroTitle').innerText = movie.title || "Featured";
    
    document.getElementById('heroPlay').onclick = () => openDetail(movie.product_id);
    document.getElementById('heroInfo').onclick = () => openDetail(movie.product_id);
}

// --- DETAIL & EPISODES ---
async function openDetail(id) {
    const sheet = document.getElementById('sheet');
    const overlay = document.getElementById('sheetOverlay');
    const epList = document.getElementById('epList');

    // Buka sheet dulu biar responsif
    overlay.classList.add('active');
    sheet.classList.add('active');
    
    document.getElementById('sheetTitle').innerText = "Memuat...";
    epList.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Mengambil info...</div>';

    try {
        const res = await fetch(`${API_URL}?action=detail&id=${id}`);
        const data = await res.json();
        const meta = data.metadata.current_product;

        document.getElementById('sheetTitle').innerText = meta.title || meta.synopsis;
        document.getElementById('sheetDesc').innerText = meta.synopsis || "-";
        document.getElementById('sheetYear').innerText = meta.release_date || "";

        epList.innerHTML = '';
        if(data.product_list && data.product_list.length > 0) {
            data.product_list.forEach(ep => {
                const div = document.createElement('div');
                div.className = 'ep-item';
                div.innerHTML = `
                    <div class="ep-info">
                        <h4>Episode ${ep.number}</h4>
                        <p>${ep.synopsis ? ep.synopsis.substring(0, 30)+'...' : 'Tonton sekarang'}</p>
                    </div>
                    <span class="material-icons" style="color:var(--primary)">play_circle</span>
                `;
                div.onclick = () => playVideo(ep.ccs_product_id);
                epList.appendChild(div);
            });
        } else {
            epList.innerHTML = '<div style="padding:20px">Video tidak tersedia</div>';
        }

    } catch (err) {
        document.getElementById('sheetTitle').innerText = "Gagal Memuat";
    }
}

function closeSheet() {
    document.getElementById('sheet').classList.remove('active');
    document.getElementById('sheetOverlay').classList.remove('active');
}

// --- PLAYER ---
async function playVideo(ccsId) {
    const modal = document.getElementById('playerModal');
    const video = document.getElementById('videoPlayer');
    modal.classList.add('active');

    try {
        const res = await fetch(`${API_URL}?action=stream&id=${ccsId}`);
        const data = await res.json();
        
        if (data.url) {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(data.url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = data.url;
                video.play();
            }
        } else {
            alert("Stream link tidak ditemukan (Mungkin konten Premium)");
            stopVideo();
        }
    } catch (err) {
        alert("Gagal memutar video");
        stopVideo();
    }
}

function stopVideo() {
    const video = document.getElementById('videoPlayer');
    video.pause();
    video.src = "";
    document.getElementById('playerModal').classList.remove('active');
}

// --- SEARCH ---
function toggleSearch() {
    const page = document.getElementById('searchPage');
    page.classList.toggle('active');
    if(page.classList.contains('active')) document.getElementById('searchInput').focus();
}

document.getElementById('searchInput').addEventListener('keypress', async (e) => {
    if(e.key === 'Enter') {
        const grid = document.getElementById('searchGrid');
        grid.innerHTML = '<div style="color:#fff">Mencari...</div>';
        
        try {
            const res = await fetch(`${API_URL}?action=search&query=${e.target.value}`);
            const data = await res.json();
            
            grid.innerHTML = '';
            data.forEach(item => {
                grid.innerHTML += `
                    <div class="card" onclick="openDetail('${item.product_id}'); toggleSearch()">
                        <img src="${item.image_url}" style="width:100%; border-radius:4px;">
                        <p style="font-size:0.7rem; margin-top:5px; color:#ccc; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${item.title || item.synopsis}</p>
                    </div>
                `;
            });
        } catch(err) { grid.innerHTML = 'Gagal mencari.'; }
    }
});
