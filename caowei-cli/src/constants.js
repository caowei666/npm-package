// 存放用户的常量
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'userprofile']}/.template`;
module.exports = {
  downloadDirectory,
};
