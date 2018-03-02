// Runner grades
var GRADE = {
          M: [  ['0:00', '2:51'],  // god!       sub 2:00
                ['2:52', '3:13'],  // semigod,   sub 2:13, 男子国际健将
                ['3:14', '3:19'],  // legend,    sub 2:19, 男子国家健将
                ['3:20', '3:39'],  // superhero, sub 2:34, 男子国家一级
                ['3:40', '3:55'],  // diamond,   sub 2:45, 東馬直通，男子海外，sub-elite overseas
                ['3:56', '4:09'],  // platium,   sub 2:55, 東馬直通，男子日本国内，sub-elite domestic
                ['4:10', '4:16'],  // gold,      sub 3:00
                ['4:17', '4:30'],  // silver,    sub 3:10, 男子国家二级
                ['4:31', '4:37'],  // bronze,    sub 3:15, Male BQ/age:40-44
                ['4:38', '4:52'],  // steel,     sub 3:25, Male BQ/age:45-49
                ['4:53', '5:41'],  // aluminium, sub 4:00, 男子国家三级
                ['5:42', '7:07'],  // wood,      sub 5:00
                ['7:08', '8:31'],  // clay,      sub 6:00
                ['8:32', 'MAX'],   // out of grade
               ],
          F: [  ['0:00', '2:51'],  // goddess!   sub 2:00
                ['2:52', '3:39'],  // angel,     sub 2:34, 女子国际健将
                ['3:40', '3:48'],  // legend,    sub 2:40, 女子国家健将
                ['3:49', '4:43'],  // superhero, sub 3:19, 女子国家一级
                ['4:44', '4:59'],  // diamond,   sub 3:30, 東馬直通，女子海外，sub-elite overseas
                ['5:00', '5:13'],  // platium,   sub 3:40, 東馬直通，女子日本国呢，sub-elite domestic
                ['5:14', '5:20'],  // gold,      sub 3:45, Female BQ/age:40-40
                ['5:21', '5:27'],  // silver,    sub 3:50, 女子国家二级
                ['5:28', '5:34'],  // bronze,    sub 3:55, Male BQ/age:45-49
                ['5:35', '5:41'],  // steel,     sub 4:00
                ['5:42', '5:55'],  // alumnium,  sub 4:10, 女子国家三级
                ['5:56', '7:07'],  // wood,      sub 5:00
                ['7:08', '8:31'],  // clay,      sub 6:00
                ['8:32', 'MAX'],   // out of grade
               ],
        };
// color assigned for each grade
var GRADE_COLOR = GRADE.M.map((v, i, arr) => d3.interpolateRainbow(i/arr.length));

// maximum time when all team finishing
var MAX = to_seconds('4:30:00');
// wait for miliseconds before next member
var WAIT = 500;

// count of split for each team
var COUNT_OF_SPLIT = 9;

// convert elapsed time in second to "HH:MM:SS"
function to_time(seconds) {
  if (!Number.isNaN(seconds)) {
    var dt = new Date(null);
    dt.setSeconds(seconds);
    return dt.toISOString().substr(11, 8);
  } else {
    return '--:--:--';
  }
}

// convert elapsed time or pace in "HH:MM:SS" format to timve value in second
function to_seconds(t) {
  return t.split(':').reduce((p,c) => p * 60 + +c, 0);
}

// return MAX if not a number
function mx(v) {
  return Number.isNaN(v) ? MAX : v;
}

// given a gender & pace, return his/her grade
function gradeOf(gender, pace) {
  var i, arr = GRADE[gender + '_tv'];  // tv: time value in seconds
  if (!arr) {
    return -1;
  }
  for (i = 0; i < arr.length; i++) {
    if (pace < arr[i][1]) {
      return i;
    }
  }
  return i - 1;
}

// prepare data:
//  - calculate time in second cosumed by each member (a step)
//  - convert adjusted pace in "MM:SS" format to time value in seconds
//  - calculate time in second elapsed upto member N (total time elapsed)
//  - convert adjusted pace to grade according to a member's gender
//  - interpolate distance covered by interval of 10-minute
function process(arr) {
  console.log('pre-process');
  for (var k in GRADE) {
    GRADE[k+ '_tv'] = GRADE[k].map(p=> p.map(v => to_seconds(v)));
  }
  arr.forEach(d => {
    d.name = d.alias + '(' + d.name.split('／').pop() + ')'
    d.gender = d.gender.slice(0, 1);
    d.gender = d.gender === 'W' ? 'F' : d.gender;

    var split = d.split, gap = to_seconds(d.result.gap);
    d._step = split.map(m => to_seconds(m.duration));
    d._pace = split.map(m => to_seconds(m.pace));
    d._total = split.map(m => to_seconds(m.elapsed) - gap);
    d._grade = d._pace.map((p, i) => gradeOf(d.gender, p));

    // d._distance = interpolateDistance(d);
  });
}

//  interpolate distance covered by interval of 10-minute
var INTERVAL = 600;  // 600 seconds = 10 minute

//  NOT USED!
function interpolateDistance(d) {
// noprotect
  var t = gap = INTERVAL, arr = [], idx = 0,  l = 0,  g1, last, goal;
  for (t = gap; t <= MAX && idx < COUNT_OF_SPLIT; t += gap) {
    if (t <= d._total[idx]) {
      l += (gap / d._pace[idx]) || 0;
    } else {
      g1 = t - d._total[idx];
      if (g1 < gap || idx < COUNT_OF_SPLIT - 1) {
        l += ((g1 / d._pace[idx + 1]) || 0) + (((gap - g1) / d._pace[idx]) || 0);
        if (idx < COUNT_OF_SPLIT - 1) {
          idx++;
        }
      } else if (goal) {
         l = 42.195;
      } else {
         l += gap / d._pace[idx];
        if (idx >= COUNT_OF_SPLIT - 1) {
          goal = true;
        }
      }
    }
    arr.push(l);
  }
  return arr;
}

// color for gender (Male/Female/Unknown)
var GENDER_COLOR = {
  '':  '#444',
  'F': '#F00',
  'M': '#44F',
}

// callback after receive data
function receiveData(records) {
  var arr = records.slice();
  process(arr);

  var upto = 0, bar;
  var scale = (svgTeams.node().getBoundingClientRect().width - 40) / MAX;

  d3.select('.legend').selectAll('div')
      .data(GRADE_COLOR)
      .enter()
      .append('div')
      .attr('style', (d, i) => 'background-color:' + d);

  function _init() {
    arr = records.slice();
    bar = svgTeams.selectAll('g')
                        .data(arr, key)
                        .enter()
                        .append('g')
                           .attr('transform', (d,i) => 'translate(0, ' + (i * 28 + 20) + ')');

      bar.selectAll('rect')
           .data(d => d)
           .enter()
           .append('rect')
           .classed('lap', true)
           .attr('x', (d, i) => 5 + i * 5)
           .attr('y', 4)
           .attr('height', 7)
           .attr('width',  24)
           .attr('fill', d => GENDER_COLOR[d.gender || '']);

    bar.append('text')
            .attr('class', 'name')
            .attr('x', d => 36)
            .attr('y', 0)
            .text(d => d.block + d.no + ' ' + d.name);

    bar.append('text')
            .attr('class', 'result')
            .attr('x', d => 280)
            .attr('y', 0);

    var rank = bar.insert('g', ':first-child')
            .attr('class', 'rank')
            .classed('marked', d => +d.no === markedNo)
            .attr('transform', 'translate(0, -15)')
            .on('click', pinMe);

    rank.append('rect')
             .attr('width', 33)
             .attr('height', 27)
             .attr('rx', 3)
             .attr('ry', 3);
    rank.append('text')
             .attr('x', 4)
             .attr('y', 15)
             .text((d, i) => (' ' + ++i + '.').slice(-3));

    stepByStep || setTimeout( () => run(arr, bar, upto, scale), 500);
    if (upto === -1) {
      upto = 0;
    }
  }

  _init();

  function playOrStepby() {
    d3.event.stopPropagation();
    var sel = d3.select(this);
    if (!stepByStep) {
      if (sel.classed('btn-stepby')) {
        stepByStep = true;
        timers.forEach(v => clearTimeout(v));
        upto = g_upto + 0;
        timers = [];
      }
    } else {
      if (sel.classed('btn-play')) {
        upto = -1;
        stepByStep = false;
      }
    }
    if (upto >= COUNT_OF_SPLIT) {
      upto = -1;
    }
    if (!stepByStep || upto === -1) {
      svgTeams.html('');
      bar = svgTeams.selectAll('g').data(arr, key);
      bar.interrupt();
      bar.select('g').interrupt();
      bar.select('rect').interrupt();
      bar.select('.result').interrupt();
      bar.select('.rank').interrupt();
      _init();
      showMarked.call(svgTeams.node());
      upto = 0;
    } else {
      if (upto === -1) {
        _init();
        upto++;
      } else {
        var next = upto;
        setTimeout( () => run(arr, bar, next, scale), 500);
        if (upto >= COUNT_OF_SPLIT - 1) {
          upto = -1;
        } else {
          upto++;
        }
      }
    }
  }

  d3.select('.btn-play').on('click', playOrStepby);
  d3.select('.btn-stepby').on('click', playOrStepby);

  d3.select('.fixed').on('click', function() {
    d3.select('#infographics-container').node().parentNode.scrollTop = 0;
  });

}

function pinMe() {
    var sel = d3.select(this);
    if (sel.classed('marked')) {
      sel.classed('marked', false);
      markedNo = -1;
    } else {
      d3.selectAll('.rank').classed('marked', false);
      sel.classed('marked', true);
      markedNo = +d3.select(this.parentNode).datum().no;
    }
}

function showMarked() {
  var marked = d3.select(this).select('.rank.marked').node();
  if (marked != null) {
    var scroller = container.node().parentNode,
        top = d3.select('.fixed').node().getBoundingClientRect(),
        r   = marked.getBoundingClientRect(),
        p   = r.top - top.height;

    if (p < 0) {
      scroller.scrollTop += p;
    } else {
      p = scroller.clientHeight - r.top - r.height;
      if (p < 0) {
        scroller.scrollTop -= p;
      }
    }
  }
}

// return key of record = team no.
function key(d) {
  return d.no;
}

var stepByStep = false;
var timers = [];

// run upto member N
// arr : array of records
// bar: selection of all bars
// upto: member index (0 to 4)
// scale: convert time value in second to width of bar
function run(arr, bar, upto, scale) {
    arr.sort((a, b)=> mx(a._total[upto]) -  mx(b._total[upto]));
    var factor = upto > 0 ? 6 : 3;
    factor = 24;
    var func = {
      step: d => d._step[upto] / factor,
      gap:  d => (upto === 0 ? 0 : d._total[upto - 1] - fastest)
    };

    var fastest = arr.reduce( (p, c) => ((c = upto === 0 ? 0 : c._total[upto - 1]) < p ? c: p), Number.MAX_SAFE_INTEGER);
    var max = arr.reduce( (p, c) => (c =c._step[upto]) > p ? c : p, 0);

    max += arr.reduce((p, c) => {
      c = func.gap(c) * factor;
      return c > p ? c: p;
    }, 0);
    max /= factor;


    bar = svgTeams.selectAll('g').data(arr, key);
    bar.transition()
         .delay(max)
         .duration(400)
         .attr('transform', (d,i) => 'translate(0, ' + (i * 28 + 20) + ')')
         .on('end', showMarked);

    svgTeams.selectAll('.rank').on('click', pinMe);

    bar.append('rect')
         // .classed('f', d => d.gender === 'F')
         .attr('x', d => 36 + upto * 2 + (d._total[upto - 1 ] || 0) * scale)
         .attr('y', 4)
         .attr('height', 7)
         .attr('width',  0)
         .attr('fill', d => GRADE_COLOR[d._grade[upto]])// step_color(upto))
         .transition()
         .delay(func.gap)
         .duration(func.step)
         .ease(d3.easeLinear)
         .attr("width", d => (d._step[upto] || 0) * scale);

    bar.select('.result')
         .attr('fill', '#38F')
         .transition()
         .delay(func.gap)
         .text(d => to_time(d._total[upto]))
         .filter(d => !Number.isNaN(d._total[upto]))
         .attr('fill', '#FFF')
         .transition()
         .duration(250)
         .attr('fill', '#38F')

    bar.select('.rank').select('text')
         .transition()
         .delay(max)
         .duration(400)
         .text((d, i) => (' ' + ++i + '.').slice(-3));

     if (upto < COUNT_OF_SPLIT - 1) {

       if (timers[upto]) {
         clearTimeout(timers[upto]);
       }
       if (!stepByStep) {
         timers[upto+1] = setTimeout(() => run(arr, bar, upto+1, scale),  stepByStep ? 0 : max + WAIT);
       }
       clearTimeout(timers[upto]);
       if (upto + 1 > g_upto) {
         g_upto = upto + 1;
       }
     } else {
       g_upto = -1;
     }
}

var container = d3.select("#infographics-container"),
    svgTeams  = d3.select('#svg-teams'),
    markedNo  = -1,
    g_upto    = -1;


function getPersonalRecord(number) {
  return $.post({
   		url : 'detail.php',
	    data: {
            category: null,
            number: number,
            name: null,
            age: null,
            country: null,
            prefecture: null,
            sort_key: "place",
            sort_asc: 1,
            page:1,
            d_number: number
        }
    });
}

function val($cell, idx, sep) {
  var v = $cell.eq(idx).text();
	return sep ? v.split(sep).pop() : v;
}

function parseRecord(html) {
	var $item = $(html).find('.contentsBox .m-item_tbl').eq(0), r = {};
  var $row = $item.eq(0).find('tr').last(),
	    $cell = $row.children();

  // basic
  $.extend(r, {  no: val($cell, 1),
							 name: val($cell, 2).split('／').pop(),
							 result: {},
							 place: {inTotal: val($cell, 0)}});

  // place & time
  $item = $item.next();
	$row = $item.find('tr').first();
	$cell = $row.children();
	r.category = val($cell, 1);
	r.place.byCategory    = val($cell, 2, '：');

	$row  = $row.next();
	$cell = $row.children();
	r.age = val($cell, 1);
	r.place.byAge = val($cell, 2, '：');

	$row  = $row.next();
	$cell = $row.children();
	r.gender         = val($cell, 1, '／');
	r.place.byGender = val($cell, 2, '：');

	$row  = $row.next();
	$cell = $row.children();
	r.location         = val($cell, 1);
	r.place.byLocation = val($cell, 2, '：');

  if (r.location === '日本') {
    $row = $row.next();
    r.location     = val($cell, 1);
    r.perf         = val($cell, 1);
    r.place.byPerf = val($cell, 2, '：');
  }
	$row = $row.next();
	r.result.net   = val($row.children(), 1);
	$row = $row.next();
	r.result.gross = val($row.children(), 1);

  var gap = to_seconds(r.result.gross) - to_seconds(r.result.net);
  r.result.gap = to_time(gap);


  // split
  $item = $item.next();
  $row  = $item.find('tr').eq(0);

  var i, odd, split = [], lap;

  for (i = 1; i < 19; i++) {
    $row = $row.next();
    $cell = $row.children();
    if (i === 9) { // half
      r.result.half = val($cell, 1);
      r.result['half-net'] = to_time(to_seconds(r.result.half) - gap);
    } else {
      if ($cell.length > 1) {
        if (i === 1) {
          lap = {
                  position: val($cell, 0),
                  elapsed : val($cell, 1)
                };
          lap.duration = to_time(to_seconds(lap.elapsed) - gap);
          lap.pace = to_time(to_seconds(lap.duration) / 5);
          split.push(lap);
        } else {
          lap = $.extend(lap, {
                  position: val($cell, 0),
                  elapsed : val($cell, 1)
                });
        }
      } else {
        lap = {position: null, elapsed: null, duration: val($cell, 0)};
        lap.pace = to_time(to_seconds(lap.duration) / 5);
        split.push(lap);
      }
    }
  }

  lap.position = "Finish";
  lap.pace = to_time(to_seconds(lap.duration) / 2.195);
  r.split = split;

  console.log('gap:', to_time(gap), r);

	return r;
}
/*
(_ => {
  var list =
`B81756 龙少爷
B81055 馬步蜓
C62207 杜云鹏
C83133 双子星
D28508 12356890
E----- Neo
E54177 ミユキ
E82618 青园
E92688 Nick 尼古拉斯
E92619 岳王
E92616 三岳
F51558 林 碧英
F61170 高宜贵
F25216 OO
F82724 徐阳
F85415 李香君
G29121 熊二alin
G53009 ❄
G53316 Tomoko
G53421 Minna
G91580 私教
G23874 瑞奇
G67191 rimmel
H96677 花花Hu
H96184 何小萍
J33709 GongYX（颜家巷）
J51022 相信
J82809 Today
J96075 横滨小姐姐
J81743 arno pan
K67367 hirochan
L22350 乐雨
L30750 wm_z
G----- ウィスキー`;

  var t, count;
  list = list.split('\n')
             .map(r => (r = r.split(/\s+/), {alias: r[1], number: r[0].slice(1), block: r[0].slice(0, 1, 1)}))
             .filter(r => !isNaN(parseInt(r.number)));
  console.log('Runners List:', list);

  count = list.length;
  list = list.map(each => getPersonalRecord(each.number)
                              .then(html => parseRecord(html))
                              .then(r => (r.alias = each.alias, r.block = each.block, r)));
    $.when.apply(null, list)
     .then(function() {
       var data = [].slice.apply(arguments);
       console.log('DATA', data);
       receiveData(data);
     });
})();
//*/

d3.json('data.json', receiveData);
