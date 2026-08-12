// 懂球帝 去广告[WorkBuddy 自写]
// 作用：递归清理 api.dongqiudi.com 响应 JSON 中的广告条目
// 只删除带有「强广告信号」的对象（ad_info / is_ad / data_type 含 ad / advertisement / ad_type），
// 正常内容不受影响。非 JSON 或解析失败时原样返回，绝不崩。
(function () {
  var body = ($response && $response.body) || "";
  try {
    var obj = JSON.parse(body);

    function isAd(o) {
      if (!o || typeof o !== "object") return false;
      // 只要存在 ad_info 对象（含空对象）即视为广告标记
      if (o.ad_info !== undefined && o.ad_info !== null && typeof o.ad_info === "object") return true;
      if (o.is_ad === true) return true;
      if (typeof o.data_type === "string" && /ad/i.test(o.data_type)) return true;
      if (o.advertisement === true) return true;
      if (o.ad === true) return true;
      if (o.promotion === true) return true;
      if (o.ad_type !== undefined && o.ad_type !== null && o.ad_type !== "") return true;
      return false;
    }

    function cleanArray(arr) {
      if (!Array.isArray(arr)) return arr;
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        var it = arr[i];
        if (isAd(it)) continue;
        if (Array.isArray(it)) out.push(cleanArray(it));
        else if (it && typeof it === "object") out.push(cleanObject(it));
        else out.push(it);
      }
      return out;
    }

    function cleanObject(o) {
      if (!o || typeof o !== "object") return o;
      var r = {};
      for (var k in o) {
        if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
        var v = o[k];
        if (Array.isArray(v)) r[k] = cleanArray(v);
        else if (v && typeof v === "object") r[k] = cleanObject(v);
        else r[k] = v;
      }
      return r;
    }

    var res = cleanObject(obj);
    $done({ body: JSON.stringify(res) });
  } catch (e) {
    // 非 JSON / 解析失败：原样放行
    $done({});
  }
})();
