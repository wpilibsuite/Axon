import json
import glob


def get_labels():
    f = None
    for file in glob.glob("/home/**/**/meta.json"):
        f = file
    with open(f, 'r') as meta:
        return [label["title"] for label in json.load(meta)["classes"]]


def main(output_pbtxt):
    with open(output_pbtxt, 'w+') as pbtxt:
        for i, label in enumerate(get_labels()):
            pbtxt.write("item {\n\nid: %s\n\nname: \"%s\"\n}\n\n" % (i + 1, label))
