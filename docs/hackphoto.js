var TMPL = {
  head: '//allsports.jp/photo/photo_',
  tail: 't',
};

function toUrls(item) {
  var p = item.params, now = Math.floor(new Date().getTime() / 1000);
  var full  = item.detail.replace('/pc_watermark_3_v/', '/pc_watermark_99_v/')
                         .replace(/\/logov_.*$/, '/')
                         .replace(/(.*)_(.*)(\/pc_watermark_)/, '$1_' + now + '$3'),
	  thumb = TMPL.head + [p.event_id, p.photographer_id, p.photo_num, p.page_id, p.photo_id, p.photo_hash, TMPL.tail].join('_');
  return [full, thumb];
}


var cnt = 0, s = '';
function padding(n) { return ('000' + cnt).slice(-3) }
$.getJSON('common.json').then(r => {
  r = r.map(toUrls);
  //r = r.slice(1,13);
  r = r.map( e => (cnt++, e.map((d, i) => 'http:' + d + ' ' + padding(cnt) + (i === 0 ? '-W' : '-T') +  '.jpg')));
  return [].concat(...r)
}).then(r => console.log(r.join('\r\n')));
