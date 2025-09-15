import { loggerService } from './logger.service.js'
import { makeId, readJsonFile, writeJsonFile } from './util.service.js'

const cars = readJsonFile('./data/car.json')

export const carService = {
    query,
    getById,
    remove,
    save,
}

async function query() {
    return cars
}

async function getById(carId) {
    const car = cars.find(car => car._id === carId)

    if (!car) {
        loggerService.error(`Couldn't find car with _id ${carId}`)
        throw `Couldn't get car`
    }
    return car
}

async function remove(carId) {
    const idx = cars.findIndex(car => car._id === carId)
    cars.splice(idx, 1)

    return _saveCars()
}

async function save(carToSave) {
    if (carToSave._id) {
        const idx = cars.findIndex(car => car._id === carToSave._id)
        cars.splice(idx, 1, carToSave)
    } else {
        carToSave._id = makeId()
        cars.push(carToSave)
    }
    await _saveCars()
    return carToSave
}

function _saveCars() {
    return writeJsonFile('./data/car.json', cars)
}