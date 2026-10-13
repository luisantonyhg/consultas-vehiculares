import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSPRLStatusBadge, hasSPRLRegistryEvidence, runFetchHistorialDuenos } from '../src/services/api.js';

const failedHistory = { status: 'PARTIAL_RESULT', asientos: [], verification: {
    vehicle_data:'VERIFIED', public_current_owner:'VERIFIED', registry_record:'FAILED',
    seat_list:'NOT_VERIFIED', seat_details:'NOT_VERIFIED', ownership_history:'PARTIAL', encumbrances_history:'NOT_VERIFIED',
}, ownership_history:{status:'PARTIAL'}, resumen:{total_propietarios:1} };

test('un titular público sin asientos no se muestra como historial ni gravámenes pendientes', () => {
    assert.equal(hasSPRLRegistryEvidence(failedHistory),false);
    const badge=buildSPRLStatusBadge(failedHistory);
    assert.match(badge,/NO VERIFICADO · REINTENTAR/);
    assert.doesNotMatch(badge,/bg-amber|GRAVÁMENES PENDIENTES|DUEÑO/);
});

test('el adaptador envía una falla registral sin filas al callback de reintento',async () => {
    const original=globalThis.fetch;const errors=[];
    globalThis.fetch=async()=>({ok:true,status:200,headers:new Headers(),json:async()=>failedHistory});
    try {
        const data=await runFetchHistorialDuenos('ABC123','https://example.test/api/v1',{
            setCardLoading(){},setCardData(){assert.fail('no debe renderizar una consulta fallida como datos')},setCardError(...args){errors.push(args)},
        });
        assert.equal(data.success,false);assert.equal(data.retryable,true);assert.equal(errors.length,1);
    } finally {globalThis.fetch=original;}
});
