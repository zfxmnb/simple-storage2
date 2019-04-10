//simple-storage2
function storage(type) {
    if (typeof window !== 'object') {
        return
    }
    if ((type === 'sessionStorage' || type === 'session') && sessionStorage) {
        return storage.storageUtils(sessionStorage)
    } else if (localStorage) {
        return storage.storageUtils(localStorage)
    }
};

storage.storageUtils = function (currentStorage) {
    return {
        /**
         * 判断是否符合执行条件
         * @param {*} key 缓存key
         * @param {*} needKey 是否必须传key
         */
        isEnabled(key, needKey) {
            if (typeof window === 'object' && currentStorage && (!needKey || key && typeof key === 'string')) {
                return true
            }
        },

        /**
         * 过期时间格式话
         * @param {*} expires 过期时间 "2019-1-14 21:38:00"【具体时间】 || (1 | "1" | "1d")【天】 || "1h"【小时】 || "1m"【分钟】 || "1s"【秒】 || "0n"【自然日】
         */
        formatExpires(expires) {
            var date = new Date(),
                unit = 86400000; //天
            if (typeof expires === 'string') {
                var time = parseFloat(expires);
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
                    var arr = expires.trim().split(/\D+/g);
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
            var expires = extra.expires,
                resetData = extra.resetData;
            if (!this.isEnabled(key, true) || data === undefined) {
                return false
            }
            if (expires) {
                expires = this.formatExpires(expires);
                if (expires) {
                    var dataobj = {
                        operateTime: Date.now(),
                        expires,
                        data
                    }
                    resetData && (dataobj.resetData = resetData);
                    currentStorage.setItem(key, JSON.stringify(dataobj));
                    console.log('设置，过期时间:', new Date(expires));
                } else {
                    return false
                }
            } else {
                var dataobj = {
                    operateTime: Date.now(),
                    data
                }
                currentStorage.setItem(key, JSON.stringify(dataobj));
            }
            return true
        },

        /**
         * 获取缓存
         * @param {*} key 缓存key
         */
        get(key) {
            if (!this.isEnabled(key, true)) {
                return
            }
            var data, storageData = currentStorage.getItem(key);
            if (storageData && typeof storageData === 'string') {
                try {
                    data = JSON.parse(storageData);
                } catch (err) {
                    //console.warn('getStorage', key, err);
                }
            }
            if (data && data.expires && Date.now() > data.expires) {
                if (data.resetData) {
                    data = data.resetData;
                    this.set({
                        key,
                        data
                    });
                    console.log('获取，已过期时间:', new Date(data.expires));
                } else {
                    this.remove(key);
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
         * 获取过期时间
         * @param {*} key 缓存key
         */
        getExpire(key) {
            if (!this.isEnabled(key, true)) {
                return
            }
            var storageData = currentStorage.getItem(key);
            if (storageData && typeof storageData === 'string') {
                try {
                    var data = JSON.parse(storageData);
                    if (data && data.expires) {
                        return data.expires
                    }
                } catch (err) {
                    //console.warn('getStorage', key, err);
                }
            }
            return null
        },

        /**
         * 获取所有缓存
         */
        getAll() {
            var _this = this,
                keys = this.getkeys(),
                results = [];
            keys.forEach(function (key) {
                results.push({
                    key,
                    data: _this.get(key)
                })
            });
            return results;
        },

        /**
         * 获取所有缓存key
         */
        getkeys() {
            var i = 0,
                keys = [];
            while (currentStorage.key(i)) {
                keys.push(currentStorage.key(i));
                i++;
            }
            return keys;
        },

        /**
         * 移除缓存
         * @param {*} key 缓存key
         */
        remove(key) {
            if (!this.isEnabled(key, true)) {
                return
            }
            const Key = currentStorage.key;
            currentStorage.removeItem(key);
            currentStorage.key = Key;
        },

        /**
         * 清除过期缓存
         * @param {*} isExpires 执行清除过期缓存
         */
        clear(isExpires) {
            if (!this.isEnabled()) {
                return
            }
            if (isExpires) {
                var _this = this,
                    keys = this.getkeys();
                keys.forEach(function (key) {
                    _this.get(key)
                });
            } else {
                currentStorage.clear();
            }
        }
    }
};

(function (root) {
    var defaultStorage = storage.storageUtils(root.localStorage);
    for (var key in defaultStorage) {
        storage[key] = defaultStorage[key]
    }
})(this);

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else if (root.storage) {
        root.storage = factory();
    }
})(this, function () {
    console.log(storage)
    return storage;
});