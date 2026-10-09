const json = (data, status=200) => Response.json(data, {status});
export async function handleApi(request, storage) {
  const url = new URL(request.url);
  if (url.pathname === '/api/e') return new Response(null, {status:204});
  if (url.pathname === '/api/feedback/config') return json({voice:true, turnstileSiteKey:null});
  if (url.pathname === '/api/feedback' && request.method === 'POST') {
    if (Number(request.headers.get('content-length')) > 16000) return json({message:'Feedback is too long.'},413);
    try {
      const input = await request.json();
      const text = typeof input.text === 'string' ? input.text.trim() : '';
      if (!text || text.length > 2000) return json({message:'Enter feedback of up to 2,000 characters.'},400);
      const id = crypto.randomUUID();
      await storage.put(`feedback/${id}.json`, JSON.stringify({id,text,look:String(input.look||'').slice(0,8000),createdAt:new Date().toISOString()}));
      return json({id},201);
    } catch { return json({message:'Could not save your feedback. Please try again.'},503); }
  }
  if (url.pathname.startsWith('/api/')) return json({message:'Not found.'},404);
  return null;
}
export default {
  async fetch(request, env) {
    const result = await handleApi(request, env.BUCKET);
    if (result) return result;
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !new URL(request.url).pathname.includes('.')) {
      return env.ASSETS.fetch(new Request(new URL('/index.html',request.url),request));
    }
    return response;
  }
};
