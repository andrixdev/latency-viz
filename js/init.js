/**
 * INIT
 * Init methods
 * 
 * Latency visualization interface
 * ANDRIX ® 2026
 */

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)

let Init = {}
Init.room = urlParams.get("room")
Init.viz = urlParams.get("viz")
Init.fullscreen = urlParams.get("fullscreen")
Init.stats = urlParams.get("stats")
Init.captions = urlParams.get("captions")

Init.vizMapping = {
	"2d": 0,
	"2d-average": 1,
	"3d": 2,
	"3d-average": 3,
	"3d-depth": 4,
	"silhouette": 5,
	"painting": 6,
	"3d-aura": 7,
	"3d-aura-energy": 8,
	"energy": 9,
	"direction": 10,
	"circles": 11,
	"vitruvian": 12,
	"grid": 13,
	"grid-energy": 14,
	"sphere": 15,
	"sphere-energy": 16,
	"rain": 17,
	"attraction": 18,
	"vortex": 19,
	"vortex-energy": 20,
	"tempest": 21,
	"hybrid": 22,
	"trails": 23,
	"trails-gravity": 24,
	"magnetic": 25,
	"multipole": 26
}
