document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================================
    // 1. GLOBAL: PRELOADER (RED DE SEGURIDAD)
    // =========================================================
    const pageLoader = document.getElementById('page-loader');
    if (pageLoader) {
        const hideLoader = () => {
            pageLoader.classList.add('loader-hidden');
            setTimeout(() => { 
                pageLoader.style.display = 'none'; 
            }, 500);
        };

        // Intenta ocultarlo apenas carga el DOM
        setTimeout(hideLoader, 600);

        // RESPALDO: Si por algo no se ocultó en 3 segundos, forzarlo.
        setTimeout(() => {
            pageLoader.style.display = 'none';
        }, 3000);
    }

    // =========================================================
    // 2. GLOBAL: HEADER & NAV
    // =========================================================
    const header = document.getElementById('mainHeader');
    let ticking = false;

    if (header) { // Check de seguridad
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 50) header.classList.add('scrolled');
                    else header.classList.remove('scrolled');
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // Menú Hamburguesa
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hamburgerBtn.classList.toggle('is-active');
            navMenu.classList.toggle('is-open');
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                hamburgerBtn.classList.remove('is-active');
                navMenu.classList.remove('is-open');
            }
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('is-active');
                navMenu.classList.remove('is-open');
            });
        });
    }

    // =========================================================
    // 3. VIDEO INTELIGENTE (SOLO SI EXISTEN VIDEOS)
    // =========================================================
    if (window.innerWidth > 768) {
        const lazyVideos = document.querySelectorAll('.lazy-video');
        if (lazyVideos.length > 0) {
            lazyVideos.forEach(video => {
                const source = video.querySelector('source');
                if (source && source.dataset.src) {
                    source.src = source.dataset.src; 
                    video.load(); 
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => { console.log('Autoplay handled'); });
                    }
                }
            });
        }
    }

    // =========================================================
    // 4. ANIMACIONES
    // =========================================================
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(el => revealObserver.observe(el));
    }

    // =========================================================
    // 5. INICIALIZADORES (SOLO SI EXISTEN LOS ELEMENTOS)
    // =========================================================
    
    // Campo
    if (document.getElementById('track-interiores')) {
        initSlider('track-interiores', 'dots-interiores');
        initSlider('track-exteriores', 'dots-exteriores');
        initSlider('track-lifestyle', 'dots-lifestyle');
    }

    // Parador
    if (document.getElementById('gridContainer') || document.getElementById('listContainer')) {
        initScheduleSystem();
    }
    if (document.getElementById('regionalTrack')) {
         initRegionalSlider();
    }

    // Hotel (Reservas)
    const btnConsultar = document.getElementById('btnConsultar');
    if (btnConsultar) {
        initHotelLogic();
    }

}); // --- FIN DOMContentLoaded ---


/* =========================================
   FUNCIONES AUXILIARES
   ========================================= */

// NUEVA FUNCIÓN PARA EL CALENDARIO FLATPICKR
function initHotelLogic() {
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const guestsSelect = document.getElementById('guests');
    const btnConsultar = document.getElementById('btnConsultar');

    if (checkinInput && checkoutInput) {
        
        // Inicializamos el calendario de Salida (Checkout)
        const checkoutPicker = flatpickr(checkoutInput, {
            locale: "es",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y", // Formato visual lindo: 25/12/2026
            minDate: "today",
            disableMobile: true // Forza el calendario premium en celulares
        });

        // Inicializamos el calendario de Llegada (Checkin)
        flatpickr(checkinInput, {
            locale: "es",
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y",
            minDate: "today",
            disableMobile: true,
            onChange: function(selectedDates, dateStr, instance) {
                // Cuando eligen llegada, la salida mínima es un día después
                if(selectedDates.length > 0) {
                    let nextDay = new Date(selectedDates[0]);
                    nextDay.setDate(nextDay.getDate() + 1);
                    checkoutPicker.set('minDate', nextDay);
                    
                    // Si ya había una fecha de salida anterior a la nueva de llegada, la borramos
                    if (checkoutPicker.selectedDates.length > 0 && checkoutPicker.selectedDates[0] <= selectedDates[0]) {
                        checkoutPicker.clear();
                    }
                    // Abre automáticamente el segundo calendario para agilizar
                    setTimeout(() => checkoutPicker.open(), 100);
                }
            }
        });

        btnConsultar.addEventListener('click', () => {
            // Flatpickr guarda la fecha real en el input original en formato Y-m-d
            const checkin = checkinInput.value;
            const checkout = checkoutInput.value;
            const guests = guestsSelect ? guestsSelect.value : "2"; 
            
            if (!checkin || !checkout) {
                alert('Por favor, selecciona fecha de llegada y salida.');
                return;
            }
            
            const message = `Hola! Quisiera consultar disponibilidad para el Hotel.%0A%0A📅 *Llegada:* ${formatDate(checkin)}%0A📅 *Salida:* ${formatDate(checkout)}%0A👥 *Personas:* ${guests}`;
            window.open(`https://wa.me/5493446621925?text=${message}`, '_blank');
        });
    }
}

function formatDate(dateString) {
    if(!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// --- MODALES ---
let currentImages = [];
let currentIndex = 0;

function openModal(element) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (!modal || !modalImg) return;
    
    const imgClicked = element.tagName === 'IMG' ? element : element.querySelector('img');
    if(!imgClicked) return;

    const track = element.closest('.slider-track') || element.closest('.gallery-grid') || element.closest('.modal-grid-content') || element.closest('.marquee-content');
    
    if(track) {
        currentImages = Array.from(track.querySelectorAll('img'));
    } else {
        currentImages = [imgClicked];
    }
    
    currentIndex = currentImages.indexOf(imgClicked);
    if(currentIndex === -1) currentIndex = 0;
    
    modal.style.display = 'flex';
    modalImg.src = imgClicked.src;
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function navigateImage(direction) {
    if (currentImages.length === 0) return;
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = currentImages.length - 1;
    if (currentIndex >= currentImages.length) currentIndex = 0;
    
    const img = currentImages[currentIndex];
    const modalImg = document.getElementById('modalImage');
    if(modalImg) {
        modalImg.style.opacity = '0.5';
        setTimeout(() => {
            modalImg.src = img.src;
            modalImg.style.opacity = '1';
        }, 150);
    }
}

function updateMap(cardElement, mapUrl) {
    const mapFrame = document.getElementById('dynamicMap');
    const loader = document.getElementById('mapLoader');
    if (!mapFrame) return;

    document.querySelectorAll('.location-card, .amenity-item, .place-card, .loc-item-visual').forEach(c => {
        c.classList.remove('active');
        c.style.borderLeft = ''; 
    });

    if(cardElement) cardElement.classList.add('active');
    if (loader) loader.classList.add('active');

    setTimeout(() => {
        mapFrame.src = mapUrl;
        mapFrame.onload = () => { if (loader) loader.classList.remove('active'); };
    }, 200);
}

function openVideoModal(videoId) {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('youtubePlayer');
    if (!modal || !container) return;
    container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.style.display = 'flex';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const container = document.getElementById('youtubePlayer');
    if (modal) modal.style.display = 'none';
    if (container) container.innerHTML = ''; 
}

function openFullGridModal(category) {
    const modal = document.getElementById('fullGridModal');
    const content = document.getElementById('fullGridContent');
    const title = document.getElementById('fullGridTitle');
    const dataSource = document.getElementById('data-' + category);
    
    if(!modal || !content || !dataSource) return;

    content.innerHTML = '';
    if(title) title.textContent = "Galería " + category.charAt(0).toUpperCase() + category.slice(1);

    const images = Array.from(dataSource.querySelectorAll('img'));
    images.forEach(img => {
        const div = document.createElement('div');
        div.className = 'grid-cell';
        const newImg = document.createElement('img');
        newImg.src = img.src;
        newImg.loading = "lazy"; 
        newImg.onclick = function() { openModal(this); }; 
        div.appendChild(newImg);
        content.appendChild(div);
    });

    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('open'); }, 10);
    document.body.style.overflow = 'hidden'; 
}

function closeFullGridModal() {
    const modal = document.getElementById('fullGridModal');
    if(modal) {
        modal.classList.remove('open');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 400); 
    }
}

function initSlider(trackId, dotsContainerId) {
    const track = document.getElementById(trackId);
    const dotsContainer = document.getElementById(dotsContainerId);
    if (!track || !dotsContainer) return;

    const items = track.querySelectorAll('.slide-item');
    dotsContainer.innerHTML = ''; 
    items.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => scrollToSlide(track, index));
        dotsContainer.appendChild(dot);
    });

    track.addEventListener('scroll', () => {
        const scrollLeft = track.scrollLeft;
        const itemWidth = items[0].offsetWidth + 20; 
        const index = Math.round(scrollLeft / itemWidth);
        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach(d => d.classList.remove('active'));
        if(dots[index]) dots[index].classList.add('active');
    }, { passive: true });

    const wrapper = track.parentElement;
    const btnNext = wrapper.querySelector('.next');
    const btnPrev = wrapper.querySelector('.prev');
    if(btnNext) btnNext.addEventListener('click', () => track.scrollBy({ left: 300, behavior: 'smooth' }));
    if(btnPrev) btnPrev.addEventListener('click', () => track.scrollBy({ left: -300, behavior: 'smooth' }));
}

function scrollToSlide(track, index) {
    const items = track.querySelectorAll('.slide-item');
    if(!items[index]) return;
    const itemWidth = items[index].offsetWidth + 20; 
    track.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
}

function initScheduleSystem() {
    const gridContainer = document.getElementById('gridContainer');
    const listContainer = document.getElementById('listContainer');
    const listScrollArea = document.getElementById('listScrollArea');
    const btnPrev = document.getElementById('btnPrevView');
    const btnNext = document.getElementById('btnNextView');
    const viewNameLabel = document.getElementById('viewName');
    const searchInput = document.getElementById('destinationInput');
    const suggestionsList = document.getElementById('suggestionsList');

    if (!gridContainer || !listContainer) return;

    // Rutas WebP para logos
    const logoMapList = {
        "via bariloche": "img/logos/via bariloche.webp",
        "flecha bus": "img/logos/flecha bus.webp",
        "crucero del norte": "img/logos/crucero del norte.webp",
        "rapido tata": "img/logos/rapido tata.webp",
        "rápido tata": "img/logos/rapido tata.webp"
    };

    const mainCompaniesConfig = [
        { name: "Via Bariloche", headerClass: "header-via", region: "Vía Bariloche", logo: "img/logos/via bariloche.webp", borderClass: "border-via" },
        { name: "Flecha Bus", headerClass: "header-flecha", region: "Flecha Bus", logo: "img/logos/flecha bus.webp", borderClass: "border-flecha" },
        { name: "Rapido Tata", headerClass: "header-rapido", region: "Rápido Tata", logo: "img/logos/rapido tata.webp", borderClass: "border-rapido" },
        { name: "Crucero del Norte", headerClass: "header-crucero", region: "Crucero del Norte", logo: "img/logos/crucero del norte.webp", borderClass: "border-crucero" }
    ];

    const allTrips = [
        { empresa: "Via Bariloche", time: "04:35", dest: "Retiro", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "05:30", dest: "Retiro", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "07:35", dest: "Retiro", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "09:50", dest: "Retiro", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "10:25", dest: "Retiro", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "04:35", dest: "Mar del Plata", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "00:00", dest: "Posadas", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "00:40", dest: "Posadas", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "17:35", dest: "Posadas", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "21:00", dest: "Posadas", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "23:05", dest: "Posadas", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "00:00", dest: "Puerto Iguazú", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "00:40", dest: "Puerto Iguazú", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "17:35", dest: "Puerto Iguazú", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Via Bariloche", time: "21:00", dest: "Puerto Iguazú", info: "Cama / Semi", web: "https://www.viabariloche.com.ar" },
        { empresa: "Rapido Tata", time: "19:40", dest: "Roque Sáenz Peña", info: "Cama / Semi", web: "https://www.rapidotata.com.ar" },
        { empresa: "Rapido Tata", time: "19:40", dest: "Mercedes", info: "Cama / Semi", web: "https://www.rapidotata.com.ar" },
        { empresa: "Rapido Tata", time: "19:40", dest: "Resistencia", info: "Cama / Semi", web: "https://www.rapidotata.com.ar" },
        { empresa: "Rapido Tata", time: "19:40", dest: "Miraflores", info: "Cama / Semi", web: "https://www.rapidotata.com.ar" },
        { empresa: "Flecha Bus", time: "14:00", dest: "Porto Alegre (Brasil)", info: "Cama / Semi", web: "https://www.flechabus.com.ar" },
        { empresa: "Flecha Bus", time: "14:00", dest: "Florianópolis (Brasil)", info: "Cama / Semi", web: "https://www.flechabus.com.ar" },
        { empresa: "Flecha Bus", time: "14:00", dest: "Camboriú (Brasil)", info: "Cama / Semi", web: "https://www.flechabus.com.ar" },
        { empresa: "Crucero del Norte", time: "20:30", dest: "Eldorado", info: "Cama / Semi", web: "https://www.crucerodelnorte.com.ar" },
        { empresa: "Crucero del Norte", time: "20:30", dest: "Posadas", info: "Cama / Semi", web: "https://www.crucerodelnorte.com.ar" },
        { empresa: "Crucero del Norte", time: "20:30", dest: "Puerto Iguazú", info: "Cama / Semi", web: "https://www.crucerodelnorte.com.ar" }
    ];

    function renderGrid() {
        gridContainer.innerHTML = '';
        mainCompaniesConfig.forEach(config => {
            const trips = allTrips.filter(t => t.empresa === config.name);
            trips.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

            const listItems = trips.map(t => `
                <li>
                    <div class="dep-time">${t.time}</div>
                    <div class="dep-info"><strong>${t.dest}</strong><span>${t.info}</span></div>
                </li>
            `).join('');

            const logoPath = config.logoSvg;
            const firstTrip = trips.length > 0 ? trips[0] : null;
            const companyUrl = firstTrip ? firstTrip.web : "#";
            let overlayHtml = '';
            if (companyUrl && companyUrl.startsWith('http')) {
                overlayHtml = `<a href="${companyUrl}" target="_blank" class="website-link-overlay"><span>Ir al sitio</span><i class="fa-solid fa-arrow-right-long"></i></a>`;
            }
            
            const card = document.createElement('div');
            card.className = 'schedule-card fade-in-up';
            card.innerHTML = `
                <div class="company-logo-area"><img src="${config.logo}" alt="${config.name}">${overlayHtml}</div>
                <div class="company-header ${config.headerClass}"><h3>${config.region}</h3></div>
                <ul class="departure-list">
                    ${listItems || '<li style="padding:20px; color:#999;">Sin servicios</li>'}
                    <li class="no-results-in-card hidden">No encontrado.<small>Consulte en mostrador</small></li>
                </ul>
            `;
            gridContainer.appendChild(card);
        });
    }

    function renderList() {
        listScrollArea.innerHTML = '';
        const sortedTrips = [...allTrips].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        sortedTrips.forEach((trip, index) => {
            const logoPath = getLogoPathList(trip.empresa);
            const companyConfig = mainCompaniesConfig.find(c => c.name === trip.empresa);
            const borderClass = companyConfig ? companyConfig.borderClass : '';
            const btnLink = trip.web ? `<a href="${trip.web}" target="_blank" class="btn-ticket"><i class="fa-solid fa-ticket"></i> Comprar</a>` : `<span class="btn-ticket" style="background:#ccc; cursor:not-allowed;">Boletería</span>`;

            const row = document.createElement('div');
            row.className = `schedule-row ${borderClass}`;
            if(index < 20) row.style.animationDelay = `${index * 0.03}s`;
            row.classList.add('fade-in-up');
            
            row.innerHTML = `
                <div class="row-logo"><img src="${logoPath}" alt="${trip.empresa}"></div>
                <div class="row-time"><span class="time-big">${trip.time}</span><span class="time-label">Salida</span></div>
                <div class="row-info"><strong class="row-dest">${trip.dest}</strong><div class="row-meta"><span><i class="fa-solid fa-bus"></i> ${trip.empresa}</span><span><i class="fa-solid fa-couch"></i> ${trip.info}</span></div></div>
                <div class="row-action">${btnLink}</div>
            `;
            listScrollArea.appendChild(row);
        });
        
        const noRes = document.createElement('div');
        noRes.id = 'noResultsList';
        noRes.className = 'no-results-list hidden';
        noRes.innerHTML = `<i class="fa-solid fa-road"></i><p>No se encontraron viajes.</p>`;
        listScrollArea.appendChild(noRes);
    }

    if(searchInput && suggestionsList) {
        const destinations = [...new Set(allTrips.map(t => t.dest))].sort();
        searchInput.addEventListener('input', function() {
            const val = this.value.toLowerCase();
            suggestionsList.innerHTML = ''; 
            if (val.length === 0) { suggestionsList.classList.add('hidden'); applyFilter(''); return; }
            const matches = destinations.filter(dest => dest.toLowerCase().includes(val));
            if (matches.length > 0) {
                suggestionsList.classList.remove('hidden');
                matches.forEach(dest => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${dest}`;
                    li.addEventListener('click', () => { searchInput.value = dest; suggestionsList.classList.add('hidden'); applyFilter(dest); });
                    suggestionsList.appendChild(li);
                });
            } else { suggestionsList.classList.add('hidden'); }
            applyFilter(val);
        });
        document.addEventListener('click', (e) => { if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) suggestionsList.classList.add('hidden'); });
    }

    let currentViewMode = 'grid';
    function switchView() {
        if(searchInput) searchInput.value = '';
        if(suggestionsList) suggestionsList.classList.add('hidden');
        applyFilter('');
        if (currentViewMode === 'grid') {
            currentViewMode = 'list';
            if(viewNameLabel) viewNameLabel.textContent = "Todos los Horarios";
            gridContainer.classList.add('hidden'); listContainer.classList.remove('hidden');
            if(listScrollArea.children.length === 0) renderList();
        } else {
            currentViewMode = 'grid';
            if(viewNameLabel) viewNameLabel.textContent = "Por Empresas";
            listContainer.classList.add('hidden'); gridContainer.classList.remove('hidden');
        }
    }
    
    function applyFilter(searchTerm) {
        const term = searchTerm.toLowerCase();
        if (currentViewMode === 'grid') {
            const cards = gridContainer.querySelectorAll('.schedule-card');
            cards.forEach(card => {
                const list = card.querySelector('.departure-list');
                const items = list.querySelectorAll('li:not(.no-results-in-card)');
                const noResultsMsg = card.querySelector('.no-results-in-card');
                let visibleCount = 0;
                items.forEach(item => {
                    const destText = item.querySelector('.dep-info strong').textContent.toLowerCase();
                    if (destText.includes(term)) { item.classList.remove('hidden-item'); visibleCount++; } else { item.classList.add('hidden-item'); }
                });
                if (visibleCount === 0 && items.length > 0) { if(noResultsMsg) noResultsMsg.classList.remove('hidden'); } else { if(noResultsMsg) noResultsMsg.classList.add('hidden'); }
            });
        } else {
            const rows = listScrollArea.querySelectorAll('.schedule-row');
            const noResList = document.getElementById('noResultsList');
            let visibleCount = 0;
            rows.forEach(row => {
                const destText = row.querySelector('.row-dest').textContent.toLowerCase();
                if (destText.includes(term)) { row.classList.remove('hidden-item'); visibleCount++; } else { row.classList.add('hidden-item'); }
            });
            if (visibleCount === 0) { if(noResList) noResList.classList.remove('hidden'); } else { if(noResList) noResList.classList.add('hidden'); }
        }
    }

    function timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        let cleanTime = timeStr.toLowerCase().replace('hs', '').replace(' ', '').trim();
        if (!cleanTime.includes(':')) cleanTime += ':00';
        const [hours, minutes] = cleanTime.split(':').map(Number);
        return (hours * 60) + (minutes || 0);
    }
    
    function getLogoPathList(companyName) {
        const key = companyName.toLowerCase().trim();
        return logoMapList[key] || "img/logo.svg";
    }

    if(btnPrev) btnPrev.addEventListener('click', switchView);
    if(btnNext) btnNext.addEventListener('click', switchView);

    renderGrid();
    renderList();
}

function initRegionalSlider() {
    const track = document.getElementById('regionalTrack');
    if (!track) return;
    const slides = Array.from(track.children);
    const nextButton = document.getElementById('btnNextSlide');
    const prevButton = document.getElementById('btnPrevSlide');
    const dotsNav = document.getElementById('sliderDots');
    
    let currentIndex = 0;
    if(dotsNav && dotsNav.children.length === 0) {
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(index));
            dotsNav.appendChild(dot);
        });
    }

    function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        track.style.transform = 'translateX(-' + (index * 100) + '%)';
        currentIndex = index;
        if(dotsNav) {
            Array.from(dotsNav.children).forEach(d => d.classList.remove('active'));
            dotsNav.children[index].classList.add('active');
        }
    }

    if(nextButton) nextButton.addEventListener('click', () => goToSlide(currentIndex + 1));
    if(prevButton) prevButton.addEventListener('click', () => goToSlide(currentIndex - 1));
    setInterval(() => goToSlide(currentIndex + 1), 5000);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeFullGridModal();
        closeVideoModal();
    }
});