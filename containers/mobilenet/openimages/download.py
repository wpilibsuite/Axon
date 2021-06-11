import json
import sys
from glob import glob
import os
from os.path import basename
from shutil import copyfile
import cv2
import pandas
from openimages.download import download_dataset
from zipfile import ZipFile


class OpenImagesDownloader:
    """
    Class for converting OpenImages format into an Axon usable format (TFRecords)
    """

    def __init__(self, data_json):
        """
        Set up attributes, parse JSON
        :param data_json:
        """
        try:
            assert os.path.isfile(data_json)
        except AssertionError:
            print("Not Found:", data_json)
            sys.exit(1)
        with open(data_json) as file:
            self.data = json.load(file)
        self.labels = self.data["labels"]
        print(self.labels)
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
        """
        API call to download OpenImages slice
        :return: None
        """
        download_dataset(dest_dir=self.directory, csv_dir=self.directory, class_labels=self.labels,
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
#                             print(label)
                            self.parse_line(key + '.jpg', label, height, width, box)
                else:
                    box = {i.lower(): entry.get(i) for i in ["XMin", "XMax", "YMin", "YMax"]}
                    label = self.label_map[entry.get("LabelName")].lower()
                    if label in labels:
#                         print(label)
                        self.parse_line(key + '.jpg', label, height, width, box)
            except KeyError:
                pass

        print("creating subfolders")
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
                copyfile("tar/" + row["filename"], "tar/" + name + '/' + row["filename"])
                # self.label_frame("tar/" + row["filename"], row["class"], row["xmin"], row["xmax"], row["ymin"], row["ymax"])

    def make_zip(self):
        with ZipFile("/wpi-data/create/{}/dataset.zip".format(sys.argv[1]), 'w') as zipFile:
            for directory in "train test".split():
                for folderName, subfolders, filenames in os.walk("tar/" + directory):
                    for filename in filenames:
#                         print(filename)
                        # create complete filepath of file in directory
                        file = os.path.join(directory, filename)
                        # Add file to zip
                        zipFile.write("tar/" + directory + '/' + filename, file)
        print(sys.argv[1]+"/dataset.zip")


if __name__ == "__main__":
    data = "/wpi-data/create/{}/data.json".format(sys.argv[1])
    downloader = OpenImagesDownloader(data)
#     downloader.download()
#     downloader.create_csv()
    print("Making archive")
#     downloader.make_zip()
