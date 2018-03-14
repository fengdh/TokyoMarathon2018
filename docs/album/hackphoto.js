var TMPL = {
  head: '//allsports.jp/photo/photo_',
  tail: 't',
};

function toUrls(item) {
  var p = item.params, now = Math.floor(new Date().getTime() / 1000);
  var full  = item.detail.replace(/\/pc_watermark_3_([vh])\//, '/pc_watermark_99_$1/')
                         .replace(/\/logo._.*$/, '/')
                         .replace(/(.*)_(.*)(\/pc_watermark_)/, '$1_' + now + '$3'),
	  thumb = TMPL.head + [p.event_id, p.photographer_id, p.photo_num, p.page_id, p.photo_id, p.photo_hash, TMPL.tail].join('_');
  return [full, thumb];
}


var cnt = 0, s = '';
function padding(n) { return ('000' + cnt).slice(-3) }

function outputList(cnt, url) {
	return $.getJSON(url).then(r => {
	  r = r.map(toUrls);
	  //r = r.slice(1,13);
	  r = r.map( e => (cnt++, e.map((d, i) => 'http:' + d + ' ' + padding(cnt) + (i === 0 ? '-W' : '-T') +  '.jpg')));
	  return [].concat(...r)
	}).then(r => console.log(r.join('\r\n')));
}

outputList(0, 'album/allsp.json')
	.then( _ => outputList(300, 'album/common.json'));
