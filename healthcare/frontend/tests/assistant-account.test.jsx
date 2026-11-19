// @vitest-environment jsdom
import { test, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const user={id:'test-user',name:'Test Citizen',age:32,state:'Uttar Pradesh',language:'English'};
const reply={mode:'live',language:'English',emergency:false,department:'Orthopaedics',sections:{understanding:'Thanks for sharing.',information:'Talk to a doctor.',department:'Orthopaedics may be a starting point.',medicines:'Ask a pharmacist.'}};

test('account assistant sends explicit consent and handles saved history',async()=>{
 localStorage.clear();localStorage.setItem('sahaara-mode',JSON.stringify('account'));document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();window.confirm=vi.fn(()=>true);
 let sent;vi.stubGlobal('fetch',vi.fn(async(path,options={})=>{let url=new URL(path,'http://localhost');let ok=body=>({ok:true,status:200,json:async()=>body});
  if(url.pathname==='/api/auth/me')return ok({user});
  if(url.pathname==='/api/schemes')return ok({schemes:[]});
  if(url.pathname==='/api/schemes/saved')return ok({saved:[]});
  if(url.pathname==='/api/assistant/status')return ok({mode:'live',provider:'OpenAI',historyAvailable:true,languages:['English','Hindi'],retentionDays:30});
  if(url.pathname==='/api/assistant/messages'){sent=JSON.parse(options.body);return ok({reply,saved:sent.saveHistory});}
  if(url.pathname==='/api/assistant/history'&&options.method==='DELETE')return {ok:true,status:204};
  if(url.pathname==='/api/assistant/history')return ok({turns:[{question:'Earlier saved question',reply}]});
  throw new Error('Unexpected request '+url.pathname);
 }));
 await import('../src/main.jsx');await screen.findByText(/Good to see you, Test/);const u=userEvent.setup();await u.click(screen.getByRole('button',{name:'AI Assistant'}));
 await screen.findByText('AI DEPARTMENT SUGGESTIONS');
 await u.click(screen.getByRole('checkbox',{name:/I agree to send my question/}));
 await u.click(screen.getByRole('checkbox',{name:/Save new messages/}));
 await u.type(screen.getByRole('textbox',{name:'Health question'}),'knee pain');await u.click(screen.getByRole('button',{name:'Send message'}));
 await screen.findByText('Orthopaedics may be a starting point.');
 expect(sent).toMatchObject({message:'knee pain',language:'English',consentExternal:true,saveHistory:true,context:[]});
 await u.click(screen.getByRole('button',{name:'Load saved history'}));await screen.findByText('Earlier saved question');
 await u.click(screen.getByRole('button',{name:'Delete saved history'}));await waitFor(()=>expect(screen.queryByText('Earlier saved question')).toBeNull());
 expect(window.confirm).toHaveBeenCalled();vi.unstubAllGlobals();
},15000);
