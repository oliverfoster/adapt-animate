/*
* adapt-animate
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');
	var Backbone = require('extensions/adapt-animate/js/emmet.min');
	var elements = [ "contentObjects", "articles", "blocks", "components" ];
	var config = undefined;

	var attrs = function(object) {
            // Get attributes
            var a = {};
            if (object) {
                var atts = object.attributes;
                for (var i in atts) {
                    var p = atts[i];
                    if (typeof p.value !== 'undefined') a[p.nodeName] = p.value;
                }
            }
            return a;
	    };


	var animate = {
		modelJSON: undefined,
		modelAnimate: undefined,
		view: undefined,
		go: function(view, elementType) {
			var model = view.model;
			if (config.length === 0) return;
			if (model.get("_animate") === undefined || model.get("_animate")._isEnabled === false) return;
			
			this.grab(model, view, elementType);
			this.attach.initialize(model, view);

		},
		grab: function(model, view, elementType) {
			var modelJSON = model.toJSON();
			var modelAnimate = model.get("_animate");

			if (modelAnimate._merged === undefined) {

				if (modelAnimate._animations !== undefined) {
					var redo = {};
					var id = 1;
					_.each(modelAnimate._animations, function(item) {
						if (item._id == undefined) item._id = "lan-" + (id++);
						redo[item._id] = item;
					});
					modelAnimate._animations = redo;
				}

				_.each(config._animations, function(item) {
					if (item["_"+elementType] === undefined) return;
					_.each(item["_"+elementType], function(element) {
						var answer = _.findWhere([modelJSON], element);
						if (answer !== undefined) {
							if (modelAnimate._animations === undefined) modelAnimate._animations = {};
							if (modelAnimate._animations[item._id] !== undefined) return;
							modelAnimate._animations[item._id] = item;
							return;
						}
					});
				});

				modelAnimate._merged = true;
			}
		},
		attach: {
			initialize: function(model, view) {
				var modelAnimate = model.get("_animate");
				_.each(modelAnimate._animations, function(animation, key) {
					_.each(animation._events, function(actionsOn, eventsOn) {
						if (typeof actionsOn == "string") actionsOn = [actionsOn];

						var eventsOn = animate.eventsOn.parse(eventsOn);
						eventsOn.parent = view.$el;
						eventsOn.children = view.$el.find(eventsOn.on);
						eventsOn.count = 0;
						eventsOn.index = -1;
						var actionsOn = animate.actionsOn.parse(actionsOn);
						_.each(actionsOn, function(actionOn) { actionOn.count = 0; });

						animate.attach.create($.extend(true,{},eventsOn), $.extend(true,{},actionsOn));
					});
				});
			},
			create: function(eventsOn, actionsOn) {
				eventsOn.index++;
				var eventObj = eventsOn.events[eventsOn.index];
				var callback = undefined;
				if (eventObj.callback === undefined) {
					eventObj.callback = _.bind(animate.attach.run, eventsOn.children, eventsOn, actionsOn);
				}
				callback = eventObj.callback;
				var mode = "on";
				var live = false;
				switch (eventObj.mode) {
				case "1":
					mode = "one";
					break;	
				case "!":
					mode = "on";
					live = true;
					break;	
				}
				switch(eventObj.name) {
				case "scroll":
					$(window)["on"]("scroll", callback);
					break;
				case "interval":
					if (mode == "one") {
						setTimeout.apply(window, [ callback, eventObj.arguments ] );
						break;
					}
					setInterval.apply(window, [ callback, eventObj.arguments ] );
					break;
				case "inview":
					function inviewCallback(event, isInView, visiblePartX, visiblePartY) {
						if (!isInView && mode == "one" && eventObj.inview) {
							eventObj.appliedCount--;
							delete eventObj.inview;
							if (eventObj.appliedCount === 0) {
								eventsOn.children["off"]("inview", inviewCallback);
							}
							return;
						}
						if (!isInView) {
							delete eventObj.inview;
							return;
						}
						if (isInView && eventObj.inview) return;
						eventObj.inview = true;
						if (isInView) callback();
					}
					if (live) {
						if (eventObj.appliedCount === 0) eventsOn.parent["on"]("inview", eventsOn.on, inviewCallback);
					} else {
						if (eventObj.appliedCount === 0) eventsOn.children["on"]("inview", inviewCallback);
					};
					eventObj.appliedCount++;
					break;
				case "outview":
					function outviewCallback(event, isInView, visiblePartX, visiblePartY) {
						if (!isInView) callback();
						if (!isInView && mode == "one") {
							eventObj.appliedCount--;
							if (eventObj.appliedCount === 0) {
								eventsOn.children["off"]("inview", outviewCallback);
							}
						}
					}
					if (live) {
						if (eventObj.appliedCount === 0) eventsOn.parent["on"]("inview", eventsOn.on, outviewCallback);
					} else {
						if (eventObj.appliedCount === 0) eventsOn.children["on"]("inview", outviewCallback);
					}
					eventObj.appliedCount++;
					break;
				default:
					if (live) {
						if (eventObj.appliedCount === 0) eventsOn.parent[mode](eventObj.name, eventsOn.on, callback );
					} else {
						if (eventObj.appliedCount === 0) eventsOn.children[mode](eventObj.name, callback );
					}
					break;
				}
			},
			run: function(eventsOn, actionsOn) {
				var back = false;
				if (eventsOn.index < eventsOn.events.length - 1) {
					back = (eventsOn.events[eventsOn.index + 1].mode == "<");
				}
				if (eventsOn.index < eventsOn.events.length - 1 && !back) {
					animate.attach.create(eventsOn, actionsOn);
				} else {
					eventsOn.count++;
					_.each(actionsOn, function(actionOn) {
						eventsOn.children = eventsOn.parent.find(eventsOn.on);
						var elements = eventsOn.parent.find(actionOn.on);
						actionOn.count++;
						var from = undefined;
						var to = undefined;
						for (var i = 0; i < elements.length; i++) {
							var index = (actionOn.action.direction == "backward" ? (elements.length - 1) - i : i);
							var $element = $(elements[index]);
							var top = $element.offset()["top"] - $(window).scrollTop();
							var left = $element.offset()["left"] - $(window).scrollLeft();
							var bottom = $(window).height() - top;
							var right = $(window).width() - left;
							var topP = (100 /  $(window).height()) * top;
							var leftP = (100 / $(window).width()) * left;
							var bottomP = (100 /  $(window).height()) * ($(window).height() - top);
							var rightP = (100 / $(window).width()) * ($(window).width() - left);

							
							var alt = animate.attach.expandContext(actionOn.alterations, actionOn.count, index, i, top, right, bottom, left, topP, rightP, bottomP, leftP);
							var alterations = $(emmet.expandAbbreviation(alt,"plain"))[0];
							var attributes = attrs(alterations);
							var content = undefined;
							if ($(alterations).html() > "") content = $(alterations).html();
							
							var interval = undefined;
							if (actionOn.action.interval === undefined) interval = 0;
							else interval = animate.attach.calculateContext(actionOn.action.interval, actionOn.count, index, i, top, right, bottom, left, topP, rightP, bottomP, leftP);
							switch (actionOn.action.type) {
							case "add":
								setTimeout( _.bind(function($element, attributes, content) {
									_.each(attributes, function(value, key) {
										if (key == "class") {
											$element.addClass(value);
										} else {
											$element.attr(key, value);
										}
									});
									$element.html(content);
								}, window, $element, attributes, content)
								, interval);
								break;
							case "remove":
								setTimeout( _.bind(function($element, attributes, content) {
									_.each(attributes, function(value, key) {
										if (key == "class") {
											$element.removeClass(value);
										} else {
											$element.attr(key, "");
										}
									});
									$element.html(content);
								}, window, $element, attributes, content)
								, interval);
								break;
							}
						}
					});
					if (back) {
						eventsOn.index = parseInt(eventsOn.events[eventsOn.index + 1].name) - 1;
						animate.attach.create(eventsOn, actionsOn);
					}
				}
			},
			calculateContext: function(string, x, ni, i, top, right, bottom, left, topP, rightP, bottomP, leftP) {
				var string = animate.attach.expandContext(string, x, ni, i, top, right, bottom, left, topP, rightP, bottomP, leftP);
				string = eval(string);
				return string;
			},
			expandContext: function(string, x, ni, i, top, right, bottom, left, topP, rightP, bottomP, leftP) {
				string = string.replace(/\$x/g, x);
				string = string.replace(/\$lx/g, x-1);
				string = string.replace(/\$nx/g, x+1);
				string = string.replace(/\$ni/g, ni);
				string = string.replace(/\$i/g, i);
				string = string.replace(/\$t%d/g, topP/100);
				string = string.replace(/\$r%d/g, rightP/100);
				string = string.replace(/\$b%d/g, bottomP/100);
				string = string.replace(/\$l%d/g, leftP/100);
				string = string.replace(/\$t%/g, topP);
				string = string.replace(/\$r%/g, rightP);
				string = string.replace(/\$b%/g, bottomP);
				string = string.replace(/\$l%/g, leftP);
				string = string.replace(/\$t/g, top);
				string = string.replace(/\$r/g, right);
				string = string.replace(/\$b/g, bottom);
				string = string.replace(/\$l/g, left);
				return string;
			}
		},
		event: {
			parse: function(event) {
				var mode = "";
				switch (event.substr(0,1) ) {
				case "1":
					mode = "1";
					event = event.substr(1);
					break;
				case "!":
					mode = "!";
					event = event.substr(1);
					break;
				case "<":
					mode = "<";
					event = event.substr(1);
					break;
				}
				if (event.indexOf("(") > -1 && event.indexOf(")") > -1) {
					var eventName = event.substr(0, event.indexOf("("));
					var args = event.substr(event.indexOf("("));
					args = eval("[" + args + "]");
					return { name: eventName, arguments: args, mode: mode, appliedCount: 0 };
				} else {
					return { name: event, mode: mode, appliedCount: 0 };
				}
			}
		},
		eventsOn: {
			parse: function(eventsOn) {
				eventsOn = eventsOn.trim();
				var parts = eventsOn.split(" ");
				if (parts.length < 2) throw eventsOn + " does not have both an event and a selector";
				var events = animate.eventsOn.parseEvents(parts[0]);
				events.on = animate.eventsOn.parseOn(parts[1]);
				return events;
			},
			parseEvents: function(events) {
				events = events.trim();
				var parts = events.split(">");
				var redo = [];
				_.each(parts, function(event) {
					redo.push(animate.event.parse(event));
				});
				return { events: redo };
			},
			parseOn: function(on) {
				on = on.trim();
				if (on.substr(0,1) == "'" && on.substr(on.length-1) == "'") return on.substr(1, on.length-2);
				return on;
			}
		},
		actionsOn: {
			parse: function(actionsOn) {
				var redo = [];
				_.each(actionsOn, function(actionOn) {
					actionOn = actionOn.trim();
					var parts = actionOn.split(" ");
					if (parts.length < 1) throw actionOn + " does not have both an alteration";
					if (parts.length == 1) {
						var alterations = animate.actionsOn.parseAlterations(parts[1]);
						redo.push( { alterations: alterations } );	
						return;
					} else if (parts.length == 2) {
						var action = animate.actionsOn.parseAction(parts[0]);
						var alterations = animate.actionsOn.parseAlterations(parts[1]);
						redo.push( { action: action, alterations: alterations } );
						return;
					} else if (parts.length > 3) {
						var ends = parts.splice(2);
						parts[2] = ends.join(' ');
					}
					var action = animate.actionsOn.parseAction(parts[0]);
					var alterations = animate.actionsOn.parseAlterations(parts[1]);
					var on = animate.actionsOn.parseOn(parts[2]);
					redo.push( { action: action, alterations: alterations, on: on } );
					return;
				});
				return redo;
			},
			parseAction: function(action) {
				action = action.trim();
				var type = undefined;
				var direction = undefined;
				var interval = undefined;
				switch (action.substr(0,1)) {
				case "-":
					type = "remove";
					action = action.substr(1);
					break;
				case "+":
					type = "add";
					action = action.substr(1);
					break;
				default:
					type = "add";
				}
				if (action.substr(0,1) == "(" && action.substr(action.length-1) == ")") action = action.substr(1, action.length-2);
				switch (action.substr(0,1)) {
				case ">":
					direction = "forward";
					action = action.substr(1);
					break;
				case "<":
					direction = "backward";
					action = action.substr(1);
					break;
				default:
					direction = "foward";
				}
				if (action.length > 0) interval = action;
				var rtn = {};
				if (type !== undefined) rtn.type = type;
				if (direction !== undefined) rtn.direction = direction;
				if (interval !== undefined) rtn.interval = interval;
				return rtn;

			},
			parseAlterations: function(alterations) {
				alterations = alterations.trim();
				if (alterations.substr(0,1) == "'" && alterations.substr(alterations.length-1) == "'") return alterations.substr(1, alterations.length-2);
				return alterations;
			},
			parseOn: function(on) {
				on = on.trim();
				if (on.substr(0,1) == "'" && on.substr(on.length-1) == "'") return on.substr(1, on.length-2);
				return on;
			}
		}
	};


	Adapt.on("app:dataReady", function() {
		if (Adapt.course.get("_animate") === undefined) return;
		var id = 1;
		var animate = Adapt.course.get("_animate");
		_.each(animate._animations, function(item) {
			if (item._id == undefined) item._id = "glan-" + (id++);
		});
		config = animate;
	});

	Adapt.on("pageView:postRender", function(view) {
		animate.go(view, "contentObjects");
	});
	Adapt.on("articleView:postRender", function(view) {
		animate.go(view, "articles");
	});
	Adapt.on("blockView:postRender", function(view) {
		animate.go(view, "blocks");
	});
	Adapt.on("componentView:postRender", function(view) {
		animate.go(view, "components");
	});


})