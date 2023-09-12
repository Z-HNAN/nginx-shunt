import { NextApiRequest, NextApiResponse } from 'next';
import * as path from 'node:path'
import * as fs from 'node:fs/promises'

import { $ } from 'zx';

const NGINX_CONFIG_PATH = '/home/huawei/config/nginx';
const NGINX_CONTAINER_NAME = 'nginx';

async function getGrayENVConfig() {
  const gray = await fs.readFile(path.join(NGINX_CONFIG_PATH, 'gray.conf'), { encoding: 'utf-8'})

  const regex = /split_clients .* \{([^}]*)\}/g; // 读取split_clients内容
  const splitClientsRes = regex.exec(gray);
  if (!splitClientsRes) {
    return [];
  }

  const splitClients = splitClientsRes[1].replace(/\s+/g, '')
    .split(';').slice(0, -1) // 20%canary, 80%prod
    .map(confStr => ({ key: confStr.split('%')[1], percent: parseInt(confStr.split('%')[0]) })) // { key, percent }, 

  return splitClients;
}
async function setGrayENVConfig(grayClients: Array<GrayClient>) {
  const gray = await fs.readFile(path.join(NGINX_CONFIG_PATH, 'gray.conf'), { encoding: 'utf-8'})

  const grayContent = grayClients.map(({ key, percent}) => `\t${percent}%\t${key};`).join('\n')
  const newGray = gray.replace(/(split_clients .* \{)[^}]*(\})/g, (_, prefix, suffix) => prefix + '\n' + grayContent + '\n' + suffix);

  await fs.writeFile(path.join(NGINX_CONFIG_PATH, 'gray.conf'), newGray, { encoding: 'utf-8' });

  return { code: 0 }
}

async function getTestENVConfig() {
  const files = await fs.readdir(path.join(NGINX_CONFIG_PATH, 'env'))

  const testClients = await Promise.all(files
    .map(file => fs.readFile(path.join(NGINX_CONFIG_PATH, 'env', file), { encoding: 'utf-8'}).then(config => ({ key: file.replace(/\.conf$/, ''), config }))) // [key, file]
  )
  
  return testClients;
}
async function setTestENVConfig(testClients: Array<TestClient>) {
  const oldTestClients = await getTestENVConfig();

  const deleteTestClients = oldTestClients.filter(oldClient => !testClients.find(c => c.key === oldClient.key));
  for (let deleteClient of deleteTestClients) {
    await removeTestENVConfig(deleteClient.key);
  }

  for (let testClient of testClients) {
    await updateTestENVConfig(testClient);
  }

  return { code: 0 }
}

async function removeTestENVConfig(key: string) {
  const testEnvConfig = path.join(NGINX_CONFIG_PATH, 'env', `${key}.conf`);
  await fs.access(testEnvConfig)
  await fs.rm(testEnvConfig)
}
async function updateTestENVConfig({ key, config }: TestClient) {
  const testEnvConfig = path.join(NGINX_CONFIG_PATH, 'env', `${key}.conf`);

  // 检测语法是否正常
  const tempConfFile = path.join(NGINX_CONFIG_PATH, 'test.conf.temp');
  const dockerConfFile = path.join('/etc/nginx/conf.d', 'test.conf.temp')
  try {
    await fs.writeFile(tempConfFile, `events {worker_connections 1024;}\nhttp {\n${config}\n}`, { encoding: 'utf-8' });
    await $`docker exec ${NGINX_CONTAINER_NAME} nginx -t -c ${dockerConfFile}`;
  } catch (err) {
    throw Error(`nginx syntax\n${(err as Error).message}`)
  } finally {
    await fs.rm(tempConfFile);
  }

  await fs.writeFile(testEnvConfig, config, { encoding: 'utf-8' });
}

async function getEnvConfig() {
  const grayClients = await getGrayENVConfig();
  const testClients = await getTestENVConfig();

  return { grayClients, testClients }
}

async function reloadNginx() {
  await $`docker exec ${NGINX_CONTAINER_NAME} nginx -t`
  await $`docker exec ${NGINX_CONTAINER_NAME} nginx -s reload`
  return { code: 0 }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req.query;
  try {
    req.body = req.body ? JSON.parse(req.body) : req.body
    switch (method) {
      case 'getEnvConfig':
        res.json(await getEnvConfig());
        break;
      case 'reloadNginx':
        res.json(await reloadNginx());
        break;
      case 'setGrayENVConfig':
        res.json(await setGrayENVConfig(req.body['gray_clients']))
        break;
      case 'setTestENVConfig':
        res.json(await setTestENVConfig(req.body['test_clients']))
        break;
  
      case 'ping':
      default:
        res.send('pong')
    }
  } catch (err) {
    res.status(500).send((err as Error).message)
  }
}