ARG BASE_VERSION=edge
FROM wpilib/axon-base:${BASE_VERSION}

COPY scripts /tensorflow/models/research/
WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python", "output_metrics.py", "--dir"]