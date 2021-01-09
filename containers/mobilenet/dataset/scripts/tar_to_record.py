import sys, os, shutil, tarfile, argparse
import json_to_csv, generate_tfrecord, parse_meta, parse_hyperparams
from os.path import join


def main(dataset_paths, percent_eval, directory):

    OUTPUT_PATH = directory
    EXTRACT_PATH = "/home"
    TMP_PATH = "/home/tmp"

    if not os.path.exists(TMP_PATH):
        os.makedirs(TMP_PATH)
    if not os.path.exists(EXTRACT_PATH):
        os.makedirs(EXTRACT_PATH)

    try:
        for i in dataset_paths:
            shutil.copy(i, join(EXTRACT_PATH, 'data.tar'))
    except:
        print('unable to retrieve a dataset tar file:')
        sys.exit(1)
    for dataset in dataset_paths:
        with tarfile.open(dataset) as tar_file:
            tar_file.extractall(join(EXTRACT_PATH, 'out'))

    if percent_eval > 100 or percent_eval < 0:
        percent_eval = 30
    json_to_csv.main(percent_eval)
    try:

        generate_tfrecord.main(TMP_PATH + "/train.csv", join(OUTPUT_PATH, 'train.record'))
        generate_tfrecord.main(TMP_PATH + "/eval.csv", join(OUTPUT_PATH, 'eval.record'))

        parse_meta.main(join(OUTPUT_PATH, 'map.pbtxt'))

        print(".\nRecords generated")
    except ValueError:
        print("The datasets provided do not have the same class labels. Please make sure that labels are spelt the same in both datasets, or label the same objects for both datasets.")


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument('--dir', type=str, help='Path of the folder to train in.')
    DIRECTORY = parser.parse_args().dir
    
    data = parse_hyperparams.parse(os.path.join(DIRECTORY,"hyperparameters.json"))
    DATASET_PATHS = data["dataset-path"]
    PERCENT_EVAL = data["percent-eval"]
    main(DATASET_PATHS, PERCENT_EVAL, DIRECTORY)
