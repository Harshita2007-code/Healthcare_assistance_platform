import {matchScheme} from './eligibilityService.js';
export function publicScheme(scheme,user){
 return {id:scheme.slug,name:scheme.name,tag:scheme.tag,category:scheme.category,beneficiary:scheme.beneficiary,description:scheme.description,benefit:scheme.benefit,target:scheme.target,documents:scheme.documents,criteria:scheme.criteria,apply:scheme.apply,url:scheme.url,source:scheme.source,sourceReviewedAt:scheme.sourceReviewedAt,scope:scheme.scope,color:scheme.color,match:matchScheme(scheme,user)};
}
