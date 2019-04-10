# simple-storage2
```js
import Storage from "simple-storage2";
/**
 * var storage = Storage('session'); // sessionStorage
 * or
 * var storage = Storage || Storage('local'); // localStorage
 */

/**
 * set item
 * @param {*} key
 * @param {*} data
 * @param {expires, resetData} resetData: expire after data
 *  expires "2019-1-14 21:38:00" 【time string】| 1【timestamp】 || ("1" | "1d")【day】 || "1h"【hours】 || "1m"【minutes】 || "1s"【seconds】 || "0n"【today+】
 */
storage.set(key, data, extra);
 
// get item
storage.get(key);

// get expire
storage.getExpire(key)
 
// get all items
storage.getAll();
 
// get all key
storage.getKeys();
 
// remove item
storage.remove(key);
 
// remove all items param: isExpires //clear expire storage
storage.clear(isExpires);
```