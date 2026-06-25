const url = 'https://fullnode.testnet.sui.io:443';
const body = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'sui_getLatestSuiSystemState',
  params: []
});

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
