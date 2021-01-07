FROM borda/docker_python-opencv-ffmpeg


RUN mkdir -p /tensorflow/models/research/ && \
    cd /tensorflow/models/research/ && \
    apt-get update && \
    apt-get install wget -y && \
    python3 --version && \
    wget "https://github.com/wpilibsuite/DetectCoral/releases/download/v2/testing.mp4" --no-check-certificate

RUN pip3 install tensorflow pillow

COPY scripts /tensorflow/models/research/
WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python3", "-u", "test.py", "--dir"]