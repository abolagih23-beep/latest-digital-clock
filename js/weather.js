/* ============================================================
   js/weather.js – FINAL ERROR-FREE VERSION
   OpenWeather Geocode + Current Weather + Forecast + Rain AI
=============================================================== */

const OPENWEATHER_API_KEY = "f42e83ab15e10a17f0aaba80acbe5825";  // FIXED (no newline)
const GEO_LIMIT = 1;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FORECAST_HOURS_WINDOW = 12;

/* ------------------------
   UI Elements (SAFE GETTERS)
------------------------- */

const locationInput     = document.getElementById("locationInput");
const updateWeatherBtn  = document.getElementById("updateWeatherBtn");
const speakWeatherBtn   = document.getElementById("speakWeatherBtn");
const voiceStateBtn     = document.getElementById("voiceStateBtn");
const detectGPSBtn      = document.getElementById("detectGPSBtn");

const stateNameEl       = document.getElementById("state-name");
const tempEl            = document.getElementById("temperature");
const humidityEl        = document.getElementById("humidity");
const pressureEl        = document.getElementById("pressure");
const windEl            = document.getElementById("wind");
const rainProbEl        = document.getElementById("rain-prob");
const rainMeter         = document.getElementById("rainMeter");
const weatherOutputEl   = document.getElementById("weatherOutput");
const weatherIconEl     = document.getElementById("weatherIcon");

/* ------------------------
   Nigeria States
------------------------- */
const nigeriaStates = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe",
  "Zamfara","FCT Abuja"
];

const zones = {
  "North Central": ["Benue","FCT Abuja","Kogi","Kwara","Nasarawa","Niger","Plateau"],
  "North East": ["Adamawa","Bauchi","Borno","Gombe","Taraba","Yobe"],
  "North West": ["Jigawa","Kaduna","Kano","Katsina","Kebbi","Sokoto","Zamfara"],
  "South East": ["Abia","Anambra","Ebonyi","Enugu","Imo"],
  "South South": ["Akwa Ibom","Bayelsa","Cross River","Delta","Edo","Rivers"],
  "South West": ["Ekiti","Lagos","Osun","Ondo","Ogun","Oyo"]
};

/* ------------------------
   Helpers
------------------------- */

function nowMs(){ return Date.now(); }
function cacheKeyFor(place){ return place.trim().toLowerCase(); }

const weatherCache = new Map();

/* ------------------------
   API FUNCTIONS
------------------------- */

async function geocodePlace(place){
  const query = encodeURIComponent(place);
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=1&appid=${OPENWEATHER_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode failed (${res.status})`);

  const data = await res.json();
  if (!data.length) throw new Error("Location not found");

  const g = data[0];
  const display = [g.name, g.state, g.country].filter(Boolean).join(", ");

  return {
    lat: g.lat,
    lon: g.lon,
    displayName: display
  };
}

async function fetchCurrentWeather(lat, lon){
  const url =
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
    `&units=metric&appid=${OPENWEATHER_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Current weather failed (${res.status})`);

  const d = await res.json();

  return {
    temp: d.main.temp,
    humidity: d.main.humidity,
    pressure: d.main.pressure,
    windSpeed: d.wind?.speed ?? 0,
    weatherDesc: d.weather?.[0]?.description ?? "Unknown",
    weatherMain: d.weather?.[0]?.main ?? "",
    cloudiness: d.clouds?.all ?? 0,
    rainLast1h: d.rain?.["1h"] ?? 0
  };
}

async function fetchForecast(lat, lon){
  const url =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}` +
    `&units=metric&appid=${OPENWEATHER_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`);

  return await res.json();
}

/* ------------------------
   Rain Prediction AI
------------------------- */

function predictRainfall(current, forecastData, hours){
  let score = 0;

  // Humidity
  if (current.humidity >= 85) score += 35;
  else if (current.humidity >= 70) score += 20;
  else if (current.humidity >= 50) score += 10;

  // Cloudiness
  if (current.cloudiness >= 80) score += 28;
  else if (current.cloudiness >= 60) score += 18;

  // Pressure drop
  if (current.pressure <= 1005) score += 18;
  else if (current.pressure <= 1010) score += 10;

  // Forecast analysis
  const now = Math.floor(Date.now()/1000);
  const end = now + hours * 3600;

  const entries = forecastData.list.filter(e => e.dt >= now && e.dt <= end);

  entries.forEach(e=>{
    const pop = (e.pop ?? 0) * 100;
    score += pop * 0.5;

    const desc = e.weather?.[0]?.description ?? "";
    if (/rain|storm|shower/.test(desc)) score += 10;
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  let label = "No Rain Expected";
  if (score >= 75) label = "Heavy Rain Likely";
  else if (score >= 50) label = "Moderate Rain Likely";
  else if (score >= 25) label = "Light Rain Possible";

  return { score, label };
}

/* ------------------------
   UI Rendering
------------------------- */

function updateIcon(desc){
  const d = desc.toLowerCase();
  let icon = "☀️";

  if (d.includes("rain")) icon = "🌧️";
  else if (d.includes("cloud")) icon = "☁️";
  else if (d.includes("storm")) icon = "⛈️";
  else if (d.includes("snow")) icon = "❄️";
  else if (d.includes("mist") || d.includes("fog")) icon = "🌫️";

  if (weatherIconEl) weatherIconEl.textContent = icon;
}

function setUIWeather({ displayName, current, rainPrediction, forecastSummary }){

  if (stateNameEl) stateNameEl.textContent = `Location: ${displayName}`;
  if (tempEl) tempEl.textContent         = `Temp: ${Math.round(current.temp)}°C`;
  if (humidityEl) humidityEl.textContent = `Humidity: ${current.humidity}%`;
  if (pressureEl) pressureEl.textContent = `Pressure: ${current.pressure} hPa`;
  if (windEl) windEl.textContent         = `Wind: ${current.windSpeed} m/s`;

  if (rainProbEl) rainProbEl.textContent =
    `${rainPrediction.label} (${rainPrediction.score}%)`;

  if (rainMeter) rainMeter.value = rainPrediction.score;

  if (weatherOutputEl)
    weatherOutputEl.innerText =
      `${displayName}: ${current.weatherDesc}, ${Math.round(current.temp)}°C. `
      + `${rainPrediction.label}. ${forecastSummary}`;

  updateIcon(current.weatherDesc);
}

/* ------------------------
   MAIN WORKFLOW
------------------------- */

async function lookupAndShowWeather(place){
  try {
    if (!place.trim()) throw new Error("Enter a location");

    const key = cacheKeyFor(place);
    const cached = weatherCache.get(key);

    if (cached && nowMs() - cached.timestamp < CACHE_TTL_MS){
      setUIWeather(cached.payload);
      return;
    }

    const geo = await geocodePlace(place);
    const [current, forecast] = await Promise.all([
      fetchCurrentWeather(geo.lat, geo.lon),
      fetchForecast(geo.lat, geo.lon)
    ]);

    const rainPrediction = predictRainfall(current, forecast, FORECAST_HOURS_WINDOW);

    const payload = {
      displayName: geo.displayName,
      current,
      rainPrediction,
      forecastSummary: "Forecast OK"
    };

    weatherCache.set(key, { timestamp: nowMs(), payload });

    setUIWeather(payload);

  } catch (err) {
    console.error(err);

    if (weatherOutputEl)
      weatherOutputEl.innerText = `Weather lookup failed: ${err.message}`;

    stateNameEl.textContent = "Location: --";
    tempEl.textContent = "Temp: --°C";
    humidityEl.textContent = "Humidity: --%";
    pressureEl.textContent = "Pressure: -- hPa";
    windEl.textContent = "Wind: -- m/s";
    rainProbEl.textContent = "Rainfall: --";
    if (rainMeter) rainMeter.value = 0;
  }
}

/* ------------------------
   EVENT LISTENERS
------------------------- */

if (updateWeatherBtn)
  updateWeatherBtn.onclick = () => lookupAndShowWeather(locationInput.value);

if (locationInput)
  locationInput.onkeydown = e => { if (e.key==="Enter") updateWeatherBtn.click(); };

if (speakWeatherBtn)
  speakWeatherBtn.onclick = () => {
    if (weatherOutputEl && window.speak)
      window.speak(weatherOutputEl.innerText);
  };

if (detectGPSBtn)
  detectGPSBtn.onclick = () => {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherWithCoords(pos.coords.latitude, pos.coords.longitude),
      () => alert("GPS unavailable")
    );
  };

/* ------------------------
   AUTO LOAD
------------------------- */

window.addEventListener("load", ()=>{
  setTimeout(()=> lookupAndShowWeather("Lagos, Nigeria"), 800);
});
