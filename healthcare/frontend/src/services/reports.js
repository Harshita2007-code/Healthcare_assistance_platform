import {request,currentSessionEpoch,notifySessionExpired} from './api';
export const reportApi={
 status:()=>request('/reports/status'),
 history:()=>request('/reports/history'),
 mockScan:saveHistory=>request('/reports/scan',{method:'POST',body:{consent:true,saveHistory}}),
 remove:id=>request('/reports/'+encodeURIComponent(id),{method:'DELETE'}),
 clear:()=>request('/reports/history',{method:'DELETE'}),
 async scan(file,saveHistory){
  const body=new FormData();body.append('file',file);body.append('consent','true');body.append('saveHistory',String(saveHistory));
  const epoch=currentSessionEpoch();let response;try{response=await fetch('/api/reports/scan',{method:'POST',credentials:'same-origin',headers:{'X-Requested-With':'Sahaara-Web'},body})}catch{throw new Error('The scan connection was interrupted. It may have been saved; check history before retrying.')}
  const data=await response.json().catch(()=>null);if(!response.ok){notifySessionExpired(response.status,data?.error?.code,epoch);const error=new Error(data?.error?.message||'The scanner is temporarily unavailable.');error.status=response.status;throw error}return data;
 },
};
