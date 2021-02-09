const net = window.require("net");
export default class Localhost {
  waitForStart(): void {
    const server = net.createServer();

    server.once("error", function (err: { message: string }) {
      console.log(err.message);
    });

    server.once("listening", function () {
      // close the server if listening doesn't fail
      server.close();
      console.log("Server found");
      const { shell } = window.require("electron");
      shell.openExternal("http://localhost:3000");
    });

    server.listen(3000);
  }
}
