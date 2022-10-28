import tarfile, os


# this script simply extracts the model into the ckpt directory.
# to avoid downloads within the train script, a switch model script
# may be called before the train script, but the default model is
# downloaded to the research directory upon buiding the image

def prepare_checkpoint(checkpoint_tar):
    CKPT_DIR = os.path.join(os.getcwd(), 'learn', 'ckpt')

    model_name = "/opt/ml/model/ssd_mobilenet_v2_quantized_300x300_coco_2019_01_03" + '.tar.gz'

    with tarfile.open(model_name) as model:
        
        import os
        
        def is_within_directory(directory, target):
            
            abs_directory = os.path.abspath(directory)
            abs_target = os.path.abspath(target)
        
            prefix = os.path.commonprefix([abs_directory, abs_target])
            
            return prefix == abs_directory
        
        def safe_extract(tar, path=".", members=None, *, numeric_owner=False):
        
            for member in tar.getmembers():
                member_path = os.path.join(path, member.name)
                if not is_within_directory(path, member_path):
                    raise Exception("Attempted Path Traversal in Tar File")
        
            tar.extractall(path, members, numeric_owner=numeric_owner) 
            
        
        safe_extract(model, CKPT_DIR)
