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
	"3d": 1,
	"3d-depth": 2,
	"aura": 3,
	"silhouette": 4,
	"painting": 5,
	"circles": 6,
	"vitruvian": 7,
	"energy": 8,
	"aura-energy": 9,
	"grid": 10,
	"grid-energy": 11,
	"rain": 12,
	"attraction": 13,
	"vortex": 14,
	"tempest": 15,
	"trails": 16,
	"trails-gravity": 17,
	"magnetic": 18
}
