// SkyCast weather dashboard using Fetch API, async/await, and JSON.

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const statusMessage = document.getElementById("statusMessage");
const weatherPanel = document.getElementById("weatherPanel");

// Translate the API's weather code into a readable condition and icon.
function getWeatherInfo(code, isDay) {
  if (code === 0) return { description: "Clear sky", icon: isDay ? "☀️" : "🌙" };
  if (code === 1) return { description: "Mainly clear", icon: isDay ? "🌤️" : "🌙" };
  if (code === 2) return { description: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { description: "Overcast", icon: "☁️" };
  if ([45, 48].includes(code)) return { description: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { description: "Drizzle", icon: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { description: "Rain", icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { description: "Snow", icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { description: "Thunderstorm", icon: "⛈️" };
  return { description: "Changing conditions", icon: "🌥️" };
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  searchButton.textContent = isLoading ? "Loading..." : "Search →";
}

// Find a city and its coordinates, then request weather for those coordinates.
async function searchWeather(city) {
  setLoading(true);
  setStatus("Finding the city and fetching the latest weather...");
  weatherPanel.hidden = true;

  try {
    const geocodingUrl =
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(city) + "&count=1&language=en&format=json";

    const geoResponse = await fetch(geocodingUrl);
    if (!geoResponse.ok) {
      throw new Error("City search is temporarily unavailable. Please try again.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("We couldn't find that city. Check the spelling and try again.");
    }

    const place = geoData.results[0];
    const weatherUrl =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      place.latitude +
      "&longitude=" +
      place.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m" +
      "&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto";

    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error("Weather data could not be loaded. Please try again in a moment.");
    }

    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      throw new Error("The weather service returned incomplete data. Please try again.");
    }

    displayWeather(place, weatherData.current, weatherData.current_units);
    setStatus("Weather updated successfully.");
  } catch (error) {
    console.error("Weather request failed:", error);
    setStatus(
      error instanceof TypeError
        ? "Network error. Check your internet connection and try again."
        : error.message || "Something went wrong. Please try again.",
      true
    );
  } finally {
    setLoading(false);
  }
}

// Render the JSON response in the dashboard.
function displayWeather(place, current, units) {
  const info = getWeatherInfo(current.weather_code, current.is_day);

  const locationParts = [place.name, place.admin1, place.country].filter(Boolean);
  document.getElementById("cityName").textContent = locationParts.join(", ");
  document.getElementById("weatherDescription").textContent = info.description;
  document.getElementById("weatherIcon").textContent = info.icon;
  document.getElementById("temperature").textContent = Math.round(current.temperature_2m);
  document.getElementById("humidity").textContent = current.relative_humidity_2m + "%";
  document.getElementById("windSpeed").textContent =
    Math.round(current.wind_speed_10m) + " " + (units.wind_speed_10m || "km/h");
  document.getElementById("feelsLike").textContent =
    "Feels like " + Math.round(current.apparent_temperature) + "°C right now.";
  document.getElementById("feelsMetric").textContent =
    Math.round(current.apparent_temperature) + "°C";

  const timeText = current.time ? new Date(current.time).toLocaleString([], {
    weekday: "short", hour: "2-digit", minute: "2-digit"
  }) : "Current observation";
  document.getElementById("updatedTime").textContent = "Local time: " + timeText;

  weatherPanel.hidden = false;
}

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) {
    setStatus("Please enter a city name first.", true);
    cityInput.focus();
    return;
  }

  searchWeather(city);
});

// Start with a useful example so the dashboard is not blank on first opening.
searchWeather("Chennai");
