import sys, os, shutil, tarfile, argparse, zipfile
import json_to_csv, generate_tfrecord, parse_meta, parse_hyperparams
from os.path import join, splitext, split


def main(dataset_paths, percent_eval, directory):
    ROOT_PATH, PATH_EXT = os.path.splitext(dataset_paths[-1])
    DATASET_NAME = ROOT_PATH.split('/')[-1]

    OUTPUT_PATH = directory
    EXTRACT_PATH = "/home"
    TMP_PATH = "/home/tmp"

    # Placeholder for enum, here 1 is tar, 0 is ZIP
    NORMAL_MODE = 1 # Assume this is a tar

    if not os.path.exists(TMP_PATH):
        os.makedirs(TMP_PATH)
    if not os.path.exists(EXTRACT_PATH):
        os.makedirs(EXTRACT_PATH)

    if PATH_EXT == '.zip':
        print('.zip file extension found, interpreting as tensorflow object detection csv zip')
        NORMAL_MODE = 0 # Not a tar file

    if NORMAL_MODE: # Perform working tar code
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

            generate_tfrecord.main(TMP_PATH + "/train.csv", join(OUTPUT_PATH, 'train.record'), NORMAL_MODE, "/home/")
            generate_tfrecord.main(TMP_PATH + "/eval.csv", join(OUTPUT_PATH, 'eval.record'), NORMAL_MODE, "/home/")

            parse_meta.main(join(OUTPUT_PATH, 'map.pbtxt'), NORMAL_MODE, TMP_PATH + "/eval.csv")

            print(".\nRecords generated")
        except ValueError:
            print("The datasets provided do not have the same class labels. Please make sure that labels are spelt the same in both datasets, or label the same objects for both datasets.")

    if not NORMAL_MODE:
        print('treating as zip of tf obj detect')
        #Psuedocode

        #Unzip the zip in correct dir
        with zipfile.ZipFile(dataset_paths[-1], 'r') as zip_file: # Unzip the file (Assuming 1 zip at this time)
            zip_file.extractall(EXTRACT_PATH)


        #Generate the records
        try:
            print(EXTRACT_PATH + "/" + DATASET_NAME + "/test/_annotations.csv")
            generate_tfrecord.main(EXTRACT_PATH + "/" + DATASET_NAME + "/test/_annotations.csv", join(OUTPUT_PATH, 'test.record'), NORMAL_MODE, EXTRACT_PATH + "/" + DATASET_NAME + "/test/")
            generate_tfrecord.main(EXTRACT_PATH + "/" + DATASET_NAME + "/train/_annotations.csv", join(OUTPUT_PATH, 'eval.record'), NORMAL_MODE, EXTRACT_PATH + "/" + DATASET_NAME + "/train/")

            print('main records generated')
            parse_meta.main(join(OUTPUT_PATH, 'map.pbtxt'), NORMAL_MODE, EXTRACT_PATH + "/" + DATASET_NAME + "/train/_annotations.csv") # Edge case of missing label in one csv

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
