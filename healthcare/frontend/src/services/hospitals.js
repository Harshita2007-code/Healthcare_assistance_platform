import {request} from './api';
export const hospitalApi={
 status:()=>request('/hospitals/status'),
 geocode:q=>request('/hospitals/geocode',{method:'POST',body:{q}}),
 nearby:filters=>request('/hospitals/nearby',{method:'POST',body:filters}),
};
