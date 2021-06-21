import json
import os
import sys
from glob import glob
from os.path import basename
from shutil import copyfile, rmtree
from zipfile import ZipFile

import cv2
import pandas
from download import download_dataset


class OpenImagesDownloader:
    """
    Class for converting OpenImages format into an Axon usable format (TFRecords)
    """

    def __init__(self, data_json, create_id):
        """
        Set up attributes, parse JSON
        :param data_json:
        """
        self.create_id = create_id
        try:
            assert os.path.isfile(data_json)
        except AssertionError:
            print("Not Found:", data_json)
            sys.exit(1)
        with open(data_json) as file:
            self.data = json.load(file)
        # will error if not in Title Case
        self.labels = [i.title() for i in self.data["labels"]]
        self.title = "_".join([i.replace(" ","") for i in self.labels])
        print(self.labels)
        assert type(self.labels) == list
        self.limit = self.data["limit"]
        assert type(self.limit) == int
        print("Getting dataset, size: {}, contents: {}".format(self.limit, self.labels))
        self.directory = "./data/create/" + create_id + "/train"
        self.label_map = {}
        self.image_data = {}
        self.csv = []
        self.images = glob(self.directory + "/*/images/*.jpg")

    def download(self):
        """
        API call to download OpenImages slice
        :return: None
        """
        download_dataset(dest_dir=self.directory, meta_dir=self.directory, class_labels=self.labels,
                         annotation_format="pascal", exclusions_path=None, limit=self.limit)

    def parse_line(self, key, label, height, width, box):
        """
        Add a line to the csv
        :param key:
        :param label:
        :param height:
        :param width:
        :param box:
        :return:
        """
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
        print("Parsing huge .csv. Give me a minute.")
        self.images = glob(self.directory + "/*/images/*.jpg")
        with open(os.path.join(self.directory, "class-descriptions-boxable.csv")) as file:
            for row in file.readlines():
                row = row.rstrip().split(',')
                self.label_map.update({row[0]: row[1]})

        try:
            os.mkdir("data/create/" + self.create_id + "/tar")
        except FileExistsError:
            pass
        try:
            os.mkdir("data/create/" + self.create_id + "/tar/train")
        except FileExistsError:
            pass
        try:
            os.mkdir("data/create/" + self.create_id + "/tar/test")
        except FileExistsError:
            pass
        for image_path in self.images:
            image = cv2.imread(image_path)
            height, width, channels = image.shape
            file_id = image_path.split("/")[-1].rstrip(".jpg")
            copyfile(image_path, "data/create/" + self.create_id + "/tar/" + image_path.split("/")[-1])
            self.image_data.update({file_id: {"height": height, "width": width}})

        all_labels_df = pandas.read_csv(os.path.join(self.directory, "train-annotations-bbox.csv"))
        all_labels_df.set_index("ImageID", inplace=True)

        labels = [i.lower() for i in self.labels]
        for key in self.image_data.keys():
            entry = all_labels_df.loc[key]
            try:
                height = self.image_data[key]["height"]
                width = self.image_data[key]["width"]
                if type(entry) == pandas.DataFrame:
                    for row in entry.iterrows():
                        box = {i.lower(): row[1][i] for i in ["XMin", "XMax", "YMin", "YMax"]}
                        label = self.label_map[row[1]["LabelName"]].lower()
                        if label in labels:
                            self.parse_line(key + '.jpg', label, height, width, box)
                else:
                    box = {i.lower(): entry.get(i) for i in ["XMin", "XMax", "YMin", "YMax"]}
                    label = self.label_map[entry.get("LabelName")].lower()
                    if label in labels:
                        self.parse_line(key + '.jpg', label, height, width, box)
            except KeyError:
                pass

        print("creating subfolders")
        self.create_subfolders("train")
        self.create_subfolders("test")

    def create_subfolders(self, name):
        with open("data/create/" + self.create_id + "/tar/{}/_annotations.csv".format(name), 'w+') as csv:
            csv.write("filename,width,height,class,xmin,ymin,xmax,ymax\n")
            r = range(len(self.csv))[:int(len(self.csv) * .7)] if name == "train" else range(len(self.csv))[
                                                                                       int(len(self.csv) * .7):]
            for i in r:
                row = self.csv[i]
                csv.write("{},{},{},{},{},{},{},{}\n".format(row["filename"], row["width"], row["height"], row["class"],
                                                             row["xmin"], row["ymin"], row["xmax"], row["ymax"]))
                copyfile("data/create/" + self.create_id + "/tar/" + row["filename"],
                         "data/create/" + self.create_id + "/tar/" + name + '/' + row["filename"])

    def make_zip(self):
        with ZipFile("data/create/{}/dataset.zip".format(sys.argv[1]), 'w') as zipFile:
            for directory in "train test".split():
                for folderName, subfolders, filenames in os.walk("data/create/" + self.create_id + "/tar/" + directory):
                    for filename in filenames:
                        # create complete filepath of file in directory
                        file = os.path.join(directory, filename)
                        # Add file to zip
                        zipFile.write("data/create/" + self.create_id + "/tar/" + directory + '/' + filename, file)

    def clean(self):
        rmtree("data/create/" + self.create_id + "/train")
        rmtree("data/create/" + self.create_id + "/tar")
        print("Cleanup finished")


if __name__ == "__main__":
    print("Python initialized")
    data = "data/create/{}/data.json".format(sys.argv[1])
    downloader = OpenImagesDownloader(data, sys.argv[1])
    downloader.download()
    downloader.create_csv()
    print("Making archive")
    downloader.make_zip()
    downloader.clean()
    print("Clean up done.")
