import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const loadDependency = createRequire(import.meta.url);
const ts = loadDependency('typescript');
const prefix = fs.existsSync('src/app/api/auth/login/route.ts') ? 'src/' : '';
function load(path, mocks = {}, env = {}, fetchMock) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const sandbox = { module, exports: module.exports, require: name => name in mocks ? mocks[name] : loadDependency(name), process: {env}, Date, Map, URL, URLSearchParams, AbortSignal, fetch: fetchMock };
  vm.runInNewContext(code, sandbox);
  return module.exports;
}
(async () => {
 const env = { RECAPTCHA_SECRET_KEY: 'test-secret', NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'test-public', NEXT_PUBLIC_SITE_URL: 'https://example.com' };
 const limiter = load(prefix + 'lib/auth/rate-limit.ts', {}, env);
 for(let i=0;i<5;i++) assert.equal(limiter.consumeLoginAttempt('user@example.com','one'),0);
 assert.ok(limiter.consumeLoginAttempt('user@example.com','two')>0);
 const ipLimiter = load(prefix + 'lib/auth/rate-limit.ts', {}, env);
 for(let i=0;i<20;i++) assert.equal(ipLimiter.consumeLoginAttempt(`${i}@example.com`,'same-ip'),0);
 assert.ok(ipLimiter.consumeLoginAttempt('another@example.com','same-ip')>0);
 let passwordCalls=0, retry=0, authError=null;
 let captcha={success:true,hostname:'example.com',action:'login',score:0.9};
 const client = async()=>({auth:{signInWithPassword:async()=>{passwordCalls++;return {error:authError}}}});
 const mocks = {'next/server':{NextResponse:{json:(body,options)=>({body,...options})}}, '@/lib/auth/rate-limit':{consumeLoginAttempt:()=>retry}, '@/lib/supabase/server':{createClient:client,createSupabaseServerClient:client}};
 const route=load(prefix+'app/api/auth/login/route.ts',mocks,env,async()=>({ok:true,json:async()=>captcha}));
 const req=(body,origin='https://example.com')=>({url:'https://example.com/api/auth/login',headers:new Headers({origin}),text:async()=>JSON.stringify(body)});
 const body={email:'USER@example.com',password:'test-password',captchaToken:'test-token'};
 assert.equal((await route.POST(req(body,'https://attacker.com'))).status,403);
 assert.equal((await route.POST(req({...body,captchaToken:''}))).status,400);
 for(const patch of [{success:false},{hostname:'attacker.com'},{action:'signup'},{score:0.49},{score:undefined}]) {
  const original=captcha;captcha={...captcha,...patch};assert.equal((await route.POST(req(body))).status,400);captcha=original;
 }
 assert.equal(passwordCalls,0);
 retry=60;const limited=await route.POST(req(body));assert.equal(limited.status,429);assert.equal(limited.headers['Retry-After'],'60');retry=0;
 authError={status:400,message:'sensitive detail'};const failed=await route.POST(req(body));assert.equal(failed.status,401);assert.equal(failed.body.error,'Invalid email or password.');
 authError=null;const success=await route.POST(req(body));assert.equal(success.body.success,true);
 delete env.RECAPTCHA_SECRET_KEY;assert.equal((await route.POST(req(body))).status,503);
 console.log('Passed login security checks: account/IP limits, origin, input validation, CAPTCHA hostname/action/score, 429, credential errors, success, missing-key fail-closed.');
})().catch(error=>{console.error(error);process.exitCode=1});
