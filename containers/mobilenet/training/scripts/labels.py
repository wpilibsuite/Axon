import os
def get_total(directory):
    a = ""
    with open(os.path.join(directory, "map.pbtxt"), 'r') as f:
        for i in f.readlines():
            a += i
    return a.count("id")
