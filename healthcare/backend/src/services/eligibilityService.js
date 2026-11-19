// Conservative, profile-holder-only hints. These are not official determinations.
export function matchScheme(scheme, profile) {
  const age = profile?.age;
  if (scheme.slug === 'pmjay' && typeof age === 'number' && age >= 70 && age <= 120) {
    return { status: 'Potentially Eligible', reason: 'The profile age is 70 or above. The senior citizen expansion covers Indian citizens aged 70 or above; citizenship, Aadhaar age and enrolment must be verified by the authority.', sourceUrl: 'https://nha.gov.in/img/resources/English_FAQs_related_to_the_benefits_for_senior_citizens.pdf' };
  }
  if (scheme.slug === 'rbsk' && typeof age === 'number' && age > 18 && age <= 120) {
    return { status: 'Does Not Appear to Match', reason: 'The profile holder is over 18; this programme targets children from birth to 18. A child in the family may still be relevant.', sourceUrl: scheme.url };
  }
  return { status: 'More Information Required', reason: scheme.slug === 'pmjay' ? 'Age alone is not enough to establish household entitlement. Check the official beneficiary database.' : scheme.slug === 'rbsk' ? 'Age and profile details alone cannot establish access to a screening channel. Check with the local health team.' : 'The profile does not contain enough verified beneficiary and local facility details to assess this programme.', sourceUrl: scheme.url };
}
