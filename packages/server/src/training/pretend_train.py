from time import sleep
from numpy import sin, cos
import json

def log(message):
    with open('/opt/ml/model/log.json','w') as f:
        json.dump(message,f)

def main():
    global name

    with open('/opt/ml/model/hyperparameters.json') as f:
        hypers = json.load(f)

    name = hypers['name']
    steps = hypers['steps']

    status = 'starting the training'
    epoch = 0
    precision = [[0,0]]
    loss = [[0,0]]
    recall = [[0,0]]

    data = {'status':status,
        'epoch':epoch,
        'data':{
            'DetectionBoxes_Precision/mAP':precision,
            'Loss/total_loss':loss,
            'DetectionBoxes_Recall/AR@100':recall
            }
        }

    log(data);

    sleep(2);

    data['status'] = 'training'
    for i in range(steps):
        data['epoch'] = i
        data['data']['DetectionBoxes_Precision/mAP'].append([i,sin(i*2)])
        data['data']['Loss/total_loss'].append([i,cos(i*.5)])
        data['data']['DetectionBoxes_Recall/AR@100'].append([i,sin(i*4)])
        log(data);
        sleep(1);

    data['status'] = 'training complete'

    log(data);

    with open('/opt/ml/model/model.tar.gz','w') as f:
        f.write('pretend im a model')



if __name__ == "__main__":
    main()
