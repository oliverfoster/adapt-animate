/*
* adapt-animate-ie9
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {
	var supported = [
		"border-radius",
		"box-shadow",
		"background-size",
		"background-origin",
		"word-wrap",
		"@font-face",
		"-ms-transform", // takes precedence over transform
		"transform", 
		//2d transformations only, translate(), rotate(), scale(), skew(), matrix() with -ms-transform
		"transform-origin",
	];
	var ignore = [
		"text-shadow",
		"border-image",
		"linear-gradient",
		"radial-gradient",
		"repeating-linear-gradient",
		"repeating-radial-gradient",
		"tranform-style",
		"perspective",
		"perspective-origin",
		"backface-visibilty",
		"transition",
		"transition-delay",
		"transition-duration",
		"transition-property",
		"transition-timing-function",
		"animation",
		"@keyframes",
		"column-count",
		"column-gap",
		"column-rule",
		"resize",
		"box-sizing",
		"outline-offset"
	];

	var DOMAttrs = function(object) {
        //GET DOM ELEMENT ATTRIBUTES AS {KEY: VALUE}
        var a = {};
        if (object) {
            var atts = object.attributes;
            for (var i in atts) {
                var p = atts[i];
                if (p === null) continue;
                if (typeof p.value !== 'undefined') a[p.nodeName] = p.value;
            }
        }
        return a;
    };

	var OnScreen = require('extensions/adapt-animate/js/onscreen');

	require('extensions/adapt-animate/js/cssParser');

	var href = $('link[rel="stylesheet"][type="text/css"').attr("href");
	var css = undefined;
	$.ajax({ 
		url:href, 
		async: false, 
		method:"GET", 
		complete: function(data) {
			css = data.responseText;
		}
	});

	var parser = new CSSParser();
	var cssRules = parser.parse(css, false, true).cssRules;

	var styleRules = _.where(cssRules, { type: 1 });
	var keyFramesRules = _.where(cssRules, { type: 7 });
	var animations = _.filter(cssRules, function(item) {
		return _.filter(item.declarations, function(dec) {
			return dec.property == "animation";
		}).length > 0;
	});


	var ie = {

		element: function($element) {
			var elementCSS = buildElementCSS($element);
			
			if (elementCSS['-ms-animation']) {
				var parts = elementCSS['-ms-animation'].split(" ");
				elementCSS['animation-name'] = parts[0];
				elementCSS['animation-duration'] = parts[1];
				elementCSS['animation-iteration-count'] = parts[2];
				//console.log(parts);
			} else if (elementCSS['animation']) {
				var parts = elementCSS['animation'].split(" ");
				elementCSS['animation-name'] = parts[0];
				elementCSS['animation-duration'] = parts[1];
				elementCSS['animation-iteration-count'] = parts[2];
				//console.log(parts);
			}

			if (elementCSS['animation-name']) {
				var options = {
					duration: parseFloat(elementCSS['animation-duration']),
					iterations: isNaN(parseInt(elementCSS['animation-iteration-count']))
						? elementCSS['animation-iteration-count'] 
						: parseInt(elementCSS['animation-iteration-count'])
					,
					name: elementCSS['animation-name']
				};

				var keyFrames = _.findWhere(keyFramesRules, { name: options.name } );

				keyFrames = keyFramesDeclarationsFilter(keyFrames);

				animateElementKeyFrames($element, keyFrames, options);
			}
		}


	};

	window.ie = ie;

	function buildElementCSS($element) {
		var classes = $element.attr("class").split(" ");
		var built = {};
		_.each(styleRules, function(rules) {
			try {
				if (!$element.is(rules.mSelectorText)) return;

				var hasMSTransform = (_.filter(rules.declarations, function(dec) {
					return dec.property == "-ms-animation";
				}).length > 0);

				_.each(rules.declarations, function(dec) {
					if (ignore.indexOf(dec.property) > -1) return;
					if (dec.property.substr(0,1) == "-" && dec.property.substr(0,3) != "-ms" ) return;
					if (hasMSTransform && dec.property.indexOf("animation") > -1 && dec.property !== "-ms-animation") return;

					built[dec.property] = dec.valueText;
				});
			} catch (e) {}
			var i = 0;
		});
		return built;
	}


	function animateElementKeyFrames($element, keyFrames, options) {
		if (keyFrames.cssRules && keyFrames.cssRules.length > 0) {
			var frameMarkers = [];
			if (keyFrames.cssRules[0].keyText.indexOf("%") > -1) {
				//using percentages
				_.each(keyFrames.cssRules, function(subRule) {
					var newItems = subRule.keyText.split(",");
					for(var i = 0; i < newItems.length; i++) {
						newItems[i] = parseInt(newItems[i]);
						var copy = $.extend({}, subRule);
						copy.interval = ((options.duration /100) * newItems[i]) * 1000;
						frameMarkers.push( copy );
					}
				});

			} else if (keyFrames.cssRules[0].keyText.indexOf("from") > -1 || keyFrames.cssRules[0].keyText.indexOf("to") > -1) {
				
				//using from/to


			}

			
			frameMarkers.sort(function(a,b) {
				return a.interval - b.interval;
			});

			//TODO: TWEENING!! SHOULD HAVE AT LEAST 10 FRAMES PER ANIMATION
			frameMarkers = tweening(frameMarkers);

			_.each(frameMarkers, function(value, index) {
				value.index = index;
				value.count = frameMarkers.length;
			});

			var animationObj = {
				frameMarkers: frameMarkers,
				times: 0,
				$element: $element,
				options: options
			};

			animationObj.frameExecutor = _.bind(frameExecutor, animationObj);
			animationObj.startFrameTimers = _.bind(startFrameTimers, animationObj);
			animationObj.startFrameTimers();
		}


	}

	function frameExecutor(fm) {
		var thisHandle = this;
		if (!thisHandle.$element.is(thisHandle.$element.selector)) {
			return;
		}
		//var hasMSTransform = (_.filter(fm.declarations, function(dec) {
		//	return dec.property == "-ms-transform";
		//}).length > 0);
		_.each(fm.declarations, function(dec) {
			//if (ignore.indexOf(dec.property) > -1) return;
			//if (dec.property.substr(0,1) == "-" && dec.property.substr(0,3) != "-ms" ) return;
			//if (hasMSTransform && dec.property.indexOf("transform") > -1 && dec.property !== "-ms-transform") return;
			//console.log(thisHandle.$element.parent());
			thisHandle.$element.css(dec.property, dec.valueText);
			//console.log ( "applying " + dec.property + ": " + dec.valueText );
		});
		if (fm.index == fm.count - 1) {
			//TODO: CHECK THAT SELECTOR STILL APPLYS TO OBJECT
			if (this.$element[0]._uniq != makeUniq(this.$element[0])) return;
			//last item
			if (this.options.iterations === "infinite") {
				this.startFrameTimers();
			} else if (this.options.iterations <= this.times) {
				this.startFrameTimers();
			}
		}

	}

	function startFrameTimers() {
		//TODO: implement animation-delay
		var thisHandle = this;
		this.$element[0]._uniq = makeUniq(this.$element[0]);
		_.each(this.frameMarkers, function(fm) {
			setTimeout(function() {
				thisHandle.frameExecutor(fm);
			}, fm.interval );
		});
		this.times++;
	}

	function keyFramesDeclarationsFilter(keyFrames) {

		_.each(keyFrames.cssRules, function(cssRule) {
			var hasMSTransform = (_.filter(cssRule.declarations, function(dec) {
				return dec.property == "-ms-transform";
			}).length > 0);
			cssRule.declarations = _.filter(cssRule.declarations, function(dec) {
				if (ignore.indexOf(dec.property) > -1) return false;
				if (dec.property.substr(0,1) == "-" && dec.property.substr(0,3) != "-ms" ) return false ;
				if (hasMSTransform && dec.property.indexOf("transform") > -1 && dec.property !== "-ms-transform") return false;
				return true;
			});
		});

		return keyFrames;
	}

	function tweening(frameMarkers) {

		var frameInterval = 50;

		var props = fetchPropertiesToTween(frameMarkers);

		var lengthMilli = fetchPropertiesLengthMilliseconds(props);

		props = tweenProperties(props, lengthMilli, frameInterval);

		var totalFrameCount = (lengthMilli / frameInterval) + 1;

		frameMarkers = propertiesToFrameMarkers(props, totalFrameCount, frameInterval);

		return frameMarkers;
	}

	function fetchPropertiesToTween(frameMarkers) { 
		var props = {};
		_.each(frameMarkers, function(frame) {
			_.each(frame.declarations, function(dec) {
				if (dec.property.indexOf("transform") > -1) {

					dec.valueText = dec.valueText.replace(", ", ",");
					var aTrans = dec.valueText.split(" ");
					_.each(aTrans, function( aTran ) { 
						var aValues = aTran.match(/(\w|\,|\.)+/gim);
						if (props[aValues[0]] === undefined) {
							props[aValues[0]]= [];
							props[aValues[0]].parent = dec.property;
						}
						props[aValues[0]].push({ 
							interval: frame.interval,
							percent: parseInt(frame.keyText), 
							values: aValues[1].split(",")
						});
					});
				} else {
					if (props[dec.property] === undefined) {
						props[dec.property]= [];
						props[dec.property].parent = dec.property;
					}
					props[dec.property].push({ 
						interval: frame.interval, 
						percent: parseInt(frame.keyText),
						values: [dec.valueText]
					} );
				}
				
			});
		});
		return props;
	}

	function fetchPropertiesLengthMilliseconds(props) {
		var lengthMilli = 0;

		//Calculate animation length
		for (var pk in props) {
		 	var prop = props[pk];
			if (prop.length === 0 ) throw "Cannot have one keyframe!";
			var distance = prop[0].percent - prop[1].percent;
			var time = prop[0].interval - prop[1].interval;
			lengthMilli = (time/distance) * 100;
			break;
		};

		return lengthMilli
	}

	function tweenProperties(props, lengthMilli, frameInterval) {
		//Populate frames
		for (var pk in props) {
			var prop = props[pk];
			if (prop.length === 0 ) throw "Cannot have one keyframe!";
			var redone = [];
			redone.parent = props[pk].parent;
			redone.name = pk;
			for (var i = 1; i < prop.length; i++) {
				var distance = prop[i-1].percent - prop[i].percent;
				var time = prop[i-1].interval - prop[i].interval;

				var start = Math.floor(prop[i-1].interval / frameInterval) * frameInterval;
				var end = Math.floor(prop[i].interval / frameInterval) * frameInterval;
				var frameCount = ((end - start) / frameInterval);

				var diff = difference(prop[i-1].values, prop[i].values);
				var orig = []; 
				_.each(prop[i-1].values, function(item) {
					orig.push(parseFloat(item));
				});

				var shunt = false;
				if (i - 1 > 0) shunt = true;

				for (var f = (shunt ? 1 : 0); f < (shunt ? frameCount + 1 : frameCount + 1); f++) {

					var frame = { 
						values: [], 
						interval: start + (f * frameInterval),
						distance: Math.floor((100/lengthMilli) * (start + (f * frameInterval)))
					} ;
					for (var a = 0; a < diff.length; a++) {
						frame.values.push( orig[a] + ((diff[a] / frameCount) * f) );
					}

					redone.push( frame );

				}
			}
			props[pk] = redone;
		}
		return props;
	}

	function propertiesToFrameMarkers(props, totalFrameCount, frameInterval) {
		var frameMarkers = [];

		var parents = _.groupBy(props, function( item) { return item.parent; } );


		for (var f = 0; f < totalFrameCount; f++) {

			var newFrame = {};
			newFrame.keyText = ((100/(totalFrameCount-1)) * f) + "%";
			newFrame.interval = f * frameInterval;
			newFrame.declarations = {};

			_.each(parents, function(properties, name) {

				_.each(properties, function(prop) {
					if (f > prop.length - 1) return;

					var dec = { valueText: "", property: "" };

					if (prop.name == name ){
						newFrame.declarations[name] = dec;
						newFrame.declarations[name].property = prop.name;
						newFrame.declarations[name].valueText = prop[f].values.join(",");
					} else {
						if (newFrame.declarations[name] === undefined) newFrame.declarations[name] = dec;
						newFrame.declarations[name].property = name;
						if (newFrame.declarations[name].valueText.length === 0) {
							newFrame.declarations[name].valueText = prop.name + "(" + prop[f].values.join(",") + ")";
						} else {
							newFrame.declarations[name].valueText += "," + prop.name + "(" + prop[f].values.join(",") + ")";
						}
					}

				});
				

			});

			newFrame.declarations = _.values(newFrame.declarations);

			frameMarkers.push(newFrame);
		}

		return frameMarkers;

	}

	function difference(arr1, arr2) {
		var arr3 = [];
		for (var i = 0; i < arr1.length; i++) {
			arr3.push(arr2[i] - arr1[i]);
		}
		return arr3;
	}

	function makeUniq(element) {
		var da = DOMAttrs(element);
		delete da['style'];
		delete da['_uniq'];
		delete da['_onscreen'];
		return JSON.stringify(da);
	}

	if ( $("html").hasClass("ie9") ) {
		setInterval(function() {
			_.each(animations, function(item) {
				var elements = $(item.mSelectorText);
				_.each(elements, function(element) {
					var uniq = makeUniq(element);
					if (element._uniq === uniq ) return;
					var ele = $(element);
					ele.selector = item.mSelectorText;
					ie.element(ele);
					element._uniq = uniq;

				});

			});

		}, 500);
	}

	if (!Array.prototype.indexOf) {
	  Array.prototype.indexOf = function(elt /*, from*/)
	  {
	    var len = this.length >>> 0;

	    var from = Number(arguments[1]) || 0;
	    from = (from < 0)
	         ? Math.ceil(from)
	         : Math.floor(from);
	    if (from < 0)
	      from += len;

	    for (; from < len; from++)
	    {
	      if (from in this &&
	          this[from] === elt)
	        return from;
	    }
	    return -1;
	  };
	}

	if ( $("html").hasClass("ie8") ) {
		//filter inheritance
		var style = $("<style>");
		$("head").append(style);
		style[0].innerText = ("<style>html, body, div, span, object, iframe, h1, h2, h3, h4, h5, h6, p, blockquote, pre, abbr, address, cite, code, del, dfn, em, img, ins, kbd, q, samp, small, strong, sub, sup, var, b, i, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, figure, footer, header, hgroup, menu, nav, section, time, mark, audio, video, article, aside, figure, footer, header, hgroup, nav, section, object, a, hr, input, select, textarea, button { filter: inherit; }</style>");
		
	}

	return ie;

});