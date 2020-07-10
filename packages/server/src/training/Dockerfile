FROM tensorflow/tensorflow:1.12.0-rc2-devel

ARG DEBIAN_FRONTEND=noninteractive

RUN mkdir -p /tensorflow/models/research/ && \
    mkdir -p /opt/ml/model/

COPY pretend_train.py /tensorflow/models/research/

WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python"]
CMD ["./pretend_train.py"]