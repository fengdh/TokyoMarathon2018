// Collect Race Result for Tokyo marathon

(function go() {

// define race year and urls
var RACE_YEAR = '2021/'; // or '' for the latest race year
var TM_URL    = { index : `https://www.marathon.tokyo/${RACE_YEAR}result/index.php`,
                 detail : `https://www.marathon.tokyo/${RACE_YEAR}result/detail.php` };

// define number cards to collect, or leave it empty (=[ ]) to collect all racers by nationality/region
var NUM_CARDS = ['13791', '32026', '18462', '62048'];

var REGION    = 'CHN';
     
var script = document.createElement('script');
script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
script.type = 'text/javascript';
script.onload = function() {
    // using defined number cards or start collect number cards from page 1
    $.when(collect_number_cards())
     .then(list => {
                list = [...list, ...NUM_CARDS];
                console.log('Number Cards count = ', list.length, list);
                // list = list.slice(0, 10);

                return $.when.apply(null, list.map(one)).then(function() {
                    return [].slice.call(arguments)
                });
                script.remove();
            }
    ).then(console.log);
}
document.getElementsByTagName('head')[0].appendChild(script);

function collect_number_cards(page = 1, cards = [], data = {country: REGION, sort_key: 'place', sort_asc: 1}) {
    return $.post({url: TM_URL.index, data: { ...data, page} })
        .then(    h => $(h).find('.m-item_tbl').eq(0).find('tr').slice(1))
        .then($rows => $rows.map((i, r) => $(r).children().eq(2).text()).toArray())
        .then(  arr => {
                console.log('Collecting number cards, page ', page);
                [].push.apply(cards, arr);
                if (arr.length > 0) {
                    return collect_number_cards(++page, cards)
                } else {
                    console.log(cards);
                }
                return cards;
            });
}



var _txt_  = (i, e) => $(e).text();
var _html_ = (i, e) => $(e).html();
var _prop_ = t => t.replaceAll(/(^.*(<br>|／))|[ )]/g, '').replaceAll(/[(]/g, '_');

function one(d_number) {
    return $.post({url: TM_URL.detail, data: { d_number} })
        .then(d => $(d))
        .then($html => $html.find('.cont3 .m-item_tbl'))
        .then($tbls => {
            var $rows, titles, values, ret = {};

            // parse block A: number/name/overall place
            $rows  = $tbls.eq(0).find('tr');
            titles = $rows.eq(0).find('th').map(_html_)
                                        .toArray().map(_prop_);
            values = $rows.eq(1).find('td').map(_txt_);
            
            titles.reduce((p, c, i) => (p[c] = values[i], p), ret);

            console.log('  loading details for', d_number, ret.Name);
            
            // parse block B: more details
            $rows = $tbls.eq(1);
            $rows.find('tr').map( (i, row) => { 
                    var $cells = $(row).children();
                    ret[_prop_($cells.eq(0).text())] = $cells.eq(1).text();

                    var arr = $cells.eq(2).text().split('：');
                    arr.length > 1 && (ret[_prop_(arr[0])] = arr[1]);
                });

            // parse block C: lap times
            var laps = ret.laps = [];
            $tbls.eq(2).find('tr').slice(1)
                            .map((i, row) => { 
                                    var $row = $(row),
                                        cells = $row.children().map(_txt_).toArray(),
                                        odd = i % 2;
                                    if (odd) {
                                        cells = i < 8
                                            ? [...$row.next().children().map(_txt_).toArray(), ...cells]
                                            : [...cells, ...(i == 9 ? $row.prev() : $row).prev().children().map(_txt_).toArray()];
                                        }; 
                                    if (i == 0 || odd ) {
                                        var entry = { point: _prop_(cells[0]),
                                                    elapsed: cells[1],
                                                        lap: cells[2] };
                                        if (i == 7) { entry.lap = '-' }
                                        laps.push(entry);
                                    }
                                });
            
            return ret;
        });
    }

})();
