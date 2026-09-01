import test from 'node:test';
import assert from 'node:assert/strict';

import { setupCaptcha } from '../src/ui/captcha.js';


test('Turnstile usa una sola estrategia de recuperación y el reset explícito sigue disponible', async () => {
  let options;
  let resetCalls = 0;
  let domReady;
  const classList = { add() {}, remove() {} };
  const host = { id: 'turnstile-container', innerHTML: '' };
  const elements = {
    'captcha-row': { classList, prepend() {} },
    'visual-captcha-controls': { classList },
    'captcha-input': { classList, required: true },
    'turnstile-container': host,
  };

  globalThis.location = { hostname: 'consulta.example' };
  globalThis.document = {
    getElementById(id) { return elements[id] || null; },
    createElement() { return {}; },
    head: { appendChild() {} },
  };
  globalThis.window = {
    turnstile: {
      render(_host, config) { options = config; return 17; },
      reset(id) { assert.equal(id, 17); resetCalls += 1; },
      remove() {},
    },
    addEventListener(event, callback) {
      if (event === 'DOMContentLoaded') domReady = callback;
    },
  };

  const captcha = setupCaptcha('https://backend.example/api/v1', 'site-key');
  domReady();
  await Promise.resolve();

  assert.equal(options.retry, 'auto');
  assert.equal(options['refresh-expired'], 'auto');
  assert.equal(options['refresh-timeout'], 'auto');
  assert.equal(options['error-callback']('network-error'), false);
  options['expired-callback']();
  options['timeout-callback']();
  assert.equal(resetCalls, 0, 'los callbacks auto no deben competir con reset manual');

  await captcha.refresh();
  assert.equal(resetCalls, 1, 'el token consumido sí se renueva explícitamente');
});
