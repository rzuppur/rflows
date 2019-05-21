import SocketFrame from "@/js/model/Frame";

export interface OpenResult {
  alreadyOpen?: true;
  error?: true;
  frame?: SocketFrame;
  CloseEvent?: any;
}

export interface SubResult {
  alreadyExists?: true;
  frame?: SocketFrame;
}

export interface SocketResult {
  id: number;
  type: string;
  body: Object;
}

export default class Socket {
  connected: boolean;
  subscriptions: Object[];

  constructor(frameHandler: (frame: any) => void, closeCb: (closeEvent: any) => void);

  open(): Promise<OpenResult>;
  subscribe(destination: string, response?: boolean): Promise<SubResult | void>;
  unsubscribe(destination: string): void;
  unsubscribeAll(): void;
  message(destination: string, data: Object, response?: boolean): Promise<SocketResult | void>;
}
