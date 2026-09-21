#!/bin/bash
# Imagens do /work que o Framer serve e que o proxy daqui bloqueia.
set -e
cd ~/Developer/Bondioli/public/site
curl -fL -o work-5.png "https://framerusercontent.com/images/GQftbZzTvXa3UgSA6ZagUhY3sI.png"
curl -fL -o work-6.png "https://framerusercontent.com/images/kI3zZdlKLX2DBICHbIxFzNBb5M4.png"
mkdir -p ../images
cd ../images
curl -fL -o rodrigo.png "https://framerusercontent.com/images/bAIgzzOFB3uK4wKn8rzomk66s4.png"
cd ..
ls -la site/work-5.png site/work-6.png images/rodrigo.png
