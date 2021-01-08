#!/bin/bash

# Exit script on error.
set -e
set -x

usage() {
  cat << END_OF_USAGE
  Converts TensorFlow checkpoint to EdgeTPU-compatible TFLite file.

  --config_path Path of the pipeline config file.
  --ckpt_path Path to the checkpoint, without file extension. 
  --help            Display this help.
END_OF_USAGE
}

config_path=""
ckpt_path=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --config_path)
      config_path=$2
      shift 2 ;;
    --ckpt_path)
      ckpt_path=$2
      shift 2 ;;
    --help)
      usage
      exit 0 ;;
    --*)
      echo "Unknown flag $1"
      usage
      exit 1 ;;
  esac
done

OUTPUT_DIR="/tensorflow/models/research/learn/models"


rm -rf "${OUTPUT_DIR}"
mkdir "${OUTPUT_DIR}"

echo $config_path
echo $ckpt_path

echo "EXPORTING frozen graph from checkpoint..."
python object_detection/export_tflite_ssd_graph.py \
  --pipeline_config_path="${config_path}" \
  --trained_checkpoint_prefix="${ckpt_path}" \
  --output_directory="${OUTPUT_DIR}" \
  --add_postprocessing_op=true

echo "CONVERTING frozen graph to TF Lite file..."
tflite_convert \
  --output_file="/tensorflow/models/research/learn/models/output_tflite_graph.tflite" \
  --graph_def_file="/tensorflow/models/research/tflite_graph.pb" \
  --inference_type=QUANTIZED_UINT8 \
  --input_arrays="normalized_input_image_tensor" \
  --output_arrays="TFLite_Detection_PostProcess,TFLite_Detection_PostProcess:1,TFLite_Detection_PostProcess:2,TFLite_Detection_PostProcess:3" \
  --mean_values=128 \
  --std_dev_values=128 \
  --input_shapes=1,300,300,3 \
  --change_concat_input_ranges=false \
  --allow_nudging_weights_to_use_fast_gemm_kernel=true \
  --allow_custom_ops

echo "TFLite graph generated at ${OUTPUT_DIR}/output_tflite_graph.tflite"
