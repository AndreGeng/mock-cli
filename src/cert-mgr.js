const EasyCert = require("node-easy-cert");

const { getMockCliPath } = require("./utils");

const options = {
  rootDirPath: getMockCliPath("certs"),
  inMemory: false,
  defaultCertAttrs: [
    { name: "countryName", value: "CN" },
    { name: "organizationName", value: "GZ" },
    { shortName: "ST", value: "SH" },
    { shortName: "OU", value: "FE" }
  ]
};
const easyCert = new EasyCert(options);

const certMgr = Object.assign({}, easyCert);

certMgr.generateRootCA = function() {
  return new Promise((resolve, reject) => {
    easyCert.generateRootCA(
      {
        commonName: "mock-cli root CA"
      },
      (err, keyPath, ctrPath) => {
        if (err) {
          return reject(err);
        }
        resolve({
          keyPath,
          ctrPath
        });
      }
    );
  });
};

certMgr.getCertificate = function(hostname) {
  return new Promise((resolve, reject) => {
    easyCert.getCertificate(hostname, (err, keyContent, ctrContent) => {
      if (err) {
        return reject(err);
      }
      resolve({
        keyContent,
        ctrContent
      });
    });
  });
};

module.exports = certMgr;
