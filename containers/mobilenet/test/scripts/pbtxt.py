class PBTXTParser:
    def __init__(self, path):
        self.path = path
        self.label_map = []

    def parse(self):
        with open(self.path, 'r') as f:
            file = [i.replace("\n", '') for i in f.readlines()]
            for line in file:
                if line.startswith("name"):
                    name = line.split(": ")[1].strip('"').rstrip('"')
                    self.label_map.append(name)

    def get_labels(self):
        return self.label_map
