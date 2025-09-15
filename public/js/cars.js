console.log('Hi')

async function onGetCars() {
    const elCarList = document.querySelector('pre')

    const res = await fetch('/api/car')
    const cars = await res.json()

    elCarList.innerText = JSON.stringify(cars, null, 4)
}