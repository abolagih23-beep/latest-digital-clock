/* js/voice.js
   Enhanced voice assistant (TTS + simple AI-style contextual reply)
*/

window.voiceSettings = {
  enabled: true,
  lang: "en-US",
  pitch: 1,
  rate: 1
};

window.speak = function(text){
  try {
    if (!window.voiceSettings.enabled) return;
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = window.voiceSettings.lang;
    u.pitch = window.voiceSettings.pitch;
    u.rate = window.voiceSettings.rate;
    // small variety: append friendly suffix
    if (!/thank|please|goodbye/i.test(text)) {
      u.text = text + " — this is Animasahaun Digital Clock.";
    } else {
      u.text = text;
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {
    console.warn("speak error", e);
  }
};

/* Simple AI-style reply generator (local, rule-based) */
window.aiReply = function(intent, data){
  // intent: "weather-summary" | "greeting" | "help"
  if (intent === "weather-summary") {
    const s = data && data.summary ? data.summary : "I don't have the weather details right now.";
    return `Here's the weather update. ${s}`;
  }
  if (intent === "greeting") {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning! Have a productive day.";
    if (hr < 18) return "Good afternoon! Hope your day is going well.";
    return "Good evening! Relax and have a calm night.";
  }
  if (intent === "help") return "You can ask me to update weather, speak the weather, or select a Nigerian state by voice.";
  return "I'm here to help.";
};
