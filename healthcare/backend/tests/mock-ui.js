// Real browser + Vite + file-backed mock API; no MongoDB or third-party services.
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createMockStore} from '../src/mock/store.js';
import {createMockApp} from '../src/mock/app.js';
let dir,server,vite,browser;
try{
 dir=await mkdtemp(join(tmpdir(),'sahaara-mock-ui-'));server=createMockApp(await createMockStore(dir)).listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','15175','--strictPort'],{cwd:new URL('../../frontend/',import.meta.url).pathname,env:{...process.env,API_PROXY_TARGET:`http://127.0.0.1:${port}`},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Vite timed out')),20000);for(const stream of [vite.stdout,vite.stderr])stream.on('data',b=>{output+=b;if(/Local:/.test(output)){clearTimeout(timer);resolve()}});vite.on('exit',()=>reject(Error(output)))});
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.route('https://**/*',r=>r.abort());const btn=name=>page.getByRole('button',{name,exact:true}),nav=name=>page.locator('.sidebar').getByRole('button',{name,exact:true}).click();
 await page.goto('http://127.0.0.1:15175/');await btn('Create an account').click();await page.getByPlaceholder('Enter your full name').fill('Mock Person');await page.getByPlaceholder('Your age').fill('30');await page.getByLabel(/^State/).selectOption('Uttar Pradesh');await page.getByPlaceholder('10-digit mobile number').fill('9876543200');await page.getByPlaceholder('Create a password').fill('MockPassword123!');await btn('Create account').click();await page.getByText('MOCK DATA',{exact:true}).waitFor();await page.getByText('Local mock data mode.',{exact:false}).waitFor();
 await nav('Government Schemes');await btn('Ayushman Bharat PM-JAY').click();let dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Save scheme'}).click();await dialog.getByRole('button',{name:'Saved scheme'}).waitFor();await dialog.getByRole('button',{name:'Close'}).click();
 await nav('AI Assistant');await page.getByLabel('Save new messages to my account. They are encrypted and available for 30 days.').check();await page.getByLabel('Health question').fill('fictional knee pain');await page.getByLabel('Send message').click();await page.getByText('SIMULATED RESPONSE').waitFor();
 await nav('Hospital Finder');await page.getByText('Facilities, addresses and departments below are fictional sample data',{exact:false}).waitFor();
 await nav('Medical Report Scanner');await page.getByText('Simulation only.',{exact:true}).waitFor();await page.getByRole('checkbox',{name:/I understand this is a fictional sample/}).check();await page.getByRole('checkbox',{name:/Save the fictional sample/}).check();let scanBody;page.on('request',r=>{if(r.url().endsWith('/api/reports/scan'))scanBody=r.postData()});await btn('Generate sample result').click();await page.getByRole('heading',{name:'Example report information'}).waitFor();assert.deepEqual(JSON.parse(scanBody),{consent:true,saveHistory:true});await btn('Load saved reports').click();await page.getByRole('button',{name:/Delete Sample report/}).click();await page.getByText('No saved reports.').waitFor();
 await nav('Log out');await page.getByPlaceholder('Enter your 10-digit mobile number').fill('9876543200');await page.getByPlaceholder('Enter your password').fill('MockPassword123!');await btn('Continue to dashboard').click();await page.getByText('MOCK DATA',{exact:true}).waitFor();await nav('My Profile');await page.getByRole('button',{name:'Ayushman Bharat PM-JAY',exact:true}).first().waitFor();assert.deepEqual(errors,[]);console.log('Mock backend browser test: PASS — registration, bookmarks, assistant, fictional map, simulated report/history, logout and login; no MongoDB.');
}catch(e){console.error('Mock browser test failed:',e);process.exitCode=1}
finally{await browser?.close();if(vite&&vite.exitCode===null){vite.kill('SIGTERM');await once(vite,'exit').catch(()=>{})}if(server)await new Promise(r=>server.close(r));if(dir)await rm(dir,{recursive:true,force:true})}
