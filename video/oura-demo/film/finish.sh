#!/bin/bash
# Mux sound into the 4K master and make the delivery files.
#   out/ayna-oura-demo_4k_master.mov   3840x2160 60fps ProRes 422 HQ + 48 kHz PCM
#   out/ayna-oura-demo_4k.mp4          3840x2160 60fps H.264 High + AAC (shareable 4K)
#   out/ayna-oura-demo_1080p.mp4       1920x1080 60fps H.264 High + AAC (the link to send)
#   out/ayna-oura-demo_thumbnail.png   hero frame (Oura insight, attributed)
set -euo pipefail
cd "$(dirname "$0")/out"
python3 ../sound.py
ffmpeg -y -loglevel error -i master_4k_silent.mov -i sound.wav -map 0:v -map 1:a -c:v copy -c:a pcm_s24le -shortest ayna-oura-demo_4k_master.mov
COLOR="-color_primaries bt709 -color_trc bt709 -colorspace bt709"
ffmpeg -y -loglevel error -i ayna-oura-demo_4k_master.mov -c:v libx264 -preset slow -crf 14 -profile:v high -pix_fmt yuv420p $COLOR \
  -c:a aac -b:a 256k -movflags +faststart ayna-oura-demo_4k.mp4
ffmpeg -y -loglevel error -i ayna-oura-demo_4k_master.mov -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset slow -crf 17 -profile:v high \
  -pix_fmt yuv420p $COLOR -c:a aac -b:a 192k -movflags +faststart ayna-oura-demo_1080p.mp4
ffmpeg -y -loglevel error -ss 22.0 -i ayna-oura-demo_4k_master.mov -frames:v 1 ayna-oura-demo_thumbnail.png
ls -la ayna-oura-demo_*
