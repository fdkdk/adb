// 美柚 去广告[WorkBuddy 自写 v3]
// 思路：与懂球帝同款通用清理（国内 App 广告 SDK 常用 sdk/addata 等同名字段），
//      并扩展覆盖更多开屏广告专属字段名。递归遍历响应 JSON，清空/删除广告相关
//      字段与对象；非 meiyou 请求、非 JSON、解析失败均原样放行，绝不崩。
//      注：美柚无公开现成 QX 脚本可参考，本脚本为启发式；若仍漏广告，请抓一条
//      美柚广告接口响应发来，按真实结构精准化。
(function () {
  var reqUrl = ($request && ($request.url || $request.URL)) || "";
  if (!/meiyou/i.test(reqUrl)) { $done({}); return; }

  var body = ($response && $response.body) || "";
  if (typeof body !== "string" || body.trim() === "") { $done({}); return; }

  var prefix = "", suffix = "", core = body;
  var open = body.search(/\{|\[/);
  var close = body.lastIndexOf("}");
  var closeB = body.lastIndexOf("]");
  var end = close > closeB ? close : closeB;
  if (open > 0) prefix = body.slice(0, open);
  if (end >= 0 && end < body.length - 1) suffix = body.slice(end + 1);
  if (open >= 0 && end >= open) core = body.slice(open, end + 1);

  try {
    var obj = JSON.parse(core);

    // 广告字段（命中即清空数组 / 删除对象 / 删除标量）
    var AD_FIELDS = [
      "sdk", "addata", "ad", "ads", "adInfo", "ad_info", "adinfo", "advert", "advertisement",
      "adType", "ad_type", "adId", "ad_id", "isAd", "is_ad", "promotion", "promotions", "promote",
      "splash", "splashAd", "splash_img", "launchAd", "launch", "openAd", "openScreen", "open_screen",
      "startupAd", "startup", "bootAd", "welcomeAd", "boot", "bootImg",
      "banner", "bannerAd", "bannerInfo", "banner_img", "bannerUrl", "banner_url",
      "popup", "popupAd", "popupInfo", "popup_img", "floatAd", "float", "floatWindow",
      "feedAd", "feeds_ad", "feed_ad", "nativeAd", "native", "insertAd", "insert", "insert_img",
      "videoAd", "video_ad", "preroll", "preRoll", "interstitial", "interstitialAd",
      "recommendAd", "recommend_ad", "adView", "adBanner", "adData", "ad_data", "adList", "ad_list"
    ];

    function isAdObj(o) {
      if (!o || typeof o !== "object") return false;
      if (o.ad_info && typeof o.ad_info === "object") return true;
      if (o.is_ad === true || o.isAd === true) return true;
      if (typeof o.data_type === "string" && /ad/i.test(o.data_type)) return true;
      if (o.advertisement === true) return true;
      if (o.ad_type !== undefined && o.ad_type !== null && o.ad_type !== "") return true;
      if (o.ad === true || (typeof o.ad === "string" && o.ad.length)) return true;
      if (o.promotion === true) return true;
      if (typeof o.ad_source === "string" && /ad|广告/.test(o.ad_source)) return true;
      return false;
    }

    function cleanArray(arr) {
      if (!Array.isArray(arr)) return arr;
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        var it = arr[i];
        if (isAdObj(it)) continue;
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
        var lk = ("" + k).toLowerCase();
        var hit = (AD_FIELDS.indexOf(k) !== -1) || (AD_FIELDS.indexOf(lk) !== -1);
        if (hit) {
          if (Array.isArray(v)) r[k] = [];          // 广告数组清空
          else if (v && typeof v === "object") continue; // 广告对象删除
          else continue;                            // 广告标量删除
          continue;
        }
        if (Array.isArray(v)) r[k] = cleanArray(v);
        else if (v && typeof v === "object") r[k] = cleanObject(v);
        else r[k] = v;
      }
      return r;
    }

    var res = cleanObject(obj);
    $done({ body: prefix + JSON.stringify(res) + suffix });
  } catch (e) {
    $done({});
  }
})();
