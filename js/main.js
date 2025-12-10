/* js/main.js
   App glue: clock, settings panel, theme + marquee, map animations
*/

function pad(n){ return n.toString().padStart(2,'0'); }

function updateClock(){
  const now = new Date();
  const hh = pad(now.getHours()), mm = pad(now.getMinutes()), ss = pad(now.getSeconds());
  const timeEl = document.getElementById("time");
  if (timeEl) timeEl.textContent = `${hh}:${mm}:${ss}`;
  const dateEl = document.getElementById("date");
  if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined,{weekday:'long', year:'numeric', month:'long', day:'numeric'});
  updateFlipClock(`${hh}:${mm}:${ss}`);
}
setInterval(updateClock, 1000);
updateClock();

function updateFlipClock(timestr){
  const mode = document.getElementById("clockMode") ? document.getElementById("clockMode").value : 'digital';
  const flip = document.getElementById("flip-clock");
  const timeEl = document.getElementById("time");
  if (!flip || !timeEl) return;
  if (mode === 'flip'){
    flip.classList.remove('hidden');
    timeEl.classList.add('hidden');
    flip.innerHTML = '';
    timestr.split('').forEach(ch => {
      const d = document.createElement('div');
      d.className = 'flip-card';
      d.textContent = ch;
      flip.appendChild(d);
    });
  } else {
    flip.classList.add('hidden');
    timeEl.classList.remove('hidden');
  }
}

// settings panel
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("close-settings");
settingsBtn.addEventListener('click', ()=> settingsPanel.classList.add('open'));
closeSettings.addEventListener('click', ()=> settingsPanel.classList.remove('open'));

// theme toggle & select
const themeSwitch = document.getElementById("themeSwitch");
const themeSelect = document.getElementById("themeSelect");
function applyTheme(t){
  document.body.setAttribute('data-theme', t);
  localStorage.setItem('adc_theme', t);
}
if (themeSelect){
  themeSelect.addEventListener('change', e => applyTheme(e.target.value));
  const saved = localStorage.getItem('adc_theme') || 'neon';
  themeSelect.value = saved;
  applyTheme(saved);
}
if (themeSwitch){
  themeSwitch.addEventListener('change', e => applyTheme(e.target.checked ? 'glass' : (localStorage.getItem('adc_theme') || 'neon')));
  const val = localStorage.getItem('adc_theme') || 'neon';
  themeSwitch.checked = (val === 'glass');
}

// marquee speed
const marqueeSpan = document.querySelector('#marquee span');
const marqueeRange = document.getElementById("marqueeSpeed");
if (marqueeRange && marqueeSpan){
  marqueeRange.addEventListener('input', e=>{
    const s = e.target.value;
    marqueeSpan.style.animationDuration = `${s}s`;
    localStorage.setItem('adc_marquee_speed', s);
  });
  const ms = localStorage.getItem('adc_marquee_speed') || marqueeRange.value;
  marqueeRange.value = ms;
  marqueeSpan.style.animationDuration = `${ms}s`;
}

// animate map on hover (add subtle scale)
const nigeriaMap = document.getElementById("nigeriaMap");
if (nigeriaMap){
  nigeriaMap.addEventListener('mouseover', () => nigeriaMap.style.transform = 'scale(1.01)');
  nigeriaMap.addEventListener('mouseout', () => nigeriaMap.style.transform = 'scale(1)');
}

// welcome voice
setTimeout(()=> { if (window.speak) window.speak(window.aiReply('greeting')); }, 900);
