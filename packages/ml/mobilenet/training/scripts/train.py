#!/usr/bin/env python2.7
import os
import shutil
import argparse

import labels
import modularized_model_main
import parse_hyperparams
import sed


def main(directory):
    """
    Trains a mobilenetv2 using transfer learning, as described by `hyperparameters.json`. Takes a full path to the directory of a mounted volume to work in.
    Checkpoints other than the default should be mounted in the given directory. `map.pbtxt` and the .record(s) should be mounted.
    Returns:
        None
    """

    # hyperparameters
    TRAIN_PATH = os.path.join(directory, 'train')
    data = parse_hyperparams.parse(os.path.join(directory, "hyperparameters.json"))
    TRAIN_STEPS = data["epochs"]
    BATCH_SIZE = data["batch-size"]
    EVAL_FREQ = data["eval-frequency"]
    CHECKPOINT = data["checkpoint"]

    shutil.rmtree(TRAIN_PATH, ignore_errors=True)

    if not os.path.exists(TRAIN_PATH):
        os.mkdir(TRAIN_PATH)

    # transfer learning with checkpoints other than default checkpoint
    if CHECKPOINT != "default":
        sed.replace_words(
            '/tensorflow/models/research/start_ckpt/model.ckpt',
            os.path.join(directory, CHECKPOINT), "pipeline.config")

    # write the project directory to pipeline config
    sed.replace_words("/opt/ml/model", directory, "pipeline.config")


    nb_classes = labels.get_total(directory)
    sed.replace_words('NUM_CLASSES', str(nb_classes), "pipeline.config")
    sed.replace_words('BATCH_SIZE_PARAM', str(BATCH_SIZE), "pipeline.config")
    shutil.copy('pipeline.config', os.path.join(directory, 'pipeline.config'))

    # call the API for retraining
    modularized_model_main.main(
        pipeline_config_path='pipeline.config',
        model_dir=TRAIN_PATH,
        num_train_steps=TRAIN_STEPS,
        eval_period=EVAL_FREQ)


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument('--dir', type=str, help='Path of the folder to train in.')
    DIRECTORY = parser.parse_args().dir

    main(DIRECTORY)
