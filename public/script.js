const API_URL = '/api'; // Relative path untuk Vercel

// --- Inisialisasi ---
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.navbar');
        if (window.scrollY > 100) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

    // Enter di search box
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') doSearch();
    });
});

// --- Fetch Data Home ---
async function loadHome() {
    try {
        const res = await fetch(`${API_URL}?action=home`);
        const data = await res.json();
        
        if (!data || !data.section) return;

        // Cari section yang ada konten videonya
        const sections = data.section.filter(s => s.data && s.data.length > 0);
        
        // Set Hero Banner (Ambil item pertama dari section Trending/pertama)
        const heroItem = sections[0].data[0];
        setHero(heroItem);

        // Render Rows
        const container = document.getElementById('rowsContainer');
        container.innerHTML = ''; // Clear

        sections.forEach(sec => {
            // Hindari section iklan/kosong
            if(sec.data.length > 0 && sec.title) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'row';
                
                let postersHTML = '';
                sec.data.forEach(movie => {
                    // Cek ada gambar tidak
                    const img = movie.image_url || 'https://via.placeholder.com/150x225?text=No+Image';
                    postersHTML += `
                        <img class="poster" 
                             src="${img}" 
                             alt="${movie.title}"
                             onclick="openDetail('${movie.product_id}')">
                    `;
                });

                rowDiv.innerHTML = `
                    <h3>${sec.title}</h3>
                    <div class="row-posters">${postersHTML}</div>
                `;
                container.appendChild(rowDiv);
            }
        });

    } catch (err) {
        console.error("Gagal load home:", err);
    }
}

function setHero(movie) {
    document.getElementById('hero').style.backgroundImage = `url('${movie.cover_image_url || movie.image_url}')`;
    document.getElementById('heroTitle').innerText = movie.title || movie.synopsis;
    document.getElementById('heroDesc').innerText = movie.synopsis || "Saksikan keseruannya sekarang hanya di VIUFLIX.";
    
    const playBtn = document.getElementById('heroPlayBtn');
    playBtn.onclick = () => openDetail(movie.product_id);
}

// --- Detail & Player ---
async function openDetail(productId) {
    try {
        // Tampilkan loading/buka modal player
        const modal = document.getElementById('playerModal');
        const videoTitle = document.getElementById('playerTitle');
        const epList = document.getElementById('episodeList');
        
        videoTitle.innerText = "Loading...";
        epList.innerHTML = '';
        modal.classList.remove('hidden');

        // Fetch detail
        const res = await fetch(`${API_URL}?action=detail&id=${productId}`);
        const data = await res.json();
        
        const metadata = data.metadata.current_product;
        videoTitle.innerText = metadata.synopsis; // Kadang title ada di synopsis untuk API ini

        // Render Episode List
        if (data.product_list && data.product_list.length > 0) {
            data.product_list.forEach(ep => {
                const btn = document.createElement('button');
                btn.className = 'ep-btn';
                btn.innerText = `Ep ${ep.number}`;
                btn.onclick = () => playVideo(ep.ccs_product_id);
                epList.appendChild(btn);
            });
            
            // Auto play episode pertama/terpilih
            playVideo(data.product_list[0].ccs_product_id);
        }

    } catch (err) {
        alert("Gagal memuat detail video.");
        closePlayer();
    }
}

async function playVideo(ccsId) {
    try {
        const res = await fetch(`${API_URL}?action=stream&id=${ccsId}`);
        const data = await res.json();
        
        if(data && data.url) {
            initPlayer(data.url);
        } else {
            alert("Stream URL tidak ditemukan (Mungkin konten Premium/VIP).");
        }
    } catch (err) {
        console.error(err);
    }
}

function initPlayer(sourceUrl) {
    const video = document.getElementById('video');
    
    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(sourceUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = sourceUrl;
        video.addEventListener('loadedmetadata', function() {
            video.play();
        });
    }
}

function closePlayer() {
    const video = document.getElementById('video');
    video.pause();
    video.src = "";
    document.getElementById('playerModal').classList.add('hidden');
}

// --- Search Logic ---
function doSearch() {
    const query = document.getElementById('searchInput').value;
    const input = document.getElementById('searchInput');
    
    // Toggle input visibility jika kosong
    if (input.style.display === 'none' || input.style.display === '') {
        input.style.display = 'block';
        input.focus();
        return;
    }
    
    if(!query) return;

    fetchSearch(query);
}

async function fetchSearch(query) {
    try {
        document.getElementById('mainContent').classList.add('hidden');
        document.getElementById('searchResults').classList.remove('hidden');
        document.getElementById('searchGrid').innerHTML = '<p>Mencari...</p>';

        const res = await fetch(`${API_URL}?action=search&query=${query}`);
        const data = await res.json();
        
        const grid = document.getElementById('searchGrid');
        grid.innerHTML = '';

        if(data && data.length > 0) {
            data.forEach(item => {
                const img = item.image_url;
                grid.innerHTML += `
                    <div class="poster" onclick="openDetail('${item.product_id}')">
                         <img src="${img}" style="width:100%; border-radius:4px;">
                         <p style="margin-top:5px; font-size:0.8rem">${item.synopsis}</p>
                    </div>
                `;
            });
        } else {
            grid.innerHTML = '<p>Tidak ditemukan.</p>';
        }

    } catch (err) {
        console.error(err);
    }
}

function closeSearch() {
    document.getElementById('searchResults').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('searchInput').value = '';
    document.getElementById('searchInput').style.display = 'none';
}
