/**
 * ANDRIX ® 2026
 */

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)

let Init = {}
Init.room = urlParams.get("room")
Init.viz = urlParams.get("viz")
Init.fullscreen = urlParams.get("fullscreen")

Init.vizMapping = {
	"2d": 0,
	"3d": 2,
	"aura": 3,
	"silhouette": 4,
	"grid": 10
}
