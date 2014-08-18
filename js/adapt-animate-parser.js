/*
* adapt-animate-parser
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Emmet = require('extensions/adapt-animate/js/emmet.min');

	var DOMAttrs = function(object) {
        //GET DOM ELEMENT ATTRIBUTES AS {KEY: VALUE}
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


	var parser = {

		context: {

			interval: function(index, naturalIndex, eventsOn, actionOn, onScreen) {
				//EXPAND AND EVALUATE INTERVAL EXPRESSIONS FOR ACTIONS: (>$i*250) == descending item index times 250 milliseconds
				var interval = parser.context.expand(actionOn.action.interval, index, naturalIndex, eventsOn, actionOn, onScreen);
				interval = eval(interval);
				return interval;
			},

			alterations: function(index, naturalIndex, eventsOn, actionOn, onScreen) {
				//EXPAND AND EVALUATE EMMET ALTERATION EXPRESSIONS: .red#item   ==   id="item" class="red"
				var expanded = parser.context.expand(actionOn.alterations, index, naturalIndex, eventsOn, actionOn, onScreen);
				var alterations = $(emmet.expandAbbreviation(expanded,"plain"))[0];
				var attributes = DOMAttrs(alterations);
				var content = undefined;
				if ($(alterations).html() > "") content = $(alterations).html();
				return {attributes:attributes, content:content};
			},

			expand: function(string, index, naturalIndex, eventsOn, actionOn, onScreen) {
				//REPLACE EXPRESSIONS WITH VALUES:  $i = index, $t = onScreen.top
				string = string.replace(/\$iv%d/g, onScreen.inviewP/100);
				string = string.replace(/\$iv%/g, onScreen.inviewP);
				string = string.replace(/\$e/g, eventsOn.count);
				string = string.replace(/\$le/g, eventsOn.count-1);
				string = string.replace(/\$ne/g, eventsOn.count+1);
				string = string.replace(/\$ge/g,  eventsOn.groupByEvent.count);
				string = string.replace(/\$lge/g, eventsOn.groupByEvent.count-1);
				string = string.replace(/\$nge/g, eventsOn.groupByEvent.count+1);
				string = string.replace(/\$gs/g, eventsOn.groupByOn.count);
				string = string.replace(/\$lgs/g, eventsOn.groupByOn.count-1);
				string = string.replace(/\$ngs/g, eventsOn.groupByOn.count+1);
				string = string.replace(/\$x/g, actionOn.count);
				string = string.replace(/\$lx/g, actionOn.count-1);
				string = string.replace(/\$nx/g, actionOn.count+1);
				string = string.replace(/\$ni/g, naturalIndex);
				string = string.replace(/\$i/g, index);
				string = string.replace(/\$t%d/g, onScreen.topP/100);
				string = string.replace(/\$r%d/g, onScreen.rightP/100);
				string = string.replace(/\$b%d/g, onScreen.bottomP/100);
				string = string.replace(/\$l%d/g, onScreen.leftP/100);
				string = string.replace(/\$t%/g, onScreen.topP);
				string = string.replace(/\$r%/g, onScreen.rightP);
				string = string.replace(/\$b%/g, onScreen.bottomP);
				string = string.replace(/\$l%/g, onScreen.leftP);
				string = string.replace(/\$t/g, onScreen.top);
				string = string.replace(/\$r/g, onScreen.right);
				string = string.replace(/\$b/g, onScreen.bottom);
				string = string.replace(/\$l/g, onScreen.left);
				return string;
			}

		},

		sections: {

			eventsOn: {

				parse: function(eventsOn) {
					//PARSE EVENTON SECTION
					eventsOn = eventsOn.trim();
					var parts = eventsOn.split(" ");
					if (parts.length < 2) throw eventsOn + " does not have both an event and a selector";
					var events = parser.sections.eventsOn.parseEvents(parts[0]);
					events.str = parts[0];
					events.on =parser.sections.eventsOn.parseOn(parts[1]);
					return events;
				},

				parseEvents: function(events) {
					//PARSE MODE, EVENTNAME AND EVENT ARGUMENTS SECTIONS
					events = events.trim();
					var parts = events.split(">");
					var redo = [];

					_.each(parts, function(event) {

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
							redo.push( { name: eventName, arguments: args, mode: mode, appliedCount: 0 } );
						} else {
							redo.push( { name: event, mode: mode, appliedCount: 0 } );
						}

					});

					return {events:redo};
				},

				parseOn: function(on) {
					//PARSE ON SECTION
					on = on.trim();
					if (on.substr(0,1) == "'" && on.substr(on.length-1) == "'") return on.substr(1, on.length-2);
					return on;
				}
			},

			actionsOn: {

				parse: function(actionsOn) {
					//PARSE ACTIONON SECTION
					var redo = [];
					_.each(actionsOn, function(actionOn) {
						actionOn = actionOn.trim();
						var parts = actionOn.split(" ");
						if (parts.length < 1) throw actionOn + " does not have both an alteration";
						if (parts.length == 1) {
							var alterations = parser.sections.actionsOn.parseAlterations(parts[1]);
							redo.push( { alterations: alterations, count: 0 } );	
							return;
						} else if (parts.length == 2) {
							var action = parser.sections.actionsOn.parseAction(parts[0]);
							var alterations = parser.sections.actionsOn.parseAlterations(parts[1]);
							redo.push( { action: action, alterations: alterations, count: 0 } );
							return;
						} else if (parts.length > 3) {
							var ends = parts.splice(2);
							parts[2] = ends.join(' ');
						}
						var action = parser.sections.actionsOn.parseAction(parts[0]);
						var alterations = parser.sections.actionsOn.parseAlterations(parts[1]);
						var on = parser.sections.actionsOn.parseOn(parts[2]);
						redo.push( { action: action, alterations: alterations, on: on, count: 0 } );
						return;
					});
					return redo;
				},

				parseAction: function(action) {
					//PARSE ADD/REMOVE, DIRECTION AND INTERVAL SECTIONS
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
					//PARSE ALTERATIONS
					alterations = alterations.trim();
					if (alterations.substr(0,1) == "'" && alterations.substr(alterations.length-1) == "'") return alterations.substr(1, alterations.length-2);
					return alterations;
				},

				parseOn: function(on) {
					//PARSE ON
					on = on.trim();
					if (on.substr(0,1) == "'" && on.substr(on.length-1) == "'") return on.substr(1, on.length-2);
					return on;
				}
			}
		}
	};

	return parser;

});