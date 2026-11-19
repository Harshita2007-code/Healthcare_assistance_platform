// @vitest-environment jsdom
import {test,expect,vi} from 'vitest';
import {screen,act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('a late profile save cannot restore account data after logout',async()=>{
 localStorage.clear();localStorage.setItem('sahaara-mode',JSON.stringify('account'));document.body.innerHTML='<div id="root"></div>';window.scrollTo=vi.fn();
 const user={id:'user-a',name:'Test User',age:30,state:'Uttar Pradesh',language:'English'};let resolvePatch;
 vi.stubGlobal('fetch',vi.fn(async(url,options={})=>{let path=new URL(url,'http://localhost').pathname;const ok=body=>({ok:true,status:200,json:async()=>body});if(path==='/api/auth/me'&&options.method==='PATCH')return new Promise(resolve=>{resolvePatch=()=>resolve(ok({user:{...user,name:'Late Update'}}))});if(path==='/api/auth/me')return ok({user});if(path==='/api/auth/logout')return {ok:true,status:204};if(path==='/api/schemes')return ok({schemes:[]});if(path==='/api/schemes/saved')return ok({saved:[]});throw Error(path)}));
 await import('../src/main.jsx');await screen.findByText(/Good to see you, Test/);const u=userEvent.setup();await u.click(screen.getByRole('button',{name:'My Profile'}));await u.click(screen.getByRole('button',{name:'Edit profile'}));await u.click(screen.getByRole('button',{name:'Save changes'}));expect(resolvePatch).toBeTypeOf('function');await u.click(screen.getByRole('button',{name:'Log out'}));await screen.findByText('Welcome to Sahaara');await act(async()=>resolvePatch());expect(screen.getByText('Welcome to Sahaara')).toBeTruthy();expect(screen.queryByText('Late Update')).toBeNull();vi.unstubAllGlobals();
},15000);
