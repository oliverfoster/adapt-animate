/*
* adapt-animate
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var OnScreen = require('extensions/adapt-animate/js/onscreen');

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');
	var parser = require('extensions/adapt-animate/js/adapt-animate-parser');

	var globalScope = undefined;

	var animate = {

		element: function(view, elementType) {

			//MAIN EXECUTOR, TAKES _componentObject, _article, _block or _component VIEWS 
			//NOTE: ALSO ACCEPTS A MOCK _global VIEW REPRESENTION THE DOCUMENT BODY

			if (globalScope === undefined) return;
			if (globalScope.length === 0) return;

			var model = view.model;

			//IF MODEL IS _animate._isEnabled = true
			if (model.get("_animate") === undefined || model.get("_animate")._isEnabled === false) return;
			
			//CONFIGURE ELEMENT MODEL WITH APPLICABLE ANIMATIONS
			animate.elementConfigure(model, view, elementType);

			//PARSE ANIMATIONS AND ATTACH EVENT QUEUES TO DOM
			animate.eventQueues.initialize(model, view);

		},

		elementConfigure: function(model, view, elementType) {
			//MERGE APPLICABLE ANIMATIONS FROM GLOBAL SCOPE (COURSE.JSON) INTO EACH ELEMENT 
			var modelAnimate = model.get("_animate");

			if (modelAnimate._merged === undefined) {

				//REDO _animations ARRAY SO THAT UNIQUE _id s ARE REPRESENTED IN {KEY: VALUE} FORMAT RATHER THAN [INDEX]
				if (modelAnimate._animations !== undefined) {
					var redo = {};
					var id = 1;
					_.each(modelAnimate._animations, function(item) {
						if (item._id == undefined) item._id = "lan-" + (id++);
						redo[item._id] = item;
					});
					modelAnimate._animations = redo;
				} else {
					modelAnimate._animations = {};
				}

				//ADD ANIMATIONS FROM GLOBAL ANIMATIONS SCOPE IF ID DOES NOT EXIST IN LOCAL ELEMENT
				if (globalScope._animations.length > 0) {
					var modelJSON = model.toJSON();
					_.each(globalScope._animations, function(item) {
						if (item._isEnabled === false) return;
						if (item["_"+elementType] === undefined) return;
						if (item["_"+elementType] === true) {
							modelAnimate._animations[item._id] = item;
						} else {
							//GO THROUGH EACH _componentObjects/_articles/_blocks/_components SECTION
							//MATCH RULES TO CURRENT ITEM
							_.each(item["_"+elementType], function(element) {
								//CHECK RULES MATCH
								var answer = _.findWhere([modelJSON], element);
								if (answer !== undefined) {
									if (modelAnimate._animations === undefined) modelAnimate._animations = {};
									if (modelAnimate._animations[item._id] !== undefined) return;
									modelAnimate._animations[item._id] = item;
									return;
								}
							});
						}
					});
				}

				//SET MERGED FLAG ON ELEMENT
				modelAnimate._merged = true;
			}

		},

		eventQueues: {

			initialize: function(model, view) {

				var modelAnimate = model.get("_animate");
				var events = [];

				//PARSE ANIMATIONS
				_.each(modelAnimate._animations, function(animation, key) {
					_.each(animation._events, function(actionsOnStrs, eventsOnStr) {
						if (typeof actionsOnStrs == "string") actionsOnStrs = [actionsOnStrs];

						//CREATE EVENTOBJECT
						/*
							{
								actionsOn: [
									{
										action: {
											direction: "forward(default)/backward"
											type: "add(default)/remove"
										},
										alterations: "emmet alteration",
										count: 0,
										on: "jquery selector"
									}
								],
								children: $([on]),
								count: 0,
								events: [
									{
										appliedCount: 0,
										mode: "(default)/!/1",
										name: "click/scroll/inview/etc"
									}
								],
								on: "jquery selector",
								orig: [
									"actionOn section",
									"actionOn section"...
								]
								parent: $([view]),
								str: "eventOn section"
							}
						*/

						var eventsOn = parser.sections.eventsOn.parse(eventsOnStr);
						eventsOn.orig = actionsOnStrs;
						eventsOn.parent = view.$el;
						eventsOn.children = view.$el.find(eventsOn.on);
						eventsOn.count = 0;
						eventsOn.index = -1;
						eventsOn.actionsOn = parser.sections.actionsOn.parse(actionsOnStrs);

						events.push(eventsOn);
						
					});
				});

				//CREATE GROUPING STORAGES FOR CONTEXT VARIABLE EXPANSION
				var groupByEvent = _.groupBy(events, function(item) { return item.str; });
				var groupByOn = _.groupBy(events, function(item) { return item.on; });
				_.each(groupByEvent, function(item, key) {
					groupByEvent[key] = {
						count: 0,
						name: key
					};
				});

				//ATTACH EVENTSQUEUES TO ELEMENT
				_.each(events, function(eventsOn) {

					//COPY EVENT QUEUE
					var copy = $.extend(true,{},eventsOn);

					//REATTACH CONTEXT VARIABLE STORAGES REFERENCES TO COPY OBJ
					copy.groupByEvent = groupByEvent[eventsOn.str];
					copy.groupByOn = groupByOn[eventsOn.on];

					//ATTACH FIRST EVENT
					animate.eventQueues.attach(copy);

				});

			},

			attach: function(eventsOn) {
				//ATTACH NEXT EVENT IN QUEUE TO EXECUTE onEvent

				//PUSH EVENTQUEUE FORWARD ONE INDEX
				//NOTE: ALL SINGLE EVENTS FALLBACK ONE INDEX AFTER EXECUTION
				eventsOn.index++;
				var eventObj = eventsOn.events[eventsOn.index];

				//CREATE EVENT HANDLER
				var onEvent = undefined;
				if (eventObj.handler === undefined) {
					eventObj.handler = _.bind(animate.eventQueues.onEvent, eventsOn.children, eventsOn);
				}
				onEvent = eventObj.handler;

				//CAPTURE IF EVENT IS ONE/ON/ON(SELECTOR)
				var mode = "on";
				var hasSelector = false;
				switch (eventObj.mode) {
				case "1":
					mode = "one";
					break;	
				case "!":
					mode = "on";
					hasSelector = true;
					break;	
				}

				//APPLY APPROPRIATE EVENT / GENERIC JQUERY EVENT
				switch(eventObj.name) {

				case "scroll":

					$(window)["on"]("scroll", onEvent);
					break;

				case "interval":

					if (mode == "one") {
						//IF 1interval USE TIMEOUT INSTEAD
						setTimeout.apply(window, [ function() {
							onEvent();
							//PUSH EVENTQUEUE BACK ONE INDEX
							eventsOn.index--;
						}, eventObj.arguments ] );
						break;
					}
					setInterval.apply(window, [ onEvent, eventObj.arguments ] );
					break;

				case "timeout":

					setTimeout.apply(window, [ function() {
						onEvent();
						//PUSH EVENTQUEUE BACK ONE INDEX
						eventsOn.index--;
					}, eventObj.arguments ] );
					break;

				case "inview": 
				case "onscreen":

					//HANDLER REQUIRED TO PROXY EVENT EXECUTION
					function onInview(event, onScreen) {
						var $target = $(event.currentTarget);
						
						var isInView = true;
						if (onScreen.inviewP <= 0) isInView = false;

						var inview = $target.attr("onscreen");
						
						if (!isInView && mode == "one" && inview=="onscreen") {
							//IF NOT INVIEW ANYMORE AND EVENT TO TRIGGER ONCE, REMOVE EVENT AND MARK OUT OF VIEW
							$target.attr("onscreen","");
							eventObj.appliedCount--;
							delete eventObj.inview;
							if (eventObj.appliedCount === 0) {
								//PUSH EVENTQUEUE BACK ONE INDEX
								eventsOn.index--;
								eventsOn.children["off"]("onscreen", onInview);
							}
							return;
						}
						if (!isInView) {
							//REMOVE ONSCREEN ATTRIBUTE FROM ELEMENT
							$target.attr("onscreen","");
							return;
						}

						//IF ONSCREEN AND MARKED, QUIT
						if (isInView && inview) return;

						//IF OUT OF PARAMETER INVIEW BOUNDS, QUIT
						if (eventObj.arguments !== undefined && eventObj.arguments[0] !== undefined) {
							if (onScreen.inviewP < parseInt(eventObj.arguments[0])) return;
						}

						//MARK ELEMENT AS ONSCREEN
						$target.attr("onscreen","onscreen");
						//RUN onEvent
						onEvent($target);
					}

					//APPLY EVENT IN CHOSEN FORMAT
					if (hasSelector) {
						if (eventObj.appliedCount === 0) eventsOn.parent["on"]("onscreen", eventsOn.on, onInview);
					} else {
						if (eventObj.appliedCount === 0) {
							eventsOn.children["on"]("onscreen", onInview);
						}
					};

					//CONTROL EVENT HANDLER ATTACHMENT COUNT
					eventObj.appliedCount++;
					break;

				case "outview":
				case "offscreen":

					//HANDLER REQUIRED TO PROXY EVENT EXECUTION
					function onOutview(event, onScreen) {

						var isInView = true;
						if (onScreen.inviewP <= 0) isInView = false;

						if (!isInView) {
							var $target = $(event.currentTarget);
							onEvent($target);
						}

						if (!isInView && mode == "one") {
							//IF EVENT IS ONCE ONLY REMOVE EVENT
							eventObj.appliedCount--;
							if (eventObj.appliedCount === 0) {
								//PUSH EVENTQUEUE BACK ONE INDEX
								eventsOn.index--;
								eventsOn.children["off"]("onscreen", onOutview);
							}
						}

					}

					//APPLY EVENT IN CHOSEN FORMAT
					if (hasSelector) {
						if (eventObj.appliedCount === 0) eventsOn.parent["on"]("onscreen", eventsOn.on, onOutview);
					} else {
						if (eventObj.appliedCount === 0) eventsOn.children["on"]("onscreen", onOutview);
					}

					//CONTROL EVENT HANDLER ATTACHMENT COUNT
					eventObj.appliedCount++;
					break;

				default:

					//GENERIC JQUERY EVENT HANDLER

					//APPLY EVENT IN CHOSEN FORMAT
					if (hasSelector) {
						if (eventObj.appliedCount === 0) eventsOn.parent[mode](eventObj.name, eventsOn.on, onEvent );
					} else {

						switch(mode) {
						case "one":
							if (eventObj.appliedCount === 0) eventsOn.children[mode](eventObj.name, function() {
								onEvent();
								//PUSH EVENTQUEUE BACK ONE INDEX
								eventsOn.index--;
							} );
							break;
						case "on":
							if (eventObj.appliedCount === 0) eventsOn.children[mode](eventObj.name, onEvent );
							break;
						}
						
					}

					//CONTROL EVENT HANDLER ATTACHMENT COUNT
					eventObj.appliedCount++;
					break;

				}

			},

			onEvent: function(eventsOn, target) {

				var back = false;
				if (eventsOn.index < eventsOn.events.length - 1) {
					//IF NEXT EVENT IS A BACK INSTRUCTION (<0,<1,<2,etc), MARK BACK AS TRUE
					back = (eventsOn.events[eventsOn.index + 1].mode == "<");
				}

				if (eventsOn.index < eventsOn.events.length - 1 && !back) {
					//IF NOT LAST EVENT IN QUEUE (OR BACK INSTRUCTION), ATTACH NEXT EVENT
					animate.eventQueues.attach(eventsOn);
				} else {
					//INCREMENT EXECUTION COUNTS
					eventsOn.count++;
					eventsOn.groupByEvent.count++;
					eventsOn.groupByOn.count++;

					//APPLY ACTION ALTERATIONS
					_.each(eventsOn.actionsOn, function(actionOn) {

						//SELECT ELEMENTS TO ALTER
						eventsOn.children = eventsOn.parent.find(eventsOn.on);
						var elements = undefined;
						if (actionOn.on !== undefined) {
							elements = eventsOn.parent.find(actionOn.on);
						} else {
							//IF NO ACTIONON SECTION ON SPECIFIED, USE CURRENT EVENT TARGET OR EVENTS ON ELEMENTS
							elements = (target || eventsOn.children);
						}

						//INCREMENT ACTION COUNT
						actionOn.count++;

						var from = undefined;
						var to = undefined;
						for (var i = 0; i < elements.length; i++) {
							//CHOOSE DIRECTION OF APPLICATION, FORWARD/BACKWARD
							var index = (actionOn.action.direction == "backward" ? (elements.length - 1) - i : i);
							var $element = $(elements[index]);

							var onScreen = $element.onscreen();

							//PARSE ALTERATION EXPRESSION AND COLLECT ALTERATIONS
							var alterations = parser.context.alterations(index, i, eventsOn, actionOn, onScreen);
							
							//PARSE INTERVAL EXPRESSION
							var interval = undefined;
							if (actionOn.action.interval === undefined) interval = 0;
							else interval = parser.context.interval(index, i, eventsOn, actionOn, onScreen);
							
							//APPLY ALTERATIONS WITH/WITHOUT INTERVAL BETWEEN 
							switch (actionOn.action.type) {
							case "add":
								var tailor =  _.bind(function($element, alterations) {
									_.each(alterations.attributes, function(value, key) {
										if (key == "class") {
											$element.addClass(value);
										} else {
											$element.attr(key, value);
										}
									});
									$element.html(alterations.content);
								}, window, $element, alterations);
								
								if (interval > 0) setTimeout( tailor, interval);
								else tailor();
								break;
							case "remove":
								var tailor = _.bind(function($element, alterations) {
									_.each(alterations.attributes, function(value, key) {
										if (key == "class") {
											$element.removeClass(value);
										} else {
											$element.attr(key, "");
										}
									});
									$element.html(alterations.content);
								}, window, $element, alterations);
								
								if (interval > 0) setTimeout( tailor, interval);
								else tailor();
								break;
							}
						}

					});
					if (back) {
						//IF BACK SPACIFIED MOVE BACK GIVEN COUNT
						eventsOn.index = parseInt(eventsOn.events[eventsOn.index + 1].name) - 1;
						//ATTACH NEXT EVENT
						animate.eventQueues.attach(eventsOn);
					}
				}
			}
		}	
	};


	Adapt.on("app:dataReady", function() {
		if (Adapt.course.get("_animate") === undefined) return;

		//GIVE UNIDENTIFIED GLOBAL ANIMATIONS A UNIQ ID
		var id = 1;
		var _animate = Adapt.course.get("_animate");
		_.each(_animate._animations, function(item) {
			if (item._id == undefined) item._id = "glan-" + (id++);
		});

		globalScope = _animate;

		//APPLY _global: true ANIMATIONS TO DOCUMENT BODY
		var view = {};
		view.$el = $("body");
		view.model = new Backbone.Model({
			"_animate": {
				"_isEnabled": true
			}
		});
		animate.element(view, "global");

	});


	Adapt.on("pageView:postRender", function(view) {
		animate.element(view, "contentObjects");
	});
	Adapt.on("articleView:postRender", function(view) {
		animate.element(view, "articles");
	});
	Adapt.on("blockView:postRender", function(view) {
		animate.element(view, "blocks");
	});
	Adapt.on("componentView:postRender", function(view) {
		animate.element(view, "components");
	});

})
