const axios = require('axios');
const ora = require('ora');
const path = require('path');
const inquirer = require('inquirer');
const { promisify } = require('util');
const fs = require('fs');
let ncp = require('ncp');

ncp = promisify(ncp);
let downloadGitReop = require('download-git-repo');
// 可以把异步的api转换为promise
downloadGitReop = promisify(downloadGitReop);
const Metalsmith = require('metalsmith'); // 遍历文件夹 找需不需要渲染
// 统一了所有的模板引擎
let { render } = require('consolidate').ejs;

render = promisify(render);
const { downloadDirectory } = require('./constants');
// create的所有逻辑
// create功能是创建项目
// 拉起你自己的所有项目列出来，让用户选安装的哪个项目 projectName
// 选完后在显示所有的版本号1.0

// https://api.github.com/users/caowei666/repos获取用户下的仓库
const fetchRepolist = async () => {
  const { data } = await axios.get('https://api.github.com/users/caowei666/repos');
  return data;
};

const download = async (repo) => {
  const api = `caowei666/${repo}`;
  const dest = `${downloadDirectory}/${repo}`;
  await downloadGitReop(api, dest);
  console.log(dest);
  return dest;
};

const waitFnloading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();
  return result;
};

module.exports = async (projectName) => {
// 1、获取项目列表
  let repos = await waitFnloading(fetchRepolist, 'fetching template...')();
  repos = repos.map((item) => item.name);
  const { repo } = await inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: '选择一个模板',
    choices: repos,
  });
  const result = await waitFnloading(download, 'download template...')(repo);
  // 拿到下载的目录，直接拷贝到当前目录
  // 把template下载的文件拷贝到执行目录下

  // 如果有ask.js
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    console.log('简单模板');
    await ncp(result, path.resolve(projectName));
  } else {
    // 复杂的模板：把git上的项目下载下来，如果有ask文件就是一个复杂的模板，我们需要用户选择，选择后编译模板
    // metalsmith包 只要编译都需要这个模板
    console.log('复杂模板');
    await new Promise((resolve, reject) => {
      Metalsmith(__dirname)
        .source(result)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const args = require(path.join(result, 'ask.js'));
          const obj = await inquirer.prompt(args);
          const meta = metal.metadata();
          Object.assign(meta, obj);
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          const obj = metal.metadata();
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].content.toString();
              if (content.includes('<%')) {
                content = await render(content, obj);
                files[file].content = Buffer.from(content);
              }
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            reject();
          } else {
            resolve();
          }
        });
    });
  }
};
