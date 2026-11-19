import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import request from 'supertest';
import {createMockStore} from '../src/mock/store.js';
import {createMockApp} from '../src/mock/app.js';
const header=r=>r.set('X-Requested-With','Sahaara-Web');
const profile={name:'Fictional User',age:31,state:'Uttar Pradesh'};
test('file-backed mock API: account isolation, persistence and simulated services without MongoDB', {timeout:30000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sahaara-mock-test-'));try{
 let store=await createMockStore(dir),app=createMockApp(store);
 const register=mobile=>header(request(app).post('/api/auth/register')).send({mobile,password:'MockPassword123!',profile});
 let a=await register('9876543200'),b=await register('9876543201');assert.equal(a.status,201);assert.equal(a.body.dataMode,'mock');const ac=a.headers['set-cookie'][0].split(';')[0],bc=b.headers['set-cookie'][0].split(';')[0];
 let r=await register('9876543200');assert.equal(r.status,409);
 r=await request(app).get('/api/auth/me').set('Cookie',ac);assert.equal(r.body.user.name,'Fictional User');assert.equal(r.headers['cache-control'],'no-store');
 r=await header(request(app).patch('/api/auth/me').set('Cookie',ac)).send({name:'Fictional Updated'});assert.equal(r.body.user.name,'Fictional Updated');
 r=await request(app).get('/api/schemes').set('Cookie',ac);assert.equal(r.body.schemes.length,4);assert.equal(r.body.schemes.some(s=>s.id==='pmjay'),true);
 r=await header(request(app).put('/api/schemes/pmjay/saved').set('Cookie',ac));assert.equal(r.status,200);r=await request(app).get('/api/schemes/saved').set('Cookie',bc);assert.deepEqual(r.body.saved,[]);
 r=await request(app).get('/api/hospitals/status').set('Cookie',ac);assert.equal(r.body.mock,true);assert.equal(r.body.configured,false);
 r=await header(request(app).post('/api/assistant/messages').set('Cookie',ac)).send({message:'fictional knee pain',language:'English',saveHistory:true});assert.equal(r.body.reply.mode,'simulated');
 r=await request(app).get('/api/assistant/history').set('Cookie',ac);assert.equal(r.body.turns[0].question,'fictional knee pain');r=await request(app).get('/api/assistant/history').set('Cookie',bc);assert.deepEqual(r.body.turns,[]);
 r=await request(app).get('/api/reports/status').set('Cookie',ac);assert.equal(r.body.mock,true);assert.equal(r.body.ocrAvailable,false);
 r=await header(request(app).post('/api/reports/scan').set('Cookie',ac)).send({consent:true,saveHistory:true});assert.equal(r.status,200);assert.equal(r.body.report.simulation,true);const reportId=r.body.report.id;
 r=await header(request(app).post('/api/reports/scan').set('Cookie',ac)).send({consent:true,saveHistory:true,rawFile:'secret'});assert.equal(r.status,400);
 r=await request(app).get('/api/reports/history').set('Cookie',bc);assert.deepEqual(r.body.reports,[]);r=await header(request(app).delete('/api/reports/'+reportId).set('Cookie',bc));assert.equal(r.status,404);
 const raw=await readFile(join(dir,'store.json'),'utf8');assert.doesNotMatch(raw,/MockPassword123!|fictional knee pain|Sample Patient/);
 store=await createMockStore(dir);app=createMockApp(store);r=await request(app).get('/api/auth/me').set('Cookie',ac);assert.equal(r.status,401,'sessions expire on restart');
 r=await header(request(app).post('/api/auth/login')).send({mobile:'9876543200',password:'MockPassword123!'});assert.equal(r.status,200);const cookie=r.headers['set-cookie'][0].split(';')[0];
 r=await request(app).get('/api/schemes/saved').set('Cookie',cookie);assert.deepEqual(r.body.saved,['pmjay']);r=await request(app).get('/api/reports/history').set('Cookie',cookie);assert.equal(r.body.reports[0].simulation,true);r=await request(app).get('/api/assistant/history').set('Cookie',cookie);assert.equal(r.body.turns[0].question,'fictional knee pain');
 r=await header(request(app).delete('/api/reports/'+reportId).set('Cookie',cookie));assert.equal(r.status,204);r=await header(request(app).delete('/api/assistant/history').set('Cookie',cookie));assert.equal(r.status,204);
 r=await header(request(app).post('/api/auth/logout').set('Cookie',cookie)).send({});assert.equal(r.status,204);r=await request(app).get('/api/auth/me').set('Cookie',cookie);assert.equal(r.status,401);
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('mock mode refuses production startup',async()=>{
 const {spawnSync}=await import('node:child_process');const result=spawnSync(process.execPath,['src/mock/server.js'],{env:{...process.env,NODE_ENV:'production'},encoding:'utf8'});assert.equal(result.status,1);assert.match(result.stderr,/cannot run in production/);
});

test('default server starts without MongoDB and reuses the same local data on restart', {timeout:30000},async()=>{
 const net=(await import('node:net')).default;const {spawn}=await import('node:child_process');const {once}=await import('node:events');
 const dir=await mkdtemp(join(tmpdir(),'sahaara-default-'));const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));let child;
 async function start(){child=spawn(process.execPath,['src/server.js'],{env:{...process.env,PORT:String(port),MOCK_DATA_DIR:dir,NODE_ENV:'test',MONGODB_URI:'not-a-valid-uri'},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Mock server did not start')),10000);let output='';const ready=b=>{output+=b;if(output.includes('MOCK API listening')){clearTimeout(timer);resolve()}};child.stdout.on('data',ready);child.stderr.on('data',ready);child.once('exit',code=>{clearTimeout(timer);reject(Error(`Server exited ${code}: ${output}`))})})}
 async function stop(){if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}child=null}
 try{await start();let r=await fetch(`http://127.0.0.1:${port}/api/health/ready`);assert.equal((await r.json()).mode,'mock');const body={mobile:'9876543209',password:'MockPassword123!',profile};r=await fetch(`http://127.0.0.1:${port}/api/auth/register`,{method:'POST',headers:{'content-type':'application/json','X-Requested-With':'Sahaara-Web'},body:JSON.stringify(body)});assert.equal(r.status,201);await stop();await start();r=await fetch(`http://127.0.0.1:${port}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json','X-Requested-With':'Sahaara-Web'},body:JSON.stringify({mobile:body.mobile,password:body.password})});assert.equal(r.status,200);assert.equal((await r.json()).dataMode,'mock');}finally{await stop();await rm(dir,{recursive:true,force:true})}
});
