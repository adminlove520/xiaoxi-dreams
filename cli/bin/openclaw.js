#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import os from 'os';

const program = new Command();
const CONFIG_PATH = path.join(os.homedir(), '.openclaw.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  }
  return {
    url: 'http://localhost:3000',
    apiKey: '',
    centerUrl: 'https://xiaoxi-dreams.vercel.app'
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

program
  .name('openclaw')
  .description('OpenClaw CLI - SuperDreams Agent Control Tool')
  .version('5.1.0');

// Config Command
program
  .command('config')
  .description('配置 OpenClaw URL 和 API Key')
  .option('-u, --url <url>', 'Agent Dashboard URL (e.g., http://localhost:3000)')
  .option('-k, --key <key>', 'API Key for authentication')
  .option('-c, --center <center>', 'Control Center URL')
  .action((options) => {
    const config = loadConfig();
    if (options.url) config.url = options.url.replace(/\/$/, '');
    if (options.key) config.apiKey = options.key;
    if (options.center) config.centerUrl = options.center.replace(/\/$/, '');
    
    saveConfig(config);
    console.log(chalk.green('✔ 配置已更新:'));
    console.log(chalk.cyan(`  Agent URL: ${config.url}`));
    console.log(chalk.cyan(`  Center URL: ${config.centerUrl}`));
    console.log(chalk.cyan(`  API Key: ${config.apiKey ? '********' : '(未设置)'}`));
  });

// Dream Command
program
  .command('dream')
  .description('触发 Agent 执行做梦 (记忆整合)')
  .action(async () => {
    const config = loadConfig();
    const spinner = ora('Agent 正在做梦...').start();
    
    try {
      const res = await fetch(`${config.url}/api/dreams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      if (res.ok) {
        spinner.succeed(chalk.green('做梦成功!'));
        console.log(chalk.gray('--- 梦境报告 ---'));
        console.log(data.dream.report);
      } else {
        spinner.fail(chalk.red(`做梦失败: ${data.error}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`做梦请求出错: ${error.message}`));
    }
  });

// Sync Command
program
  .command('sync')
  .description('同步 Agent 数据到控制中心')
  .action(async () => {
    const config = loadConfig();
    if (!config.apiKey) {
      console.log(chalk.yellow('⚠ 未配置 API Key，请先运行: openclaw config -k <your_key>'));
      return;
    }

    const spinner = ora('正在同步数据到控制中心...').start();
    
    try {
      const res = await fetch(`${config.url}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerUrl: config.centerUrl,
          apiKey: config.apiKey
        })
      });
      
      const data = await res.json();
      if (data.success) {
        spinner.succeed(chalk.green(`同步完成!`));
        console.log(chalk.cyan(`  记忆: ${data.memories.sent} 条`));
        console.log(chalk.cyan(`  梦境: ${data.dreams.sent} 条`));
      } else {
        spinner.fail(chalk.red(`同步失败: ${data.error}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`同步请求出错: ${error.message}`));
    }
  });

// Stats Command
program
  .command('stats')
  .description('查看 Agent 状态和统计信息')
  .action(async () => {
    const config = loadConfig();
    const spinner = ora('正在获取统计信息...').start();
    
    try {
      const res = await fetch(`${config.url}/api/stats`);
      const data = await res.json();
      
      if (res.ok) {
        spinner.stop();
        console.log(chalk.bold.green('\n📊 SuperDreams Agent 统计数据:'));
        console.log(chalk.gray('--------------------------------'));
        console.log(`${chalk.yellow('记忆总数:')}  ${data.total_memories}`);
        console.log(`${chalk.yellow('梦境总数:')}  ${data.total_dreams}`);
        console.log(`${chalk.yellow('健康评分:')}  ${chalk.bold.cyan(data.health_score)}/100`);
        console.log(`${chalk.yellow('近期活跃:')}  ${data.recent_7d} 条记忆 (近7天)`);
        console.log(chalk.gray('--------------------------------\n'));
      } else {
        spinner.fail(chalk.red('获取统计信息失败'));
      }
    } catch (error) {
      spinner.fail(chalk.red(`请求出错: ${error.message}`));
    }
  });

program.parse(process.argv);
