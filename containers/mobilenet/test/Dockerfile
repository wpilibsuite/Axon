FROM valian/docker-python-opencv-ffmpeg:py3


RUN mkdir -p /tensorflow/models/research/ && \
    cd /tensorflow/models/research/ && \
    apt-get update && \
    apt-get install wget -y && \
    pip3 install --index-url https://google-coral.github.io/py-repo/ tflite_runtime

COPY scripts /tensorflow/models/research/
WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python3", "-u", "test.py", "--dir"]