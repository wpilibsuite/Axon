import cv2
import numpy as np
from time import time
import tensorflow as tf
import parse_hyperparams
from pbtxt import PBTXTParser
import tarfile
import argparse
from os.path import join

from mjpegstreamer import MJPEGServer


def test_video(directory, video_path, interpreter, labels):
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    frames = 0
    height = input_details[0]['shape'][1]
    width = input_details[0]['shape'][2]

    floating_model = (input_details[0]['dtype'] == np.float32)

    input_mean = 127.5
    input_std = 127.5

    video = cv2.VideoCapture(video_path)
    imW = video.get(cv2.CAP_PROP_FRAME_WIDTH)
    imH = video.get(cv2.CAP_PROP_FRAME_HEIGHT)
    fps = video.get(cv2.CAP_PROP_FPS)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(join(directory, "inference.mp4"), fourcc, fps, (int(imW), int(imH)))

    server = MJPEGServer(imW, imH)
    server.start()

    print("MJPEG server started")
    while video.isOpened():
        start = time()
        # Acquire frame and resize to expected shape [1xHxWx3]
        ret, frame = video.read()
        if not ret:
            print('Reached the end of the video!')
            break
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_resized = cv2.resize(frame_rgb, (width, height))
        input_data = frame_resized.reshape([1, width, height, 3])

        # Normalize pixel values if using a floating model (i.e. if model is non-quantized)
        if floating_model:
            input_data = (np.float32(input_data) - input_mean) / input_std

        # Perform the actual detection by running the model with the image as input
        interpreter.set_tensor(input_details[0]['index'], input_data)
        interpreter.invoke()

        # Retrieve detection results
        boxes = interpreter.get_tensor(output_details[0]['index'])[0]  # Bounding box coordinates of detected objects
        classes = interpreter.get_tensor(output_details[1]['index'])[0].astype(np.int64)  # Class index of detected objects
        scores = interpreter.get_tensor(output_details[2]['index'])[0]  # Confidence of detected objects

        # Loop over all detections and draw detection box if confidence is above minimum threshold
        for i in range(len(scores)):
            if scores[i] > .5 and scores[i] <= 1.0:

                # Get bounding box coordinates and draw box
                # Interpreter can return coordinates that are outside of image dimensions, need to force them to be within image using max() and min()
                ymin = int(max(1, (boxes[i][0] * imH)))
                xmin = int(max(1, (boxes[i][1] * imW)))
                ymax = int(min(imH, (boxes[i][2] * imH)))
                xmax = int(min(imW, (boxes[i][3] * imW)))
                cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (10, 255, 0), 4)

                # Draw label
                # Look up object name from "labels" array using class index
                print(int(classes[i]))
                object_name = labels[int(classes[i])]
                label = '%s: %d%%' % (object_name, int(scores[i] * 100))  # Example: 'person: 72%'
                label_size, base = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)  # Get font size
                label_ymin = max(ymin, label_size[1] + 10)  # Make sure not to draw label too close to top of window
                cv2.rectangle(frame, (xmin, label_ymin - label_size[1] - 10),
                              (xmin + label_size[0], label_ymin + base - 10),
                              (255, 255, 255), cv2.FILLED)  # Draw white box to put label text in
                # Draw label text
                cv2.putText(frame, label, (xmin, label_ymin - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
            else:
                break

        # All the results have been drawn on the frame, so it's time to display it.
        if frames % 1000 == 0:
            print("Completed", frames, "frames. FPS:", (1 / (time() - start)))
        frames += 1
        # print("frame sent")
        out.write(frame)
        server.set_image(frame)
    video.release()


def main(directory):
    model_dir = directory
    data = parse_hyperparams.parse(join(model_dir, "testparameters.json"))
    video_path = data["test-video"]
    model_path = data["model-tar"]
    tar = tarfile.open(model_path)
    tar.extractall("/tensorflow/models/research/")

    parser = PBTXTParser(join(model_dir, "map.pbtxt"))
    parser.parse()
    labels = parser.file

    interpreter = tf.lite.Interpreter(
        model_path="/tensorflow/models/research/unoptimized.tflite")
    interpreter.allocate_tensors()
    test_video(directory, video_path, interpreter, labels)

    print("Done.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--dir', type=str, help='Path of the folder to export in.')
    DIRECTORY = parser.parse_args().dir

    main(DIRECTORY)
