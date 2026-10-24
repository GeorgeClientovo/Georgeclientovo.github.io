// Generate Vercel response policies from each page's existing CSP, so changing
// inline structured data cannot silently leave a stale hash at the edge.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const common=[
 {key:'X-Content-Type-Options',value:'nosniff'},
 {key:'X-Frame-Options',value:'DENY'},
 {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
 // Deliberately exclude includeSubDomains/preload: app and scanner are managed separately.
 {key:'Strict-Transport-Security',value:'max-age=31536000'},
 {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}
];
const baseline="default-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
const headers=[{source:'/(.*)',headers:[...common,{key:'Content-Security-Policy',value:baseline}]}];
const pages=(await readdir(root)).filter(name=>name.endsWith('.html')).sort();
for(const name of pages){
 const html=await readFile(new URL(name,root),'utf8');
 const policy=html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];
 assert.ok(policy,`${name}: missing meta CSP`);
 assert.ok(!/script-src[^;]*(?:'unsafe-inline'|'unsafe-eval')/.test(policy),`${name}: unsafe script policy`);
 assert.ok(policy.includes("object-src 'none'"),`${name}: objects must be disabled`);
 assert.ok(policy.includes('form-action https://formspree.io'),`${name}: preserve the enquiry destination`);
 for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/\bsrc\s*=/.test(script[1]))continue;
  const hash=createHash('sha256').update(script[2]).digest('base64');
  assert.ok(policy.includes(`'sha256-${hash}'`),`${name}: inline script hash is stale`);
 }
 const value=policy+"; frame-ancestors 'none'";
 headers.push({source:'/'+name,headers:[{key:'Content-Security-Policy',value}]});
 if(name==='index.html')headers.push({source:'/',headers:[{key:'Content-Security-Policy',value}]});
}
const config={$schema:'https://openapi.vercel.sh/vercel.json',buildCommand:'node scripts/security-headers.mjs --check',outputDirectory:'.',cleanUrls:false,headers};
const expected=JSON.stringify(config,null,2)+'\n';
if(process.argv.includes('--check')){
 assert.equal(await readFile(new URL('vercel.json',root),'utf8'),expected,'Run node scripts/security-headers.mjs after editing a page policy');
 console.log(`Verified response policies and inline hashes for ${pages.length} HTML pages.`);
}else{
 await writeFile(new URL('vercel.json',root),expected);
 console.log(`Generated ${fileURLToPath(new URL('vercel.json',root))}`);
}
