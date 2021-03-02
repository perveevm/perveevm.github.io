const defaultCity = "Saint Petersburg";

function clearAndAppend(div, toAppend) {
    div.innerHTML = "";
    div.append(toAppend);
}

function setCityWeatherInfo(cityElem, weather) {
    cityElem.querySelector('.city-info-title .city-name')
        .innerHTML = weather.name;
    cityElem.querySelector('.city-info-title .city-weather-icon')
        .src = weatherAPI.getIconURL(weather.weather[0].icon);
    cityElem.querySelector('.city-info-title .temperature')
        .innerHTML = `${Math.round(weather.main.temp)}°C`;
    cityElem.querySelector('.city-weather-info .wind-info .value')
        .innerHTML = `${weather.wind.speed} m/s`;
    cityElem.querySelector('.city-weather-info .cloudiness-info .value')
        .innerHTML = `${weather.clouds.all}%`;
    cityElem.querySelector('.city-weather-info .pressure-info .value')
        .innerHTML = `${weather.main.pressure} hpa`;
    cityElem.querySelector('.city-weather-info .humidity-info .value')
        .innerHTML = `${weather.main.humidity}%`;
    cityElem.querySelector('.city-weather-info .coordinates-info .value')
        .innerHTML = `[${weather.coord.lat.toFixed(2)}, ${weather.coord.lon.toFixed(2)}]`;
}


function setWeatherHereInfo(elem, weather) {
    elem.querySelector('.main-info .city-here-name')
        .innerHTML = weather.name;
    elem.querySelector('.main-info .weather-here-image-and-temperature .weather-icon')
        .src = weatherAPI.getIconURL(weather.weather[0].icon);
    elem.querySelector('.main-info .weather-here-image-and-temperature .temperature-here')
        .innerHTML = `${Math.round(weather.main.temp)}°C`;
    elem.querySelector('.side-info .side-info-container .wind-info .value')
        .innerHTML = `${weather.wind.speed} m/s`;
    elem.querySelector('.side-info .side-info-container .cloudiness-info .value')
        .innerHTML = `${weather.clouds.all}%`;
    elem.querySelector('.side-info .side-info-container .pressure-info .value')
        .innerHTML = `${weather.main.pressure} hpa`;
    elem.querySelector('.side-info .side-info-container .humidity-info .value')
        .innerHTML = `${weather.main.humidity}%`;
    elem.querySelector('.side-info .side-info-container .coordinates-info .value')
        .innerHTML = `[${weather.coord.lat.toFixed(2)}, ${weather.coord.lon.toFixed(2)}]`;
}

function getElemAndSetWeatherCity(weather) {
    const elem = document.importNode(document.querySelector('#city').content, true);
    setCityWeatherInfo(elem, weather);
    elem.querySelector('.close-button').addEventListener('click', removeFromFavourites);
    elem.firstElementChild.setAttribute('cityName', eraseSpaces(weather.name));
    return elem;
}

function getElemAndSetWeatherHere(weather) {
    const elem = document.importNode(document.querySelector('#main-city').content, true);
    setWeatherHereInfo(elem, weather);
    return elem;
}

async function updateWeatherHere() {
    clearAndAppend(mainCity, document.importNode(document.querySelector('#main-city-waiting').content, true));
    const defaultWeatherHandler = weather => {
        clearAndAppend(mainCity, getElemAndSetWeatherHere(weather));
    };
    navigator.geolocation.getCurrentPosition(coordinates => {
        weatherAPI.getByCityCoordinates(coordinates)
            .then(defaultWeatherHandler)
            .catch(() => errorHandler('Ошибка во время получения геолокации.'));
    }, () => weatherAPI.getByCityName(defaultCity)
        .then(defaultWeatherHandler)
        .catch(() => errorHandler('Ошибка во время получения геолокации.')));
}

function errorHandler(errorMessage) {
    const elem = document.getElementById('error');
    elem.innerHTML = errorMessage;
    setTimeout(() => {
        elem.innerHTML = '';
    }, 2000);
}

function getFavouritesFromLocalStorage() {
    return JSON.parse(localStorage.getItem(favouritesLocalStorageID));
}

function getSmallCityName(city, maxCityLength) {
    if (city.length <= maxCityLength) {
        return city;
    }
    return city.slice(0, maxCityLength) + '...';
}

function eraseSpaces(str) {
    return str.replace(/[\s.]/g, "");
}

async function addToFavourites(event) {
    event.preventDefault();
    const input = event.target[0];
    const city = input.value.trim();
    input.value = '';
    let favourites = getFavouritesFromLocalStorage();
    let cityExists = false;

    favourites.forEach(elem => {
        if (elem.toLowerCase() === city.toLowerCase()) {
            cityExists = true;
        }
    });
    if (cityExists) {
        errorHandler('Город уже добавлен в Избранное.');
    } else {
        if (!navigator.onLine) {
            errorHandler('Соединение с сервером потеряно.');
            return;
        }
        let response = await weatherAPI.getByCityName(city).catch(() => {
            errorHandler(`Ошибка во время загрузки погоды в городе ${city}.`);
        });
        if (response.cod === 200) {
            favourites = getFavouritesFromLocalStorage();
            if (favourites.includes(response.name)) {
                errorHandler('Город уже добавлен в Избранное.');
            } else {
                localStorage.setItem(favouritesLocalStorageID, JSON.stringify([...favourites, response.name]));
                updateFavourites();
            }
        } else {
            errorHandler(`Город ${getSmallCityName(city, 20)} не найден.`);
        }
    }
}

function addCityWaiting(city) {
    const template = document.querySelector('#city-waiting');
    const cityElem = document.importNode(template.content, true);
    cityElem.querySelector('.city-name').innerText = city;
    cityElem.firstElementChild.setAttribute('cityName', eraseSpaces(city));
    return cityElem;
}

function addCity(cityToAdd) {
    favouritesSection.append(addCityWaiting(cityToAdd));
    const cityElem = favouritesSection.querySelector(`.city-full-data[cityName=${eraseSpaces(cityToAdd)}]`);
    weatherAPI.getByCityName(cityToAdd)
        .then(weather => favouritesSection
            .replaceChild(getElemAndSetWeatherCity(weather), cityElem))
        .catch(() =>
            errorHandler('Ошибка во время добавления нового города.'));
}

function removeFromFavourites(event) {
    const city = event.currentTarget.parentElement.firstElementChild.innerHTML;
    const favourites = getFavouritesFromLocalStorage();
    localStorage.setItem(favouritesLocalStorageID, JSON.stringify(favourites.filter(cityName => cityName !== city)));
    updateFavourites();
}

function updateFavourites() {
    const favourites = getFavouritesFromLocalStorage();

    for (const elem of favouritesSection.children) {
        const cityNameFromElem = elem.querySelector('.city-name').innerText;
        if (!(favourites.includes(cityNameFromElem))) {
            favouritesSection.removeChild(elem);
        }
    }

    for (const city of favourites) {
        const cityName = city.toString();
        if (!favouritesSection.querySelector(`.city-full-data[cityName=${eraseSpaces(cityName)}]`)) {
            addCity(cityName);
        }
    }
}