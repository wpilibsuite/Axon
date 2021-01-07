from __future__ import print_function
import subprocess
import tarfile
import test
from os.path import join
import argparse

import parse_hyperparams


def main(directory):
    model_dir = directory
    unoptimized = "/tensorflow/models/research/learn/models/output_tflite_graph.tflite"
    second_export = "output_tflite_graph_edgetpu.tflite"
    data = parse_hyperparams.parse(join(model_dir,"exportparameters.json"))

    output_name = data["name"]
    config_path = data["config"]
    checkpoint_path = data["checkpoint"]
    export_dir = join(model_dir, data["export-dir"])
    subprocess.check_call("./convert_checkpoint_to_edgetpu_tflite.sh --config_path %s --ckpt_path %s" % (config_path, checkpoint_path), shell=True)
    subprocess.check_call("edgetpu_compiler %s -o %s" % (unoptimized, model_dir), shell=True)
    #
    with tarfile.open(join(export_dir, output_name + ".tar.gz"), 'w:gz') as model:
        model.add(join(model_dir, second_export), arcname="model.tflite")
        model.add(join(model_dir,"map.pbtxt"), arcname="map.pbtxt")
        model.add(unoptimized, arcname="unoptimized.tflite")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--dir', type=str, help='Path of the folder to export in.')
    DIRECTORY = parser.parse_args().dir

    main(DIRECTORY)
