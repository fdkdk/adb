// 美柚 去广告[WorkBuddy 自写]
// 作用：递归清理 *.meiyou.com 响应 JSON 中的广告 / 开屏对象
//  1) 删除数组里带「强广告信号」的条目（ad_info / is_ad / data_type 含 ad / advertisement / ad / promotion / ad_type / 开屏字段）
//  2) 删除 key 名为广告 / 开屏专属字段（ad / ads / advert / splash / launchAd / openAd / startupAd / bootAd / welcomeAd / adinfo / adbanner / adview 等）的对象或数组
// 正常内容不受影响。非 JSON 或解析失败时原样返回，绝不崩。
(function () {
  var body = ($response && $response.body) || "";
  // key 名明显是广告/开屏的字段，直接整段丢弃
  var AD_KEY_RE = /^(ad|ads|advert|advertise?ment|splash|splashad|launchad|openad|openscreenad|startupad|bootad|welcomead|adinfo|ad_info|adbanner|adview|bannerad|feedad|nativead|insertad|popupad|fullscreenad)$/i;
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
      // 开屏广告典型字段
      if (o.splash !== undefined && o.splash !== null && (typeof o.splash === "object" || typeof o.splash === "string")) return true;
      if (o.launchAd !== undefined || o.openAd !== undefined || o.startupAd !== undefined || o.bootAd !== undefined) return true;
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
        // 删除 key 名明显是广告 / 开屏的字段
        if (AD_KEY_RE.test(k)) continue;
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
