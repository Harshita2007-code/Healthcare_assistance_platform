
// Red-flag detection is intentionally conservative but cannot detect every emergency.
const redFlags = [
 /\b(?:chest pain|chest pressure|crushing chest|heart attack|stroke|cannot breathe|can't breathe|can not breathe|difficulty breathing|trouble breathing|shortness of breath|severe bleeding|heavy bleeding|unconscious|unresponsive|overdose|suicid\w*|kill myself|end my life|face droop|sudden weakness)\b/i,
 /सीने में दर्द|छाती में दर्द|सीने में दबाव|सांस नहीं|साँस नहीं|सांस लेने में कठिनाई|साँस लेने में तकलीफ|बेहोश|बहुत खून|अधिक रक्तस्राव|खून बह रहा|आत्महत्या|जान देना|खुद को मार/i,
];
export const isEmergency = text => redFlags.some(pattern=>pattern.test(text));
const hindiDepts={'General Medicine':'सामान्य चिकित्सा','Orthopaedics':'हड्डी एवं जोड़ विभाग','Dermatology':'त्वचा रोग विभाग','ENT':'कान, नाक और गला विभाग','Ophthalmology':'नेत्र रोग विभाग','Pediatrics':'बाल रोग विभाग','Obstetrics and Gynaecology':'स्त्री एवं प्रसूति रोग विभाग','Mental Health':'मानसिक स्वास्थ्य विभाग','Emergency':'आपातकालीन विभाग'};
function fallbackDepartment(text) {
 const t=text.toLowerCase();
 if(/knee|joint|back pain|घुटन|जोड़|हड्डी/.test(t))return 'Orthopaedics';
 if(/skin|rash|itch|त्वचा|चकत्ते|खुजली/.test(t))return 'Dermatology';
 if(/eye|vision|आंख|आँख/.test(t))return 'Ophthalmology';
 if(/ear|throat|कान|गला/.test(t))return 'ENT';
 return 'General Medicine';
}
function responseFor(department, language, mode) {
 const hi=language==='Hindi', emergency=department==='Emergency';
 if(emergency)return {mode,language,emergency:true,department:'Emergency',sections:{urgent:hi?'यह स्थिति गंभीर हो सकती है। तुरंत नज़दीकी आपातकालीन विभाग जाएँ या भारत में 112 पर कॉल करें। इस सहायक की प्रतीक्षा न करें।':'This could be an emergency. Seek emergency medical care now or call 112 in India. Do not wait for this assistant.'}};
 return {mode,language,emergency:false,department,sections:{
  understanding:hi?'अपनी चिंता बताने के लिए धन्यवाद। कई लक्षणों के अलग-अलग कारण हो सकते हैं।':'Thank you for sharing your concern. Symptoms can have many different causes.',
  information:hi?'ध्यान दें कि लक्षण कब शुरू हुए और क्या वे बदल रहे हैं। लक्षण बने रहें, बढ़ें या चिंता हो तो योग्य डॉक्टर से बात करें।':'Notice when symptoms began and whether they are changing. If symptoms persist, worsen, or worry you, speak with a qualified doctor.',
  department:hi?`${hindiDepts[department] || hindiDepts['General Medicine']} से शुरुआत करना उपयोगी हो सकता है। सही विभाग की पुष्टि किसी स्वास्थ्य पेशेवर से करें।`:`${department} may be a useful starting point. A healthcare professional can help confirm the right department.`,
  medicines:hi?'कुछ दवाएँ लक्षणों में राहत के लिए उपयोग की जाती हैं, लेकिन हर दवा सभी के लिए सही नहीं होती। कोई भी दवा लेने से पहले डॉक्टर या फार्मासिस्ट से सलाह लें।':'Some medicines are used to relieve symptoms, but they are not suitable for everyone. Ask a doctor or pharmacist before taking any medicine.'
 }};
}
export function createAssistantService({config={}}) {
 return {
  status(){return {mode:'simulated',provider:null,languages:['English','Hindi'],historyAvailable:Boolean(config.chatEncryptionKey),retentionDays:30};},
  async respond({message,language}) {
   if(isEmergency(message))return responseFor('Emergency',language,'safety');
   return responseFor(fallbackDepartment(message),language,'simulated');
  },
 };
}
