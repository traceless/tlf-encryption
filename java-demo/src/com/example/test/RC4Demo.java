package com.example.test;

import java.util.Random;
import java.util.Scanner;

public class RC4Demo {
    public static void main(String[] args) {
        //  输入明文
        System.out.println("请输入明文：");
        Scanner sc = new Scanner(System.in);
        String plainText = sc.nextLine();
 
        //  获取随机密钥
        System.out.println("请输入密钥长度：");
        int keylen = sc.nextInt();
        String key = getKey(keylen);
        System.out.println("随机密钥是：" + key);
 
        //  进行加密和解密并打印
        String cipher = Encrypt(plainText, key);
        String plainer = Encrypt(cipher, key);
        System.out.println("'" + plainText + "'" + "加密后密文是：" + cipher);
        System.out.println("'" + cipher + "'" + "解密后明文是：" + plainer);
    }
 
    //  随机密钥方法
    public static String getKey(int keylen) {
        char[] k = new char[keylen];
        Random r = new Random();
        for (int i = 0; i < keylen; i++) {
            k[i] = (char) ('a' + r.nextInt() % 26);
        }
        String s = new String(k);
        return s;
    }
 
    //  加密方法
    public static String Encrypt(String plainText, String key) {
        // 1.1 初始化一个S表和一个K表
        int[] S = new int[256];
        byte[] K = new byte[256];
 
        // 初始化一个密钥流
        Character[] keySchedul = new Character[plainText.length()];
 
        //  1.2 调用KSA方法对S表进行初始排列
        KSA(S, K, key);
 
        //  1.3 调用PRGA方法产生密钥流
        PRGA(S, keySchedul, plainText.length());
 
        // 存放密文结果
        StringBuffer cipherResult = new StringBuffer();
 
        //  进行加密--用明文和密钥流进行异或操作
        for (int i = 0; i < plainText.length(); i++) {
            int num = plainText.charAt(i) ^ keySchedul[i];
            System.out.println("@@@:" + num);
            cipherResult.append((char) (plainText.charAt(i) ^ keySchedul[i]));
        }
        
        return cipherResult.toString();
    }
 
    //  RSA密钥调度算法---实现用K表对S表的置换
    public static void KSA(int[] S, byte[] K, String keyStr) {
        byte[] key = keyStr.getBytes();
        //  对S表进行初始赋值
        for (int i = 0; i < 256; i++) {
            S[i] = i;
        }
        //  用种子密钥对K表进行填充
        for (int i = 0; i < 256; i++) {
            K[i] = (byte) key[i % key.length];
    
        }
        //  对S表进行置换
        int j = 0;
        for (int i = 0; i < 256; i++) {
            j = (j + S[i] + K[i]) % 256;
            swap(S, i, j);
        }
        StringBuffer kbuffer = new StringBuffer();
        for (int i = 0; i < 256; i++) {
            kbuffer.append(S[i] + ",");
        }
       
        System.out.println(kbuffer.toString());
    }
 
    //  PRGA--伪随机生成算法--利用上面重新排列的S盒来产生任意长度的密钥流
    public static void PRGA(int[] S, Character[] keySchedul, int plainTextLen) {
        int i = 0, j = 0;
        for (int k = 0; k < plainTextLen; k++) {
            i = (i + 1) % 256;
            j = (j + S[i]) % 256;
            swap(S, i, j);
            keySchedul[k] = (char) (S[(S[i] + S[j]) % 256]);
        }
 
 
    }
 
    //  交换方法，实现交换两个位置的元素
    public static void swap(int[] S, int i, int j) {
        int temp = S[i];
        S[i] = S[j];
        S[j] = temp;
    }
}