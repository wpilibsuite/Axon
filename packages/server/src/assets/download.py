import concurrent.futures
import io
import logging
import os
import warnings
from typing import Dict, List, Set

import boto3
import botocore
import lxml.etree as etree
import pandas as pd
import requests
import urllib3
from Pillow import Image
from tqdm import tqdm

# define a "public API" and somewhat manage "wild" imports
# (see http://xion.io/post/code/python-all-wild-imports.html)
__all__ = ["download_dataset", "download_images"]

# OpenImages URL locations
_OID_v4 = "https://storage.googleapis.com/openimages/2018_04/"
_OID_v5 = "https://storage.googleapis.com/openimages/v5/"

# ignore the connection pool is full warning messages from boto
warnings.filterwarnings("ignore")

# ------------------------------------------------------------------------------
# set up a basic, global _logger which will write to the console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d  %H:%M:%S",
)
_logger = logging.getLogger(__name__)


# ------------------------------------------------------------------------------
def _class_label_codes(
        class_labels: List[str],
        meta_dir: str = None,
) -> Dict:
    """
    Gets a dictionary that maps a list of OpenImages image class labels to their
    corresponding image class label codes.

    :param class_labels: image class labels for which we'll find corresponding
        OpenImages image class codes
    :param meta_dir: directory where we should look for the class descriptions
        CSV file, and if not present download it into there for future use
    :return: dictionary with the class labels mapped to their corresponding
        OpenImages image class codes
    """

    classes_csv = "class-descriptions-boxable.csv"

    if meta_dir is None:

        # get the class descriptions CSV from OpenImages and read into a DataFrame
        try:
            contents = download_file(_OID_v5 + classes_csv)
        except ValueError as e:
            raise ValueError("Failed to get class descriptions information.", e)

        df_classes = pd.read_csv(io.BytesIO(contents), header=None)

    else:

        # download the class descriptions CSV file to the specified directory if not present
        descriptions_csv_file_path = os.path.join(meta_dir, classes_csv)
        if not os.path.exists(descriptions_csv_file_path):

            # get the annotations CSV for the section
            url = _OID_v5 + classes_csv
            try:
                download_file(url, descriptions_csv_file_path)
            except ValueError as e:
                raise ValueError("Failed to get class descriptions information.", e)

        df_classes = pd.read_csv(descriptions_csv_file_path, header=None)

    # build dictionary of class labels to OpenImages class codes
    labels_to_codes = {}
    for class_label in class_labels:
        labels_to_codes[class_label.lower()] = \
            df_classes.loc[[i.lower() == class_label.lower() for i in df_classes[1]]].values[0][0]

    # return the labels to OpenImages codes dictionary
    return labels_to_codes


# ------------------------------------------------------------------------------
def download_dataset(
        dest_dir: str,
        class_labels: List[str],
        exclusions_path: str = None,
        annotation_format: str = None,
        meta_dir: str = None,
        limit: int = None,
) -> Dict:
    """
    Downloads a dataset of images and annotations for a specified list of
    OpenImages image class labels.

    :param dest_dir: base directory under which the images and annotations
        will be stored
    :param class_labels: list of OpenImages class labels we'll download
    :param annotation_format: format of annotation files, valid options:
        "darknet" (YOLO) and "pascal" (PASCAL VOC)
    :param exclusions_path: path to file containing file IDs to exclude from the
        dataset (useful if there are files known to be problematic or invalid)
    :param meta_dir: directory where we should look for the class descriptions
        and annotations CSV files, if these files are not present from a previous
        usage then download these files into this directory for future use
    :param limit: the maximum number of images per label we should download
    :return: dictionary of class labels mapped to dictionaries specifying the
        corresponding images and annotations directories for the class
    """

    # make the metadata directory if it's specified and doesn't exist
    if meta_dir is not None:
        os.makedirs(meta_dir, exist_ok=True)

    # get the OpenImages image class codes for the specified class labels
    label_codes = _class_label_codes(class_labels, meta_dir)

    # build the directories for each class label
    class_directories = {}
    for class_label in label_codes.keys():

        # create directory to contain the image files for the class
        images_dir = os.path.join(dest_dir, class_label, "images")
        os.makedirs(images_dir, exist_ok=True)
        class_directories[class_label] = {
            "images_dir": images_dir,
        }

        # create directory to contain the annotation files for the class
        if annotation_format is not None:
            annotations_dir = os.path.join(dest_dir, class_label, annotation_format)
            os.makedirs(annotations_dir, exist_ok=True)
            class_directories[class_label]["annotations_dir"] = annotations_dir

    # get the IDs of questionable files marked for exclusion
    exclusion_ids = None
    if exclusions_path is not None:
        # read the file IDs from the exclusions file
        with open(exclusions_path, "r") as exclusions_file:
            exclusion_ids = set([line.rstrip('\n') for line in exclusions_file])

    # keep counts of the number of images downloaded for each label
    class_labels = list(label_codes.keys())
    label_download_counts = {label: 0 for label in class_labels}

    # OpenImages is already split into sections so we'll need to loop over each
    split_section = "train"

    # get a dictionary of class labels to GroupByDataFrames
    # containing bounding box info grouped by image IDs
    label_bbox_groups = _group_bounding_boxes(split_section, label_codes, exclusion_ids, meta_dir)

    for label_index, class_label in enumerate(class_labels):

        # get the bounding boxes grouped by image and the collection of image IDs
        bbox_groups = label_bbox_groups[class_label]
        image_ids = bbox_groups.groups.keys()

        # limit the number of images we'll download, if specified
        if limit is not None:
            remaining = limit - label_download_counts[class_label]
            if remaining <= 0:
                break
            elif remaining < len(image_ids):
                image_ids = list(image_ids)[0:remaining]

        # download the images
        _logger.info(
            f"Downloading {len(image_ids)} {split_section} images "
            f"for class \'{class_label}\'",
        )
        _download_images_by_id(
            image_ids,
            split_section,
            class_directories[class_label]["images_dir"],
        )

        # update the downloaded images count for this label
        label_download_counts[class_label] += len(image_ids)

        # build the annotations
        if annotation_format is not None:
            _logger.info(
                f"Creating {len(image_ids)} {split_section} annotations "
                f"({annotation_format}) for class \'{class_label}\'",
            )
            _build_annotations(
                annotation_format,
                image_ids,
                bbox_groups,
                class_labels,
                label_index,
                class_directories[class_label]["images_dir"],
                class_directories[class_label]["annotations_dir"],
            )

    return class_directories


# ------------------------------------------------------------------------------
def download_images(
        dest_dir: str,
        class_labels: List[str],
        exclusions_path: str,
        meta_dir: str = None,
        limit: int = None,
) -> Dict:
    """
    Downloads a dataset of images for a specified list of OpenImages image classes.

    :param dest_dir: base directory under which the images and annotations
        will be stored
    :param class_labels: list of OpenImages class labels we'll download
    :param exclusions_path: path to file containing file IDs to exclude from the
        dataset (useful if there are files known to be problematic or invalid)
    :param meta_dir: directory where we should look for the class descriptions
        and annotations CSV files, if these files are not present from a previous
        usage then download these files into this directory for future use
    :param limit: the maximum number of images per label we should download
    :return: dictionary of the images directory directory for each class label,
        for example: {"dog": "/data/oi/dog/images", "cat": "/data/oi/cat/images"}
    """

    image_directories = download_dataset(
        dest_dir,
        class_labels,
        exclusions_path,
        None,
        meta_dir,
        limit,
    )

    # collapse a level of the returned distionary so we're able to return
    # a dictionary that just maps the class label to images directory
    return {label: dirs_dict["images_dir"] for label, dirs_dict in image_directories.items()}


# ------------------------------------------------------------------------------
def _download_images_by_id(
        image_ids: List[str],
        section: str,
        images_directory: str,
):
    """
    Downloads a collection of images from OpenImages dataset.

    :param image_ids: list of image IDs to download
    :param section: split section (train, validation, or test) where the image
        should be found
    :param images_directory: destination directory where the image files are to
        be written
    """

    # we'll download the images from AWS S3 so we'll need a boto S3 client
    s3_client = boto3.client(
        's3',
        config=botocore.config.Config(signature_version=botocore.UNSIGNED),
    )

    # create an iterable list of function arguments
    # that we'll map to the download function
    download_args_list = []
    for image_id in image_ids:
        image_file_name = image_id + ".jpg"
        download_args = {
            "s3_client": s3_client,
            "image_file_object_path": section + "/" + image_file_name,
            "dest_file_path": os.path.join(images_directory, image_file_name),
        }
        download_args_list.append(download_args)

    # use a ThreadPoolExecutor to download the images in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        # use the executor to map the download function to the iterable of arguments
        list(tqdm(executor.map(_download_single_image, download_args_list),
                  total=len(download_args_list), desc="Downloading images"))


# ------------------------------------------------------------------------------
def _build_annotations(
        annotation_format: str,
        image_ids: List[str],
        bbox_groups: pd.core.groupby.DataFrameGroupBy,
        class_labels: List[str],
        class_index: int,
        images_directory: str,
        annotations_directory: str,
        include_segmentation_masks: bool = False,
):
    """
    Builds and saves annotations for a collection of images.

    :param annotation_format:
    :param image_ids:
    :param bbox_groups:
    :param class_labels:
    :param class_index:
    :param images_directory: directory where the image files should be located
    :param annotations_directory: destination directory where the annotation
        files are to be written
    :param include_segmentation_masks:
    """

    # create an iterable list of function arguments
    # that we'll map to the annotation builder function
    build_args_list = []
    for image_id in image_ids:

        # get all bounding boxes in the image for the label
        bboxes = bbox_groups.get_group(image_id)[['XMin', 'XMax', 'YMin', 'YMax']].values.tolist()

        # build a dictionary of arguments for the _build_annotation function
        # that will be called by one of the process pool's worker processes
        build_args = {
            "annotation_format": annotation_format,
            "bboxes": bboxes,
            "image_id": image_id,
            "images_dir": images_directory,
            "annotations_dir": annotations_directory,
            "include_segmentation_masks": include_segmentation_masks,
        }

        if annotation_format == "pascal":
            build_args["class_label"] = class_labels[class_index]
        elif annotation_format == "darknet":
            build_args["class_index"] = class_index
        else:
            raise ValueError(
                f"Unsupported annotation format: \"{annotation_format}\"",
            )
        build_args_list.append(build_args)

    # use a ProcessPoolExecutor to download the images in parallel
    with concurrent.futures.ProcessPoolExecutor() as executor:

        # use the executor to map the build function to the iterable of arguments
        list(tqdm(executor.map(_build_annotation, build_args_list),
                  total=len(build_args_list)))


# ------------------------------------------------------------------------------
def _build_annotation(arguments: Dict):
    """
    Builds and saves an annotation file for an image.

    :param arguments: dictionary containing the following arguments:
        "bboxes": a list of bounding box lists with four elements: [xmin, ymin,
            xmax, ymax]
        "class_labels": list of image class labels (categories)
        "image_id": OpenImages image ID
        "images_dir": directory containing the image
        "annotations_dir": destination directory where the annotation file
            should be written
    """
    if arguments["annotation_format"] == "pascal":

        # write a PASCAL VOC file for this image
        # using all bounding boxes in the image's group
        _write_bboxes_as_pascal(
            arguments["bboxes"],
            arguments["class_label"],
            arguments["image_id"],
            arguments["images_dir"],
            arguments["annotations_dir"],
            # arguments["include_segmentation_masks"],
        )
    else:
        raise ValueError(
            f"Unsupported annotation format: \"{arguments['annotation_format']}\"",
        )


# ------------------------------------------------------------------------------
def _get_annotations_csv(
        split_section: str,
) -> str:
    """
    Requests the annotations CSV for a split section.

    :param split_section:
    :return: the CSV payload
    """

    # get the annotations CSV for the section
    url = _OID_v4 + split_section + "/" + split_section + "-annotations-bbox.csv"
    try:
        contents = download_file(url)
    except ValueError as e:
        raise ValueError(
            f"Failed to get bounding box information for split section {split_section}.", e)

    return contents


# ------------------------------------------------------------------------------
def _group_bounding_boxes(
        section: str,
        label_codes: Dict,
        exclusion_ids: Set[str],
        meta_dir: str = None,
) -> pd.core.groupby.DataFrameGroupBy:
    """
    Gets a pandas DataFrameGroupBy object containing bounding boxes for an image
    class grouped by image ID.

    :param section: the relevant split section, "train", "validation", or "test"
    :param label_codes: dictionary with class labels mapped to the
        corresponding OpenImages-specific code of the image class
    :param exclusion_ids: file IDs that should be excluded
    :param meta_dir: directory where the annotations CSV should be located,
        if not present it will be downloaded and stored here for future use
    :return: DataFrameGroupBy object with bounding box columns grouped by image IDs
    """

    _logger.info(f"Reading bounding box data")

    if meta_dir is None:

        # get the annotations CSV for the section
        contents = _get_annotations_csv(section)

        # read the CSV into a pandas DataFrame
        df_images = pd.read_csv(io.BytesIO(contents))

    else:

        # download the annotations CSV file to the specified directory if not present
        bbox_csv_file_path = os.path.join(meta_dir, section + "-annotations-bbox.csv")
        if not os.path.exists(bbox_csv_file_path):
            # get the annotations CSV for the section
            contents = _get_annotations_csv(section)
            with open(bbox_csv_file_path, "wb") as annotations_file:
                annotations_file.write(contents)

        # read the CSV into a pandas DataFrame
        df_images = pd.read_csv(bbox_csv_file_path)

    # remove any rows which are identified to be excluded
    if exclusion_ids and (len(exclusion_ids) > 0):
        df_images = df_images[~df_images["ImageID"].isin(exclusion_ids)]

    # filter out images that are occluded, truncated, group, depiction, inside, etc.
    for reject_field in ("IsOccluded", "IsTruncated", "IsGroupOf", "IsDepiction", "IsInside"):
        df_images = df_images[df_images[reject_field] == 0]

    # drop the columns we won't need, keeping only
    # the image ID, label name and bounding box columns
    unnecessary_columns = [
        "IsOccluded",
        "IsTruncated",
        "IsGroupOf",
        "IsDepiction",
        "IsInside",
        "Source",
        "Confidence",
    ]
    df_images.drop(unnecessary_columns, axis=1, inplace=True)

    # create a dictionary and populate it with class labels mapped to
    # GroupByDataFrame objects with bounding boxes grouped by image ID
    labels_to_bounding_box_groups = {}
    for class_label, class_code in label_codes.items():
        # filter the DataFrame down to just the images for the class label
        df_label_images = df_images[df_images["LabelName"] == class_code]

        # drop the label name column since it's no longer needed
        df_label_images.drop(["LabelName"], axis=1, inplace=True)

        # map the class label to a GroupBy object with each
        # group's row containing the bounding box columns
        labels_to_bounding_box_groups[class_label] = \
            df_label_images.groupby(df_images["ImageID"])

    # return the dictionary we've created
    return labels_to_bounding_box_groups


# ------------------------------------------------------------------------------
def _write_bboxes_as_pascal(
        bboxes: List[List[float]],
        label: str,
        image_id: str,
        images_dir: str,
        pascal_dir: str,
) -> int:
    """
    Writes a PASCAL VOC (XML) annotation file containing the bounding boxes for
    an image.

    :param bboxes: iterable of lists of bounding box coordinates [xmin, ymin, xmax, ymax]
    :param label: class label
    :param image_id: ID of the image file (typically the image file name
        minus ".jpg" or ".png")
    :param images_dir: directory where the image file is located
    :param pascal_dir: directory where the PASCAL file should be written
    :return: 0 for success, 1 for failure
    """

    # get the image dimensions
    image_file_name = image_id + ".jpg"
    image_path = os.path.join(images_dir, image_file_name)
    try:
        img_width, img_height = Image.open(image_path)
    except OSError as error:
        _logger.warning(
            "Unable to create PASCAL annotation for image "
            f"{image_file_name} -- skipping",
            error
        )
        return 1

    normalized_image_path = os.path.normpath(image_path)
    folder_name, image_file_name = normalized_image_path.split(os.path.sep)[-2:]

    annotation = etree.Element('annotation')
    folder = etree.SubElement(annotation, "folder")
    folder.text = folder_name
    filename = etree.SubElement(annotation, "filename")
    filename.text = image_file_name
    path = etree.SubElement(annotation, "path")
    path.text = normalized_image_path
    source = etree.SubElement(annotation, "source")
    database = etree.SubElement(source, "database")
    database.text = "OpenImages"
    size = etree.SubElement(annotation, "size")
    width = etree.SubElement(size, "width")
    width.text = str(img_width)
    height = etree.SubElement(size, "height")
    height.text = str(img_height)
    segmented = etree.SubElement(annotation, "segmented")
    segmented.text = "0"
    for bbox in bboxes:
        obj = etree.SubElement(annotation, "object")
        name = etree.SubElement(obj, "name")
        name.text = label
        pose = etree.SubElement(obj, "pose")
        pose.text = "Unspecified"
        truncated = etree.SubElement(obj, "truncated")
        truncated.text = "0"
        difficult = etree.SubElement(obj, "difficult")
        difficult.text = "0"
        bndbox = etree.SubElement(obj, "bndbox")
        xmin = etree.SubElement(bndbox, "xmin")
        xmin.text = str(max(0, int(bbox[0] * img_width)))
        xmax = etree.SubElement(bndbox, "xmax")
        xmax.text = str(min(img_width - 1, int(bbox[1] * img_width)))
        ymin = etree.SubElement(bndbox, "ymin")
        ymin.text = str(max(0, int(bbox[2] * img_height)))
        ymax = etree.SubElement(bndbox, "ymax")
        ymax.text = str(min(img_height - 1, int(bbox[3] * img_height)))

    # write the XML to file
    pascal_file_path = os.path.join(pascal_dir, image_id + ".xml")
    with open(pascal_file_path, 'w') as pascal_file:
        pascal_file.write(etree.tostring(annotation, pretty_print=True, encoding='utf-8').decode("utf-8"))

    return 0


# ------------------------------------------------------------------------------
def _download_single_image(arguments: Dict):
    """
    Downloads and saves an image file from the OpenImages dataset.

    :param arguments: dictionary containing the following arguments:
        "s3_client": an S3 client object
        "image_file_object_path": the S3 object path corresponding to the image
            file to be downloaded
        "dest_file_path": destination directory where the image file should be
            written
    """
    if os.path.exists(arguments["dest_file_path"]):
        return

    try:
        with open(arguments["dest_file_path"], "wb") as dest_file:
            arguments["s3_client"].download_fileobj(
                "open-images-dataset",
                arguments["image_file_object_path"],
                dest_file,
            )

    except urllib3.exceptions.ProtocolError as error:
        _logger.warning(
            f"Unable to download image {arguments['image_file_object_path']} -- skipping",
            error,
        )


# Modified from https://stackoverflow.com/a/37573701.
def download_file(url: str, dest_path: str = None):
    """
    Downloads file at the given URL and stores it in dest_path if given, or
    returns the contents if dest_path is None (default).

    :param url URL to download.
    :param dest_path Location to store downloaded file at, or None to return
        contents instead.
    :return Downloaded file contents if dest_path is None, otherwise None.
    """
    response = requests.get(url, allow_redirects=True, stream=True)

    if response.status_code != 200:
        raise ValueError(
            f"Failed to download file from {url}. "
            f"-- Invalid response (status code: {response.status_code}).",
        )

    total_size = int(response.headers.get('content-length', 0))
    block_size = 100 * 1024  # 100 Kibibyte
    t = tqdm(total=total_size, unit='iB', unit_scale=True,
             desc=f"GET {os.path.basename(os.path.normpath(url))}")

    if dest_path is not None:
        with open(dest_path, 'wb') as f:
            for data in response.iter_content(block_size):
                t.update(len(data))
                f.write(data)
    else:
        file_contents_blocks = []
        for data in response.iter_content(block_size):
            t.update(len(data))
            file_contents_blocks.append(data)

    t.close()

    if total_size != 0 and t.n != total_size:
        raise ValueError(
            f"Download interrupted (received {t.n} of {total_size} bytes)")

    return bytes().join(file_contents_blocks) if dest_path is None else None
