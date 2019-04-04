//simple-storage2
const storage = {
    /**
     * 判断是否符合执行条件
     * @param {*} key 缓存key
     * @param {*} needKey 是否必须传key
     */
    isEnabled(key, needKey) {
        if (typeof window === 'object' && localStorage && (!needKey || key && typeof key === 'string')) {
            return true
        }
    },

    /**
     * 过期时间格式话
     * @param {*} expires 过期时间 "2019-1-14 21:38:00"【具体时间】 || (1 | "1" | "1d")【天】 || "1h"【小时】 || "1m"【分钟】 || "1s"【秒】 || "0n"【自然日】
     */
    formatExpires(expires) {
        let date = new Date(),
            unit = 86400000; //天
        if (typeof expires === 'string') {
            const time = parseFloat(expires);
            if (expires.includes('n') && !isNaN(time) && time >= 0) {
                //自然日
                date.setTime(date.getTime() + unit * parseInt(time));
                date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
                expires = date.getTime();
            } else if (/^\w+$/.test(expires) && !isNaN(time) && time > 0) {
                //天/时/分/秒
                if (expires.includes('h')) {
                    unit = 3600000; //时
                } else if (expires.includes('m')) {
                    unit = 60000; //分
                } else if (expires.includes('s')) {
                    unit = 1000; //秒
                }
                date.setTime(date.getTime() + unit * parseFloat(expires));
                expires = date.getTime();
            } else {
                //时间格式字符串
                let arr = expires.trim().split(/\D+/g);
                if (arr.length >= 3 && !isNaN(arr[0]) && !isNaN(arr[1]) && !isNaN(arr[2])) {
                    date = new Date(arr[0], arr[1] - 1, arr[2], parseInt(arr[3]) || 23, parseInt(arr[4]) || 59, parseInt(arr[5]) || 59);
                    expires = date.getTime()
                } else {
                    expires = 0
                }
            }
        } else if (typeof expires === 'number' && expires > 0) {
            expires = date.getTime() + expires;
        } else {
            expires = 0;
        }
        return expires
    },

    /**
     * 设置缓存，可设置过期时间
     * @param {*} key 缓存key
     * @param {*} data 缓存数据
     * @param {expires, resetData} resetData: expire after data
     *  expires "2019-1-14 21:38:00" 【time string】| 1【timestamp】 || ("1" | "1d")【day】 || "1h"【hours】 || "1m"【minutes】 || "1s"【seconds】 || "0n"【today+】
     */
    set(key, data, extra) {
        if (typeof extra !== 'object') {
            extra = {}
        }
        let {
            expires,
            resetData
        } = extra;
        if (!storage.isEnabled(key, true) && data !== undefined) {
            return false
        }
        if (expires) {
            expires = storage.formatExpires(expires);
            if (expires) {
                const dataobj = {
                    operateTime: Date.now(),
                    expires,
                    data
                }
                resetData && (dataobj.resetData = resetData);
                localStorage.setItem(key, JSON.stringify(dataobj));
                console.log('设置，过期时间:', new Date(expires));
            } else {
                return false
            }
        } else {
            const dataobj = {
                operateTime: Date.now(),
                data
            }
            localStorage.setItem(key, JSON.stringify(dataobj));
        }
        return true
    },

    /**
     * 获取缓存
     * @param {*} key 缓存key
     */
    get(key) {
        if (!storage.isEnabled(key, true)) {
            return
        }
        let data, storageData = localStorage.getItem(key);
        if (typeof storageData === 'string') {
            try {
                data = JSON.parse(storageData);
            } catch (err) {
                console.warn('getStorage', key, err);
            }
        }
        if (data && data.expires && Date.now() > data.expires) {
            if (data.resetData) {
                data = data.resetData;
                storage.set({
                    key,
                    data
                });
                console.log('获取，已过期时间:', new Date(data.expires));
            } else {
                storage.remove(key);
                console.log('获取，已过期时间:', new Date(data.expires));
                data = undefined;
            }
        } else if (data && data.operateTime) {
            data = data.data;
        } else {
            data = storageData
        }
        return data
    },

    /**
     * 获取所有缓存
     */
    getAll() {
        const keys = storage.getkeys();
        let results = [];
        keys.forEach((key) => {
            results.push({
                key,
                data: storage.get(key)
            })
        });
        return results;
    },

    /**
     * 获取所有缓存key
     */
    getkeys() {
        let i = 0,
            keys = [];
        while (localStorage.key(i)) {
            keys.push(localStorage.key(i));
            i++;
        }
        return keys;
    },

    /**
     * 移除缓存
     * @param {*} key 缓存key
     */
    remove(key) {
        if (!storage.isEnabled(key, true)) {
            return
        }
        const Key = localStorage.key;
        localStorage.removeItem(key);
        localStorage.key = Key;
    },

    /**
     * 清除过期缓存
     * @param {*} isExpires 执行清除过期缓存
     */
    clear(isExpires) {
        if (!storage.isEnabled()) {
            return
        }
        if (isExpires) {
            const keys = storage.getkeys();
            keys.forEach((key) => {
                storage.get(key)
            });
        } else {
            localStorage.clear();
        }
    }
};
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.storage = factory();
    }
}(this, () => {
    return storage;
}));