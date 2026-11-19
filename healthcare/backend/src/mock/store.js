import {mkdir,readFile,writeFile,rename,unlink,chmod} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {randomBytes} from 'node:crypto';
const initial=()=>({version:1,users:[],chats:[],reports:[]});
export async function createMockStore(directory){
 await mkdir(directory,{recursive:true,mode:0o700});const path=join(directory,'store.json'),keysPath=join(directory,'keys.json');
 let keys;
 try{keys=JSON.parse(await readFile(keysPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;keys={chat:randomBytes(32).toString('hex'),report:randomBytes(32).toString('hex')};try{await writeFile(keysPath,JSON.stringify(keys,null,2),{flag:'wx',mode:0o600})}catch(err){if(err.code!=='EEXIST')throw err;keys=JSON.parse(await readFile(keysPath,'utf8'))}}
 await chmod(keysPath,0o600);
 if(!/^[a-f0-9]{64}$/.test(keys.chat||'')||!/^[a-f0-9]{64}$/.test(keys.report||''))throw new Error('Invalid mock keys file.');
 let data;try{data=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;data=initial();await writeFile(path,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600})}
 await chmod(path,0o600);
 if(data.version!==1||!Array.isArray(data.users)||!Array.isArray(data.chats)||!Array.isArray(data.reports))throw new Error('Invalid mock data file.');
 let queue=Promise.resolve();
 return {keys,async read(fn){await queue;return fn(structuredClone(data))},async update(fn){const task=queue.then(async()=>{const next=structuredClone(data),result=await fn(next),tmp=join(dirname(path),`.store-${randomBytes(8).toString('hex')}.tmp`);try{await writeFile(tmp,JSON.stringify(next,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(tmp,path)}finally{await unlink(tmp).catch(()=>{})}data=next;return result});queue=task.catch(()=>{});return task}};
}
