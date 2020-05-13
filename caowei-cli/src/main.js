// 找到要执行的核心文件
// 1解析用户的参数
const program = require('commander');
const path = require('path');

// console.log(process.argv);
const { version } = require('../package.json');

const mapAction = {
  create: {
    alias: 'c',
    description: 'create a project',
    example: [
      'caowei-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    example: [
      'caowei-cli config set <k> <v>',
      'caowei-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    example: [],
  },
};
// Object.keys()可以循环symbol
Reflect.ownKeys(mapAction).forEach((action) => {
  program
    .command(action)
    .alias(mapAction[action].alias)
    .description(mapAction[action].description)
    .action(() => {
      if (action === '*') {
        console.log(mapAction[action].description);
      } else { // create config...
        // console.log(action);
        // caowei-cli create xxx
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});

program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapAction).forEach((action) => {
    mapAction[action].example.forEach((example) => {
      console.log(` ${example}`);
    });
  });
});

program.version(version).parse(process.argv);
