import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../',import.meta.url));
const built = process.argv.includes('--built');
const directory = built ? path.join(projectRoot,'dist') : projectRoot;
if (!built) await import('./build.mjs');
const port = Number(process.env.PORT || 4173);
const base = '/chih_huai_lin_profolio';
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer(async(req,res)=>{
  try {
    let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname === base) { res.writeHead(301,{location:`${base}/`}); return res.end(); }
    if (pathname.startsWith(base+'/')) pathname=pathname.slice(base.length);
    if (pathname.endsWith('/')) pathname+='index.html';
    // Serve only the built public files, even during development.
    if (!(pathname === '/index.html' || /^\/assets\/[\w.-]+$/.test(pathname))) { res.writeHead(404); return res.end('Not found'); }
    const file=path.join(built ? directory : path.join(projectRoot,'dist'),pathname);
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    res.writeHead(200,{'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port,'0.0.0.0',()=>console.log(`Portfolio preview listening on port ${port}; supports ${base}/`));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>process.exit(0)));
