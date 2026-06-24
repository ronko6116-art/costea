export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  res.status(200).json({
    ok: true,
    node: process.version,
    env: {
      hasLlamaKey: !!process.env.LLAMA_CLOUD_API_KEY,
      hasProjectId: !!process.env.LLAMA_PROJECT_ID,
    },
  });
}
