import argparse
from edgetpu.detection.engine import DetectionEngine
from PIL import Image
from PIL import ImageDraw
import cscore
from networktables import NetworkTablesInstance
import numpy as np
from time import time
import json
import tarfile


class PBTXTParser:
    def __init__(self, path):
        self.path = path
        self.file = None

    def parse(self):
        with open(self.path, 'r') as f:
            self.file = ''.join([i.replace('item', '') for i in f.readlines()])
            blocks = []
            obj = ""
            for i in self.file:
                if i == '}':
                    obj += i
                    blocks.append(obj)
                    obj = ""
                else:
                    obj += i
            self.file = blocks
            label_map = {}
            for obj in self.file:
                obj = [i for i in obj.split('\n') if i]
                i = int(obj[1].split()[1])
                name = obj[2].split()[1][1:-1]
                label_map.update({i: name})
            self.file = label_map

    def get_labels(self):
        return self.file


def log_object(obj, labels):
    print('-----------------------------------------')
    if labels:
        print(labels[obj.label_id])
    print('score = ', obj.score)
    box = obj.bounding_box.flatten().tolist()
    x1, y1, x2, y2 = box
    print('box = ', box)


"""
Math stuff for later
0.0017*w**2-0.3868*w+26.252
Distance =(((x1 + x2)/2-160)/((x1 - x2)/19.5))/12
Angle = (9093.75/((x2-x1)**math.log(54/37.41/29)))/12
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', help='Path of the detection model.', default="model.tflite")
    parser.add_argument('--team', help="Your FIRST team number", type=int, default=190)
    parser.add_argument('--logging', help="Flag for logs", type=bool, default=True)
    args = parser.parse_args()

    WIDTH, HEIGHT = 320, 240

    if args.logging:
        print("Initializing ML engine")

    model = tarfile.open("model.tar.gz")
    model.extractall()
    parser = PBTXTParser("map.pbtxt")
    parser.parse()
    # Initialize engine.
    engine = DetectionEngine(args.model)
    labels = parser.get_labels()
    """
    if args.logging:
        print("Connecting to Network Tables")
    ntinst = NetworkTablesInstance.getDefault()
    ntinst.startClientTeam(args.team)
    # integer, number of detected boxes at this curent moment
    nb_boxes_entry = ntinst.getTable("ML").getEntry("nb_boxes")
    # double array, list of boxes in the following format:
    # [topleftx1, toplefty1, bottomrightx1, bottomrighty1, topleftx2, toplefty2, ... ]
    # there are four numbers per box.
    boxes_entry = ntinst.getTable("ML").getEntry("boxes")
    # string array, list of class names of each box
    boxes_names_entry = ntinst.getTable("ML").getEntry("boxes_names")

    if args.logging:
        print("Starting camera server")
    """
    cs = cscore.CameraServer.getInstance()
    camera = cs.startAutomaticCapture()
    camera.setResolution(WIDTH, HEIGHT)
    cvSink = cs.getVideo()
    img = np.zeros(shape=(HEIGHT, WIDTH, 3), dtype=np.uint8)

    output = cs.putVideo("MLOut", WIDTH, HEIGHT)

    start = time()

    if args.logging:
        print("Starting mainloop")
    # Open image.
    while True:
        t, img = cvSink.grabFrame(img)
        frame = Image.fromarray(img)
        draw = ImageDraw.Draw(frame)

        # Run inference.
        ans = engine.detect_with_image(frame, threshold=0.5, keep_aspect_ratio=True, relative_coord=False, top_k=10)

        # nb_boxes_entry.setNumber(len(ans))
        boxes = []
        names = []
        # Display result.
        if ans:
            for obj in ans:
                if args.logging:
                    log_object(obj, labels)
                if labels:
                    names.append(labels[obj.label_id])
                box = obj.bounding_box.flatten().tolist()
                boxes.extend(box)
                # Draw a rectangle.
                draw.rectangle(box, outline='green')
                output.putFrame(np.array(frame))

        else:
            if args.logging:
                print('No object detected!')
            output.putFrame(img)
        # boxes_entry.setDoubleArray(boxes)
        # boxes_names_entry.setStringArray(names)
        if args.logging:
            print("FPS:", 1 / (time() - start))

        start = time()


if __name__ == '__main__':
    main()
