const API_URL = '/api'; 

// Elements
const heroImg = document.getElementById('heroImg');
const heroTitle = document.getElementById('heroTitle');
const heroInfo = document.getElementById('heroInfo');
const rowsContainer = document.getElementById('rowsContainer');
const detailModal = document.getElementById('detailModal');
const backdrop = document.getElementById('modalBackdrop');

document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    
    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });
});

async function loadHome() {
    try {
        const res = await fetch(`${API_URL}?action=home`);
        if(!res.ok) throw new Error("Gagal connect ke server");
        
        const json = await res.json();
        
        // --- LOGIC PARSING DATA YANG LEBIH KUAT ---
        // Kadang data ada di section, kadang di item_list tergantung update API
        let sections = [];
        
        // Cek struktur data umum Viu
        if (json.section) sections = json.section;
        else if (Array.isArray(json)) sections = json;
        
        if (sections.length === 0) {
            document.querySelector('.hero-loader').style.display = 'none';
            heroTitle.innerText = "Gagal memuat konten. Refresh halaman.";
            return;
        }

        // 1. Setup Hero (Ambil film pertama dari section pertama yang valid)
        const validSection = sections.find(s => s.data && s.data.length > 0);
        if (validSection) {
            const heroMovie = validSection.data[0];
            setupHero(heroMovie);
        }

        // 2. Render Rows
        rowsContainer.innerHTML = ''; // Hapus skeleton
        
        sections.forEach(sec => {
            if (sec.data && sec.data.length > 0 && sec.title) {
                const row = document.createElement('div');
                row.className = 'row';
                
                // Generate Poster HTML
                const posters = sec.data.map(mov => `
                    <img class="poster" 
                         src="${mov.image_url}" 
                         onclick="openDetail('${mov.product_id}')"
                         loading="lazy"
                         alt="${mov.title || 'Movie'}">
                `).join('');

                row.innerHTML = `
                    <h3>${sec.title}</h3>
                    <div class="row-scroller">${posters}</div>
                `;
                rowsContainer.appendChild(row);
            }
        });

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan jaringan.");
    }
}

function setupHero(movie) {
    // Hide loader
    document.querySelector('.hero-loader').classList.add('hidden');
    
    // Set Image & Text
    const imgUrl = movie.cover_image_url || movie.image_url;
    heroImg.src = imgUrl;
    heroImg.classList.remove('hidden');
    
    heroTitle.innerText = movie.title || "Featured Content";
    heroInfo.classList.remove('hidden');

    // Button Actions
    document.getElementById('heroPlayBtn').onclick = () => openDetail(movie.product_id); // Ke detail dulu biar rapi
    document.getElementById('heroDetailBtn').onclick = () => openDetail(movie.product_id);
}

// --- DETAIL & EPISODES ---

async function openDetail(id) {
    // Show Loading state in Modal (Optional improvement)
    backdrop.classList.remove('hidden');
    detailModal.classList.add('active');
    
    // Reset konten lama
    document.getElementById('modalTitle').innerText = "Loading...";
    document.getElementById('episodeList').innerHTML = '<div class="skeleton" style="height:50px;width:100%"></div>';

    try {
        const res = await fetch(`${API_URL}?action=detail&id=${id}`);
        const data = await res.json();
        
        const meta = data.metadata.current_product;
        
        // Isi Data Modal
        document.getElementById('modalTitle').innerText = meta.title || meta.synopsis;
        document.getElementById('modalDesc').innerText = meta.synopsis || "Tidak ada deskripsi.";
        document.getElementById('modalYear').innerText = meta.release_date || "2024";
        
        // Render Episodes
        const epList = document.getElementById('episodeList');
        epList.innerHTML = '';

        if(data.product_list && data.product_list.length > 0) {
            data.product_list.forEach((ep, index) => {
                const div = document.createElement('div');
                div.className = 'ep-item';
                div.onclick = () => playVideo(ep.ccs_product_id, ep.title || `Episode ${ep.number}`);
                div.innerHTML = `
                    <span class="material-icons ep-play-icon">play_circle_outline</span>
                    <div class="ep-info">
                        <h4>Episode ${ep.number}</h4>
                        <small>${ep.synopsis ? ep.synopsis.substring(0,40)+'...' : 'Tonton sekarang'}</small>
                    </div>
                `;
                epList.appendChild(div);
            });
        } else {
            epList.innerHTML = '<p>Video tidak tersedia.</p>';
        }

    } catch (err) {
        document.getElementById('modalTitle').innerText = "Error";
    }
}

function closeDetail() {
    detailModal.classList.remove('active');
    backdrop.classList.add('hidden');
}

// --- PLAYER LOGIC ---

async function playVideo(ccsId, title) {
    const playerContainer = document.getElementById('playerContainer');
    const video = document.getElementById('videoPlayer');
    
    // Tampilkan Player UI
    playerContainer.classList.remove('hidden');
    document.getElementById('playerTitle').innerText = "Memuat Video...";
    
    try {
        const res = await fetch(`${API_URL}?action=stream&id=${ccsId}`);
        const data = await res.json();
        
        if(data.url) {
            document.getElementById('playerTitle').innerText = title || "Now Playing";
            
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
            alert("Link stream gagal didapat (Mungkin konten Premium).");
            closePlayer();
        }
    } catch (err) {
        alert("Error memutar video.");
        closePlayer();
    }
}

function closePlayer() {
    const video = document.getElementById('videoPlayer');
    video.pause();
    video.src = "";
    document.getElementById('playerContainer').classList.add('hidden');
}

// --- SEARCH ---
function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');
    overlay.classList.toggle('hidden');
    if(!overlay.classList.contains('hidden')) document.getElementById('searchInput').focus();
}

document.getElementById('searchInput').addEventListener('keypress', async (e) => {
    if(e.key === 'Enter') {
        const q = e.target.value;
        const grid = document.getElementById('searchResultGrid');
        grid.innerHTML = 'Loading...';
        
        const res = await fetch(`${API_URL}?action=search&query=${q}`);
        const data = await res.json();
        
        grid.innerHTML = '';
        data.forEach(item => {
            grid.innerHTML += `
                <img src="${item.image_url}" style="width:100%; border-radius:4px;" onclick="openDetail('${item.product_id}'); toggleSearch()">
            `;
        });
    }
});
