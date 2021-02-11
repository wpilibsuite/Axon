ARG BASE_VERSION=edge
FROM wpilib/axon-base:${BASE_VERSION}

RUN mkdir -p /tensorflow/models/research/learn && \
    mkdir -p /tensorflow/models/research/learn/ckpt && \
    rm -rf /tensorflow/models/research/learn/train && \
    rm -rf /tensorflow/models/research/learn/models && \
    mkdir -p /tensorflow/models/research/start_ckpt  && \
    cd /tensorflow/models/research/start_ckpt && \
    wget "https://frcmaven.wpi.edu/artifactory/generic-release-mirror/tensorflow_models/ssd_mobilenet_v2_quantized_300x300_coco_2019_01_03/model.ckpt.data-00000-of-00001" && \
    wget "https://frcmaven.wpi.edu/artifactory/generic-release-mirror/tensorflow_models/ssd_mobilenet_v2_quantized_300x300_coco_2019_01_03/model.ckpt.index" && \
    wget "https://frcmaven.wpi.edu/artifactory/generic-release-mirror/tensorflow_models/ssd_mobilenet_v2_quantized_300x300_coco_2019_01_03/model.ckpt.meta"

COPY scripts /tensorflow/models/research/
WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python3", "train.py", "--dir"]