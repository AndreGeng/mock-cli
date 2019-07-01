const isAbsoluteUrl = (url) => {
  const regex = /^https?:\/\/|^\/\//i;
  return regex.test(url);
};
module.exports = {
  isAbsoluteUrl,
};
