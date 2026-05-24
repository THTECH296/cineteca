// Gera um "PIX Copia e Cola" (BR Code / padrão EMV do Banco Central) válido,
// com CRC16-CCITT. O QR Code é gerado a partir dessa string.

interface PixParams {
  key: string;        // chave PIX (e-mail, telefone, CPF/CNPJ ou aleatória)
  name: string;       // nome do recebedor (até 25 chars)
  city: string;       // cidade do recebedor (até 15 chars)
  amount: number;     // valor em reais
  txid?: string;      // identificador da transação (até 25 chars, alfanumérico)
}

function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`;
}

/** Remove acentos e caracteres fora do padrão, em maiúsculas. */
function sanitize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim();
}

/** CRC16-CCITT (polinômio 0x1021, init 0xFFFF) — exigido pelo BR Code. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildPixCode({ key, name, city, amount, txid = '***' }: PixParams): string {
  const merchantAccount = tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', key));
  const additional = tlv('62', tlv('05', sanitize(txid).slice(0, 25) || '***'));

  const payload =
    tlv('00', '01') +                          // Payload Format Indicator
    merchantAccount +                          // Merchant Account Information (PIX)
    tlv('52', '0000') +                        // Merchant Category Code
    tlv('53', '986') +                         // Moeda: BRL
    tlv('54', amount.toFixed(2)) +             // Valor
    tlv('58', 'BR') +                          // País
    tlv('59', sanitize(name).slice(0, 25)) +   // Nome do recebedor
    tlv('60', sanitize(city).slice(0, 15)) +   // Cidade
    additional +                               // Dados adicionais (txid)
    '6304';                                     // CRC (id 63, tamanho 04)

  return payload + crc16(payload);
}
