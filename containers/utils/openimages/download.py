import json
import sys
from glob import glob
import os
from shutil import copyfile
import cv2
import pandas
from openimages.download import download_dataset


class OpenImagesDownloader:
    def __init__(self, data_json):
        assert os.path.isfile(data_json)
        with open(data_json) as file:
            self.data = json.load(file)
        self.labels = self.data["labels"]
        assert type(self.labels) == list
        self.limit = self.data["limit"]
        assert type(self.limit) == int
        print("Getting dataset, size: {}, contents: {}".format(self.limit, self.labels))
        self.directory = "./data/train"
        self.label_map = {}
        self.image_data = {}
        self.csv = []
        self.images = glob(self.directory + "/*/images/*.jpg")

    def download(self):
        download_dataset(dest_dir=self.directory, csv_dir=self.directory, class_labels=self.labels,
                         annotation_format="pascal", exclusions_path=None, limit=self.limit)

    def parse_line(self, key, label, height, width, box):
        self.csv.append({
            "filename": key,
            "height": height,
            "width": width,
            "class": label,
            "xmin": int(box["xmin"] * width),
            "xmax": int(box["xmax"] * width),
            "ymin": int(box["ymin"] * height),
            "ymax": int(box["ymax"] * height)
        })

    def create_csv(self):
        self.images = glob(self.directory + "/*/images/*.jpg")
        with open(os.path.join(self.directory, "class-descriptions-boxable.csv")) as file:
            for row in file.readlines():
                row = row.rstrip().split(',')
                self.label_map.update({row[0]: row[1]})

        try:
            os.mkdir("tar")
        except FileExistsError:
            pass
        try:
            os.mkdir("tar/train")
        except FileExistsError:
            pass
        try:
            os.mkdir("tar/test")
        except FileExistsError:
            pass
        try:
            os.mkdir("out")
        except FileExistsError:
            pass
        for image_path in self.images:
            image = cv2.imread(image_path)
            height, width, channels = image.shape
            file_id = image_path.split("/")[-1].rstrip(".jpg")
            copyfile(image_path, "tar/" + image_path.split("/")[-1])
            self.image_data.update({file_id: {"height": height, "width": width}})

        all_labels_df = pandas.read_csv(os.path.join(self.directory, "train-annotations-bbox.csv"))
        all_labels_df.set_index("ImageID", inplace=True)

        for key in self.image_data.keys():
            entry = all_labels_df.loc[key]
            height = self.image_data[key]["height"]
            width = self.image_data[key]["width"]
            if type(entry) == pandas.DataFrame:
                for row in entry.iterrows():
                    box = {i.lower(): row[1][i] for i in ["XMin", "XMax", "YMin", "YMax"]}
                    label = self.label_map[row[1]["LabelName"]]
                    self.parse_line(key+'.jpg', label, height, width, box)
            else:
                box = {i.lower(): entry.get(i) for i in ["XMin", "XMax", "YMin", "YMax"]}
                label = self.label_map[entry.get("LabelName")]
                self.parse_line(key+'.jpg', label, height, width, box)

        self.create_subfolders("train")
        self.create_subfolders("test")

    def create_subfolders(self, name):
        with open("tar/{}/_annotations.csv".format(name), 'w+') as csv:
            csv.write("filename,width,height,class,xmin,ymin,xmax,ymax\n")
            r = range(len(self.csv))[:int(len(self.csv) * .7)] if name == "train" else range(len(self.csv))[
                                                                                       int(len(self.csv) * .7):]
            for i in r:
                row = self.csv[i]
                csv.write("{},{},{},{},{},{},{},{}\n".format(row["filename"], row["width"], row["height"], row["class"],
                                                             row["xmin"], row["ymin"], row["xmax"], row["ymax"]))
                copyfile("tar/" + row["filename"], "tar/" + name + '/' + row["filename"] + ".jpg")
                self.label_frame("tar/" + row["filename"], row["class"], row["xmin"], row["xmax"], row["ymin"],
                                 row["ymax"])

    def label_frame(self, filename, label, xmin, xmax, ymin, ymax):
        score = float(1)
        print(filename, label)
        frame = cv2.imread(filename)

        cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (10, 255, 0), 4)

        # Draw label
        # Look up object name from "labels" array using class index
        label = '%s: %d%%' % (label, score * 100)  # Example: 'person: 72%'
        label_size, base = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)  # Get font size
        label_ymin = max(ymin, label_size[1] + 10)  # Make sure not to draw label too close to top of window
        cv2.rectangle(frame, (xmin, label_ymin - label_size[1] - 10), (xmin + label_size[0], label_ymin + base - 10),
                      (255, 255, 255), cv2.FILLED)
        # Draw label text
        cv2.putText(frame, label, (xmin, label_ymin - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
        cv2.imwrite("out/" + filename.split('/')[-1], frame)


if __name__ == "__main__":
    data_json = sys.argv[1]
    downloader = OpenImagesDownloader(data_json)
    # downloader.download()
    downloader.create_csv()
