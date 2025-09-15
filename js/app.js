const form = document.querySelector("#searchForm");
const input = document.querySelector("#locationInput");
const fromDateInput = document.querySelector("#fromDate");
const toDateInput = document.querySelector("#toDate");
const output = document.querySelector("#feedback");
const calendarModal = document.querySelector(".calendarSelect");
const getRangeBtn = document.getElementById("getRangeBtn");
const openRangeBtn = document.getElementById("openDateRangeBtn");
const closeRangeBtn = document.getElementById("closeDateRangeBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const themeImages = document.querySelectorAll(".theme-switch-image");

// format date
function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// set min/max date values
function setDateLimits() {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 10);

  fromDateInput.min = formatLocalDate(today);
  toDateInput.min = formatLocalDate(today);
  fromDateInput.max = formatLocalDate(maxDate);
  toDateInput.max = formatLocalDate(maxDate);
}
// Dark/light functionality
function setMode(mode) {
  document.body.classList.remove("light-mode", "dark-mode");
  document.body.classList.add(mode);
  localStorage.setItem("weatherAppMode", mode);

  themeImages.forEach(img => {
    const lightSrc = img.dataset.light;
    const darkSrc = img.dataset.dark;
    if (lightSrc && darkSrc) {
      img.src = mode === "dark-mode" ? darkSrc : lightSrc;

      if (window.innerWidth <= 1024) {
        img.closest(".login-container, .signup-container").style.backgroundImage = `url('${mode === "dark-mode" ? darkSrc : lightSrc}')`;
      }
    }
  });

  const toggleLight = darkModeToggle.dataset.light;
  const toggleDark = darkModeToggle.dataset.dark;
  if (toggleLight && toggleDark) {
    darkModeToggle.src = mode === "dark-mode" ? toggleDark : toggleLight;
  }
}

// initialize mode on page load
document.addEventListener("DOMContentLoaded", () => {

  const savedMode = localStorage.getItem("weatherAppMode") || "light-mode";
  setMode(savedMode);

  setDateLimits();
  calendarModal.classList.remove("active"); 

  // attempt to get user's location for current weather stats
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeather(`${lat},${lon}`, 1);
      },
      () => fetchWeather("46202", 1) 
    );
  } else {
    fetchWeather("46202", 1);
  }
});

darkModeToggle.addEventListener("click", () => {
  const currentMode = document.body.classList.contains("dark-mode") ? "dark-mode" : "light-mode";
  setMode(currentMode === "dark-mode" ? "light-mode" : "dark-mode");
});

openRangeBtn.addEventListener("click", () => {
  calendarModal.classList.add("active");
  document.body.classList.add("modal-active");
});

closeRangeBtn.addEventListener("click", () => {
  calendarModal.classList.remove("active");
  document.body.classList.remove("modal-active");
});

// submit date range
getRangeBtn.addEventListener("click", () => {
  const city = input.value.trim();
  const fromDateStr = fromDateInput.value;
  const toDateStr = toDateInput.value;

  if (!city) return alert("Please enter a city or ZIP code.");
  if (!fromDateStr || !toDateStr) return alert("Please select both a start and end date.");

  const today = new Date(formatLocalDate(new Date()));
  const fromDate = new Date(fromDateStr);
  const toDate = new Date(toDateStr);

  if (fromDate < today || toDate < today) return alert("Dates cannot be in the past.");
  if (toDate < fromDate) return alert("End date cannot be before start date.");

  const diffDays = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 10) return alert("Please select a date range within 10 days.");

  calendarModal.classList.remove("active");
  document.body.classList.remove("modal-active");

  fetchWeather(city, diffDays);
});

// submit date range and location request
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = input.value.trim();
  if (!city) return output.innerHTML = "<p>Please enter a city or zip code.</p>";
  fetchWeather(city, 3);
});

// fetch weather data
function fetchWeather(location, days) {
  const apiKey = "b50145efee944263bc8171528251309";
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=${days}&aqi=no&alerts=no`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("No Info Here!");
      return response.json();
    })
    .then(data => displayWeather(data))
    .catch(error => {
      console.error("Error fetching weather data:", error);
      output.innerHTML = `<p>Sorry, we couldn’t find that location.</p>`;
    });
}

// display weather data
function displayWeather(data) {
  const location = `${data.location.name}, ${data.location.region}, ${data.location.country}`;
  const current = data.current;

  const currentHTML = `
    <h2>Current Weather for ${location}</h2>
    <p class="weatherHeading"><img src="https:${current.condition.icon}" alt="${current.condition.text}"> <span>${current.condition.text}</span></p>
    <ul>
      <li>Temperature: ${current.temp_f}°F / ${current.temp_c}°C</li>
      <li>Feels Like: ${current.feelslike_f}°F / ${current.feelslike_c}°C</li>
      <li>Humidity: ${current.humidity}%</li>
      <li>Wind: ${current.wind_mph} mph / ${current.wind_kph} kph, direction ${current.wind_dir}</li>
      <li>Pressure: ${current.pressure_in} in / ${current.pressure_mb} mb</li>
      <li>Cloud Cover: ${current.cloud}%</li>
      <li>UV Index: ${current.uv}</li>
      <li>Precipitation: ${current.precip_in} in / ${current.precip_mm} mm</li>
      <li>Visibility: ${current.vis_miles} mi / ${current.vis_km} km</li>
    </ul>
  `;

  let forecastHTML = `<h3>${data.forecast.forecastday.length}-Day Forecast:</h3>`;
  forecastHTML += '<div class="daily-grid">';
  data.forecast.forecastday.forEach(day => {
    const d = day.day;
    forecastHTML += `
      <div class="daily-card">
        <h4>${day.date}</h4>
        <p class="weatherHeading"><img src="https:${d.condition.icon}" alt="${d.condition.text}"> ${d.condition.text}</p>
        <ul>
          <li>Max Temp: ${d.maxtemp_f}°F / ${d.maxtemp_c}°C</li>
          <li>Min Temp: ${d.mintemp_f}°F / ${d.mintemp_c}°C</li>
          <li>Avg Temp: ${d.avgtemp_f}°F / ${d.avgtemp_c}°C</li>
          <li>Max Wind: ${d.maxwind_mph} mph / ${d.maxwind_kph} kph</li>
          <li>Precipitation: ${d.totalprecip_in} in / ${d.totalprecip_mm} mm</li>
          <li>Avg Humidity: ${d.avghumidity}%</li>
          <li>Avg Visibility: ${d.avgvis_miles} mi / ${d.avgvis_km} km</li>
          <li>Chance of Rain: ${d.daily_chance_of_rain}%</li>
          <li>Chance of Snow: ${d.daily_chance_of_snow}%</li>
          <li>UV Index: ${d.uv}</li>
        </ul>
      </div>
    `;
  });
  forecastHTML += '</div>';

  output.innerHTML = `${currentHTML}${forecastHTML}`;
}