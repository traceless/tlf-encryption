package main

import (
	"crypto/md5"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
)

// MD5加密
func genMd5(code string) (string, [16]byte) {
	c1 := md5.Sum([]byte(code)) //返回[16]byte数组
	Md5 := md5.New()
	_, _ = io.WriteString(Md5, code)
	return hex.EncodeToString(Md5.Sum(nil)), c1
}

// 初始化code和decode 的数据
func initEnc(password string) ([16]byte, [16]byte) {
	// 初始化[16]byte数组
	var md5Str, encode = genMd5(password)
	var decode [16]byte
	fmt.Println("md5Str: ", md5Str)

	// 仅仅用来判断是否已经存在index
	decodeCheck := make(map[int]byte, 16)

	var i, j int
	for i = 0; i < len(encode); i++ {
		var intd = uint8(encode[i])
		var dec = int(intd) ^ i
		_, exist := decodeCheck[dec%16]
		if !exist {
			decodeCheck[dec%16] = encode[i]
			decode[dec%16] = encode[i]
			fmt.Println("取模 ", dec%16)
		} else {
			for j = 0; j < 16; j++ {
				_, exist := decodeCheck[j]
				if !exist {
					// 兜底，把 encode[i]后四位转成 j ^ i 的二进制值，确保decode的后四位不冲突
					encode[i] = encode[i]&0xF0 | byte((j ^ i))
					decode[j] = encode[i]
					decodeCheck[j] = decode[j]
					fmt.Println("#取模 ", j)
					break
				}
			}
		}
	}
	fmt.Println("encode: ", encode)
	fmt.Println("decode: ", decode)
	return encode, decode
}

func encodeData(data []byte, encode [16]byte) []byte {
	var array []byte = make([]byte, len(data))
	var i int
	for i = 0; i < len(data); i++ {
		var index = uint8(data[i]) % 16
		var enc = encode[index] ^ data[i]
		var encdata = enc & 0xFF
		array[i] = encdata
	}
	return array
}

func decodeData(data []byte, decode [16]byte) []byte {
	var array []byte = make([]byte, len(data))
	var i int
	for i = 0; i < len(data); i++ {
		var index = uint8(data[i]) % 16
		var inx = decode[index] ^ data[i]
		var encdata = inx & 0xFF
		array[i] = encdata
	}
	return array
}

func main() {
	var encode, decode = initEnc("abc1234")
	var plaintext = "测试的明文加密1234￥%#"
	var encodeBytes = encodeData([]byte(plaintext), encode)
	var base64Str = base64.StdEncoding.EncodeToString(encodeBytes)
	// 加密后输入base64
	fmt.Println("base64Str:", base64Str)
	var decodeBytes = decodeData(encodeBytes, decode)
	// 输出明文
	plaintext = string(decodeBytes)
	fmt.Println("解密后plaintext:", plaintext)

}
