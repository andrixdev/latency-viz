/**
 * UTILS
 * Useful helpers
 * 
 * Latency visualization interface
 * ANDRIX ® 2026
 */


let Utils = {}

Utils.segmentAngleRad = (Xstart, Ystart, Xtarget, Ytarget, realOrWeb) => {
	/**
	 * @param {Number} Xstart X value of the segment starting point
	 * @param {Number} Ystart Y value of the segment starting point
	 * @param {Number} Xtarget X value of the segment target point
	 * @param {Number} Ytarget Y value of the segment target point
	 * @param {Boolean} realOrWeb true if Real (Y towards top), false if Web (Y towards bottom)
	 * @returns {Number} Angle between 0 and 2PI
	 */
	let result// Will range between 0 and 2PI
	if (Xstart == Xtarget) {
		if (Ystart == Ytarget) {
			result = 0 
		} else if (Ystart < Ytarget) {
			result = Math.PI/2
		} else if (Ystart > Ytarget) {
			result = 3*Math.PI/2
		} else {}
	} else if (Xstart < Xtarget) {
		result = Math.atan((Ytarget - Ystart)/(Xtarget - Xstart))
	} else if (Xstart > Xtarget) {
		result = Math.PI + Math.atan((Ytarget - Ystart)/(Xtarget - Xstart))
	}
	
	result = (result + 2*Math.PI)%(2*Math.PI)
	
	if (!realOrWeb) {
		result = 2*Math.PI - result
	}
	
	return result
}
