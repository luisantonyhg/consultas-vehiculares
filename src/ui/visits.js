function animateCount(element, target) {
    const duration = 1200;
    const startTime = performance.now();
    function update(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const current = Math.floor((1 - Math.pow(1 - progress, 3)) * target);
        element.textContent = current.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
        else element.textContent = target.toLocaleString();
    }
    requestAnimationFrame(update);
}

export async function initVisits(BACKEND_URL, clientSecret) {
    const counterEl = document.getElementById('visit-counter');
    let visitorId = localStorage.getItem('canita-visitor-id');
    if (!visitorId) {
        visitorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        localStorage.setItem('canita-visitor-id', visitorId);
    }
    const headers = { 'X-Client-Secret': clientSecret, 'X-Visitor-ID': visitorId };
    try {
        const postRes = await fetch(`${BACKEND_URL}/visits`, { method: 'POST', headers }).catch(() => null);
        if (postRes?.ok) {
            const data = await postRes.json();
            if (data.success && typeof data.total === 'number' && counterEl) {
                animateCount(counterEl, data.total);
                return;
            }
        }
        const res = await fetch(`${BACKEND_URL}/visits`, { headers });
        if (res.ok) {
            const data = await res.json();
            if (data.success && typeof data.total === 'number' && counterEl) animateCount(counterEl, data.total);
        } else if (counterEl) counterEl.textContent = 'No disponible';
    } catch (error) {
        console.error('Error al cargar contador de visitas:', error);
        if (counterEl) counterEl.textContent = 'No disponible';
    }
}
