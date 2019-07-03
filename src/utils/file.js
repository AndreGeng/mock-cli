const path = require('path');
const fs = require('fs');
const getMockCliHome = () => {
  const homeAbs = path.resolve(process.env.HOME, '.mock-cli/');
  if (!fs.existsSync(homeAbs)) {
    fs.mkdirSync(homeAbs);
  }
  return homeAbs;
};
const getMockCliPath = (pathName) => {
  const home = getMockCliHome();
  const targetPath = path.join(home, pathName);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
  }
  return targetPath;
};
module.exports = {
  getMockCliHome,
  getMockCliPath,
};
