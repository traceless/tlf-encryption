# Flow-encryption
一个简单的流加密方案，可以用在对加密要求不高的地方，有一些场景还是非常适合的。R4C的算法方案固然是更好的，但是实现和使用起来会比较复杂一些，对业务代码的耦合比较强。这个加密实现简单，可以直接代理中间的流量。

## 一、实现的思路

1、关于流加密的算法有很多，基本原理都是对字节进行`异或运`算，最简单的一个流加密实现就是一个固定的字节，比如 11001100和每个字节进行异或运算，但是这样的方式就很容易被别人破解。

2、那么我们可以简单的准备一组加密的字节，比如11001100,10001000,10011001...，如果明文的字节为 10001000，那么它对应的encode加密字节就为11001100，以此类推，所以我们要准备一个明文和加密byte的`映射`。

3、假设我们随机生成16个加密的字节（暂用int整型来标识） encode:  [161 65 196 121 39 146 155 194 209 251 110 51 103 33 96 240] ，明文的后四位（0-15）就是对应ecode的数组的`index位置`。比如明文xxxx0001，那么它对应就是 ecode[1]，如xxxx0011 -> encode[3]，以此类推，所有的明文都可以找到对应的ecode byte。

我们可以得到明文和加密encode数组的映射:

| 明文 byte | xxxx0000 | xxxx0001 |xxxx0010 | xxxx0011 |xxxx0100 | ... |
| :-----| ----: | ----: |----: | ----: |----: | ----: |
| 加密 byte | 10100001 | 01000001 |11000100 | 01111001 |00100111 | ... |
| 加密后 byte | xxxx0001 | xxxx0000 |xxxx0110 | xxxx1010 |xxxx0011 | ... |
| 密文后四位 | 1 | 0 |6 | 10 |3 | ... |

从上面可以得出加密后的密文的规则，比如密文等于xxxx0001，那么它对应的encode加密字节就是10100001，如：xxxx0011 -> 00100111，按照这方式进行解密即可。但是密文后四位会有冲突，很可能都会出现 xxxx0110 -> 6，只要找一个没有被占用的数字比如2，然后修改ecode byte`使得密文后四位`等于xxxx0010就可以了。

ecode的数组生成我们可以使用MD5的方式进行创建，然后再生成decode的数组，当然解决取模冲突后，原本encode也会发生变化，具体看代码实现。

## 二、算法的优缺点

- 缺点：这个算法实现比较简单，破解的难度我也不好去验证，毕竟是固定的密码，通过某些流数据特征还是比较容易破解的（比如class文件开头的四个字节是固定的0x CAFEBABE）。如果是单纯的暴力破解应该还是比较难的吧。另外可以根据原文件就能得到encode和decode，这个解决的方案在算法优化有提到。

- 优点：算法很简单，可以嵌入到很多代理的中间件中，对流的加密不用入侵到业务代码中，可透传加解密，没有中间停留的过程。另外文件解密只要给对方decode就可以了。

## 三、算法的优化方向

1、因为上面的是固定加密encode，如果encode泄露了，那么其他的已经加密的数据也会出现问题。那么我们也可以通过流的某些属性或特征作为MD5的salt，这样每次生成的密码本也会不一样。比如传输的是文件，那么文件的长度是比较容易获取到的，可以作为md5的salt。

2、目前采用的是16个字节，如果要换成32个字节，那么可能破解的难度是否增加？这个我没有去研究，毕竟16个字节破解的难度我不好计算出来。

## 四、其他流算法
1、流密码算法有RC4、A5/1、ZUC等，它们的实现可能会更加安全，也可以用业内一些成熟的方案。不过还是要根据实际业务需求来使用，这些算法也许并不能满足业务需求。


## 五、使用场景

httpProxy.js 是一个http代理服务器的实现，可以针对性对webdav的流量进行挟持，使用流加密的方式可以对上传的文件，下载的文件进行加解密。也可以对一些在线视频播放的流进行实时解密。

1、目前给出的ndoejs的demo版本，测试上传，删除，移动，下载（302还没解决）都可以正常使用.

2、待完善：
- nodejs版本的加解密还没实现。
- 302跳转的问题还没解决，但不影响基本可用。



 