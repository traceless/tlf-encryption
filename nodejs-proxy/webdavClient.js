import { AuthType, createClient } from "webdav";

let url = 'http://192.168.8.21:5244/dav/aliyun'
const client = createClient(url, {
    username: "admin",
    password: "5u9uQtQF"
});

const start = async function () {
    const directoryItems = await client.getDirectoryContents("/");
    console.log('directoryItems', directoryItems)
};

start()