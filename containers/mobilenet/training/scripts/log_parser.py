from __future__ import print_function
import glob
import threading
import time
import json
from collections import OrderedDict

from tensorboard.backend.event_processing.event_accumulator import EventAccumulator


class EvalJSONifier(threading.Thread):
    """
    Thread for converting evaluation binaries to json
    """

    def __init__(self, last_epoch):
        """
        Initializes the thread
        Args:
            last_epoch: the epoch to kill the thread on
        """
        threading.Thread.__init__(self)
        self.daemon = True
        self.tf_size_guidance = {
            'compressedHistograms': 10,
            'images': 1,
            'scalars': 1000,
            'histograms': 1
        }
        self.log_path = "/opt/ml/model/train/eval_0/*"
        self.last_epoch = last_epoch
        self.precision = OrderedDict()

    def run(self):
        """
        Runs when EvalJSONifier().start() is called. Every 10 seconds, checks to see if JSON is updated.
        Returns:
            None
        """
        accumulator = None
        log = []
        step = -1
        while step != self.last_epoch:
            if len(log) != 0 and accumulator is None:
                accumulator = EventAccumulator(log[0], self.tf_size_guidance)
            if accumulator is not None:
                accumulator.Reload()
                mAP = accumulator.Scalars("DetectionBoxes_Precision/mAP")
                step, value = int(mAP[-1].step), float(mAP[-1].value)
                if step not in self.precision.keys():
                    self.precision[step] = value
                    with open("/opt/ml/model/metrics.json", 'w') as file:
                        json.dump({"precision": self.precision}, file)
            else:
                log = glob.glob(self.log_path)
            time.sleep(10)
