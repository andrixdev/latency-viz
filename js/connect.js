// Socket Connect, Maxime Touroute @2026

const socket = io("https://latency.maximetouroute.com:443");

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
