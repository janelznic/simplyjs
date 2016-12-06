/*!
 * SimplyJS JavaScript Library v0.3.4 [alpha; unstable]
 * Date: 2016-12-06 11:34
 *
 * http://www.simplyjs.org
 *
 * Just simple JavaScript framework. Provides support for manipulating with DOM and events handling.
 * Easy for use, optimized for performance, native browser's support first.
 *
 * Author: Jan Elznic - http://www.janelznic.cz
 * Some parts of the code were taken from http://jak.seznam.cz & http://jquery.com
 *
 * Released under the MIT license - included in LICENSE file
 */

/**
 * Returns specific node selected by ID or array of fields selected by CSS selector
 * @param {string} [query] CSS selector
 * @param {node} [root=document] parent node
 * @returns {node || node[]}
 */
var $ = function(query, root) {
	if (query.indexOf("#") === 0 && query.indexOf(" ") === -1) { return $.gel(query.slice(1)); }

	var results = (root || document).querySelectorAll(query);

	if (!results.length) return null;

	var array = new Array(results.length);
	for (var i=0, len = results.length; len > i; i++) { array[i] = results[i]; }
	return array;
};

/* events cache */
$._events = {};

/**
 * document.getElementById, but much simpler (gel = gET elEMENT)
 * @param {string} [id] identifier of element
 * @param {object} [doc] context document
 * @returns {node} HTML node element
 */
$.gel = function(id, doc) {
	var d = doc || document;
	if (typeof(id) == "string") { return d.getElementById(id); }
	return id;
};

/**
 * Attach event listener; create and save anonymous function when that is called in their field of scope
 * this refers to the object of which is called addListener
 *
 * Examples:
 * addListener(node, "click", object)
 * addListener(node, "click", function)
 * addListener(node, "click", object, function)
 * addListener(node, "click", object, "functionName")
 *
 * @param {node} [elm] element that captures the event
 * @param {string} [type] event name (without "on" prefix); can contain multiple names separated by spaces
 * @param {object || function} [obj] object, which method is called (method can be named as handleEvent)|| anonymous function
 * @param {function || string} [func] function that will be executed as a listener || string reference to the function of an object
 * which is called as a method of the object
 * @param {boolean} [capture] value used as an argument for the DOM capturing; IE ignoring
 * @returns {string} handler identifier (can be destroyed)
 * @throws {error} $.addListener: arguments[3] must be method of arguments[2]
 */
$.addListener = function(elm, type, obj, func, capture) {
	obj = obj || window;
	capture = capture || false;

	var id = $.getRandomId();

	var action = obj;
	if (func) {
		if (typeof(func) == "string") { /* function insered as a string */
			if (typeof(obj[func]) != "function") {
				throw new Error("addListener: arguments[3] must be method of arguments[2]");
			}
			action = function(e) { obj[func](e, elm, id); }
		} else { /* referention to the function */
			action = function(e) { func.call(obj, e, elm, id); }
		}
	} else if (typeof(obj) == "function") { /* reference to the function without object */
		action = function(e) { obj(e, elm, id); }
	} else if (!document.addEventListener) { /* handleEvent */
		action = function(e) {
			e.currentTarget = elm;
			obj.handleEvent(e);
		}
	}

	this._addListener(elm, type, action, capture);

	this._events[id] = {
		elm: elm,
		type: type,
		action: action,
		capture: capture
	};

	return id;
};

/**
 * Attach event to the listener (DOM compatible or across attachEvent for IE)
 * @param {node} [elm] element that captures the event
 * @param {string} [type] event name (without "on" prefix); can contain multiple names separated by spaces
 * @param {function || object} [action] method or function which will be called
 * @param {boolean} [capture] value used as an argument for the DOM capturing; IE ignoring
 */
$._addListener = function(elm, type, action, capture) {
	var types = type.split(" ");
	for (var i=0, len = types.length; len > i; i++) {
		var t = types[i];
		if (elm.addEventListener) {
			elm.addEventListener(t, action, capture);
		} else {
			elm.attachEvent("on" + t, action);
		}
	}
};

/**
 * Remove event listener by identifier
 * @param {string} [id] event ID
 */
$.removeListener = function(id) {
	if (!(id in this._events)) { throw new Error("Cannot remove non-existent event ID '"+id+"'"); }
	var obj = this._events[id];
	this._removeListener(obj.elm, obj.type, obj.action, obj.capture);
	delete this._events[id];
};

/**
 * Detach event listener action
 * @param {object} [elm] element where event was attached
 * @param {string} [type] event name; can contain multiple names separated by spaces
 * @param {function} [action] event handler function
 * @param {boolean} [capture] value used as an argument for the DOM capturing; IE ignoring
 */
$._removeListener = function(elm, type, action, capture) {
	var types = type.split(" ");
	for (var i=0, len = types.length; len > i; i++) {
		var t = types[i];
		if (elm.removeEventListener) {
			elm.removeEventListener(t, action, capture);
		} else {
			elm.detachEvent("on"+t, action);
		}
	}
};

/**
 * Detach all event listeners saved in array
 * @param {array} [array] array with event identifiers
 */
$.removeListeners = function(array) {
	while (array.length) { this.removeListener(array.shift()); }
};

/**
 * Detach all listeners attached by addListeners (saved in this._events)
 */
$.removeAllListeners = function() {
	for (var id in this._events) { this.removeListener(id); }
};

/**
 * Cancels the default action (defined by the client) for the event
 * @param {object} [e] event
 */
$.cancelEvent = function(e) {
	var e = e || window.event;
	if(e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	}
};

/**
 * Stop events bubbling by document DOM
 * @param {object} [e] processing event
 */
$.stopEvent = function(e) {
	var e = e || window.event;
	if (e.stopPropagation) {
		e.stopPropagation();
	} else {
		e.cancelBubble = true;
	}
};

/**
 * Returns target of the event where is attached the listener
 * @param {object} [e] event object
 */
$.getEventTarget = function(e) {
	var e = e || window.event;
	return e.target || e.srcElement;
};

/**
 * Tests if the node has specific CSS class
 * @param {Object} [element] DOM node
 * @param {string} [className] CSS class
 * @returns {bool} true|false
 */
$.hasClass = function(element,className) {
	return element.classList.contains(className);
};

/**
 * Creates new element
 * @param {string} [tagName] Tag name
 * @param {string || object} [b] Added className(s) (separated by spaces) || associative array with properties for element attributes
 * @param {object} [styles] CSS styles as an object
 * @param {object} [doc] parent context document (default: document)
 * @returns {node}
 */
$.cel = function(tagName, b, styles, doc) {
	var d = doc || document;
	var node = d.createElement(tagName);
	if (b) {
		var t = typeof(b);
		if (t == "string") {
			$.addClass(node, b);
		} else if (t == "object") {
			for (var p in b) { node[p] = b[p]; }
		}
	}
	if (styles) { $.setStyle(node, styles); }
	return node;
};

/**
 * Alias for document.createTextNode.
 * @param {string} [str] text string
 * @param {object} [doc] parent context document (default: document)
 * @returns {node}
 */
$.text = function(str, doc) {
	var d = doc || document;
	return d.createTextNode(str);
};

/**
 * Adds CSS class for DOM node
 * @param {Object} [element] DOM node
 * @param {string||array} [className] CSS class (can be defined as array of classes)
 */
$.addClass = function(elm, classNames) {
	var localFunc = function(classNamesString) {
		classNamesString.split(" ").forEach(function(name) {
			elm.classList.add(name);
		});
	};

	if (typeof(classNames) == "string") {
		localFunc(classNames);
	} else {
		classNames.forEach(function(name) {
			if (typeof(name) != "string") {
				throw new Error("addClass: arguments[1][0] must be a string");
			} else {
				localFunc(name);
			}
		});
	}
};

/**
 * Removes CSS class for DOM node
 * @param {Object} [element] DOM node
 * @param {string||array} [classNames] CSS class (can be defined as array of classes)
 */
$.removeClass = function(elm, classNames) {
	var localFunc = function(classNamesString) {
		classNamesString.split(" ").forEach(function(name) {
			elm.classList.remove(name);
		});
	};

	if (typeof(classNames) == "string") {
		localFunc(classNames);
	} else {
		classNames.forEach(function(name) {
			if (typeof(name) != "string") {
				throw new Error("removeClass: arguments[1][0] must be a string");
			} else {
				localFunc(name);
			}
		});
	}
};

/**
 * Removes all childs of specific element
 * @param {Object} [element] DOM node
 */
$.removeChilds = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
};

/**
 * Append multiple childs
 * @param {Array} [arguments] First item in array will be used as parent node, the others will be appended as childs;
 * can be specified as arrays of arrays; takes variable amount of arrays
 */
$.append = function() {
	for (var i=0, len = arguments.length, parent; len > i; i++) {
		var arr = arguments[i];
		parent = arr[0];
		for (var j=1, len2 = arr.length; len2 > j; j++) {
			parent.appendChild(arr[j]);
		}
	}
};

/**
 * Returns current value of specific CSS property
 * @param {object} [elm] DOM node
 * @param {string} [property] CSS property name ("visibility", "backgroundColor", ...)
 */
$.getStyle = function(elm, property) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		var style = elm.ownerDocument.defaultView.getComputedStyle(elm, "");
		if (!style) return false;
		return style[property];
	}
	return elm.currentStyle[property];
};

/**
 * Sets specific properties for the node
 * @param {object} [elm] DOM node
 * @param {object} [style] object with specified CSS properties { color:"blue", border: 0 }
 */
$.setStyle = function(elm, style) {
	for (var name in style) {
		elm.style[name] = style[name];
	}
};

/**
 * Transfer the DOM collection to the array
 * @param {HTMLCollection} [col] HTML collection
 * @returns {array}
 */ 
$.arrayFromCollection = function(col) {
	var result = [];
	try {
		result = Array.prototype.slice.call(col);
	} catch(e) {
		for (var i=0, len = col.length;len > i; i++) { result.push(col[i]); }
	} finally {
		return result;
	}
};

/**
 * Shuffle array by random order
 * @param {array} [array]
 * @returns {array}
 */
$.shuffleArray = function(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	/* While there remain elements to shuffle */
	while (0 !== currentIndex) {
		/* Pick a remaining element */
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		/* And swap it with the current element */
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};

/**
 * Shuffle object by random order
 * @param {object} [obj]
 * @returns {object}
 */
$.shuffleObject = function(obj) {
	var keys = [];
	for (key in obj) {
		keys.push(key);
	}
	keys = $.shuffleArray(keys);

	for (var i=0, len=keys.length, tempObj = {}; len>i; i++) {
		tempObj[keys[i]] = obj[keys[i]];
	}

	return tempObj;
};

/**
 * Count number of properties in object
 * @param {object} [obj] Input object
 * @returns {number} Object length
 */
$.objectLength = function(obj) {
	var j=0;
	for (i in obj) { j++ }
	return j;
};

/**
 * Get object item by index
 * @param {object} [obj] Input object
 * @param {number} [index] Index
 * @returns {string} Item key
 */
$.getKeyByIndex = function(obj, index) {
	var i=0;
	for (key in obj) {
		if (i === index) { return key; }
		i++;
	}
};

/**
 * Slice an object with properties
 * @param {object} [obj] Input object
 * @param {number} [from] Slice from
 * @param {number} [to] Slice to
 * @returns {object} Output object
 */
$.sliceObject = function(obj, from, to) {
	if (arguments.length === 2) {
		to = arguments[1];
		from = 0;
	}

	var sliced = {};
	var i=0;
	for (key in obj) {
		if (from <= i && to >= i) {
			sliced[key] = obj[key];
		}
		if (i >= to) { break; }
		i++;
	}
	return sliced;
};

/**
 * Separate pure HTML code and JavaScript; then HTML code is insered by .innerHTML and JS scripts by eval()
 * @param {string} [str] HTML code
 * @returns {string[]} array with two items - separated HTML and separated JavaScript
 */
$.separateJS = function(str) {
	var js = [];
	var out = {};
	var s = str.replace(/<script.*?>([\s\S]*?)<\/script>/g, function(tag, code) {
		js.push(code);
		return "";
	});
	return [s, js.join("\n")];
};

/**
 * Returns parent node of specific element which has specific CSS selector
 * @param {node} [node] DOM node
 * @param {string} [selector] CSS selector
 */
$.findParent = function(node, selector) {
	var parts = (selector || "").match(/[#.]?[a-z0-9_-]+/ig) || [];

	var n = node.parentNode;
	while (n && n != document) {
		var is = true;
		for (var i=0, len = parts.length; len > i; i++) {
			var part = parts[i];
			switch (part.charAt(0)) {
				case "#":
					if (n.id != part.substring(1)) is = false;
				break;
				case ".":
					if (!$.hasClass(n, part.substring(1))) is = false;
				break;
				default:
					if (n.nodeName.toLowerCase() != part.toLowerCase()) is = false;
				break;
			}
		}
		if (is) return n;
		n = n.parentNode;
	}
	return null;
};

/**
 * Random number from to
 * @param {number} [min] From
 * @param {number} [max] To
 * @returns {number} Random number
 */
$.random = function(min, max) {
	return Math.floor((Math.random() * max) + min);
};

/**
 * Unique IDs generator
 * @returns {string} Unique ID
 */
$.getRandomId = function() {
	this._idCounter = (this._idCounter < 10000000 ? this._idCounter : 0);
	var id = "m" + new Date().getTime().toString(16) + "m" + this._idCounter.toString(16);
	this._idCounter++;
	return id;
};

/**
 * Identify device
 * @param {string} [elmId] Identifier of element, which have CSS property content with device string ID
 * @returns {string} Device ID (desktop || tablet || mobile)
 */
$.getDevice = function(elmId) {
	var elm = $.gel(elmId);
	if (!elm) {
		elm = $.cel("div", { id: elmId }, { display:"none" });
		var b = document.body;
		b.insertBefore(elm, b.firstChild);
	}
	return ($.getStyle(elm, "content")).replace(/"/g, "");
};

/**
 * Asynchronous function call
 * @param {function || string} [func] function that will be executed || string reference to the function of an object
 * @param {object} [doc] context document
 */
$.async = function(func, doc) {
	var type = typeof(func);
	if (type == "string") {
			if (typeof(obj[func]) != "function") {
				throw new Error("async: arguments[0] must be method of arguments[1]");
			}
			setTimeout(doc[func].call(doc), 0);
	} else {
		setTimeout(func.call(doc), 0);
	}
};

/**
 * Determine the platform
 * @returns {string||boolean} OS name as string (ios || android || unix || windows || mac || false)
 */
$.getPlatform = function() {
	var userAgent = navigator.userAgent || navigator.vendor || window.opera;
	if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
		return "ios";
	} else if (userAgent.match(/Android/i)) {
		return "android";
	} else if (userAgent.match(/BB10/i)) {
		return "blackberry";
	} else if (userAgent.match(/Linux/i) || userAgent.match(/X11/i)) {
		return "unix";
	} else if (userAgent.match(/Win/i)) {
		return "windows";
	} else if (userAgent.match(/Mac/i)) {
		return "mac";
	} else {
		return false;
	}
};

/**
 * Determine the client browser
 * @returns {string||boolean} Browser name as string (ios || android || unix || windows || mac || false)
 */
$.getClient = function() {
	if (window.opera) {
		return "opera";
	} else if (navigator.userAgent.indexOf("Edge") != -1) {
		return "edge";
	} else if (window.chrome) {
		return "chrome";
	} else if (("all" in document) && ("systemLanguage" in navigator)) {
		return "ie";
	} else if (document.getAnonymousElementByAttribute || "mozPaintCount" in window) {
		return "gecko";
	} else if (navigator.userAgent.indexOf("KHTML") != -1) {
		if (navigator.vendor == "KDE") {
			return "konqueror";
		} else if (navigator.vendor.indexOf("Apple") != -1) { 
			return "safari";
		} else {
			return false;
		}
	} else {
		return false;
	}
};
