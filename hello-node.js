import fs from 'fs'

function demoSync() {
	const contents = fs.readFileSync('data/data.txt', 'utf8')
	console.log(contents)
}

// demoAsync()
function demoAsync() {
	fs.readFile('data/data.txt', 'utf8', (err, contents) => {
		if (err) return console.log('Cannot read file')
		console.log(contents)
	})
	console.log('after calling readFile')
}

const cars = readJsonFile('data/car.json')
console.log(cars)

function readJsonFile(path) {
	const json = fs.readFileSync(path, 'utf8')
	const data = JSON.parse(json)
	return data
}

// console.log('Hi')
// setTimeout(() => console.log('Bye'), 2000)
