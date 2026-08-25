/** Transporte HTTP compartido por todos los proveedores vehiculares. */
let activeConsultationTicket = null;

export function setConsultationTicket(ticketId) {
    activeConsultationTicket = ticketId || null;
}

export async function secureFetch(url, options = {}) {
    const clientSecret = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PUBLIC_CLIENT_SECRET)
        ? import.meta.env.PUBLIC_CLIENT_SECRET
        : 'VehicularPESecretSecure2026';
    const headers = {
        ...options.headers,
        ...(clientSecret ? { 'X-Client-Secret': clientSecret } : {}),
        ...(activeConsultationTicket ? { 'X-Consultation-Ticket': activeConsultationTicket } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 429) {
        const error = new Error('Demasiadas consultas en poco tiempo (límite 10/min por IP). Reintentando...');
        error.name = 'RateLimited';
        throw error;
    }
    return res;
}
