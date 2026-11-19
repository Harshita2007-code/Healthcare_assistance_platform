// @vitest-environment jsdom
import {test,expect,vi} from 'vitest';
import {screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
test('expired account sessions return to login without retaining private screen data',async()=>{
 localStorage.clear();localStorage.setItem('sahaara-mode',JSON.stringify('account'));localStorage.setItem('sahaara-recent:user-a',JSON.stringify(['pmjay']));document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();
 const user={id:'user-a',name:'Test User',age:30,state:'Uttar Pradesh',language:'English'};
 vi.stubGlobal('fetch',vi.fn(async url=>{let path=new URL(url,'http://localhost').pathname;let ok=body=>({ok:true,status:200,json:async()=>body});if(path==='/api/auth/me')return ok({user});if(path==='/api/schemes')return ok({schemes:[]});if(path==='/api/schemes/saved')return ok({saved:[]});if(path==='/api/assistant/status')return {ok:false,status:401,json:async()=>({error:{code:'UNAUTHENTICATED',message:'Please log in to continue.'}})};throw Error(path)}));
 await import('../src/main.jsx');await screen.findByText(/Good to see you, Test/);expect(localStorage.getItem('sahaara-recent:user-a')).toBeNull();await userEvent.click(screen.getByRole('button',{name:'AI Assistant'}));await screen.findByText(/Your session has expired/);expect(screen.queryByText(/Good to see you/)).toBeNull();expect(localStorage.getItem('sahaara-mode')).toBeNull();vi.unstubAllGlobals();
},15000);
