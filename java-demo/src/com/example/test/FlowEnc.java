package com.example.test;

import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;


/**
 * @author doctor
 * @date 2021-06-28
 */
public class FlowEnc {

    public static byte[] encode;

    public static byte[] decode = new byte[16];

    public static void main(String[] args) throws NoSuchAlgorithmException, UnsupportedEncodingException {

        String paasword = "abc1234";
        String plaintext = "测试的明文加密1234￥%#";
        initEnc(paasword);

        String base64Str = encodeData(plaintext);
        System.out.println("base64Str: " + base64Str);
        plaintext = decodeData(base64Str);
        System.out.println("解密plaintext: " + plaintext);

    }

    public static void initEnc(String password) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("MD5");
        encode = md.digest(password.getBytes());
        int length = encode.length;
        Set<Integer> decodeCheck = new HashSet<>();
        for (int i = 0; i < length; i++) {
            int enc = Byte.toUnsignedInt(encode[i]) ^ i;
            // 这里会产生冲突
            if (!decodeCheck.contains(enc % length)) {
                System.out.println("取模 " + enc % length);
                decode[enc % length] = encode[i];
                decodeCheck.add(enc % length);
            } else {
                for (int j = 0; j < length; j++) {
                    if (!decodeCheck.contains(j)) {
                        // 兜底，把 encode[i]后四位转成 j ^ i 的二进制值，确保decode的后四位不冲突
                        encode[i] = (byte) (encode[i] & 0xF0 | (j ^ i));
                        decode[j] = encode[i];
                        decodeCheck.add(j);
                        System.out.println("#取模 " + j);
                        break;
                    }
                }
            }
        }
        String encodeStr = "";
        String decodeStr = "";
        for (int i = 0; i < length; i++) {
            encodeStr += Byte.toUnsignedInt(encode[i]) + ",";
            decodeStr += Byte.toUnsignedInt(decode[i]) + ",";
        }
        System.out.println("encode: " + encodeStr);
        System.out.println("decode: " + decodeStr);
    }

    public static String encodeData(String inputString) throws NoSuchAlgorithmException, UnsupportedEncodingException {
        byte[] data = inputString.getBytes("utf-8");
        byte[] res = encodeData(data);
        return Base64.getEncoder().encodeToString(res);
    }

    public static byte[] encodeData(byte[] data) throws NoSuchAlgorithmException, UnsupportedEncodingException {
        // 翻转密码
        for (int i = 0; i < data.length; i++) {
            int index = Byte.toUnsignedInt(data[i]) % 16;
            int enc = encode[index] ^ data[i];
            byte encdata = (byte) (enc & 0xFF);
            data[i] = encdata;
        }
        return data;
    }

    public static String decodeData(String base64Str) throws NoSuchAlgorithmException, UnsupportedEncodingException {
        byte[] data = Base64.getDecoder().decode(base64Str);
        byte[] res = decodeStr(data);
        return new String(res, "utf-8");
    }

    public static byte[] decodeStr(byte[] data) throws NoSuchAlgorithmException, UnsupportedEncodingException {
        // 翻转密码
        for (int i = 0; i < data.length; i++) {
            int index = Byte.toUnsignedInt(data[i]) % 16;
            int inx = decode[index] ^ data[i];
            byte encdata = (byte) (inx & 0xFF);
            // System.out.println("@密文 " + byteToBinary(data[i]) + " 解密的秘钥 " +
            // byteToBinary(decode[index]) + " 解密的明文 "
            // + intToBinary(by) + " index " + index);
            data[i] = encdata;
        }
        return data;
    }

    public static String byteToBinary(byte b) {
        String result = "";
        byte a = b;
        ;
        for (int i = 0; i < 8; i++) {
            byte c = a;
            a = (byte) (a >> 1);// 每移一位如同将10进制数除以2并去掉余数。
            a = (byte) (a << 1);
            if (a == c) {
                result = "0" + result;
            } else {
                result = "1" + result;
            }
            a = (byte) (a >> 1);
        }
        return result;
    }

    public static String intToBinary(int n) {
        String s = "";
        while (n > 0) {
            s = ((n % 2) == 0 ? "0" : "1") + s;
            n = n / 2;
        }
        return s;
    }

}
