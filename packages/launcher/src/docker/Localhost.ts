const waitOn = window.require("wait-on");
export default class Localhost {
  async waitForStart(): Promise<void> {
    await waitOn({
      timeout: 10000,
      resources: ["http://localhost:3000"]
    });

    const { shell } = window.require("electron");
    shell.openExternal("http://localhost:3000");
  }
}
