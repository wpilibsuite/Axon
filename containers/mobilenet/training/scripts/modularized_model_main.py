# This code is owned by The TensorFlow Authors so dont try and sell it. I've just made some edits.

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow as tf

from object_detection import model_hparams
from object_detection import model_lib


def main(
        model_dir,
        pipeline_config_path,
        num_train_steps,
        sample_1_of_n_eval_examples=1,
        sample_1_of_n_eval_on_train_examples=5,
        hparams_overrides=None,
        eval_period=100):
    """
    Creates an estimator for training and evaluation
    Args:
        model_dir: directory to save checkpoints and evaluation data
        pipeline_config_path: location of pipeline.config
        num_train_steps: number of epochs
        sample_1_of_n_eval_examples: unsure
        sample_1_of_n_eval_on_train_examples: unsure
        hparams_overrides: unsure
        eval_period: how frequently to evaluate, in terms of epochs

    Returns:
        None
    """
    config = tf.estimator.RunConfig(model_dir=model_dir, save_checkpoints_steps=eval_period, keep_checkpoint_max=None)

    train_and_eval_dict = model_lib.create_estimator_and_inputs(
        run_config=config,
        hparams=model_hparams.create_hparams(hparams_overrides),
        pipeline_config_path=pipeline_config_path,
        train_steps=num_train_steps,
        sample_1_of_n_eval_examples=sample_1_of_n_eval_examples,
        sample_1_of_n_eval_on_train_examples=sample_1_of_n_eval_on_train_examples)

    estimator = train_and_eval_dict['estimator']
    train_input_fn = train_and_eval_dict['train_input_fn']
    eval_input_fns = train_and_eval_dict['eval_input_fns']
    eval_on_train_input_fn = train_and_eval_dict['eval_on_train_input_fn']
    predict_input_fn = train_and_eval_dict['predict_input_fn']
    train_steps = train_and_eval_dict['train_steps']

    train_spec, eval_specs = model_lib.create_train_and_eval_specs(
        train_input_fn,
        eval_input_fns,
        eval_on_train_input_fn,
        predict_input_fn,
        train_steps,
        eval_on_train_data=False)

    # Currently only a single Eval Spec is allowed.
    tf.estimator.train_and_evaluate(estimator, train_spec, eval_specs[0])
