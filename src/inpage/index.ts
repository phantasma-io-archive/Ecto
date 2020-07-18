interface ICloseEvent {
  code: number;
  reason: string;
  wasClean: boolean;
}

interface IMessageEvent {
  data: string;
}

class PhantasmaLinkSocket {
  onopen: () => void = () => {};
  onerror: (error: Error) => void = () => {};
  onclose: (event: ICloseEvent) => void = () => {};
  onmessage: (message: IMessageEvent) => void = () => {};

  private onMessageListener: (msg: any) => void;
  private sid: string;

  onMessageListenerFunc(msg: any) {
    if (msg.source === window) {
      if (msg.data && msg.data.uid == "plsres" && msg.data.sid == this.sid) {
        const msgJson = JSON.stringify(msg.data.data);
        if (this.onmessage) this.onmessage({ data: msgJson });
      }
    }
  }

  constructor() {
    this.sid = new Date().getTime().toString();

    this.onMessageListener = this.onMessageListenerFunc.bind(this);
    window.addEventListener("message", this.onMessageListener);

    setTimeout(() => this.onopen(), 200);
  }

  public send(msg: string) {
    window.postMessage({ uid: "pls", data: msg, sid: this.sid }, "*");
  }

  public close() {
    window.removeEventListener("message", this.onMessageListener);

    if (this.onclose)
      this.onclose({ code: 0, wasClean: true, reason: "Closed by client" });
  }
}

(window as any).PhantasmaLinkSocket = PhantasmaLinkSocket;
