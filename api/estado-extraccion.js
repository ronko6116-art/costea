const LLAMA_API = 'https://api.cloud.llamaindex.ai';

// Este endpoint hace UNA sola consulta de estado a LlamaParse y responde.
// El navegador es quien repite la llamada cada ~2s (ver FacturaUpload.jsx).
// Así ninguna función serverless se queda esperando: cada invocación dura
// lo que tarda una llamada HTTP normal (unos cientos de ms).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const url = new URL(req.url, 'http://localhost');
    const jobId = url.searchParams.get('jobId');
    if (!jobId) return res.status(400).json({ error: 'Falta el parámetro "jobId"' });

    const apiKey = process.env.LLAMA_CLOUD_API_KEY;
    const projectId = process.env.LLAMA_PROJECT_ID;
    if (!apiKey) return res.status(500).json({ error: 'Falta LLAMA_CLOUD_API_KEY' });
    if (!projectId) return res.status(500).json({ error: 'Falta LLAMA_PROJECT_ID' });

    let pollRes;
    try {
      pollRes = await fetch(`${LLAMA_API}/api/v2/extract/${jobId}?project_id=${projectId}&expand=extract_metadata`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch (e) {
      return res.status(500).json({ error: 'fetch estado falló: ' + e.message });
    }

    if (!pollRes.ok) {
      const text = await pollRes.text().catch(() => '?');
      return res.status(500).json({ error: `estado ${pollRes.status}: ${text.slice(0, 300)}` });
    }

    let data;
    try { data = await pollRes.json(); } catch (e) { return res.status(500).json({ error: 'estado response inválida: ' + e.message }); }

    if (data.status === 'COMPLETED') {
      return res.status(200).json({ status: 'completado', datos_extraidos: data.extract_result });
    }
    if (data.status === 'FAILED') {
      return res.status(200).json({ status: 'fallido', error: data.error || 'desconocido' });
    }

    // PENDING / RUNNING / cualquier otro estado intermedio
    return res.status(200).json({ status: 'pendiente' });
  } catch (err) {
    return res.status(500).json({ error: 'handler: ' + (err.message || JSON.stringify(err)) });
  }
}
