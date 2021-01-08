from __future__ import print_function
import json
import glob


def main(percent_eval):
    f = []
    for file in glob.glob("/home/**/**/**/**/*.json"):
        f.append(file)
    print("Percent eval: {}%".format(percent_eval))
    train_jsons = [f[i] for i in range(len(f)) if i % 100 >= percent_eval]
    eval_jsons = [f[i] for i in range(len(f)) if i % 100 < percent_eval]

    def make_csv(csv_path, files):
        with open(csv_path, "w+") as csv:
            csv.write("filename,width,height,class,xmin,ymin,xmax,ymax\n")

            for filename in files:
                # path = base + '/' + filename
                path = filename
                filename = filename.split('home/')[1]
                filename = filename.split('/')
                # print filename
                filename[3] = 'img'
                filename[4] = filename[4][:-5]
                with open(path, 'r') as file:
                    line = json.load(file)
                    for obj in line["objects"]:
                        p1, p2 = obj["points"]["exterior"]
                        x1, x2 = sorted([p1[0], p2[0]])
                        y1, y2 = sorted([p1[1], p2[1]])

                        entry = ['/'.join(filename), line["size"]["width"], line["size"]["height"], obj["classTitle"],
                                 x1, y1, x2, y2]
                        csv.write(",".join(map(str, entry)) + '\n')

    make_csv("/home/tmp/train.csv", train_jsons)
    make_csv("/home/tmp/eval.csv", eval_jsons)
