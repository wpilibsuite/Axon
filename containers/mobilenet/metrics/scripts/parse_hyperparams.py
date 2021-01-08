import json


def parse(filename):
    """
    Creates a json object from a file
    Args:
        filename: the path to the file

    Returns:
        a json object
    """
    with open(filename, 'r') as f:
        data = json.load(f)
        return data
