import json


def parse(filename):
    with open(filename, 'r') as f:
        data = json.load(f)
        return data
