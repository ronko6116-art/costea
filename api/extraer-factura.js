const LLAMA_API = 'https://api.cloud.llamaindex.ai';
const POLL_MAX_ATTEMPTS = 3;
const POLL_INTERVAL_MS = 2000;

const DATA_SCHEMA = {
  type: 'object',
  properties: {
    fecha_factura: { type: 'string', description: 'Fecha de la factura o albarán en formato DD/MM/YYYY' },
    importe_total: { type: 'number', description: 'Importe total del documento (con IVA si aplica)' },
    lineas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nombre_producto: { type: 'string', description: 'Nombre completo del producto' },
          cantidad: { type: 'number', description: 'Cantidad del producto' },
          unidad_medida: { type: 'string', description: 'Unidad de medida: kg, g, L, ud, docena, etc.' },
          precio_unitario: { type: 'number', description: 'Precio por unidad del producto' },
          importe_linea: { type: 'number', description: 'Importe total de la línea (cantidad x precio_unitario)' },
        },
        required: ['nombre_producto', 'cantidad', 'precio_unitario'],
      },
    },
  },
  required: ['fecha_factura', 'lineas'],
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function multipart(buffer, fileName, fileType) {
  const boundary = '----' + Math.random().toString(36).slice(2);
  const encode = (s) => Buffer.from(s, 'utf-8');
  return {
    body: Buffer.concat([
      encode(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${fileType}\r\n\r\n`),
      buffer,
      encode(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nextract\r\n--${boundary}--\r\n`),
    ]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function llamaparseUpload(buffer, fileName, fileType, apiKey) {
  const { body, contentType } = multipart(buffer, fileName, fileType);
  const r = await fetch(`${LLAMA_API}/api/v2/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': contentType },
    body,
  });
  if (!r.ok) throw new Error(`upload ${r.status}: ${await r.text()}`);
  return (await r.json()).id;
}

async function llamaparseExtract(fileId, apiKey, projectId) {
  const r = await fetch(`${LLAMA_API}/api/v2/extract?project_id=${projectId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      file_input: fileId,
      configuration: { data_schema: DATA_SCHEMA, tier: 'cost_effective', parse_tier: 'cost_effective', extraction_target: 'per_doc', version: 'latest' },
    }),
  });
  if (!r.ok) throw new Error(`extract ${r.status}: ${await r.text()}`);
  return await r.json();
}

async function llamaparsePoll(jobId, apiKey, projectId) {
  for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const r = await fetch(`${LLAMA_API}/api/v2/extract/${jobId}?project_id=${projectId}&expand=extract_metadata`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) throw new Error(`poll ${r.status}: ${await r.text()}`);
    const d = await r.json();
    if (d.status === 'COMPLETED') return d;
    if (d.status === 'FAILED') throw new Error(`extracción falló: ${d.error || '?'}`);
  }
  throw new Error('timeout');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY;
    const projectId = process.env.LLAMA_PROJECT_ID;

    if (!apiKey) return res.status(500).json({ error: 'Falta LLAMA_CLOUD_API_KEY' });
    if (!projectId) return res.status(500).json({ error: 'Falta LLAMA_PROJECT_ID' });

    const body = await readBody(req);
    const parsed = JSON.parse(body.toString());
    const { file, fileName, fileType } = parsed;

    if (!file) return res.status(400).json({ error: 'No file' });

    const buf = Buffer.from(file, 'base64');
    const name = fileName || 'factura.jpg';
    const type = fileType || 'image/jpeg';

    const fileId = await llamaparseUpload(buf, name, type, apiKey);
    const job = await llamaparseExtract(fileId, apiKey, projectId);
    const result = await llamaparsePoll(job.id, apiKey, projectId);

    return res.status(200).json({ datos_extraidos: result.extract_result });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' });
  }
}
