class OpenWeatherMapAPI {
    constructor() {
        this.key = 'b73039e571e0d2ca35644897ae5c023f';
    }

    async getByCityName(cityName) {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${this.key}&units=metric`);
        return await response.json();
    }

    async getByCityCoordinates(coordinates) {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.coords.latitude}&lon=${coordinates.coords.longitude}&appid=${this.key}&units=metric`);
        return await response.json();
    }

    getIconURL(iconCode) {
        return `https://openweathermap.org/img/wn/${iconCode}.png`;
    }
}