(function() {
	function getOnScreen($element) {
		var height = $element.height();
		var width = $element.width();
		var wHeight = $(window).height();
		var wWidth = $(window).width();
		
		//topleft from topleft of window
		var top = $element.offset()["top"] - $(window).scrollTop();
		var left = $element.offset()["left"] - $(window).scrollLeft();

		//bottomright from bottomright of window
		var bottom = wHeight - (top + height);
		var right = wWidth - (left + width);
		
		//percentages of above
		var topP = Math.round((100 /  wHeight) * top);
		var leftP = Math.round((100 / wWidth) * left);
		var bottomP = Math.round((100 /  wHeight) * (wHeight - (top + height)));
		var rightP = Math.round((100 / wWidth) * (wWidth - (left + width)));


		//inview
		var inviewH = null;
		if (left+width > 0 && right < 0 && left < 0) {
			inviewH = width;
		} else if (left < 0) { //offscreen left
			inviewH = (width + left);
		} else if (left + width > wWidth) { //offscreen right
			inviewH = (wWidth - left);
		} else { //fully inscreen
			inviewH = width;
		}

		var inviewV = null;
		if (top+height > 0 && bottom < 0 && top < 0) {
			inviewV = height;
		} else if (top < 0) { //offscreen top
			inviewV = (height + top);
		} else if (top + height > wHeight) { //offscreen bottom
			inviewV = (wHeight - top);
		} else { //fully inscreen
			inviewV = height;
		}

		var area = height * width;
		var inviewArea = inviewV * inviewH;
		var inviewP = Math.round((100 / area) * inviewArea);

		var uniq = ""+top+left+bottom+right+height+width+wHeight+wWidth;

		return { top: top, left: left, bottom: bottom, right: right, topP: topP, leftP:leftP, bottomP: bottomP, rightP: rightP, inviewP:inviewP, uniq:uniq };
	}
	function onscreen () {
		var objs = [];
		for (var i in $.cache) {
			var item = $.cache[i];
			if (item.events !== undefined && item.events.onscreen !== undefined) objs.push(item);
		}
		/*var objs = _.filter($.cache, function(item) {
			if (item.events !== undefined && item.events.onscreen !== undefined) return true;
		});*/
		if (objs.length === 0) {
			//nothing to onscreen
			clearInterval(onscreen.interval);
			onscreen.timeslice = 1000;
			onscreen.interval = setInterval(onscreen, onscreen.timeslice);
		} else {
			//something to onscreen
			clearInterval(onscreen.interval);
			onscreen.timeslice = 250;
			onscreen.interval = setInterval(onscreen, onscreen.timeslice);
		}

		//_.each(objs, function(obj) {
		for (var oid = 0; oid < objs.length; oid++) {
			var obj = objs[oid];
			if (obj.events === undefined || obj.events.onscreen === undefined) continue;
			//_.each(obj.events.onscreen, function(listener) {
			for (var li = 0; li < obj.events.onscreen.length; li++) {
				var listener = obj.events.onscreen[li];
				var items = undefined;
				if (listener.selector === undefined) {
					items = $(obj.handle.elem);
				} else {
					items = $(obj.handle.elem).find(listener.selector);
				}
				//_.each(items, function(item) {
				for (var im = 0; im < items.length; im++) {
					var item = items[im];
					var $item = $(item);
					var osData = getOnScreen($item);
					if (item._onscreen !== undefined && item._onscreen === osData.uniq) continue;
					item._onscreen = osData.uniq;
					if (item._osData !== undefined && item._osData.inviewP < 0 && osData.inviewP < 0) {
						continue;
					}
					item._osData = osData; 
					$item.trigger("onscreen", osData);
				}
				//});
			}
			//});
		}
		//});

	}
	onscreen.timeslice = 250;
	onscreen.interval = setInterval(onscreen, onscreen.timeslice);
	$.fn.onscreen = function() {
		for (var i = 0; i < 1; i++ ) {
			return getOnScreen($(this[i]));
		}
	};
})();