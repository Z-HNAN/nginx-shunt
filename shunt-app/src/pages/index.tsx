import React, { useState } from 'react';
import { message } from 'antd';

import GrayClient from './GrayClient';
import TestClient from './TestClient';

const App = () => {
  const [grayClients, setGrayClients] = useState([]);
  const [testClients, setTestClients] = useState([]);

  function fetchEnvConfig() {
    // 将key=prod的元素放在第一位
    function sortProdFirst(a: any, b: any) {
      if (a.key === 'prod') return -1;
      if (b.key === 'prod') return 1;
      return 0;
    }

    fetch('/api/dispatch?method=getEnvConfig')
      .then(res => {
        if (res.status === 200) {
          res.json()
            .then(res => {
              setGrayClients(res.grayClients.sort(sortProdFirst));
              setTestClients(res.testClients.sort(sortProdFirst));
            })
        }
      })
  }
  React.useEffect(() => {
    fetchEnvConfig()
  }, []);

  const handleConfirmGray = (garyClients: Array<any>) => {
    message.loading('waiting...', 0)
    fetch('/api/dispatch?method=setGrayENVConfig', { method: 'post', body: JSON.stringify({ 'gray_clients': garyClients }) })
      .then(res => {
        if (res.status === 200) {
          res.json().then(res => {
            fetchEnvConfig();
            return fetch('/api/dispatch?method=reloadNginx')
          })
        } else {
          throw Error(String(res.status))
        }
      })
      .then(res => {
        message.success('success')
      })
      .catch(err => {
        message.error(err.message)
      })
      .finally(() => {
        setTimeout(() => message.destroy(), 2000)
      })
  }

  const handleConfirmTest = (testClients: Array<any>) => {
    message.loading('waiting...', 0)
    fetch('/api/dispatch?method=setTestENVConfig', { method: 'post', body: JSON.stringify({ 'test_clients': testClients }) })
      .then(res => {
        if (res.status === 200) {
          res.json().then(res => {
            fetchEnvConfig();
            return fetch('/api/dispatch?method=reloadNginx')
          })
        } else {
          throw Error(String(res.status))
        }
      })
      .then(res => {
        message.success('success')
      })
      .catch(err => {
        message.error(err.message)
      })
      .finally(() => {
        setTimeout(() => message.destroy(), 2000)
      })
  }

  return (
    <div className="page-root">
      <style jsx>{`
        .page-root {
          width: 100vw;
          height: 100vh;
          padding: 20px 10px;
        }
      `}</style>
      <GrayClient grayClients={grayClients} onConfirm={handleConfirmGray} />
      <TestClient testClients={testClients} onConfirm={handleConfirmTest} />
    </div>
  );
};

export default App;