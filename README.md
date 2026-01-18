# Latency Viz
Visualization web interface for dance bubbles

# Version
One unique branch, main version on the **master** branch  
Deployed at https://alexandrix.com/latency  

# User: Setup
No package needed, open the index.html file in your favorite browser

# URL parameters
* You can pass URL parameters to apply settings
* **room** is the backend room to which the app connects, value is integer
* **fullscreen** displays fullscreen right on start, value is 0 or 1
* **stats** displays a tiny window with FPS information, value is 0 or 1
* **captions** displays captions on fullscreen view, value is 0 or 1
* **viz** names the output you want to see in fullscreen, works with fullscreen=1, see list below
* Example of URL: file:///your-path/latency-viz/index.html?room=2&fullscreen=1&stats=1&viz=magnetic

# List of visual outputs
* **"2d"**
* **"2d-average"**
* **"3d"**
* **"3d-average"**
* **"3d-depth"**
* **"silhouette"**
* **"painting"**
* **"3d-aura"**
* **"3d-aura-energy"**
* **"energy"**
* **"direction"**
* **"circles"**
* **"vitruvian"**
* **"grid"**
* **"grid-energy"**
* **"sphere"**
* **"sphere-energy"**
* **"rain"**
* **"attraction"**
* **"vortex"**
* **"vortex-energy"**
* **"tempest"**
* **"hybrid"**
* **"trails"**
* **"trails-gravity"**
* **"magnetic"**
* **"multipole"**

# Developer: Contributing
* Install Git (https://git-scm.com/downloads)
* Talk to the main developer
* Agree on a cool feature and push commits on a new separate branch
* Test your code (manually)
* Submit a Pull Request, code will be reviewed

# Developer: Compiling LESS into CSS with Visual Studio Code
* Install the Easy LESS extension (by mrcrowl)
* All .less files are automatically compiled to CSS on file save

# Developer: Compiling LESS into CSS without Visual Studio Code
* Install the LESS preprocessor (https://lesscss.org/usage/)
* To update the stylesheet, run **lessc ./css/main.less ./css/main.css** from root directory

# TODO
* On-resize behaviour
