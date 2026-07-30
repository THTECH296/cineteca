import QRCode from 'qrcode';

/**
 * Modo demonstração — liga quando o Supabase não responde (ver `fetchMovies`).
 * O site inteiro passa a funcionar sem rede: sessão, assentos, pagamento e ingresso.
 * Nada aqui toca dinheiro ou dados reais; é tudo simulado no navegador.
 */
let demo = false;

export function setDemoMode(on: boolean): void {
  demo = on;
}

export function isDemoMode(): boolean {
  return demo;
}

// ───────── PRNG determinístico (mesma sessão ⇒ mesmo mapa de assentos) ─────────

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const COLS = 10;

/**
 * Ocupação plausível da sala: fileiras do meio enchem primeiro, as da frente
 * ficam mais vazias — e a mesma sessão devolve sempre o mesmo mapa.
 */
export function demoOccupiedSeats(movieId: string, date: string, time: string): string[] {
  const rand = mulberry32(hashSeed(`${movieId}|${date}|${time}`));
  const occupied: string[] = [];

  ROWS.forEach((row, r) => {
    // curva: fileiras centrais (D/E) mais disputadas que A e H
    const centerBias = 1 - Math.abs(r - 4) / 5;
    for (let c = 1; c <= COLS; c++) {
      // corredor central (assentos 5 e 6) também é preferido
      const aisleBias = 1 - Math.abs(c - 5.5) / 6;
      const chance = 0.1 + centerBias * 0.35 + aisleBias * 0.15;
      if (rand() < chance) occupied.push(`${row}${c}`);
    }
  });

  return occupied;
}

// ───────── PIX simulado (BR Code válido em formato, fictício em conteúdo) ─────────

export interface DemoPixCharge {
  id: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

/** CRC16/CCITT-FALSE — exigido pelo padrão EMV do BR Code. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Campo EMV: id + tamanho (2 dígitos) + valor. */
function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value;
}

/**
 * Monta um BR Code no formato EMV correto, porém com chave PIX fictícia:
 * nenhum banco consegue pagar — serve só para a demonstração parecer real.
 */
function buildBrCode(amount: number, txid: string): string {
  const merchant = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', 'demo@cineteca.exemplo.br');
  const payload =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', merchant) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', amount.toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', 'CINETECA DEMO') +
    tlv('60', 'TEOFILO OTONI') +
    tlv('62', tlv('05', txid)) +
    '6304';
  return payload + crc16(payload);
}

/** Cobrança PIX de demonstração, com QR Code gerado no próprio navegador. */
export async function createDemoPix(amountInReais: number, now: number): Promise<DemoPixCharge> {
  const txid = `DEMO${String(now).slice(-8)}`;
  const brCode = buildBrCode(amountInReais, txid);
  const brCodeBase64 = await QRCode.toDataURL(brCode, {
    width: 420,
    margin: 1,
    color: { dark: '#0b0b10', light: '#ffffff' },
  });
  return {
    id: txid,
    brCode,
    brCodeBase64,
    expiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
  };
}
