import crypto from 'crypto';
import { Transform } from 'stream';

class FlowEnc {
    constructor(password) {
        const md5 = crypto.createHash("md5");
        const encode = md5.update(password).digest();
        const decode = []
        const length = encode.length;
        const decodeCheck = {};
        for (let i = 0; i < length; i++) {
            let enc = encode[i] ^ i;
            // 这里会产生冲突
            if (!decodeCheck[enc % length]) {
                // console.log("取模 " + enc % length);
                decode[enc % length] = encode[i] & 0xFF;
                decodeCheck[enc % length] = encode[i];
            } else {
                for (let j = 0; j < length; j++) {
                    if (!decodeCheck[j]) {
                        // 兜底，把 encode[i]后四位转成 j ^ i 的二进制值，确保decode的后四位不冲突
                        encode[i] = encode[i] & 0xF0 | (j ^ i);
                        decode[j] = encode[i] & 0xFF;
                        decodeCheck[j] = encode[i];
                        // console.log("#取模 " + j);
                        break;
                    }
                }
            }
        }
        this.password = password
        this.passwordMd5 = crypto.createHash("md5").digest('hex')
        this.encode = encode;
        this.decode = Buffer.from(decode);
        let encodeStr = ''
        let decodeStr = ''
        this.encode.forEach(e => {
            encodeStr += (e * 1) + ','
        })
        this.decode.forEach(e => {
            decodeStr += (e * 1) + ','
        })
        console.log('encode:', encodeStr)
        console.log('decode:', decodeStr)
        // 解密流转换，不能多例子
        this.md5 = function (content) {
            const md5 = crypto.createHash("md5");
            return md5.update(this.passwordMd5 + content).digest('hex');
        }
        // 加密流转换
        this.encodeTransform = function () {
            return new Transform({
                // 匿名函数确保this是指向 FlowEnc
                transform: (chunk, encoding, next) => {
                    next(null, this.encodeData(chunk));
                }
            });
        }
        // 解密流转换，不能多例子
        this.decodeTransform = function () {
            return new Transform({
                transform: (chunk, encoding, next) => {
                    // this.push(); 用push也可以
                    next(null, this.decodeData(chunk));
                }
            });
        }
        // 不处理
        this.testTransform = function () {
            return new Transform({
                transform: function (chunk, encoding, callback) {
                    callback(null, chunk);
                }
            });
        }
    }

    encodeData(data) {
        data = Buffer.from(data)
        for (let i = data.length; i--;) {
            data[i] = this.encode[data[i] % 16] ^ data[i] & 0xFF;
        }
        return data;
    }

    decodeData(data) {
        for (let i = data.length; i--;) {
            data[i] = this.decode[data[i] % 16] ^ data[i] & 0xFF;
        }
        return data
    }


}

// const flowEnc = new FlowEnc('abc1234')
// const encode = flowEnc.encodeData('测试的明文加密1234￥%#')
// const decode = flowEnc.decodeData(encode)
// console.log('@@@decode', encode, decode.toString())
// export const flowEnc = FlowEnc
export default FlowEnc  