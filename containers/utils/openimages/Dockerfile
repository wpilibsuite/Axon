FROM ubuntu:latest

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install python python3-pip python-dev python3-opencv -yq && \
    pip3 install openimages pandas

COPY . /down/

WORKDIR /down/

ENTRYPOINT ["python3", "download.py"]