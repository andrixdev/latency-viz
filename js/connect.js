/** 
 * Socket Connect, Maxime Touroute x Alex Andrix @ 2026
 */

let socketURL = ""
if (Init.room == 1) {
	socketURL = "https://latency.maximetouroute.com:443"
} else if (Init.room == 2) {
	socketURL = "https://haut.maximetouroute.com:443"
} else if (Init.room == 3) {
	socketURL = "https://127.0.0.1:8000"
} else {
	socketURL = "https://latency.maximetouroute.com:443"
}

const socket = io(socketURL)

let liveMakerState = {
	zoom: 8000,
	xOffset: 0,
	yOffset: 0,
	zOffset: 0,
	zRescale: 4000
}

// Listen for the 'connect' event
socket.on('connect', () => {
	console.log('Connected to the server!')
	console.log(`Socket ID: ${socket.id}`)
	socket.emit('mauth', '', (authToken) => {

		// Auth, no
		console.log('got auth', authToken)
		socket.emit('osc')

		// Ask state after connect one first time. If reconnect, resets the state
		socket.emit('askUserState', (userState) => {
			console.log('get user state', userState)
			liveMakerState = Object.assign({}, {...userState})
			console.log('newState', liveMakerState)
			
			// Once 1st state has been received, listen to atomic changes
			socket.on('onUserStateAtomicUpdate', (atom) => {
				liveMakerState = Object.assign(liveMakerState, {...atom})
				console.log('newState', liveMakerState)
			})
		})


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
});
