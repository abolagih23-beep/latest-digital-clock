/* js/worldclock.js
   Auto discover timezones + search filter
*/
const allZones = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [
  "Africa/Lagos","Europe/London","America/New_York","Asia/Tokyo","Australia/Sydney","Asia/Dubai"
];

const worldZones = {};
allZones.forEach(tz => {
  const parts = tz.split("/");
  const city = parts[parts.length - 1].replace(/_/g," ");
  let label = city;
  if (worldZones[label]) label = `${city} (${parts[0]})`;
  worldZones[label] = tz;
});

function updateWorldClockUI(filteredList = null){
  const out = document.getElementById("world-list");
  if (!out) return;
  out.innerHTML = "";
  const keys = filteredList || Object.keys(worldZones);
  keys.forEach(city => {
    try {
      const tz = worldZones[city];
      const local = new Date().toLocaleString("en-US", { timeZone: tz });
      const time = new Date(local).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" });
      const li = document.createElement("li");
      li.textContent = `${city}: ${time}`;
      out.appendChild(li);
    } catch (e) {
      // ignore
    }
  });
}

const worldSearch = document.getElementById("world-search");
if (worldSearch){
  worldSearch.addEventListener("input", ()=> {
    const q = worldSearch.value.trim().toLowerCase();
    if (!q) { updateWorldClockUI(); return; }
    const filtered = Object.keys(worldZones).filter(k => k.toLowerCase().includes(q) || worldZones[k].toLowerCase().includes(q));
    updateWorldClockUI(filtered);
  });
}

setInterval(()=> {
  const q = worldSearch ? worldSearch.value.trim().toLowerCase() : "";
  if (q) {
    const filtered = Object.keys(worldZones).filter(k => k.toLowerCase().includes(q) || worldZones[k].toLowerCase().includes(q));
    updateWorldClockUI(filtered);
  } else updateWorldClockUI();
}, 1000);

updateWorldClockUI();
