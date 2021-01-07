import tarfile, os


# this script simply extracts the model into the ckpt directory.
# to avoid downloads within the train script, a switch model script
# may be called before the train script, but the default model is
# downloaded to the research directory upon buiding the image

def prepare_checkpoint(checkpoint_tar):
    CKPT_DIR = os.path.join(os.getcwd(), 'learn', 'ckpt')

    model_name = "/opt/ml/model/ssd_mobilenet_v2_quantized_300x300_coco_2019_01_03" + '.tar.gz'

    with tarfile.open(model_name) as model:
        model.extractall(CKPT_DIR)
