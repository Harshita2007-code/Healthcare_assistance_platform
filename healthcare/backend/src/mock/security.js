import {HttpError} from '../middleware/errors.js';
export function requireSameOriginRequest(req,_res,next){
 const site=req.get('Sec-Fetch-Site');
 if((site&&!['same-origin','none'].includes(site))||req.get('X-Requested-With')!=='Sahaara-Web')return next(new HttpError(403,'INVALID_REQUEST','Request could not be verified.'));
 next();
}
