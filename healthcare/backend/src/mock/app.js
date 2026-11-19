import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {rateLimit} from 'express-rate-limit';
import bcrypt from 'bcrypt';
import {randomBytes,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {registerSchema,loginSchema,updateProfileSchema} from '../validators/authValidators.js';
import {schemeSearchSchema,slugSchema} from '../validators/schemeValidators.js';
import {messageSchema} from '../validators/assistantValidators.js';
import {publicScheme} from '../services/schemePresenter.js';
import {schemeSeed} from '../data/schemeSeed.js';
import {createAssistantService} from '../services/assistantService.js';
import {encryptChat,decryptChat} from '../services/chatCrypto.js';
import {requireSameOriginRequest} from './security.js';
import {HttpError,errorHandler,notFound} from '../middleware/errors.js';
const dummyHash=bcrypt.hashSync('NotARealPasswordForTesting',12);
const safeUser=u=>{const {passwordHash,saved,...profile}=u;return profile};
const sample=()=>({name:'Sample report (fictional)',pages:1,text:'Patient Name: Sample Patient\nHaemoglobin: 13.2 g/dL',information:{fields:[{label:'Patient Name',value:'Sample Patient'}],measurements:['Haemoglobin: 13.2 g/dL']},simulation:true});
const options={httpOnly:true,sameSite:'strict',path:'/',maxAge:3600000};
export function createMockApp(store){
 const app=express(),sessions=new Map(),assistant=createAssistantService({config:{chatEncryptionKey:store.keys.chat}}),limiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-7',legacyHeaders:false,message:{error:{code:'RATE_LIMITED',message:'Too many requests. Please try again later.'}}});
 app.disable('x-powered-by');app.use(helmet());app.use(express.json({limit:'32kb'}));app.use(cookieParser());app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Sahaara-Data-Mode','mock');next()});
 app.get('/api/health/live',(_req,res)=>res.json({status:'ok',mode:'mock'}));app.get('/api/health/ready',(_req,res)=>res.json({status:'ready',mode:'mock'}));
 async function requireUser(req,_res,next){const token=req.cookies?.sahaara_mock_session,session=sessions.get(token);if(!session||session.expiresAt<=Date.now()){if(token)sessions.delete(token);return next(new HttpError(401,'UNAUTHENTICATED','Please log in to continue.'))}const user=await store.read(s=>s.users.find(u=>u.id===session.userId));if(!user)return next(new HttpError(401,'UNAUTHENTICATED','Please log in to continue.'));req.user=user;req.mockToken=token;next()}
 function signIn(res,user,status=200){for(const [key,v] of sessions)if(v.expiresAt<=Date.now())sessions.delete(key);let token=randomBytes(32).toString('hex');sessions.set(token,{userId:user.id,expiresAt:Date.now()+3600000});return res.status(status).cookie('sahaara_mock_session',token,options).json({user:safeUser(user),phoneVerified:false,dataMode:'mock'})}
 app.post('/api/auth/register',requireSameOriginRequest,limiter,async(req,res)=>{const {mobile,password,profile}=registerSchema.parse(req.body),passwordHash=await bcrypt.hash(password,12),user={id:randomUUID(),...profile,mobile,passwordHash,saved:[]};await store.update(s=>{if(s.users.some(u=>u.mobile===mobile))throw new HttpError(409,'ACCOUNT_EXISTS','An account with this mobile number already exists.');s.users.push(user)});signIn(res,user,201)});
 app.post('/api/auth/login',requireSameOriginRequest,limiter,async(req,res)=>{const {mobile,password}=loginSchema.parse(req.body),user=await store.read(s=>s.users.find(u=>u.mobile===mobile)),valid=Buffer.byteLength(password,'utf8')<=72&&await bcrypt.compare(password,user?.passwordHash||dummyHash);if(!user||!valid)throw new HttpError(401,'INVALID_CREDENTIALS','Mobile number or password is incorrect.');signIn(res,user)});
 app.get('/api/auth/me',requireUser,(req,res)=>res.json({user:safeUser(req.user),phoneVerified:false,dataMode:'mock'}));
 app.patch('/api/auth/me',requireSameOriginRequest,requireUser,async(req,res)=>{const patch=updateProfileSchema.parse(req.body);const user=await store.update(s=>{const u=s.users.find(x=>x.id===req.user.id);Object.assign(u,patch);return safeUser(u)});res.json({user,phoneVerified:false,dataMode:'mock'})});
 app.post('/api/auth/logout',requireSameOriginRequest,requireUser,(req,res)=>{sessions.delete(req.mockToken);res.clearCookie('sahaara_mock_session',{httpOnly:true,sameSite:'strict',path:'/'});res.status(204).end()});
 const scheme=slug=>{const item=schemeSeed.find(s=>s.slug===slug);if(!item)throw new HttpError(404,'SCHEME_NOT_FOUND','Scheme not found.');return item};
 app.get('/api/schemes',requireUser,(req,res)=>{const f=schemeSearchSchema.parse(req.query),q=(f.q||'').toLowerCase();const items=schemeSeed.filter(s=>(!q||[s.name,s.description,s.benefit,s.target].some(v=>v.toLowerCase().includes(q)))&&(!f.category||s.category===f.category)&&(!f.beneficiary||s.beneficiary===f.beneficiary)&&(!f.state||s.scope==='central'||s.states?.includes(f.state))).sort((a,b)=>a.name.localeCompare(b.name)).map(s=>publicScheme(s,req.user));res.json({schemes:items,note:'Mock data; preliminary matches are not official decisions.'})});
 app.get('/api/schemes/saved',requireUser,(req,res)=>res.json({saved:req.user.saved||[]}));
 app.get('/api/schemes/:slug',requireUser,(req,res)=>res.json({scheme:publicScheme(scheme(slugSchema.parse(req.params.slug)),req.user)}));
 for(const method of ['put','delete'])app[method]('/api/schemes/:slug/saved',requireSameOriginRequest,requireUser,async(req,res)=>{const slug=slugSchema.parse(req.params.slug);scheme(slug);await store.update(s=>{const u=s.users.find(x=>x.id===req.user.id);u.saved=u.saved.filter(x=>x!==slug);if(method==='put')u.saved.push(slug)});res.json({saved:method==='put'})});
 app.get('/api/assistant/status',requireUser,(_req,res)=>res.json({...assistant.status(),mock:true}));
 app.post('/api/assistant/messages',requireSameOriginRequest,requireUser,limiter,async(req,res)=>{const body=messageSchema.parse(req.body),reply=await assistant.respond(body);if(body.saveHistory){await store.update(s=>{s.chats.push({id:randomUUID(),userId:req.user.id,payload:encryptChat({question:body.message,reply},store.keys.chat,req.user.id),createdAt:new Date().toISOString(),expiresAt:Date.now()+30*86400000})})}res.json({reply,saved:body.saveHistory})});
 app.get('/api/assistant/history',requireUser,async(req,res)=>{const list=await store.read(s=>s.chats.filter(x=>x.userId===req.user.id&&x.expiresAt>Date.now()).slice(-100).map(x=>({...decryptChat(x.payload,store.keys.chat,req.user.id),createdAt:x.createdAt})));res.json({turns:list})});
 app.delete('/api/assistant/history',requireSameOriginRequest,requireUser,async(req,res)=>{await store.update(s=>{s.chats=s.chats.filter(x=>x.userId!==req.user.id)});res.status(204).end()});
 app.get('/api/hospitals/status',requireUser,(_req,res)=>res.json({configured:false,mock:true}));
 app.get('/api/reports/status',requireUser,(_req,res)=>res.json({ocrAvailable:false,historyAvailable:true,mock:true,maxBytes:5242880}));
 app.post('/api/reports/scan',requireSameOriginRequest,requireUser,limiter,async(req,res)=>{const body=z.object({consent:z.literal(true),saveHistory:z.boolean()}).strict().parse(req.body);const report=sample();if(body.saveHistory){report.id=randomUUID();const createdAt=new Date().toISOString();await store.update(s=>s.reports.push({id:report.id,userId:req.user.id,payload:encryptChat(report,store.keys.report,`report:${req.user.id}`),createdAt}))}else report.id=null;res.json({report,saved:body.saveHistory})});
 app.get('/api/reports/history',requireUser,async(req,res)=>{const reports=await store.read(s=>s.reports.filter(x=>x.userId===req.user.id).slice(-100).reverse().map(x=>({...decryptChat(x.payload,store.keys.report,`report:${req.user.id}`),createdAt:x.createdAt})));res.json({reports})});
 app.delete('/api/reports/history',requireSameOriginRequest,requireUser,async(req,res)=>{await store.update(s=>{s.reports=s.reports.filter(x=>x.userId!==req.user.id)});res.status(204).end()});
 app.delete('/api/reports/:id',requireSameOriginRequest,requireUser,async(req,res)=>{const id=z.uuid().parse(req.params.id);await store.update(s=>{let i=s.reports.findIndex(x=>x.userId===req.user.id&&x.id===id);if(i<0)throw new HttpError(404,'NOT_FOUND','Report not found.');s.reports.splice(i,1)});res.status(204).end()});
 app.use(notFound);app.use(errorHandler);return app;
}
