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
          nombre_producto: { type: 'string' },
          cantidad: { type: 'number' },
          unidad_medida: { type: 'string', description: 'kg, g, L, ud, docena, etc.' },
          precio_unitario: { type: 'number' },
          importe_linea: { type: 'number' },
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

function buildMultipart(buffer, name, type) {
  const boundary = '----' + Math.random().toString(36).slice(2);
  const enc = (s) => Buffer.from(s, 'utf-8');
  return {
    body: Buffer.concat([
      enc(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${type}\r\n\r\n`),
      buffer,
      enc(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="purpose"\r\n\r\nextract\r\n--${boundary}--\r\n`),
    ]),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = (await readBody(req)).toString();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return res.status(500).json({ error: 'JSON inválido', raw: raw.slice(0, 200) }); }

    const { file, fileName, fileType } = parsed;
    if (!file) return res.status(400).json({ error: 'Campo "file" requerido' });

    const apiKey = process.env.LLAMA_CLOUD_API_KEY;
    const projectId = process.env.LLAMA_PROJECT_ID;
    if (!apiKey) return res.status(500).json({ error: 'Falta LLAMA_CLOUD_API_KEY' });
    if (!projectId) return res.status(500).json({ error: 'Falta LLAMA_PROJECT_ID' });

    let buf;
    try { buf = Buffer.from(file, 'base64'); } catch (e) { return res.status(500).json({ error: 'base64 inválido: ' + e.message }); }

    const name = fileName || 'factura.jpg';
    const type = fileType || 'image/jpeg';
    const { body, contentType } = buildMultipart(buf, name, type);

    let uploadRes;
    try {
      uploadRes = await fetch(`${LLAMA_API}/api/v2/files`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': contentType },
        body,
      });
    } catch (e) { return res.status(500).json({ error: 'fetch upload falló: ' + e.message }); }

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => '?');
      return res.status(500).json({ error: `upload ${uploadRes.status}: ${text.slice(0, 300)}` });
    }

    let fileId;
    try { fileId = (await uploadRes.json()).id; } catch (e) { return res.status(500).json({ error: 'upload response inválida: ' + e.message }); }

    let extractRes;
    try {
      extractRes = await fetch(`${LLAMA_API}/api/v2/extract?project_id=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          file_input: fileId,
          configuration: { data_schema: DATA_SCHEMA, tier: 'cost_effective', parse_tier: 'cost_effective', extraction_target: 'per_doc', version: 'latest' },
        }),
      });
    } catch (e) { return res.status(500).json({ error: 'fetch extract falló: ' + e.message }); }

    if (!extractRes.ok) {
      const text = await extractRes.text().catch(() => '?');
      return res.status(500).json({ error: `extract ${extractRes.status}: ${text.slice(0, 300)}` });
    }

    let job;
    try { job = await extractRes.json(); } catch (e) { return res.status(500).json({ error: 'extract response inválida: ' + e.message }); }

    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      let pollRes;
      try {
        pollRes = await fetch(`${LLAMA_API}/api/v2/extract/${job.id}?project_id=${projectId}&expand=extract_metadata`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch (e) { return res.status(500).json({ error: `poll ${i} fetch falló: ${e.message}` }); }

      if (!pollRes.ok) {
        const text = await pollRes.text().catch(() => '?');
        return res.status(500).json({ error: `poll ${i} ${pollRes.status}: ${text.slice(0, 300)}` });
      }

      let data;
      try { data = await pollRes.json(); } catch (e) { return res.status(500).json({ error: `poll ${i} response inválida: ${e.message}` }); }

      if (data.status === 'COMPLETED') {
        return res.status(200).json({ datos_extraidos: data.extract_result, meta: { job_id: job.id } });
      }
      if (data.status === 'FAILED') {
        return res.status(500).json({ error: `extracción falló: ${data.error || 'desconocido'}` });
      }
    }

    return res.status(500).json({ error: 'timeout' });
  } catch (err) {
    return res.status(500).json({ error: 'handler: ' + (err.message || JSON.stringify(err)) });
  }
}
