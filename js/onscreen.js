/*
* adapt-animate-ie9
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

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
		var objs = _.filter($.cache, function(item) {
			if (item.events !== undefined && item.events.onscreen !== undefined) return true;
		});
		if (objs.length === 0) {
			//nothing to onscreen
			clearInterval(onscreen.interval);
			onscreen.timeslice = 1000;
			onscreen.interval = setInterval(onscreen, onscreen.timeslice);
		} else {
			//something to onscreen
			clearInterval(onscreen.interval);
			onscreen.timeslice = 500;
			onscreen.interval = setInterval(onscreen, onscreen.timeslice);
		}

		for (var o = 0; o < objs.length; o++) {
			var obj = objs[o];
			if (obj.events === undefined || obj.events.onscreen === undefined) continue;
			for (var ev = 0; ev < obj.events.onscreen.length; ev++) {
				var listener = obj.events.onscreen[ev];
				var items = undefined;
				if (listener.selector === undefined) {
					items = $(obj.handle.elem);
				} else {
					items = $(obj.handle.elem).find(listener.selector);
				}
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					$item = $(item);
					var onscreenVal = getOnScreen($item);
					if (item._onscreen !== undefined && item._onscreen === onscreenVal.uniq) continue;
					item._onscreen = onscreenVal.uniq;
					if (onscreenVal.inviewP > 0) {
						$item.trigger("onscreen", onscreenVal);
					} else {
						$item.trigger("onscreen", onscreenVal);
					}
				}
			}
		}

	}
	onscreen.timeslice = 333;
	onscreen.interval = setInterval(onscreen, onscreen.timeslice);
	$.fn.onscreen = function() {
		return getOnScreen($(this[0]));
	};
})();