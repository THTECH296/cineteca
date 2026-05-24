// Edge Function: pagamentos via AbacatePay (API v2).
// - PIX transparente (no site): create / check / simulate
// - Cartão via checkout hospedado: card (cria produto + checkout) / card-status
// A chave secreta (ABACATEPAY_KEY) fica só aqui no servidor.

const BASE = 'https://api.abacatepay.com/v2';
const KEY = Deno.env.get('ABACATEPAY_KEY') ?? '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!KEY) return json({ error: 'ABACATEPAY_KEY não configurada' }, 500);

  try {
    const { action, amount, description, id, returnUrl, completionUrl } = await req.json();
    const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

    // ── PIX transparente ──
    if (action === 'create') {
      const r = await fetch(`${BASE}/transparents/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ method: 'PIX', data: { amount, description: description ?? 'Ingresso CineTeca', expiresIn: 600 } }),
      });
      const d = await r.json();
      if (!d.success) return json({ error: d.error ?? 'Falha ao criar cobrança PIX' }, 400);
      const p = d.data;
      return json({ id: p.id, brCode: p.brCode, brCodeBase64: p.brCodeBase64, expiresAt: p.expiresAt, status: p.status });
    }

    if (action === 'check') {
      const r = await fetch(`${BASE}/transparents/check?id=${encodeURIComponent(id)}`, { headers });
      const d = await r.json();
      return json({ status: d.data?.status ?? 'UNKNOWN' });
    }

    if (action === 'simulate') {
      const r = await fetch(`${BASE}/transparents/simulate-payment?id=${encodeURIComponent(id)}`, { method: 'POST', headers, body: '{}' });
      const d = await r.json();
      return json({ status: d.data?.status ?? 'UNKNOWN', success: d.success });
    }

    // ── Cartão: checkout hospedado ──
    if (action === 'card') {
      // 1) cria um produto com o valor exato
      const prodR = await fetch(`${BASE}/products/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: description ?? 'Ingresso CineTeca',
          description: 'Ingresso de cinema',
          price: amount,
          currency: 'BRL',
          externalId: `ing-${Date.now()}`,
        }),
      });
      const prodD = await prodR.json();
      if (!prodD.success) return json({ error: prodD.error ?? 'Falha ao criar produto' }, 400);

      // 2) cria o checkout (cartão) apontando pro produto
      const ckR = await fetch(`${BASE}/checkouts/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: [{ id: prodD.data.id, quantity: 1 }],
          methods: ['CARD'],
          returnUrl: returnUrl ?? '',
          completionUrl: completionUrl ?? '',
        }),
      });
      const ckD = await ckR.json();
      if (!ckD.success) return json({ error: ckD.error ?? 'Falha ao criar checkout' }, 400);
      return json({ id: ckD.data.id, url: ckD.data.url, status: ckD.data.status });
    }

    if (action === 'card-status') {
      const r = await fetch(`${BASE}/checkouts/get?id=${encodeURIComponent(id)}`, { headers });
      const d = await r.json();
      return json({ status: d.data?.status ?? 'UNKNOWN' });
    }

    return json({ error: 'Ação inválida' }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
