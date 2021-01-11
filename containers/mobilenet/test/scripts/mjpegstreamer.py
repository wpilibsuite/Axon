import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
import cv2


class StreamingHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        print(self.path)
        if self.path.endswith('/stream.mjpg'):
            self.send_response(200)
            self.send_header('Content-type', 'multipart/x-mixed-replace; boundary=--jpgboundary')
            self.end_headers()
            try:
                while True:
                    r, buf = cv2.imencode(".jpg", MJPEGServer.get_image())
                    self.wfile.write("--jpgboundary\r\n".encode())
                    self.end_headers()
                    self.wfile.write(bytearray(buf))
                return
            except BrokenPipeError:
                return


        print(self.path)
        self.send_response(302)
        self.send_header('Location', "/stream.mjpg")
        self.end_headers()




class MJPEGServer(threading.Thread):
    img = None
    width = 0
    height = 0

    def __init__(self, width, height):
        super(MJPEGServer, self).__init__()
        self.daemon = True
        MJPEGServer.width = width
        MJPEGServer.height = height

    def run(self):
        self._server = HTTPServer(('', 5000), StreamingHandler)
        self._server.serve_forever()

    @staticmethod
    def set_image(img):
        MJPEGServer.img = img

    @staticmethod
    def get_image():
        return MJPEGServer.img
