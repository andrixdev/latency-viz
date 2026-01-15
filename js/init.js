/**
 * ANDRIX ® 2026
 */

let Init = {}

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
Init.room = urlParams.get("room")
Init.viz = urlParams.get("viz")
Init.fullscreen = urlParams.get("fullscreen")

/*Init.vizMapping = [
	{ "3D":  

	}
]*/
