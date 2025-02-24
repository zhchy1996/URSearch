const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

let previousData = null;

// 设置定时任务，每5分钟执行一次
cron.schedule('*/5 * * * *', async () => {
  // console.log('执行定时任务:', new Date().toLocaleString());
  // await fetchDataAndCompare();
  await init();
});

async function fetchMapData() {
  try {
    const params = new URLSearchParams({
      ne_lat: '34.75547747631003',
      ne_lng: '135.6973821495385',
      sw_lat: '34.586909281015494',
      sw_lng: '135.35508936389397',
      small: false
    });
    const response = await axios.post(
      'https://chintai.r6.ur-net.go.jp/chintai/api/bukken/search/map_marker/',
      params,
      {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      }
    );
    return response.data;
  } catch (error) {
    console.error('请求接口失败:', error);
  }
}

const saveData = async (data) => {
  await fs.writeFileSync(path.resolve(__dirname, './old_data.json'), data);
}

const getData = async () => {
  const data = await fs.readFileSync(path.resolve(__dirname, './old_data.json'));
  return JSON.parse(data);
}

const compareData = (data, oldData) => {
  const res = [];
  for (let i = 0;i < data.length; i++) {
    if (data[i].roomCount > oldData[i].roomCount) {
      res.push({
        id: data[i].id,
        roomCount: data[i].roomCount
      })
    }
  }
  return res;
}

const getRoomData = async id => {
  try {
    const params = new URLSearchParams({
      id
    });
    const response = await axios.post(
      'https://chintai.r6.ur-net.go.jp/chintai/api/bukken/search/map_window/',
      params,
      {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      }
    );
    return response.data;
  } catch (error) {
    console.error('请求接口失败:', error);
  } 
}

const sendNotices = async (msg) => {
  const sendMsg = encodeURIComponent(msg)
  await axios.get(`https://api.day.app/a9aHvq5BMiZiFan4YFCpxB/${sendMsg}`)
}

const genMsg = async (roomList) => {
  let msg = '';
  for (let i = 0; i < roomList.length; i++) {
      try {
        const roomData = await getRoomData(roomList[i].id)
        msg += `团地名: ${roomData.name}  位置：${roomData.access}||||`
      } catch(e) {
        console.error(e)
      }
  }
  return msg;
}

const init = async () => {
  const data = await fetchMapData();
  const oldData = await getData();
  const newList = compareData(data, oldData);
  const msg = await genMsg(newList);
  sendNotices(msg)
}
// (async () => {
// })();