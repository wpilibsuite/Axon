import json
import glob
import pandas as pd


def get_labels(operation_mode, annotation_file):
    # param: operation_mode [Int] 1 for normal 0 for not normal
    if operation_mode: # If it is a tar, 1 is input
        f = None
        for file in glob.glob("/home/**/**/meta.json"):
            f = file
        with open(f, 'r') as meta:
            return [label["title"] for label in json.load(meta)["classes"]]

    if not operation_mode:
        print('Operation mode ZIP')
        annotation_df = pd.read_csv(annotation_file)
        print(annotation_df['class'].unique())
        return annotation_df['class'].unique().tolist()




def main(output_pbtxt, operation_mode, file_path):
    if operation_mode:
        print("output_pbtxt in parse_meta.py: " + output_pbtxt)
        with open(output_pbtxt, 'w+') as pbtxt:
            print(pbtxt)
            for i, label in enumerate(get_labels(operation_mode, None)):
                pbtxt.write("item {\n\nid: %s\n\nname: \"%s\"\n}\n\n" % (i + 1, label))

    if not operation_mode:
        print("output_pbtxt in parse_meta.py op 0: " + output_pbtxt)
        with open(output_pbtxt, 'w+') as pbtxt:
            print(pbtxt)
            for i, label in enumerate(get_labels(operation_mode, file_path)):
                pbtxt.write("item {\n\nid: %s\n\nname: \"%s\"\n}\n\n" % (i + 1, label))


