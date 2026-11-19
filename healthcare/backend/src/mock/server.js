import {resolve} from 'node:path';
import {createMockStore} from './store.js';
import {createMockApp} from './app.js';
if(process.env.NODE_ENV==='production'){console.error('Mock mode cannot run in production.');process.exit(1)}
const port=Number(process.env.PORT||4001);if(!Number.isInteger(port)||port<1||port>65535){console.error('Invalid PORT.');process.exit(1)}
try{const directory=resolve(process.env.MOCK_DATA_DIR||'mock-data');const store=await createMockStore(directory);const server=createMockApp(store).listen(port,'127.0.0.1',()=>console.log(`MOCK API listening on 127.0.0.1:${port}; data: ${directory}. No MongoDB or external services. Test data only.`));process.on('SIGTERM',()=>server.close());process.on('SIGINT',()=>server.close());}catch{console.error('Could not open mock data. Check local file permissions and format.');process.exit(1)}
