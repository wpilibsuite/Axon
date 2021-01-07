FROM wpilib/axon-base:latest

COPY scripts /tensorflow/models/research/
WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python", "output_metrics.py", "--dir"]