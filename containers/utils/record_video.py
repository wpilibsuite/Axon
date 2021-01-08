import cv2
import argparse

"""
Records an mp4 using OpenCV, using the specified device, writing video to the output path.

We chose to have our FPS be 25, so that there were noticeable frame-to-frame differences. This ensures that labelling is not redundant.
"""


def record(device, output):
    WIDTH, HEIGHT, FPS = 640, 480, 25
    cap = cv2.VideoCapture(device)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, FPS)

    fourcc = cv2.VideoWriter_fourcc(*'MP4V')
    out = cv2.VideoWriter(output, fourcc, FPS, (WIDTH, HEIGHT))

    # Stop recording by pressing 'q'
    while True:
        ret, frame = cap.read()
        out.write(frame)
        cv2.imshow('frame', frame)
        c = cv2.waitKey(1)
        if c & 0xFF == ord('q'):
            break

    cap.release()
    out.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", help="OpenCV device id. Default is 0.", type=int, default=0)
    parser.add_argument("--output", help="Output mp4 path", type=str, required=True)
    args = parser.parse_args()
    record(args.device, args.output)
