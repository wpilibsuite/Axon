FROM tensorflow/tensorflow:1.12.0-rc2-devel

ARG DEBIAN_FRONTEND=noninteractive

RUN cd / & mkdir tensorflow && \
    git clone https://github.com/tensorflow/models.git && \
    (cd models && git checkout f788046ca876a8820e05b0b48c1fc2e16b0955bc) && \
    mv models /tensorflow/models

RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx curl wget python python-tk apt-transport-https ca-certificates  \
        build-essential cmake unzip yasm pkg-config libswscale-dev libtbb2 libtbb-dev libjpeg-dev libpng-dev libtiff-dev \
        libjasper-dev libavformat-dev libhdf5-dev libpq-dev && \
    pip install Cython contextlib2 pillow matplotlib numpy hdf5storage h5py scipy && \
    mkdir -p /opt/ml/input/data/training && \
    mkdir -p /opt/ml/model/


# Get protoc 3.0.0, rather than the old version already in the container
RUN cd / && \
    curl -OL "https://github.com/google/protobuf/releases/download/v3.0.0/protoc-3.0.0-linux-x86_64.zip" && \
    unzip protoc-3.0.0-linux-x86_64.zip -d proto3 && \
    mv proto3/bin/* /usr/local/bin && \
    mv proto3/include/* /usr/local/include && \
    rm -rf proto3 protoc-3.0.0-linux-x86_64.zip

# Install pycocoapi
RUN git clone --depth 1 https://github.com/cocodataset/cocoapi.git && \
    cd cocoapi/PythonAPI && \
    make -j8 && \
    cp -r pycocotools /tensorflow/models/research && \
    cd ../../ && \
    rm -rf cocoapi && \
    cd /tensorflow/models/research && \
    protoc object_detection/protos/*.proto --python_out=.

# Set the PYTHONPATH to finish installing the API
ENV PYTHONPATH $PYTHONPATH:/tensorflow/models/research:/tensorflow/models/research/slim

ENV PATH="/tensorflow/models/research:${PATH}"