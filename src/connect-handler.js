const net = require("net");
const debug = require("debug")("mockCli:connectHandler");

const HttpsServerMgr = require("./https-server-mgr");

module.exports = requestHandler => {
  const httpsServerMgr = new HttpsServerMgr();
  return async (req, cltSocket) => {
    await new Promise(resolve =>
      cltSocket.write(
        "HTTP/" + req.httpVersion + " 200 OK\r\n\r\n",
        "UTF-8",
        resolve
      )
    );
    const [host] = req.headers.host.split(":");
    const serverInfo = await httpsServerMgr.getHttpsServer(
      host,
      requestHandler
    );
    const conn = net.connect(serverInfo.port, serverInfo.host, () => {
      cltSocket.pipe(conn);
      conn.pipe(cltSocket);
    });
    conn.on("error", err => {
      debug("conn error", err);
      console.error("conn:", err);
    });
  };
};
