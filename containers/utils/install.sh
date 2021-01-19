#!/bin/sh
echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" | sudo tee /etc/apt/sources.list.d/coral-edgetpu.list
curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
sudo apt-get update
sudo apt install python3-edgetpu
sudo apt-get install libopencv-dev
pip3 install robotpy-cscore
pip3 install opencv-python
