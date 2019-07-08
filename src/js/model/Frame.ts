interface SocketFrame {
  body: string;
  command: string;
  headers: {
    "user-name"?: string,
  };
}

export default SocketFrame;
