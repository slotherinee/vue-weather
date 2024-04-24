<script setup lang="ts">
import SpinnerComponent from '@/components/SpinnerComponent.vue'
import type { Locations, Location, WeatherForeCast } from '@/types/types'
import { ref } from 'vue'

let locations = ref<Locations>([])
const searchTerm = ref('')
const weatherForecast = ref<null | WeatherForeCast>(null)
const loading = ref(false)
const error = ref('')

const searchLocations = async () => {
  if (!searchTerm.value.trim()) {
    error.value = 'Please enter a location to search'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${searchTerm.value}&count=10&language=en&format=json`
    )
    const data = await response.json()
    locations.value = data.results
  } catch (err) {
    console.error(err)
    error.value = 'An error occurred while fetching locations'
  } finally {
    loading.value = false
  }
}

const getTodaysAndNextDaysDate = () => {
  const today = new Date()
  const nextDay = new Date(today)
  nextDay.setDate(today.getDate() + 1)
  return {
    today: today.toISOString().split('T')[0],
    nextDay: nextDay.toISOString().split('T')[0],
  }
}
const { today, nextDay } = getTodaysAndNextDaysDate()

const getWeatherForecast = async (location: Location) => {
  loading.value = true
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m&start_date=${today}&end_date=${nextDay}`
    )
    const data = await response.json()
    weatherForecast.value = data

    if (data && data.hourly && data.hourly.temperature_2m && data.hourly.time) {
      const hourlyTemperatures = data.hourly.temperature_2m
      const hourlyTimes = data.hourly.time

      const currentHour = new Date().getHours()
      let currentTemperatureIndex = hourlyTimes.findIndex(
        (time: string) => new Date(time).getHours() === currentHour
      )

      if (currentTemperatureIndex !== -1) {
        if (weatherForecast.value) {
          weatherForecast.value.current = {
            temperature: hourlyTemperatures[currentTemperatureIndex],
            time: hourlyTimes[currentTemperatureIndex],
          }
        }
      }
    } else {
      console.error('Hourly weather data not found in the response')
    }
  } catch (err) {
    console.error(err)
    error.value = 'An error occurred while fetching weather forecast'
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('default', { dateStyle: 'short' }).format(
    new Date(date)
  )
}

const getLocalTime = (utcTimeString: string) => {
  const date = new Date(utcTimeString)
  return new Intl.DateTimeFormat('default', { timeStyle: 'short' }).format(date)
}
</script>

<template>
  <main>
    <div class="max-w-screen-lg mx-auto min-h-full p-3">
      <div class="flex flex-col items-center justify-center min-h-screen">
        <div>
          <form
            @submit.prevent
            class="flex gap-2">
            <input
              type="text"
              v-model="searchTerm"
              placeholder="Search Location"
              class="p-2 border border-gray-300 rounded" />
            <button
              @click="searchLocations"
              class="bg-blue-500 text-white p-2 rounded">
              Search
            </button>
          </form>
        </div>
        <div class="w-full mt-10">
          <div class="flex justify-center items-center gap-2">
            <SpinnerComponent v-if="loading" />
            <div
              v-if="error"
              class="text-red-500">
              {{ error }}
            </div>
          </div>
          <div class="w-full mt-10">
            <ul
              class="grid grid-cols-1 md:grid-cols-3 justify-center justify-items-center gap-4"
              v-if="locations.length > 0">
              <li
                v-for="location in locations"
                :key="location.id"
                @click="getWeatherForecast(location)"
                class="p-2 w-full border border-gray-300 rounded mt-2 cursor-pointer">
                <div class="flex flex-row-reverse justify-between items-center">
                  <div>
                    <img
                      :src="`https://hatscripts.github.io/circle-flags/flags/${location.country_code.toLowerCase()}.svg`"
                      width="16" />
                  </div>
                  <div>{{ location.name }} | {{ location.country }}</div>
                </div>
              </li>
            </ul>
            <div
              class="mt-10 flex flex-col items-center justify-center w-full gap-4"
              v-if="weatherForecast">
              <div class="flex flex-col items-center gap-2">
                <h2>Current Weather Conditions</h2>
                <p>Temperature: {{ weatherForecast.current.temperature }}</p>
                <p>
                  Time:
                  {{ getLocalTime(weatherForecast.current.time).slice(0, 3)
                  }}{{ String(new Date().getMinutes()).padStart(2, '0') }}
                </p>
                <h2>
                  Hourly Weather Forecast from {{ formatDate(today) }} to
                  {{ formatDate(nextDay) }}
                </h2>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-5">
                <div
                  v-for="(temp, index) in weatherForecast.hourly.temperature_2m"
                  :key="index">
                  <div
                    class="p-2 border border-gray-300 rounded mt-2"
                    :class="{ 'bg-gray-100': index % 2 === 0 }">
                    <p>
                      <span class="font-bold">{{ temp }} °C</span> -
                      {{ getLocalTime(weatherForecast.hourly.time[index]) }}
                      {{ formatDate(weatherForecast.hourly.time[index]) }}
                      {{
                        temp === +weatherForecast.current.temperature
                          ? '[Current]'
                          : ''
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
