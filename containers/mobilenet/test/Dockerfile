FROM wpilib/axon-test-base

RUN mkdir -p /tensorflow/models/research/
COPY scripts /tensorflow/models/research/
WORKDIR /tensorflow/models/research/
ENTRYPOINT ["python3", "-u", "test.py", "--dir"]
