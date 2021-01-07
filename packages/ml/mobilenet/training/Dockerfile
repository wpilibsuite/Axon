FROM gcperkins/wpilib-ml-base

RUN mkdir -p /tensorflow/models/research/learn && \
    mkdir -p /tensorflow/models/research/learn/ckpt && \
    rm -rf /tensorflow/models/research/learn/train && \
    rm -rf /tensorflow/models/research/learn/models && \
    mkdir -p /tensorflow/models/research/start_ckpt  && \
    cd /tensorflow/models/research/start_ckpt && \
    wget "https://github.com/wpilibsuite/DetectCoral/releases/download/v2/model.ckpt.data-00000-of-00001" && \
    wget "https://github.com/wpilibsuite/DetectCoral/releases/download/v2/model.ckpt.index" && \
    wget "https://github.com/wpilibsuite/DetectCoral/releases/download/v2/model.ckpt.meta"

COPY scripts /tensorflow/models/research/
WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python", "train.py", "--dir"]