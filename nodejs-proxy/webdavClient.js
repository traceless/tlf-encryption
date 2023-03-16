import { AuthType, createClient } from "webdav";

let url = 'http://192.168.8.21:5344/dav/tianyi'
const client = createClient(url, {
    username: "admin",
    password: "YiuNH7ly"
});

const start = async function () {
    const directoryItems = await client.getDirectoryContents("/");
    console.log('directoryItems', directoryItems)
};

start()