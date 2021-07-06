import argparse
import collections
import os
import tarfile
from time import time

import cv2
import numpy as np
import tflite_runtime.interpreter as tflite

import parse_hyperparams
from mjpegstreamer import MJPEGServer
from pbtxt import PBTXTParser


class BBox(collections.namedtuple('BBox', ['xmin', 'ymin', 'xmax', 'ymax'])):
    """Bounding box.
    Represents a rectangle which sides are either vertical or horizontal, parallel
    to the x or y axis.
    """
    __slots__ = ()

    def scale(self, sx, sy):
        """Returns scaled bounding box."""
        return BBox(xmin=sx * self.xmin,
                    ymin=sy * self.ymin,
                    xmax=sx * self.xmax,
                    ymax=sy * self.ymax)


class Tester:
    def __init__(self, model_dir):
        data = parse_hyperparams.parse(model_dir + "/testparameters.json")
        output_vid_path = data["output-vid-path"]
        self.video_path = data["test-video"]
        self.test_dir = data["test-dir"]
        try:
            os.mkdir(self.test_dir)
        except:
            pass
        model_path = data["model-tar"]
        tar = tarfile.open(model_path)
        tar.extractall("/tensorflow/models/research/")

        self.interpreter = tflite.Interpreter(model_path="/tensorflow/models/research/unoptimized.tflite")

        parser = PBTXTParser("/tensorflow/models/research/map.pbtxt")
        parser.parse()
        self.labels = parser.get_labels()

        self.input_video = cv2.VideoCapture(self.video_path)
        width = self.input_video.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = self.input_video.get(cv2.CAP_PROP_FRAME_HEIGHT)
        fps = self.input_video.get(cv2.CAP_PROP_FPS)
        self.total_frames = self.input_video.get(cv2.CAP_PROP_FRAME_COUNT)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        self.output_video = cv2.VideoWriter(output_vid_path, fourcc, fps, (int(width), int(height)))
        self.server = MJPEGServer(300, 300)

        self.frames = 0

    def run(self):
        self.server.start()
        print("MJPEG server started")

        self.interpreter.allocate_tensors()

        while self.input_video.isOpened():
            start = time()
            # Acquire frame and resize to expected shape [1xHxWx3]
            ret, frame_cv2 = self.input_video.read()
            if not ret:
                break

            # input
            scale = self.set_input(frame_cv2)

            # run inference
            self.interpreter.invoke()

            # output
            boxes, class_ids, scores, x_scale, y_scale = self.get_output(scale)
            for i in range(len(boxes)):
                if scores[i] > .5:

                    class_id = class_ids[i]
                    if np.isnan(class_id):
                        continue

                    class_id = int(class_id)
                    if class_id not in range(len(self.labels)):
                        continue

                    frame_cv2 = self.label_frame(frame_cv2, self.labels[class_id], boxes[i], scores[i], x_scale,
                                                 y_scale)

            self.output_video.write(frame_cv2)
            self.server.set_image(frame_cv2)
            if self.frames % 250 == 0:
                print("Completed", self.frames, "frames. FPS:", (1 / (time() - start)))
                with open(self.test_dir + "/progress.json", 'w+') as progress:
                    progress.write('{"percentDone": %f}' % (self.frames / self.total_frames))
            self.frames += 1

        self.input_video.release()
        with open(self.test_dir + "/progress.json", 'w+') as progress:
            progress.write('{"percentDone": 1.0}')

    def label_frame(self, frame, object_name, box, score, x_scale, y_scale):
        ymin, xmin, ymax, xmax = box
        score = float(score)
        bbox = BBox(xmin=xmin,
                    ymin=ymin,
                    xmax=xmax,
                    ymax=ymax).scale(x_scale, y_scale)
        height, width, channels = frame.shape
        # check bbox validity
        if not 0 <= ymin < ymax <= height or not 0 <= xmin < xmax <= width:
            return frame

        ymin, xmin, ymax, xmax = int(bbox.ymin), int(bbox.xmin), int(bbox.ymax), int(bbox.xmax)

        cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (10, 255, 0), 4)

        # Draw label
        # Look up object name from "labels" array using class index
        label = '%s: %d%%' % (object_name, score * 100)  # Example: 'person: 72%'
        label_size, base = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)  # Get font size
        label_ymin = max(ymin, label_size[1] + 10)  # Make sure not to draw label too close to top of window
        cv2.rectangle(frame, (xmin, label_ymin - label_size[1] - 10), (xmin + label_size[0], label_ymin + base - 10),
                      (255, 255, 255), cv2.FILLED)
        # Draw label text
        cv2.putText(frame, label, (xmin, label_ymin - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        return frame

    def input_size(self):
        """Returns input image size as (width, height) tuple."""
        _, height, width, _ = self.interpreter.get_input_details()[0]['shape']
        return width, height

    def set_input(self, frame):
        """Copies a resized and properly zero-padded image to the input tensor.
        Args:
          frame: image
        Returns:
          Actual resize ratio, which should be passed to `get_output` function.
        """
        width, height = self.input_size()
        h, w, _ = frame.shape
        new_img = np.reshape(cv2.resize(frame, (300, 300)), (1, 300, 300, 3))
        self.interpreter.set_tensor(self.interpreter.get_input_details()[0]['index'], np.copy(new_img))
        return width / w, height / h

    def output_tensor(self, i):
        """Returns output tensor view."""
        tensor = self.interpreter.get_tensor(self.interpreter.get_output_details()[i]['index'])
        return np.squeeze(tensor)

    def get_output(self, scale):
        boxes = self.output_tensor(0)
        class_ids = self.output_tensor(1)
        scores = self.output_tensor(2)

        width, height = self.input_size()
        image_scale_x, image_scale_y = scale
        x_scale, y_scale = width / image_scale_x, height / image_scale_y
        return boxes, class_ids, scores, x_scale, y_scale


if __name__ == "__main__":
    argparser = argparse.ArgumentParser()
    argparser.add_argument('--dir', type=str, help='Path of the folder to export in.')
    DIRECTORY = argparser.parse_args().dir
    tester = Tester(DIRECTORY)
    tester.run()
