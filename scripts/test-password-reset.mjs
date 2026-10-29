import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const prefix=fs.existsSync('src/lib/auth/password-reset.ts')?'src/':'';
const env={NEXT_PUBLIC_SITE_URL:'https://example.com',RECAPTCHA_SECRET_KEY:'mock-secret',NEXT_PUBLIC_RECAPTCHA_SITE_KEY:'mock-public'};
let retry=0,emails=0,updates=0,signouts=0,exchangeError=null,providerError=null,userError=null;
let user={id:'test',email:'test@example.com',is_anonymous:false};
let captcha={success:true,hostname:'example.com',action:'password_reset',score:0.9};
let redirectTo='';
const client=async()=>({auth:{
 resetPasswordForEmail:async(email,options)=>{emails++;assert.equal(email,'test@example.com');redirectTo=options.redirectTo;return {error:providerError};},
 exchangeCodeForSession:async()=>({error:exchangeError}),
 getUser:async()=>({data:{user},error:userError}),
 updateUser:async({password})=>{assert.equal(password,'new-password-12345');updates++;return {error:providerError};},
 signOut:async(options)=>{assert.equal(options.scope,'global');signouts++;return {error:null};},
}});
class Reply {constructor(body,options={}){this.body=body;this.status=options.status||200;this.headers=new Headers(options.headers);}static json(body,options){return new Reply(body,options);}static redirect(url){return new Reply(null,{status:307,headers:{location:url.toString()}});}}
const mocks={'next/server':{NextResponse:Reply},'@/lib/supabase/server':{createClient:client,createSupabaseServerClient:client},'@/lib/auth/rate-limit':{consumeLoginAttempt:()=>retry},'@/lib/auth/client-ip':{getClientIp:()=> 'test-ip'}};
const module={exports:{}};
const source=ts.transpileModule(fs.readFileSync(prefix+'lib/auth/password-reset.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(source,{module,exports:module.exports,require:name=>mocks[name],process:{env},URL,URLSearchParams,AbortSignal,fetch:async()=>({ok:true,json:async()=>captcha})});
const api=module.exports;
const req=(body,origin='https://example.com')=>({url:'https://example.com/api/auth/forgot-password',headers:new Headers({origin}),text:async()=>JSON.stringify(body)});
const valid={email:'TEST@example.com',captchaToken:'token',locale:'pt',next:'/admin'};
assert.equal((await api.requestPasswordReset(req(valid,'https://evil.invalid'))).status,403);
assert.equal((await api.requestPasswordReset(req({...valid,email:'invalid'}))).status,400);
assert.equal(emails,0);
for(const patch of [{success:false},{hostname:'evil.invalid'},{action:'login'},{score:0.4},{score:undefined}]){const old=captcha;captcha={...old,...patch};assert.equal((await api.requestPasswordReset(req(valid))).status,400);captcha=old;}
retry=60;assert.equal((await api.requestPasswordReset(req(valid))).status,429);retry=0;
assert.equal((await api.requestPasswordReset(req(valid))).status,200);
assert.equal(new URL(redirectTo).origin,'https://example.com');assert.equal(new URL(redirectTo).pathname,'/auth/recovery');assert.equal(new URL(redirectTo).searchParams.get('next'),'/admin');
for(const status of [400,404,429]) {providerError={status};assert.equal((await api.requestPasswordReset(req(valid))).status,200);}providerError=null;
for(const next of ['//evil.invalid','https://evil.invalid','/\\evil.invalid','/\nevil.invalid'])assert.notEqual(api.resetNext(next,'https://example.com'),next);
const recovered=await api.recoverPassword({url:'https://example.com/auth/recovery?code=test&next=%2Fadmin&locale=pt'});
assert.ok(new URL(recovered.headers.get('location')).pathname.endsWith('/reset-password'));assert.equal(new URL(recovered.headers.get('location')).searchParams.get('next'),'/admin');
exchangeError={message:'Expired'};const expired=await api.recoverPassword({url:'https://example.com/auth/recovery?code=expired'});assert.equal(new URL(expired.headers.get('location')).pathname,'/forgot-password');exchangeError=null;
const password={password:'new-password-12345',confirmation:'new-password-12345'};
assert.equal((await api.updatePassword(req(password,'https://evil.invalid'))).status,403);
assert.equal((await api.updatePassword(req({...password,confirmation:'mismatch'}))).status,400);
user=null;assert.equal((await api.updatePassword(req(password))).status,401);
user={id:'test',is_anonymous:true,email:'test@example.com'};assert.equal((await api.updatePassword(req(password))).status,401);
assert.equal(updates,0);
user={id:'test',is_anonymous:false,email:'test@example.com'};providerError={status:400};assert.equal((await api.updatePassword(req(password))).status,400);assert.equal(signouts,0);
providerError=null;assert.equal((await api.updatePassword(req(password))).status,200);assert.equal(signouts,1);
console.log('Passed password recovery: CSRF, CAPTCHA, rate limits, non-enumerating responses, redirect safety, expired links, authenticated updates, validation, and sign-out.');
