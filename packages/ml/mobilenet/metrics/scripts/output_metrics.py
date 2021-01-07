import subprocess, argparse, os
import log_parser
import parse_hyperparams


def main(directory):
    # tensorboard runs at http://localhost:6006
    subprocess.Popen(['tensorboard', '--logdir', os.path.join(directory,'train')])
    data = parse_hyperparams.parse(os.path.join(directory,"hyperparameters.json"))
    TRAIN_STEPS = data["epochs"]
    parser = log_parser.EvalJSONifier(directory, TRAIN_STEPS)
    parser.start()


if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument('--dir', type=str, help='Path of the folder to train in.')
    DIRECTORY = parser.parse_args().dir
    
    main(DIRECTORY)
