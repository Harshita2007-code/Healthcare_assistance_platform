// Explicitly simulated, offline-only responses for demo profiles.
export function demoAssistantReply(text, language) {
  const urgent=/\b(chest pain|chest pressure|stroke|cannot breathe|can't breathe|difficulty breathing|trouble breathing|severe bleeding|heavy bleeding|unconscious|overdose|suicid\w*|kill myself|end my life)\b|सीने में दर्द|छाती में दर्द|सांस नहीं|साँस नहीं|बेहोश|बहुत खून|खून बह रहा|आत्महत्या|खुद को मार/i.test(text);
  const hi=language==='Hindi';
  if(urgent)return {mode:'simulated',language,emergency:true,department:'Emergency',sections:{urgent:hi?'यह स्थिति गंभीर हो सकती है। तुरंत नज़दीकी आपातकालीन विभाग जाएँ या भारत में 112 पर कॉल करें। इस सहायक की प्रतीक्षा न करें।':'This could be an emergency. Seek emergency medical care now or call 112 in India. Do not wait for this assistant.'}};
  const department=/knee|joint|back pain|घुटन|जोड़|हड्डी/i.test(text)?'Orthopaedics':/skin|rash|itch|त्वचा|चकत्ते|खुजली/i.test(text)?'Dermatology':'General Medicine';
  const labels={'Orthopaedics':'हड्डी एवं जोड़ विभाग','Dermatology':'त्वचा रोग विभाग','General Medicine':'सामान्य चिकित्सा'};
  return {mode:'simulated',language,emergency:false,department,sections:{
    understanding:hi?'अपनी चिंता बताने के लिए धन्यवाद। कई लक्षणों के अलग-अलग कारण हो सकते हैं।':'Thank you for sharing your concern. Symptoms can have many different causes.',
    information:hi?'लक्षण बने रहें, बढ़ें या चिंता हो तो योग्य डॉक्टर से बात करें।':'If symptoms persist, worsen, or worry you, speak with a qualified doctor.',
    department:hi?`${labels[department]} से शुरुआत उपयोगी हो सकती है। सही विभाग के लिए स्वास्थ्य पेशेवर से पूछें।`:`${department} may be a useful starting point. A healthcare professional can help confirm the right department.`,
    medicines:hi?'दवाएँ सभी के लिए सही नहीं होतीं। कोई भी दवा लेने से पहले डॉक्टर या फार्मासिस्ट से सलाह लें।':'Some medicines are used to relieve symptoms, but they are not suitable for everyone. Ask a doctor or pharmacist before taking any medicine.'
  }};
}
