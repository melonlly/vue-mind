import { message } from 'ant-design-vue'

/**
 * 生成uuid
 * @param {*} len 生成的uuid长度
 * @param {*} radix 进制
 */
export function getUuid (len, radix) {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    let i
    const uuid = []
    radix = radix || chars.length
  
    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix]
    } else {
      // rfc4122, version 4 form
      let r
  
      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
      uuid[14] = '4'
  
      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16
          uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r]
        }
      }
    }
    return uuid.join('')
}
  
export const uuid = getUuid
 

/**
 * 移动数组
 * @param {*} array 
 * @param {*} fromIndex 
 * @param {*} toIndex 
 */
export function arrayMove(array, fromIndex, toIndex) {
    var obj = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, obj);
}

export const getObjType = obj => {
    const type = Object.prototype.toString.call(obj)
    const array = type.split(/\s/g)
    return array[1].replace(']', '')
}

// 判断是否为空
export const isEmpty = obj => {
    const type = getObjType(obj)
    let flag = false
    switch (type) {
        case 'Null':
            flag = true
            break
        case 'Undefined':
            flag = true
            break
        case 'String':
        if (obj.trim() === '') {
            flag = true
        }
            break
        case 'Array':
        if (obj.length === 0) {
            flag = true
        }
            break
        default:
            flag = false
    }
    return flag
}

/* 简单的错误提示 */
export const showErrorTip = (error, defaultContent) => {
    const content = error.message || defaultContent
    message.error(content)
}

// 加密
export const encrypt = (word, keyStr) =>  {
    keyStr = keyStr ? keyStr : 'hsytarwjhlophg18';
    var key  = CryptoJS.enc.Utf8.parse(keyStr);//Latin1 w8m31+Yy/Nw6thPsMpO5fg==
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, {mode:CryptoJS.mode.ECB,padding: CryptoJS.pad.Pkcs7});
    return encrypted.toString();
}

// 解密
export const decrypt = (word, keyStr) =>  {
    keyStr = keyStr ? keyStr : 'hsytarwjhlophg18';
    var key  = CryptoJS.enc.Utf8.parse(keyStr);//Latin1 w8m31+Yy/Nw6thPsMpO5fg==
    var decrypt = CryptoJS.AES.decrypt(word, key, {mode:CryptoJS.mode.ECB,padding: CryptoJS.pad.Pkcs7});
    return CryptoJS.enc.Utf8.stringify(decrypt).toString();
}
