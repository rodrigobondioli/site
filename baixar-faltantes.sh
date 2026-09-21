#!/bin/bash
# Imagens do /work que o Framer serve e que o proxy daqui bloqueia.
set -e
cd ~/Developer/Bondioli/public/site
curl -fL -o work-5.png "https://framerusercontent.com/images/GQftbZzTvXa3UgSA6ZagUhY3sI.png"
curl -fL -o work-6.png "https://framerusercontent.com/images/kI3zZdlKLX2DBICHbIxFzNBb5M4.png"
# vídeo do Sobre (quadrado, 623) — o work-1.mp4 é outro
curl -fL -o work-1.mp4 "https://framerusercontent.com/assets/SQNiLhalcHcUeUim1uG9Azv5Ls.mp4"
cd ..
ls -la site/work-5.png site/work-6.png site/work-1.mp4
