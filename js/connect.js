/**
 * CONNECT
 * Socket connection with detection software by Maxime Touroute
 * 
 * Latency visualization interface
 * ANDRIX & Maxime Touroute © 2026
 */

let socketURL = ""
if (Init.room == 1) {
	socketURL = "https://latency.maximetouroute.com:443"
} else if (Init.room == 2) {
	socketURL = "https://haut.maximetouroute.com:443"
} else if (Init.room == 3) {
	socketURL = "http://192.168.4.23:3005"
} else {
	socketURL = "https://latency.maximetouroute.com:443"
}

const socket = io(socketURL)

let liveMakerState = {
	"uiPage.latency.alex.zoom": 8000,
	"uiPage.latency.alex.xOffset": 0,
	"uiPage.latency.alex.yOffset": 0,
	"uiPage.latency.alex.zOffset": 0,
	"uiPage.latency.alex.zScale": 4000,
	"uiPage.latency.alex.a": 1,
	"uiPage.latency.alex.b": 2,
	"uiPage.latency.alex.c": 3
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
			Bub.updateLivermakerControls(liveMakerState)
			
			// Once 1st state has been received, listen to atomic changes
			socket.on('onUserStateAtomicUpdate', (atom) => {
				liveMakerState = Object.assign(liveMakerState, {...atom})
				console.log('newState', liveMakerState)
				Bub.updateLivermakerControls(liveMakerState)
			})
		})
	})
})

// Full frame
socket.on('latency_onNewBubbleFrame', (bubbleFrame) => {
	Bub.updateFrame(bubbleFrame)
})
