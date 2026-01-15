// Socket Connect, Maxime Touroute x Alex Andrix @ 2026

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let room = urlParams.get('room')

let socketURL = ""
if (room == 1) {
	socketURL = "https://latency.maximetouroute.com:443"
} else if (room == 2) {
	socketURL = "https://haut.maximetouroute.com:443"
} else {
	console.error("Room id not recognized")
	alert("Room id not recognized: " + room)
}

const socket = io(socketURL)

// Listen for the 'connect' event
socket.on('connect', () => {
	console.log('Connected to the server!')
	console.log(`Socket ID: ${socket.id}`)
	socket.emit('mauth', '', (authToken) => {
		console.log('got auth', authToken)
		socket.emit('osc')
	})
})


/*
// Point by point
socket.on('on-osc', (message) => {
	//console.log('got osc message from back:', message)
	Bub.updatePoint(message.url, message.parameter)
})
*/

// Full frame
socket.on('latency_onNewBubbleFrame', (bubbleFrame) => {
	//console.log(bubbleFrame.point1)
	//console.log(bubbleFrame.point1.x)
	Bub.updateFrame(bubbleFrame)
})
