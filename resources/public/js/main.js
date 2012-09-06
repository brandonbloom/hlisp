var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6518 = x == null ? null : x;
  if(p[goog.typeOf(x__6518)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6519__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6519 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6519__delegate.call(this, array, i, idxs)
    };
    G__6519.cljs$lang$maxFixedArity = 2;
    G__6519.cljs$lang$applyTo = function(arglist__6520) {
      var array = cljs.core.first(arglist__6520);
      var i = cljs.core.first(cljs.core.next(arglist__6520));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6520));
      return G__6519__delegate(array, i, idxs)
    };
    G__6519.cljs$lang$arity$variadic = G__6519__delegate;
    return G__6519
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____6605 = this$;
      if(and__3822__auto____6605) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____6605
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2359__auto____6606 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6607 = cljs.core._invoke[goog.typeOf(x__2359__auto____6606)];
        if(or__3824__auto____6607) {
          return or__3824__auto____6607
        }else {
          var or__3824__auto____6608 = cljs.core._invoke["_"];
          if(or__3824__auto____6608) {
            return or__3824__auto____6608
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____6609 = this$;
      if(and__3822__auto____6609) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____6609
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2359__auto____6610 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6611 = cljs.core._invoke[goog.typeOf(x__2359__auto____6610)];
        if(or__3824__auto____6611) {
          return or__3824__auto____6611
        }else {
          var or__3824__auto____6612 = cljs.core._invoke["_"];
          if(or__3824__auto____6612) {
            return or__3824__auto____6612
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____6613 = this$;
      if(and__3822__auto____6613) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____6613
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2359__auto____6614 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6615 = cljs.core._invoke[goog.typeOf(x__2359__auto____6614)];
        if(or__3824__auto____6615) {
          return or__3824__auto____6615
        }else {
          var or__3824__auto____6616 = cljs.core._invoke["_"];
          if(or__3824__auto____6616) {
            return or__3824__auto____6616
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____6617 = this$;
      if(and__3822__auto____6617) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____6617
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2359__auto____6618 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6619 = cljs.core._invoke[goog.typeOf(x__2359__auto____6618)];
        if(or__3824__auto____6619) {
          return or__3824__auto____6619
        }else {
          var or__3824__auto____6620 = cljs.core._invoke["_"];
          if(or__3824__auto____6620) {
            return or__3824__auto____6620
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____6621 = this$;
      if(and__3822__auto____6621) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____6621
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2359__auto____6622 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6623 = cljs.core._invoke[goog.typeOf(x__2359__auto____6622)];
        if(or__3824__auto____6623) {
          return or__3824__auto____6623
        }else {
          var or__3824__auto____6624 = cljs.core._invoke["_"];
          if(or__3824__auto____6624) {
            return or__3824__auto____6624
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____6625 = this$;
      if(and__3822__auto____6625) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____6625
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2359__auto____6626 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6627 = cljs.core._invoke[goog.typeOf(x__2359__auto____6626)];
        if(or__3824__auto____6627) {
          return or__3824__auto____6627
        }else {
          var or__3824__auto____6628 = cljs.core._invoke["_"];
          if(or__3824__auto____6628) {
            return or__3824__auto____6628
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____6629 = this$;
      if(and__3822__auto____6629) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____6629
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2359__auto____6630 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6631 = cljs.core._invoke[goog.typeOf(x__2359__auto____6630)];
        if(or__3824__auto____6631) {
          return or__3824__auto____6631
        }else {
          var or__3824__auto____6632 = cljs.core._invoke["_"];
          if(or__3824__auto____6632) {
            return or__3824__auto____6632
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____6633 = this$;
      if(and__3822__auto____6633) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____6633
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2359__auto____6634 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6635 = cljs.core._invoke[goog.typeOf(x__2359__auto____6634)];
        if(or__3824__auto____6635) {
          return or__3824__auto____6635
        }else {
          var or__3824__auto____6636 = cljs.core._invoke["_"];
          if(or__3824__auto____6636) {
            return or__3824__auto____6636
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____6637 = this$;
      if(and__3822__auto____6637) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____6637
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2359__auto____6638 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6639 = cljs.core._invoke[goog.typeOf(x__2359__auto____6638)];
        if(or__3824__auto____6639) {
          return or__3824__auto____6639
        }else {
          var or__3824__auto____6640 = cljs.core._invoke["_"];
          if(or__3824__auto____6640) {
            return or__3824__auto____6640
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____6641 = this$;
      if(and__3822__auto____6641) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____6641
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2359__auto____6642 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6643 = cljs.core._invoke[goog.typeOf(x__2359__auto____6642)];
        if(or__3824__auto____6643) {
          return or__3824__auto____6643
        }else {
          var or__3824__auto____6644 = cljs.core._invoke["_"];
          if(or__3824__auto____6644) {
            return or__3824__auto____6644
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____6645 = this$;
      if(and__3822__auto____6645) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____6645
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2359__auto____6646 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6647 = cljs.core._invoke[goog.typeOf(x__2359__auto____6646)];
        if(or__3824__auto____6647) {
          return or__3824__auto____6647
        }else {
          var or__3824__auto____6648 = cljs.core._invoke["_"];
          if(or__3824__auto____6648) {
            return or__3824__auto____6648
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____6649 = this$;
      if(and__3822__auto____6649) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____6649
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2359__auto____6650 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6651 = cljs.core._invoke[goog.typeOf(x__2359__auto____6650)];
        if(or__3824__auto____6651) {
          return or__3824__auto____6651
        }else {
          var or__3824__auto____6652 = cljs.core._invoke["_"];
          if(or__3824__auto____6652) {
            return or__3824__auto____6652
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____6653 = this$;
      if(and__3822__auto____6653) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____6653
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2359__auto____6654 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6655 = cljs.core._invoke[goog.typeOf(x__2359__auto____6654)];
        if(or__3824__auto____6655) {
          return or__3824__auto____6655
        }else {
          var or__3824__auto____6656 = cljs.core._invoke["_"];
          if(or__3824__auto____6656) {
            return or__3824__auto____6656
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____6657 = this$;
      if(and__3822__auto____6657) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____6657
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2359__auto____6658 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6659 = cljs.core._invoke[goog.typeOf(x__2359__auto____6658)];
        if(or__3824__auto____6659) {
          return or__3824__auto____6659
        }else {
          var or__3824__auto____6660 = cljs.core._invoke["_"];
          if(or__3824__auto____6660) {
            return or__3824__auto____6660
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____6661 = this$;
      if(and__3822__auto____6661) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____6661
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2359__auto____6662 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6663 = cljs.core._invoke[goog.typeOf(x__2359__auto____6662)];
        if(or__3824__auto____6663) {
          return or__3824__auto____6663
        }else {
          var or__3824__auto____6664 = cljs.core._invoke["_"];
          if(or__3824__auto____6664) {
            return or__3824__auto____6664
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____6665 = this$;
      if(and__3822__auto____6665) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____6665
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2359__auto____6666 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6667 = cljs.core._invoke[goog.typeOf(x__2359__auto____6666)];
        if(or__3824__auto____6667) {
          return or__3824__auto____6667
        }else {
          var or__3824__auto____6668 = cljs.core._invoke["_"];
          if(or__3824__auto____6668) {
            return or__3824__auto____6668
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____6669 = this$;
      if(and__3822__auto____6669) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____6669
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2359__auto____6670 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6671 = cljs.core._invoke[goog.typeOf(x__2359__auto____6670)];
        if(or__3824__auto____6671) {
          return or__3824__auto____6671
        }else {
          var or__3824__auto____6672 = cljs.core._invoke["_"];
          if(or__3824__auto____6672) {
            return or__3824__auto____6672
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____6673 = this$;
      if(and__3822__auto____6673) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____6673
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2359__auto____6674 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6675 = cljs.core._invoke[goog.typeOf(x__2359__auto____6674)];
        if(or__3824__auto____6675) {
          return or__3824__auto____6675
        }else {
          var or__3824__auto____6676 = cljs.core._invoke["_"];
          if(or__3824__auto____6676) {
            return or__3824__auto____6676
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____6677 = this$;
      if(and__3822__auto____6677) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____6677
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2359__auto____6678 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6679 = cljs.core._invoke[goog.typeOf(x__2359__auto____6678)];
        if(or__3824__auto____6679) {
          return or__3824__auto____6679
        }else {
          var or__3824__auto____6680 = cljs.core._invoke["_"];
          if(or__3824__auto____6680) {
            return or__3824__auto____6680
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____6681 = this$;
      if(and__3822__auto____6681) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____6681
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2359__auto____6682 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6683 = cljs.core._invoke[goog.typeOf(x__2359__auto____6682)];
        if(or__3824__auto____6683) {
          return or__3824__auto____6683
        }else {
          var or__3824__auto____6684 = cljs.core._invoke["_"];
          if(or__3824__auto____6684) {
            return or__3824__auto____6684
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____6685 = this$;
      if(and__3822__auto____6685) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____6685
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2359__auto____6686 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____6687 = cljs.core._invoke[goog.typeOf(x__2359__auto____6686)];
        if(or__3824__auto____6687) {
          return or__3824__auto____6687
        }else {
          var or__3824__auto____6688 = cljs.core._invoke["_"];
          if(or__3824__auto____6688) {
            return or__3824__auto____6688
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____6693 = coll;
    if(and__3822__auto____6693) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____6693
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2359__auto____6694 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6695 = cljs.core._count[goog.typeOf(x__2359__auto____6694)];
      if(or__3824__auto____6695) {
        return or__3824__auto____6695
      }else {
        var or__3824__auto____6696 = cljs.core._count["_"];
        if(or__3824__auto____6696) {
          return or__3824__auto____6696
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____6701 = coll;
    if(and__3822__auto____6701) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____6701
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2359__auto____6702 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6703 = cljs.core._empty[goog.typeOf(x__2359__auto____6702)];
      if(or__3824__auto____6703) {
        return or__3824__auto____6703
      }else {
        var or__3824__auto____6704 = cljs.core._empty["_"];
        if(or__3824__auto____6704) {
          return or__3824__auto____6704
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____6709 = coll;
    if(and__3822__auto____6709) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____6709
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2359__auto____6710 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6711 = cljs.core._conj[goog.typeOf(x__2359__auto____6710)];
      if(or__3824__auto____6711) {
        return or__3824__auto____6711
      }else {
        var or__3824__auto____6712 = cljs.core._conj["_"];
        if(or__3824__auto____6712) {
          return or__3824__auto____6712
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____6721 = coll;
      if(and__3822__auto____6721) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____6721
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2359__auto____6722 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6723 = cljs.core._nth[goog.typeOf(x__2359__auto____6722)];
        if(or__3824__auto____6723) {
          return or__3824__auto____6723
        }else {
          var or__3824__auto____6724 = cljs.core._nth["_"];
          if(or__3824__auto____6724) {
            return or__3824__auto____6724
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____6725 = coll;
      if(and__3822__auto____6725) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____6725
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2359__auto____6726 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6727 = cljs.core._nth[goog.typeOf(x__2359__auto____6726)];
        if(or__3824__auto____6727) {
          return or__3824__auto____6727
        }else {
          var or__3824__auto____6728 = cljs.core._nth["_"];
          if(or__3824__auto____6728) {
            return or__3824__auto____6728
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____6733 = coll;
    if(and__3822__auto____6733) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____6733
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2359__auto____6734 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6735 = cljs.core._first[goog.typeOf(x__2359__auto____6734)];
      if(or__3824__auto____6735) {
        return or__3824__auto____6735
      }else {
        var or__3824__auto____6736 = cljs.core._first["_"];
        if(or__3824__auto____6736) {
          return or__3824__auto____6736
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____6741 = coll;
    if(and__3822__auto____6741) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____6741
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2359__auto____6742 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6743 = cljs.core._rest[goog.typeOf(x__2359__auto____6742)];
      if(or__3824__auto____6743) {
        return or__3824__auto____6743
      }else {
        var or__3824__auto____6744 = cljs.core._rest["_"];
        if(or__3824__auto____6744) {
          return or__3824__auto____6744
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____6749 = coll;
    if(and__3822__auto____6749) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____6749
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2359__auto____6750 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6751 = cljs.core._next[goog.typeOf(x__2359__auto____6750)];
      if(or__3824__auto____6751) {
        return or__3824__auto____6751
      }else {
        var or__3824__auto____6752 = cljs.core._next["_"];
        if(or__3824__auto____6752) {
          return or__3824__auto____6752
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____6761 = o;
      if(and__3822__auto____6761) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____6761
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2359__auto____6762 = o == null ? null : o;
      return function() {
        var or__3824__auto____6763 = cljs.core._lookup[goog.typeOf(x__2359__auto____6762)];
        if(or__3824__auto____6763) {
          return or__3824__auto____6763
        }else {
          var or__3824__auto____6764 = cljs.core._lookup["_"];
          if(or__3824__auto____6764) {
            return or__3824__auto____6764
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____6765 = o;
      if(and__3822__auto____6765) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____6765
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2359__auto____6766 = o == null ? null : o;
      return function() {
        var or__3824__auto____6767 = cljs.core._lookup[goog.typeOf(x__2359__auto____6766)];
        if(or__3824__auto____6767) {
          return or__3824__auto____6767
        }else {
          var or__3824__auto____6768 = cljs.core._lookup["_"];
          if(or__3824__auto____6768) {
            return or__3824__auto____6768
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____6773 = coll;
    if(and__3822__auto____6773) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____6773
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2359__auto____6774 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6775 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2359__auto____6774)];
      if(or__3824__auto____6775) {
        return or__3824__auto____6775
      }else {
        var or__3824__auto____6776 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____6776) {
          return or__3824__auto____6776
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____6781 = coll;
    if(and__3822__auto____6781) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____6781
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2359__auto____6782 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6783 = cljs.core._assoc[goog.typeOf(x__2359__auto____6782)];
      if(or__3824__auto____6783) {
        return or__3824__auto____6783
      }else {
        var or__3824__auto____6784 = cljs.core._assoc["_"];
        if(or__3824__auto____6784) {
          return or__3824__auto____6784
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____6789 = coll;
    if(and__3822__auto____6789) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____6789
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2359__auto____6790 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6791 = cljs.core._dissoc[goog.typeOf(x__2359__auto____6790)];
      if(or__3824__auto____6791) {
        return or__3824__auto____6791
      }else {
        var or__3824__auto____6792 = cljs.core._dissoc["_"];
        if(or__3824__auto____6792) {
          return or__3824__auto____6792
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____6797 = coll;
    if(and__3822__auto____6797) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____6797
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2359__auto____6798 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6799 = cljs.core._key[goog.typeOf(x__2359__auto____6798)];
      if(or__3824__auto____6799) {
        return or__3824__auto____6799
      }else {
        var or__3824__auto____6800 = cljs.core._key["_"];
        if(or__3824__auto____6800) {
          return or__3824__auto____6800
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____6805 = coll;
    if(and__3822__auto____6805) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____6805
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2359__auto____6806 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6807 = cljs.core._val[goog.typeOf(x__2359__auto____6806)];
      if(or__3824__auto____6807) {
        return or__3824__auto____6807
      }else {
        var or__3824__auto____6808 = cljs.core._val["_"];
        if(or__3824__auto____6808) {
          return or__3824__auto____6808
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____6813 = coll;
    if(and__3822__auto____6813) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____6813
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2359__auto____6814 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6815 = cljs.core._disjoin[goog.typeOf(x__2359__auto____6814)];
      if(or__3824__auto____6815) {
        return or__3824__auto____6815
      }else {
        var or__3824__auto____6816 = cljs.core._disjoin["_"];
        if(or__3824__auto____6816) {
          return or__3824__auto____6816
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____6821 = coll;
    if(and__3822__auto____6821) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____6821
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2359__auto____6822 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6823 = cljs.core._peek[goog.typeOf(x__2359__auto____6822)];
      if(or__3824__auto____6823) {
        return or__3824__auto____6823
      }else {
        var or__3824__auto____6824 = cljs.core._peek["_"];
        if(or__3824__auto____6824) {
          return or__3824__auto____6824
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____6829 = coll;
    if(and__3822__auto____6829) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____6829
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2359__auto____6830 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6831 = cljs.core._pop[goog.typeOf(x__2359__auto____6830)];
      if(or__3824__auto____6831) {
        return or__3824__auto____6831
      }else {
        var or__3824__auto____6832 = cljs.core._pop["_"];
        if(or__3824__auto____6832) {
          return or__3824__auto____6832
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____6837 = coll;
    if(and__3822__auto____6837) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____6837
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2359__auto____6838 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6839 = cljs.core._assoc_n[goog.typeOf(x__2359__auto____6838)];
      if(or__3824__auto____6839) {
        return or__3824__auto____6839
      }else {
        var or__3824__auto____6840 = cljs.core._assoc_n["_"];
        if(or__3824__auto____6840) {
          return or__3824__auto____6840
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____6845 = o;
    if(and__3822__auto____6845) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____6845
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2359__auto____6846 = o == null ? null : o;
    return function() {
      var or__3824__auto____6847 = cljs.core._deref[goog.typeOf(x__2359__auto____6846)];
      if(or__3824__auto____6847) {
        return or__3824__auto____6847
      }else {
        var or__3824__auto____6848 = cljs.core._deref["_"];
        if(or__3824__auto____6848) {
          return or__3824__auto____6848
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____6853 = o;
    if(and__3822__auto____6853) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____6853
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2359__auto____6854 = o == null ? null : o;
    return function() {
      var or__3824__auto____6855 = cljs.core._deref_with_timeout[goog.typeOf(x__2359__auto____6854)];
      if(or__3824__auto____6855) {
        return or__3824__auto____6855
      }else {
        var or__3824__auto____6856 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____6856) {
          return or__3824__auto____6856
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____6861 = o;
    if(and__3822__auto____6861) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____6861
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2359__auto____6862 = o == null ? null : o;
    return function() {
      var or__3824__auto____6863 = cljs.core._meta[goog.typeOf(x__2359__auto____6862)];
      if(or__3824__auto____6863) {
        return or__3824__auto____6863
      }else {
        var or__3824__auto____6864 = cljs.core._meta["_"];
        if(or__3824__auto____6864) {
          return or__3824__auto____6864
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____6869 = o;
    if(and__3822__auto____6869) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____6869
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2359__auto____6870 = o == null ? null : o;
    return function() {
      var or__3824__auto____6871 = cljs.core._with_meta[goog.typeOf(x__2359__auto____6870)];
      if(or__3824__auto____6871) {
        return or__3824__auto____6871
      }else {
        var or__3824__auto____6872 = cljs.core._with_meta["_"];
        if(or__3824__auto____6872) {
          return or__3824__auto____6872
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____6881 = coll;
      if(and__3822__auto____6881) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____6881
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2359__auto____6882 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6883 = cljs.core._reduce[goog.typeOf(x__2359__auto____6882)];
        if(or__3824__auto____6883) {
          return or__3824__auto____6883
        }else {
          var or__3824__auto____6884 = cljs.core._reduce["_"];
          if(or__3824__auto____6884) {
            return or__3824__auto____6884
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____6885 = coll;
      if(and__3822__auto____6885) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____6885
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2359__auto____6886 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____6887 = cljs.core._reduce[goog.typeOf(x__2359__auto____6886)];
        if(or__3824__auto____6887) {
          return or__3824__auto____6887
        }else {
          var or__3824__auto____6888 = cljs.core._reduce["_"];
          if(or__3824__auto____6888) {
            return or__3824__auto____6888
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____6893 = coll;
    if(and__3822__auto____6893) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____6893
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2359__auto____6894 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6895 = cljs.core._kv_reduce[goog.typeOf(x__2359__auto____6894)];
      if(or__3824__auto____6895) {
        return or__3824__auto____6895
      }else {
        var or__3824__auto____6896 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____6896) {
          return or__3824__auto____6896
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____6901 = o;
    if(and__3822__auto____6901) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____6901
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2359__auto____6902 = o == null ? null : o;
    return function() {
      var or__3824__auto____6903 = cljs.core._equiv[goog.typeOf(x__2359__auto____6902)];
      if(or__3824__auto____6903) {
        return or__3824__auto____6903
      }else {
        var or__3824__auto____6904 = cljs.core._equiv["_"];
        if(or__3824__auto____6904) {
          return or__3824__auto____6904
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____6909 = o;
    if(and__3822__auto____6909) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____6909
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2359__auto____6910 = o == null ? null : o;
    return function() {
      var or__3824__auto____6911 = cljs.core._hash[goog.typeOf(x__2359__auto____6910)];
      if(or__3824__auto____6911) {
        return or__3824__auto____6911
      }else {
        var or__3824__auto____6912 = cljs.core._hash["_"];
        if(or__3824__auto____6912) {
          return or__3824__auto____6912
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____6917 = o;
    if(and__3822__auto____6917) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____6917
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2359__auto____6918 = o == null ? null : o;
    return function() {
      var or__3824__auto____6919 = cljs.core._seq[goog.typeOf(x__2359__auto____6918)];
      if(or__3824__auto____6919) {
        return or__3824__auto____6919
      }else {
        var or__3824__auto____6920 = cljs.core._seq["_"];
        if(or__3824__auto____6920) {
          return or__3824__auto____6920
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____6925 = coll;
    if(and__3822__auto____6925) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____6925
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2359__auto____6926 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6927 = cljs.core._rseq[goog.typeOf(x__2359__auto____6926)];
      if(or__3824__auto____6927) {
        return or__3824__auto____6927
      }else {
        var or__3824__auto____6928 = cljs.core._rseq["_"];
        if(or__3824__auto____6928) {
          return or__3824__auto____6928
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6933 = coll;
    if(and__3822__auto____6933) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____6933
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2359__auto____6934 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6935 = cljs.core._sorted_seq[goog.typeOf(x__2359__auto____6934)];
      if(or__3824__auto____6935) {
        return or__3824__auto____6935
      }else {
        var or__3824__auto____6936 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____6936) {
          return or__3824__auto____6936
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____6941 = coll;
    if(and__3822__auto____6941) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____6941
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2359__auto____6942 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6943 = cljs.core._sorted_seq_from[goog.typeOf(x__2359__auto____6942)];
      if(or__3824__auto____6943) {
        return or__3824__auto____6943
      }else {
        var or__3824__auto____6944 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____6944) {
          return or__3824__auto____6944
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____6949 = coll;
    if(and__3822__auto____6949) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____6949
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2359__auto____6950 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6951 = cljs.core._entry_key[goog.typeOf(x__2359__auto____6950)];
      if(or__3824__auto____6951) {
        return or__3824__auto____6951
      }else {
        var or__3824__auto____6952 = cljs.core._entry_key["_"];
        if(or__3824__auto____6952) {
          return or__3824__auto____6952
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____6957 = coll;
    if(and__3822__auto____6957) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____6957
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2359__auto____6958 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____6959 = cljs.core._comparator[goog.typeOf(x__2359__auto____6958)];
      if(or__3824__auto____6959) {
        return or__3824__auto____6959
      }else {
        var or__3824__auto____6960 = cljs.core._comparator["_"];
        if(or__3824__auto____6960) {
          return or__3824__auto____6960
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____6965 = o;
    if(and__3822__auto____6965) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____6965
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2359__auto____6966 = o == null ? null : o;
    return function() {
      var or__3824__auto____6967 = cljs.core._pr_seq[goog.typeOf(x__2359__auto____6966)];
      if(or__3824__auto____6967) {
        return or__3824__auto____6967
      }else {
        var or__3824__auto____6968 = cljs.core._pr_seq["_"];
        if(or__3824__auto____6968) {
          return or__3824__auto____6968
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____6973 = d;
    if(and__3822__auto____6973) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____6973
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2359__auto____6974 = d == null ? null : d;
    return function() {
      var or__3824__auto____6975 = cljs.core._realized_QMARK_[goog.typeOf(x__2359__auto____6974)];
      if(or__3824__auto____6975) {
        return or__3824__auto____6975
      }else {
        var or__3824__auto____6976 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____6976) {
          return or__3824__auto____6976
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____6981 = this$;
    if(and__3822__auto____6981) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____6981
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2359__auto____6982 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6983 = cljs.core._notify_watches[goog.typeOf(x__2359__auto____6982)];
      if(or__3824__auto____6983) {
        return or__3824__auto____6983
      }else {
        var or__3824__auto____6984 = cljs.core._notify_watches["_"];
        if(or__3824__auto____6984) {
          return or__3824__auto____6984
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____6989 = this$;
    if(and__3822__auto____6989) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____6989
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2359__auto____6990 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6991 = cljs.core._add_watch[goog.typeOf(x__2359__auto____6990)];
      if(or__3824__auto____6991) {
        return or__3824__auto____6991
      }else {
        var or__3824__auto____6992 = cljs.core._add_watch["_"];
        if(or__3824__auto____6992) {
          return or__3824__auto____6992
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____6997 = this$;
    if(and__3822__auto____6997) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____6997
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2359__auto____6998 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____6999 = cljs.core._remove_watch[goog.typeOf(x__2359__auto____6998)];
      if(or__3824__auto____6999) {
        return or__3824__auto____6999
      }else {
        var or__3824__auto____7000 = cljs.core._remove_watch["_"];
        if(or__3824__auto____7000) {
          return or__3824__auto____7000
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____7005 = coll;
    if(and__3822__auto____7005) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____7005
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2359__auto____7006 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7007 = cljs.core._as_transient[goog.typeOf(x__2359__auto____7006)];
      if(or__3824__auto____7007) {
        return or__3824__auto____7007
      }else {
        var or__3824__auto____7008 = cljs.core._as_transient["_"];
        if(or__3824__auto____7008) {
          return or__3824__auto____7008
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____7013 = tcoll;
    if(and__3822__auto____7013) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____7013
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2359__auto____7014 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7015 = cljs.core._conj_BANG_[goog.typeOf(x__2359__auto____7014)];
      if(or__3824__auto____7015) {
        return or__3824__auto____7015
      }else {
        var or__3824__auto____7016 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____7016) {
          return or__3824__auto____7016
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7021 = tcoll;
    if(and__3822__auto____7021) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____7021
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2359__auto____7022 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7023 = cljs.core._persistent_BANG_[goog.typeOf(x__2359__auto____7022)];
      if(or__3824__auto____7023) {
        return or__3824__auto____7023
      }else {
        var or__3824__auto____7024 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____7024) {
          return or__3824__auto____7024
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____7029 = tcoll;
    if(and__3822__auto____7029) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____7029
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2359__auto____7030 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7031 = cljs.core._assoc_BANG_[goog.typeOf(x__2359__auto____7030)];
      if(or__3824__auto____7031) {
        return or__3824__auto____7031
      }else {
        var or__3824__auto____7032 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____7032) {
          return or__3824__auto____7032
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____7037 = tcoll;
    if(and__3822__auto____7037) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____7037
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2359__auto____7038 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7039 = cljs.core._dissoc_BANG_[goog.typeOf(x__2359__auto____7038)];
      if(or__3824__auto____7039) {
        return or__3824__auto____7039
      }else {
        var or__3824__auto____7040 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____7040) {
          return or__3824__auto____7040
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____7045 = tcoll;
    if(and__3822__auto____7045) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____7045
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2359__auto____7046 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7047 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2359__auto____7046)];
      if(or__3824__auto____7047) {
        return or__3824__auto____7047
      }else {
        var or__3824__auto____7048 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____7048) {
          return or__3824__auto____7048
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____7053 = tcoll;
    if(and__3822__auto____7053) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____7053
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2359__auto____7054 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7055 = cljs.core._pop_BANG_[goog.typeOf(x__2359__auto____7054)];
      if(or__3824__auto____7055) {
        return or__3824__auto____7055
      }else {
        var or__3824__auto____7056 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____7056) {
          return or__3824__auto____7056
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____7061 = tcoll;
    if(and__3822__auto____7061) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____7061
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2359__auto____7062 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____7063 = cljs.core._disjoin_BANG_[goog.typeOf(x__2359__auto____7062)];
      if(or__3824__auto____7063) {
        return or__3824__auto____7063
      }else {
        var or__3824__auto____7064 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____7064) {
          return or__3824__auto____7064
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____7069 = x;
    if(and__3822__auto____7069) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____7069
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2359__auto____7070 = x == null ? null : x;
    return function() {
      var or__3824__auto____7071 = cljs.core._compare[goog.typeOf(x__2359__auto____7070)];
      if(or__3824__auto____7071) {
        return or__3824__auto____7071
      }else {
        var or__3824__auto____7072 = cljs.core._compare["_"];
        if(or__3824__auto____7072) {
          return or__3824__auto____7072
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____7077 = coll;
    if(and__3822__auto____7077) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____7077
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2359__auto____7078 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7079 = cljs.core._drop_first[goog.typeOf(x__2359__auto____7078)];
      if(or__3824__auto____7079) {
        return or__3824__auto____7079
      }else {
        var or__3824__auto____7080 = cljs.core._drop_first["_"];
        if(or__3824__auto____7080) {
          return or__3824__auto____7080
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____7085 = coll;
    if(and__3822__auto____7085) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____7085
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2359__auto____7086 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7087 = cljs.core._chunked_first[goog.typeOf(x__2359__auto____7086)];
      if(or__3824__auto____7087) {
        return or__3824__auto____7087
      }else {
        var or__3824__auto____7088 = cljs.core._chunked_first["_"];
        if(or__3824__auto____7088) {
          return or__3824__auto____7088
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____7093 = coll;
    if(and__3822__auto____7093) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____7093
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2359__auto____7094 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7095 = cljs.core._chunked_rest[goog.typeOf(x__2359__auto____7094)];
      if(or__3824__auto____7095) {
        return or__3824__auto____7095
      }else {
        var or__3824__auto____7096 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____7096) {
          return or__3824__auto____7096
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____7101 = coll;
    if(and__3822__auto____7101) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____7101
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2359__auto____7102 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____7103 = cljs.core._chunked_next[goog.typeOf(x__2359__auto____7102)];
      if(or__3824__auto____7103) {
        return or__3824__auto____7103
      }else {
        var or__3824__auto____7104 = cljs.core._chunked_next["_"];
        if(or__3824__auto____7104) {
          return or__3824__auto____7104
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____7106 = x === y;
    if(or__3824__auto____7106) {
      return or__3824__auto____7106
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__7107__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7108 = y;
            var G__7109 = cljs.core.first.call(null, more);
            var G__7110 = cljs.core.next.call(null, more);
            x = G__7108;
            y = G__7109;
            more = G__7110;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7107 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7107__delegate.call(this, x, y, more)
    };
    G__7107.cljs$lang$maxFixedArity = 2;
    G__7107.cljs$lang$applyTo = function(arglist__7111) {
      var x = cljs.core.first(arglist__7111);
      var y = cljs.core.first(cljs.core.next(arglist__7111));
      var more = cljs.core.rest(cljs.core.next(arglist__7111));
      return G__7107__delegate(x, y, more)
    };
    G__7107.cljs$lang$arity$variadic = G__7107__delegate;
    return G__7107
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__7112 = null;
  var G__7112__2 = function(o, k) {
    return null
  };
  var G__7112__3 = function(o, k, not_found) {
    return not_found
  };
  G__7112 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7112__2.call(this, o, k);
      case 3:
        return G__7112__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7112
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__7113 = null;
  var G__7113__2 = function(_, f) {
    return f.call(null)
  };
  var G__7113__3 = function(_, f, start) {
    return start
  };
  G__7113 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7113__2.call(this, _, f);
      case 3:
        return G__7113__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7113
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__7114 = null;
  var G__7114__2 = function(_, n) {
    return null
  };
  var G__7114__3 = function(_, n, not_found) {
    return not_found
  };
  G__7114 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7114__2.call(this, _, n);
      case 3:
        return G__7114__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7114
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____7115 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____7115) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____7115
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__7128 = cljs.core._count.call(null, cicoll);
    if(cnt__7128 === 0) {
      return f.call(null)
    }else {
      var val__7129 = cljs.core._nth.call(null, cicoll, 0);
      var n__7130 = 1;
      while(true) {
        if(n__7130 < cnt__7128) {
          var nval__7131 = f.call(null, val__7129, cljs.core._nth.call(null, cicoll, n__7130));
          if(cljs.core.reduced_QMARK_.call(null, nval__7131)) {
            return cljs.core.deref.call(null, nval__7131)
          }else {
            var G__7140 = nval__7131;
            var G__7141 = n__7130 + 1;
            val__7129 = G__7140;
            n__7130 = G__7141;
            continue
          }
        }else {
          return val__7129
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__7132 = cljs.core._count.call(null, cicoll);
    var val__7133 = val;
    var n__7134 = 0;
    while(true) {
      if(n__7134 < cnt__7132) {
        var nval__7135 = f.call(null, val__7133, cljs.core._nth.call(null, cicoll, n__7134));
        if(cljs.core.reduced_QMARK_.call(null, nval__7135)) {
          return cljs.core.deref.call(null, nval__7135)
        }else {
          var G__7142 = nval__7135;
          var G__7143 = n__7134 + 1;
          val__7133 = G__7142;
          n__7134 = G__7143;
          continue
        }
      }else {
        return val__7133
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__7136 = cljs.core._count.call(null, cicoll);
    var val__7137 = val;
    var n__7138 = idx;
    while(true) {
      if(n__7138 < cnt__7136) {
        var nval__7139 = f.call(null, val__7137, cljs.core._nth.call(null, cicoll, n__7138));
        if(cljs.core.reduced_QMARK_.call(null, nval__7139)) {
          return cljs.core.deref.call(null, nval__7139)
        }else {
          var G__7144 = nval__7139;
          var G__7145 = n__7138 + 1;
          val__7137 = G__7144;
          n__7138 = G__7145;
          continue
        }
      }else {
        return val__7137
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__7158 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__7159 = arr[0];
      var n__7160 = 1;
      while(true) {
        if(n__7160 < cnt__7158) {
          var nval__7161 = f.call(null, val__7159, arr[n__7160]);
          if(cljs.core.reduced_QMARK_.call(null, nval__7161)) {
            return cljs.core.deref.call(null, nval__7161)
          }else {
            var G__7170 = nval__7161;
            var G__7171 = n__7160 + 1;
            val__7159 = G__7170;
            n__7160 = G__7171;
            continue
          }
        }else {
          return val__7159
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__7162 = arr.length;
    var val__7163 = val;
    var n__7164 = 0;
    while(true) {
      if(n__7164 < cnt__7162) {
        var nval__7165 = f.call(null, val__7163, arr[n__7164]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7165)) {
          return cljs.core.deref.call(null, nval__7165)
        }else {
          var G__7172 = nval__7165;
          var G__7173 = n__7164 + 1;
          val__7163 = G__7172;
          n__7164 = G__7173;
          continue
        }
      }else {
        return val__7163
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__7166 = arr.length;
    var val__7167 = val;
    var n__7168 = idx;
    while(true) {
      if(n__7168 < cnt__7166) {
        var nval__7169 = f.call(null, val__7167, arr[n__7168]);
        if(cljs.core.reduced_QMARK_.call(null, nval__7169)) {
          return cljs.core.deref.call(null, nval__7169)
        }else {
          var G__7174 = nval__7169;
          var G__7175 = n__7168 + 1;
          val__7167 = G__7174;
          n__7168 = G__7175;
          continue
        }
      }else {
        return val__7167
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7176 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__7177 = this;
  if(this__7177.i + 1 < this__7177.a.length) {
    return new cljs.core.IndexedSeq(this__7177.a, this__7177.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7178 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7179 = this;
  var c__7180 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__7180 > 0) {
    return new cljs.core.RSeq(coll, c__7180 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__7181 = this;
  var this__7182 = this;
  return cljs.core.pr_str.call(null, this__7182)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7183 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7183.a)) {
    return cljs.core.ci_reduce.call(null, this__7183.a, f, this__7183.a[this__7183.i], this__7183.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__7183.a[this__7183.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7184 = this;
  if(cljs.core.counted_QMARK_.call(null, this__7184.a)) {
    return cljs.core.ci_reduce.call(null, this__7184.a, f, start, this__7184.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7185 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7186 = this;
  return this__7186.a.length - this__7186.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__7187 = this;
  return this__7187.a[this__7187.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__7188 = this;
  if(this__7188.i + 1 < this__7188.a.length) {
    return new cljs.core.IndexedSeq(this__7188.a, this__7188.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7189 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7190 = this;
  var i__7191 = n + this__7190.i;
  if(i__7191 < this__7190.a.length) {
    return this__7190.a[i__7191]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7192 = this;
  var i__7193 = n + this__7192.i;
  if(i__7193 < this__7192.a.length) {
    return this__7192.a[i__7193]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__7194 = null;
  var G__7194__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__7194__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__7194 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7194__2.call(this, array, f);
      case 3:
        return G__7194__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7194
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__7195 = null;
  var G__7195__2 = function(array, k) {
    return array[k]
  };
  var G__7195__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__7195 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7195__2.call(this, array, k);
      case 3:
        return G__7195__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7195
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__7196 = null;
  var G__7196__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__7196__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__7196 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7196__2.call(this, array, n);
      case 3:
        return G__7196__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7196
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7197 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7198 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__7199 = this;
  var this__7200 = this;
  return cljs.core.pr_str.call(null, this__7200)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7201 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7202 = this;
  return this__7202.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7203 = this;
  return cljs.core._nth.call(null, this__7203.ci, this__7203.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7204 = this;
  if(this__7204.i > 0) {
    return new cljs.core.RSeq(this__7204.ci, this__7204.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7205 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__7206 = this;
  return new cljs.core.RSeq(this__7206.ci, this__7206.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7207 = this;
  return this__7207.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7211__7212 = coll;
      if(G__7211__7212) {
        if(function() {
          var or__3824__auto____7213 = G__7211__7212.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____7213) {
            return or__3824__auto____7213
          }else {
            return G__7211__7212.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__7211__7212.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7211__7212)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__7211__7212)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7218__7219 = coll;
      if(G__7218__7219) {
        if(function() {
          var or__3824__auto____7220 = G__7218__7219.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7220) {
            return or__3824__auto____7220
          }else {
            return G__7218__7219.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7218__7219.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7218__7219)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7218__7219)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__7221 = cljs.core.seq.call(null, coll);
      if(s__7221 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__7221)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__7226__7227 = coll;
      if(G__7226__7227) {
        if(function() {
          var or__3824__auto____7228 = G__7226__7227.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7228) {
            return or__3824__auto____7228
          }else {
            return G__7226__7227.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7226__7227.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7226__7227)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7226__7227)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__7229 = cljs.core.seq.call(null, coll);
      if(!(s__7229 == null)) {
        return cljs.core._rest.call(null, s__7229)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__7233__7234 = coll;
      if(G__7233__7234) {
        if(function() {
          var or__3824__auto____7235 = G__7233__7234.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____7235) {
            return or__3824__auto____7235
          }else {
            return G__7233__7234.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__7233__7234.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7233__7234)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__7233__7234)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__7237 = cljs.core.next.call(null, s);
    if(!(sn__7237 == null)) {
      var G__7238 = sn__7237;
      s = G__7238;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__7239__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__7240 = conj.call(null, coll, x);
          var G__7241 = cljs.core.first.call(null, xs);
          var G__7242 = cljs.core.next.call(null, xs);
          coll = G__7240;
          x = G__7241;
          xs = G__7242;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__7239 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7239__delegate.call(this, coll, x, xs)
    };
    G__7239.cljs$lang$maxFixedArity = 2;
    G__7239.cljs$lang$applyTo = function(arglist__7243) {
      var coll = cljs.core.first(arglist__7243);
      var x = cljs.core.first(cljs.core.next(arglist__7243));
      var xs = cljs.core.rest(cljs.core.next(arglist__7243));
      return G__7239__delegate(coll, x, xs)
    };
    G__7239.cljs$lang$arity$variadic = G__7239__delegate;
    return G__7239
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__7246 = cljs.core.seq.call(null, coll);
  var acc__7247 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__7246)) {
      return acc__7247 + cljs.core._count.call(null, s__7246)
    }else {
      var G__7248 = cljs.core.next.call(null, s__7246);
      var G__7249 = acc__7247 + 1;
      s__7246 = G__7248;
      acc__7247 = G__7249;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__7256__7257 = coll;
        if(G__7256__7257) {
          if(function() {
            var or__3824__auto____7258 = G__7256__7257.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7258) {
              return or__3824__auto____7258
            }else {
              return G__7256__7257.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7256__7257.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7256__7257)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7256__7257)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__7259__7260 = coll;
        if(G__7259__7260) {
          if(function() {
            var or__3824__auto____7261 = G__7259__7260.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____7261) {
              return or__3824__auto____7261
            }else {
              return G__7259__7260.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__7259__7260.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7259__7260)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7259__7260)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__7264__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__7263 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__7265 = ret__7263;
          var G__7266 = cljs.core.first.call(null, kvs);
          var G__7267 = cljs.core.second.call(null, kvs);
          var G__7268 = cljs.core.nnext.call(null, kvs);
          coll = G__7265;
          k = G__7266;
          v = G__7267;
          kvs = G__7268;
          continue
        }else {
          return ret__7263
        }
        break
      }
    };
    var G__7264 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7264__delegate.call(this, coll, k, v, kvs)
    };
    G__7264.cljs$lang$maxFixedArity = 3;
    G__7264.cljs$lang$applyTo = function(arglist__7269) {
      var coll = cljs.core.first(arglist__7269);
      var k = cljs.core.first(cljs.core.next(arglist__7269));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7269)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7269)));
      return G__7264__delegate(coll, k, v, kvs)
    };
    G__7264.cljs$lang$arity$variadic = G__7264__delegate;
    return G__7264
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__7272__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7271 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7273 = ret__7271;
          var G__7274 = cljs.core.first.call(null, ks);
          var G__7275 = cljs.core.next.call(null, ks);
          coll = G__7273;
          k = G__7274;
          ks = G__7275;
          continue
        }else {
          return ret__7271
        }
        break
      }
    };
    var G__7272 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7272__delegate.call(this, coll, k, ks)
    };
    G__7272.cljs$lang$maxFixedArity = 2;
    G__7272.cljs$lang$applyTo = function(arglist__7276) {
      var coll = cljs.core.first(arglist__7276);
      var k = cljs.core.first(cljs.core.next(arglist__7276));
      var ks = cljs.core.rest(cljs.core.next(arglist__7276));
      return G__7272__delegate(coll, k, ks)
    };
    G__7272.cljs$lang$arity$variadic = G__7272__delegate;
    return G__7272
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__7280__7281 = o;
    if(G__7280__7281) {
      if(function() {
        var or__3824__auto____7282 = G__7280__7281.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____7282) {
          return or__3824__auto____7282
        }else {
          return G__7280__7281.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__7280__7281.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7280__7281)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__7280__7281)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__7285__delegate = function(coll, k, ks) {
      while(true) {
        var ret__7284 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__7286 = ret__7284;
          var G__7287 = cljs.core.first.call(null, ks);
          var G__7288 = cljs.core.next.call(null, ks);
          coll = G__7286;
          k = G__7287;
          ks = G__7288;
          continue
        }else {
          return ret__7284
        }
        break
      }
    };
    var G__7285 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7285__delegate.call(this, coll, k, ks)
    };
    G__7285.cljs$lang$maxFixedArity = 2;
    G__7285.cljs$lang$applyTo = function(arglist__7289) {
      var coll = cljs.core.first(arglist__7289);
      var k = cljs.core.first(cljs.core.next(arglist__7289));
      var ks = cljs.core.rest(cljs.core.next(arglist__7289));
      return G__7285__delegate(coll, k, ks)
    };
    G__7285.cljs$lang$arity$variadic = G__7285__delegate;
    return G__7285
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__7291 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__7291;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__7291
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__7293 = cljs.core.string_hash_cache[k];
  if(!(h__7293 == null)) {
    return h__7293
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____7295 = goog.isString(o);
      if(and__3822__auto____7295) {
        return check_cache
      }else {
        return and__3822__auto____7295
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7299__7300 = x;
    if(G__7299__7300) {
      if(function() {
        var or__3824__auto____7301 = G__7299__7300.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____7301) {
          return or__3824__auto____7301
        }else {
          return G__7299__7300.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__7299__7300.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7299__7300)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__7299__7300)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7305__7306 = x;
    if(G__7305__7306) {
      if(function() {
        var or__3824__auto____7307 = G__7305__7306.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____7307) {
          return or__3824__auto____7307
        }else {
          return G__7305__7306.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__7305__7306.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7305__7306)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__7305__7306)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__7311__7312 = x;
  if(G__7311__7312) {
    if(function() {
      var or__3824__auto____7313 = G__7311__7312.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____7313) {
        return or__3824__auto____7313
      }else {
        return G__7311__7312.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__7311__7312.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7311__7312)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__7311__7312)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__7317__7318 = x;
  if(G__7317__7318) {
    if(function() {
      var or__3824__auto____7319 = G__7317__7318.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____7319) {
        return or__3824__auto____7319
      }else {
        return G__7317__7318.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__7317__7318.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7317__7318)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__7317__7318)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__7323__7324 = x;
  if(G__7323__7324) {
    if(function() {
      var or__3824__auto____7325 = G__7323__7324.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____7325) {
        return or__3824__auto____7325
      }else {
        return G__7323__7324.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__7323__7324.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7323__7324)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__7323__7324)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__7329__7330 = x;
  if(G__7329__7330) {
    if(function() {
      var or__3824__auto____7331 = G__7329__7330.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____7331) {
        return or__3824__auto____7331
      }else {
        return G__7329__7330.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__7329__7330.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7329__7330)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__7329__7330)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__7335__7336 = x;
  if(G__7335__7336) {
    if(function() {
      var or__3824__auto____7337 = G__7335__7336.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____7337) {
        return or__3824__auto____7337
      }else {
        return G__7335__7336.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__7335__7336.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7335__7336)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7335__7336)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__7341__7342 = x;
    if(G__7341__7342) {
      if(function() {
        var or__3824__auto____7343 = G__7341__7342.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____7343) {
          return or__3824__auto____7343
        }else {
          return G__7341__7342.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__7341__7342.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7341__7342)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__7341__7342)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__7347__7348 = x;
  if(G__7347__7348) {
    if(function() {
      var or__3824__auto____7349 = G__7347__7348.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____7349) {
        return or__3824__auto____7349
      }else {
        return G__7347__7348.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__7347__7348.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7347__7348)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__7347__7348)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__7353__7354 = x;
  if(G__7353__7354) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____7355 = null;
      if(cljs.core.truth_(or__3824__auto____7355)) {
        return or__3824__auto____7355
      }else {
        return G__7353__7354.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__7353__7354.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7353__7354)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__7353__7354)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__7356__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__7356 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7356__delegate.call(this, keyvals)
    };
    G__7356.cljs$lang$maxFixedArity = 0;
    G__7356.cljs$lang$applyTo = function(arglist__7357) {
      var keyvals = cljs.core.seq(arglist__7357);
      return G__7356__delegate(keyvals)
    };
    G__7356.cljs$lang$arity$variadic = G__7356__delegate;
    return G__7356
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__7359 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__7359.push(key)
  });
  return keys__7359
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__7363 = i;
  var j__7364 = j;
  var len__7365 = len;
  while(true) {
    if(len__7365 === 0) {
      return to
    }else {
      to[j__7364] = from[i__7363];
      var G__7366 = i__7363 + 1;
      var G__7367 = j__7364 + 1;
      var G__7368 = len__7365 - 1;
      i__7363 = G__7366;
      j__7364 = G__7367;
      len__7365 = G__7368;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__7372 = i + (len - 1);
  var j__7373 = j + (len - 1);
  var len__7374 = len;
  while(true) {
    if(len__7374 === 0) {
      return to
    }else {
      to[j__7373] = from[i__7372];
      var G__7375 = i__7372 - 1;
      var G__7376 = j__7373 - 1;
      var G__7377 = len__7374 - 1;
      i__7372 = G__7375;
      j__7373 = G__7376;
      len__7374 = G__7377;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__7381__7382 = s;
    if(G__7381__7382) {
      if(function() {
        var or__3824__auto____7383 = G__7381__7382.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____7383) {
          return or__3824__auto____7383
        }else {
          return G__7381__7382.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__7381__7382.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7381__7382)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7381__7382)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__7387__7388 = s;
  if(G__7387__7388) {
    if(function() {
      var or__3824__auto____7389 = G__7387__7388.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____7389) {
        return or__3824__auto____7389
      }else {
        return G__7387__7388.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__7387__7388.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7387__7388)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__7387__7388)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____7392 = goog.isString(x);
  if(and__3822__auto____7392) {
    return!function() {
      var or__3824__auto____7393 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____7393) {
        return or__3824__auto____7393
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____7392
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____7395 = goog.isString(x);
  if(and__3822__auto____7395) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____7395
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____7397 = goog.isString(x);
  if(and__3822__auto____7397) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____7397
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____7402 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____7402) {
    return or__3824__auto____7402
  }else {
    var G__7403__7404 = f;
    if(G__7403__7404) {
      if(function() {
        var or__3824__auto____7405 = G__7403__7404.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____7405) {
          return or__3824__auto____7405
        }else {
          return G__7403__7404.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__7403__7404.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7403__7404)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__7403__7404)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____7407 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____7407) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____7407
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____7410 = coll;
    if(cljs.core.truth_(and__3822__auto____7410)) {
      var and__3822__auto____7411 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____7411) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____7411
      }
    }else {
      return and__3822__auto____7410
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__7420__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__7416 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__7417 = more;
        while(true) {
          var x__7418 = cljs.core.first.call(null, xs__7417);
          var etc__7419 = cljs.core.next.call(null, xs__7417);
          if(cljs.core.truth_(xs__7417)) {
            if(cljs.core.contains_QMARK_.call(null, s__7416, x__7418)) {
              return false
            }else {
              var G__7421 = cljs.core.conj.call(null, s__7416, x__7418);
              var G__7422 = etc__7419;
              s__7416 = G__7421;
              xs__7417 = G__7422;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__7420 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7420__delegate.call(this, x, y, more)
    };
    G__7420.cljs$lang$maxFixedArity = 2;
    G__7420.cljs$lang$applyTo = function(arglist__7423) {
      var x = cljs.core.first(arglist__7423);
      var y = cljs.core.first(cljs.core.next(arglist__7423));
      var more = cljs.core.rest(cljs.core.next(arglist__7423));
      return G__7420__delegate(x, y, more)
    };
    G__7420.cljs$lang$arity$variadic = G__7420__delegate;
    return G__7420
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__7427__7428 = x;
            if(G__7427__7428) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____7429 = null;
                if(cljs.core.truth_(or__3824__auto____7429)) {
                  return or__3824__auto____7429
                }else {
                  return G__7427__7428.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__7427__7428.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7427__7428)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__7427__7428)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__7434 = cljs.core.count.call(null, xs);
    var yl__7435 = cljs.core.count.call(null, ys);
    if(xl__7434 < yl__7435) {
      return-1
    }else {
      if(xl__7434 > yl__7435) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__7434, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__7436 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____7437 = d__7436 === 0;
        if(and__3822__auto____7437) {
          return n + 1 < len
        }else {
          return and__3822__auto____7437
        }
      }()) {
        var G__7438 = xs;
        var G__7439 = ys;
        var G__7440 = len;
        var G__7441 = n + 1;
        xs = G__7438;
        ys = G__7439;
        len = G__7440;
        n = G__7441;
        continue
      }else {
        return d__7436
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__7443 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__7443)) {
        return r__7443
      }else {
        if(cljs.core.truth_(r__7443)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__7445 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__7445, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__7445)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____7451 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____7451) {
      var s__7452 = temp__3971__auto____7451;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7452), cljs.core.next.call(null, s__7452))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7453 = val;
    var coll__7454 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7454) {
        var nval__7455 = f.call(null, val__7453, cljs.core.first.call(null, coll__7454));
        if(cljs.core.reduced_QMARK_.call(null, nval__7455)) {
          return cljs.core.deref.call(null, nval__7455)
        }else {
          var G__7456 = nval__7455;
          var G__7457 = cljs.core.next.call(null, coll__7454);
          val__7453 = G__7456;
          coll__7454 = G__7457;
          continue
        }
      }else {
        return val__7453
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7459 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7459);
  return cljs.core.vec.call(null, a__7459)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7466__7467 = coll;
      if(G__7466__7467) {
        if(function() {
          var or__3824__auto____7468 = G__7466__7467.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7468) {
            return or__3824__auto____7468
          }else {
            return G__7466__7467.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7466__7467.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7466__7467)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7466__7467)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7469__7470 = coll;
      if(G__7469__7470) {
        if(function() {
          var or__3824__auto____7471 = G__7469__7470.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____7471) {
            return or__3824__auto____7471
          }else {
            return G__7469__7470.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7469__7470.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7469__7470)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7469__7470)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7472 = this;
  return this__7472.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7473__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7473 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7473__delegate.call(this, x, y, more)
    };
    G__7473.cljs$lang$maxFixedArity = 2;
    G__7473.cljs$lang$applyTo = function(arglist__7474) {
      var x = cljs.core.first(arglist__7474);
      var y = cljs.core.first(cljs.core.next(arglist__7474));
      var more = cljs.core.rest(cljs.core.next(arglist__7474));
      return G__7473__delegate(x, y, more)
    };
    G__7473.cljs$lang$arity$variadic = G__7473__delegate;
    return G__7473
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7475__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7475 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7475__delegate.call(this, x, y, more)
    };
    G__7475.cljs$lang$maxFixedArity = 2;
    G__7475.cljs$lang$applyTo = function(arglist__7476) {
      var x = cljs.core.first(arglist__7476);
      var y = cljs.core.first(cljs.core.next(arglist__7476));
      var more = cljs.core.rest(cljs.core.next(arglist__7476));
      return G__7475__delegate(x, y, more)
    };
    G__7475.cljs$lang$arity$variadic = G__7475__delegate;
    return G__7475
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7477__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7477 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7477__delegate.call(this, x, y, more)
    };
    G__7477.cljs$lang$maxFixedArity = 2;
    G__7477.cljs$lang$applyTo = function(arglist__7478) {
      var x = cljs.core.first(arglist__7478);
      var y = cljs.core.first(cljs.core.next(arglist__7478));
      var more = cljs.core.rest(cljs.core.next(arglist__7478));
      return G__7477__delegate(x, y, more)
    };
    G__7477.cljs$lang$arity$variadic = G__7477__delegate;
    return G__7477
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7479__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7479 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7479__delegate.call(this, x, y, more)
    };
    G__7479.cljs$lang$maxFixedArity = 2;
    G__7479.cljs$lang$applyTo = function(arglist__7480) {
      var x = cljs.core.first(arglist__7480);
      var y = cljs.core.first(cljs.core.next(arglist__7480));
      var more = cljs.core.rest(cljs.core.next(arglist__7480));
      return G__7479__delegate(x, y, more)
    };
    G__7479.cljs$lang$arity$variadic = G__7479__delegate;
    return G__7479
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7481__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7482 = y;
            var G__7483 = cljs.core.first.call(null, more);
            var G__7484 = cljs.core.next.call(null, more);
            x = G__7482;
            y = G__7483;
            more = G__7484;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7481 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7481__delegate.call(this, x, y, more)
    };
    G__7481.cljs$lang$maxFixedArity = 2;
    G__7481.cljs$lang$applyTo = function(arglist__7485) {
      var x = cljs.core.first(arglist__7485);
      var y = cljs.core.first(cljs.core.next(arglist__7485));
      var more = cljs.core.rest(cljs.core.next(arglist__7485));
      return G__7481__delegate(x, y, more)
    };
    G__7481.cljs$lang$arity$variadic = G__7481__delegate;
    return G__7481
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7486__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7487 = y;
            var G__7488 = cljs.core.first.call(null, more);
            var G__7489 = cljs.core.next.call(null, more);
            x = G__7487;
            y = G__7488;
            more = G__7489;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7486 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7486__delegate.call(this, x, y, more)
    };
    G__7486.cljs$lang$maxFixedArity = 2;
    G__7486.cljs$lang$applyTo = function(arglist__7490) {
      var x = cljs.core.first(arglist__7490);
      var y = cljs.core.first(cljs.core.next(arglist__7490));
      var more = cljs.core.rest(cljs.core.next(arglist__7490));
      return G__7486__delegate(x, y, more)
    };
    G__7486.cljs$lang$arity$variadic = G__7486__delegate;
    return G__7486
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7491__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7492 = y;
            var G__7493 = cljs.core.first.call(null, more);
            var G__7494 = cljs.core.next.call(null, more);
            x = G__7492;
            y = G__7493;
            more = G__7494;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7491 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7491__delegate.call(this, x, y, more)
    };
    G__7491.cljs$lang$maxFixedArity = 2;
    G__7491.cljs$lang$applyTo = function(arglist__7495) {
      var x = cljs.core.first(arglist__7495);
      var y = cljs.core.first(cljs.core.next(arglist__7495));
      var more = cljs.core.rest(cljs.core.next(arglist__7495));
      return G__7491__delegate(x, y, more)
    };
    G__7491.cljs$lang$arity$variadic = G__7491__delegate;
    return G__7491
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7496__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7497 = y;
            var G__7498 = cljs.core.first.call(null, more);
            var G__7499 = cljs.core.next.call(null, more);
            x = G__7497;
            y = G__7498;
            more = G__7499;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7496 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7496__delegate.call(this, x, y, more)
    };
    G__7496.cljs$lang$maxFixedArity = 2;
    G__7496.cljs$lang$applyTo = function(arglist__7500) {
      var x = cljs.core.first(arglist__7500);
      var y = cljs.core.first(cljs.core.next(arglist__7500));
      var more = cljs.core.rest(cljs.core.next(arglist__7500));
      return G__7496__delegate(x, y, more)
    };
    G__7496.cljs$lang$arity$variadic = G__7496__delegate;
    return G__7496
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7501__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7501 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7501__delegate.call(this, x, y, more)
    };
    G__7501.cljs$lang$maxFixedArity = 2;
    G__7501.cljs$lang$applyTo = function(arglist__7502) {
      var x = cljs.core.first(arglist__7502);
      var y = cljs.core.first(cljs.core.next(arglist__7502));
      var more = cljs.core.rest(cljs.core.next(arglist__7502));
      return G__7501__delegate(x, y, more)
    };
    G__7501.cljs$lang$arity$variadic = G__7501__delegate;
    return G__7501
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7503__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7503 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7503__delegate.call(this, x, y, more)
    };
    G__7503.cljs$lang$maxFixedArity = 2;
    G__7503.cljs$lang$applyTo = function(arglist__7504) {
      var x = cljs.core.first(arglist__7504);
      var y = cljs.core.first(cljs.core.next(arglist__7504));
      var more = cljs.core.rest(cljs.core.next(arglist__7504));
      return G__7503__delegate(x, y, more)
    };
    G__7503.cljs$lang$arity$variadic = G__7503__delegate;
    return G__7503
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7506 = n % d;
  return cljs.core.fix.call(null, (n - rem__7506) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7508 = cljs.core.quot.call(null, n, d);
  return n - d * q__7508
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7511 = v - (v >> 1 & 1431655765);
  var v__7512 = (v__7511 & 858993459) + (v__7511 >> 2 & 858993459);
  return(v__7512 + (v__7512 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7513__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7514 = y;
            var G__7515 = cljs.core.first.call(null, more);
            var G__7516 = cljs.core.next.call(null, more);
            x = G__7514;
            y = G__7515;
            more = G__7516;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7513 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7513__delegate.call(this, x, y, more)
    };
    G__7513.cljs$lang$maxFixedArity = 2;
    G__7513.cljs$lang$applyTo = function(arglist__7517) {
      var x = cljs.core.first(arglist__7517);
      var y = cljs.core.first(cljs.core.next(arglist__7517));
      var more = cljs.core.rest(cljs.core.next(arglist__7517));
      return G__7513__delegate(x, y, more)
    };
    G__7513.cljs$lang$arity$variadic = G__7513__delegate;
    return G__7513
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7521 = n;
  var xs__7522 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____7523 = xs__7522;
      if(and__3822__auto____7523) {
        return n__7521 > 0
      }else {
        return and__3822__auto____7523
      }
    }())) {
      var G__7524 = n__7521 - 1;
      var G__7525 = cljs.core.next.call(null, xs__7522);
      n__7521 = G__7524;
      xs__7522 = G__7525;
      continue
    }else {
      return xs__7522
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7526__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7527 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7528 = cljs.core.next.call(null, more);
            sb = G__7527;
            more = G__7528;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7526 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7526__delegate.call(this, x, ys)
    };
    G__7526.cljs$lang$maxFixedArity = 1;
    G__7526.cljs$lang$applyTo = function(arglist__7529) {
      var x = cljs.core.first(arglist__7529);
      var ys = cljs.core.rest(arglist__7529);
      return G__7526__delegate(x, ys)
    };
    G__7526.cljs$lang$arity$variadic = G__7526__delegate;
    return G__7526
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7530__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7531 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7532 = cljs.core.next.call(null, more);
            sb = G__7531;
            more = G__7532;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7530 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7530__delegate.call(this, x, ys)
    };
    G__7530.cljs$lang$maxFixedArity = 1;
    G__7530.cljs$lang$applyTo = function(arglist__7533) {
      var x = cljs.core.first(arglist__7533);
      var ys = cljs.core.rest(arglist__7533);
      return G__7530__delegate(x, ys)
    };
    G__7530.cljs$lang$arity$variadic = G__7530__delegate;
    return G__7530
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7534) {
    var fmt = cljs.core.first(arglist__7534);
    var args = cljs.core.rest(arglist__7534);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7537 = cljs.core.seq.call(null, x);
    var ys__7538 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7537 == null) {
        return ys__7538 == null
      }else {
        if(ys__7538 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7537), cljs.core.first.call(null, ys__7538))) {
            var G__7539 = cljs.core.next.call(null, xs__7537);
            var G__7540 = cljs.core.next.call(null, ys__7538);
            xs__7537 = G__7539;
            ys__7538 = G__7540;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7541_SHARP_, p2__7542_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7541_SHARP_, cljs.core.hash.call(null, p2__7542_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7546 = 0;
  var s__7547 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7547) {
      var e__7548 = cljs.core.first.call(null, s__7547);
      var G__7549 = (h__7546 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7548)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7548)))) % 4503599627370496;
      var G__7550 = cljs.core.next.call(null, s__7547);
      h__7546 = G__7549;
      s__7547 = G__7550;
      continue
    }else {
      return h__7546
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7554 = 0;
  var s__7555 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7555) {
      var e__7556 = cljs.core.first.call(null, s__7555);
      var G__7557 = (h__7554 + cljs.core.hash.call(null, e__7556)) % 4503599627370496;
      var G__7558 = cljs.core.next.call(null, s__7555);
      h__7554 = G__7557;
      s__7555 = G__7558;
      continue
    }else {
      return h__7554
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7579__7580 = cljs.core.seq.call(null, fn_map);
  if(G__7579__7580) {
    var G__7582__7584 = cljs.core.first.call(null, G__7579__7580);
    var vec__7583__7585 = G__7582__7584;
    var key_name__7586 = cljs.core.nth.call(null, vec__7583__7585, 0, null);
    var f__7587 = cljs.core.nth.call(null, vec__7583__7585, 1, null);
    var G__7579__7588 = G__7579__7580;
    var G__7582__7589 = G__7582__7584;
    var G__7579__7590 = G__7579__7588;
    while(true) {
      var vec__7591__7592 = G__7582__7589;
      var key_name__7593 = cljs.core.nth.call(null, vec__7591__7592, 0, null);
      var f__7594 = cljs.core.nth.call(null, vec__7591__7592, 1, null);
      var G__7579__7595 = G__7579__7590;
      var str_name__7596 = cljs.core.name.call(null, key_name__7593);
      obj[str_name__7596] = f__7594;
      var temp__3974__auto____7597 = cljs.core.next.call(null, G__7579__7595);
      if(temp__3974__auto____7597) {
        var G__7579__7598 = temp__3974__auto____7597;
        var G__7599 = cljs.core.first.call(null, G__7579__7598);
        var G__7600 = G__7579__7598;
        G__7582__7589 = G__7599;
        G__7579__7590 = G__7600;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7601 = this;
  var h__2188__auto____7602 = this__7601.__hash;
  if(!(h__2188__auto____7602 == null)) {
    return h__2188__auto____7602
  }else {
    var h__2188__auto____7603 = cljs.core.hash_coll.call(null, coll);
    this__7601.__hash = h__2188__auto____7603;
    return h__2188__auto____7603
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7604 = this;
  if(this__7604.count === 1) {
    return null
  }else {
    return this__7604.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7605 = this;
  return new cljs.core.List(this__7605.meta, o, coll, this__7605.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7606 = this;
  var this__7607 = this;
  return cljs.core.pr_str.call(null, this__7607)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7608 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7609 = this;
  return this__7609.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7610 = this;
  return this__7610.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7611 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7612 = this;
  return this__7612.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7613 = this;
  if(this__7613.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7613.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7614 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7615 = this;
  return new cljs.core.List(meta, this__7615.first, this__7615.rest, this__7615.count, this__7615.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7616 = this;
  return this__7616.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7617 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7618 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7619 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7620 = this;
  return new cljs.core.List(this__7620.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7621 = this;
  var this__7622 = this;
  return cljs.core.pr_str.call(null, this__7622)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7623 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7624 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7625 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7626 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7627 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7628 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7629 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7630 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7631 = this;
  return this__7631.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7632 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7636__7637 = coll;
  if(G__7636__7637) {
    if(function() {
      var or__3824__auto____7638 = G__7636__7637.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____7638) {
        return or__3824__auto____7638
      }else {
        return G__7636__7637.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7636__7637.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7636__7637)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7636__7637)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7639__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7639 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7639__delegate.call(this, x, y, z, items)
    };
    G__7639.cljs$lang$maxFixedArity = 3;
    G__7639.cljs$lang$applyTo = function(arglist__7640) {
      var x = cljs.core.first(arglist__7640);
      var y = cljs.core.first(cljs.core.next(arglist__7640));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7640)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7640)));
      return G__7639__delegate(x, y, z, items)
    };
    G__7639.cljs$lang$arity$variadic = G__7639__delegate;
    return G__7639
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7641 = this;
  var h__2188__auto____7642 = this__7641.__hash;
  if(!(h__2188__auto____7642 == null)) {
    return h__2188__auto____7642
  }else {
    var h__2188__auto____7643 = cljs.core.hash_coll.call(null, coll);
    this__7641.__hash = h__2188__auto____7643;
    return h__2188__auto____7643
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7644 = this;
  if(this__7644.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7644.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7645 = this;
  return new cljs.core.Cons(null, o, coll, this__7645.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7646 = this;
  var this__7647 = this;
  return cljs.core.pr_str.call(null, this__7647)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7648 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7649 = this;
  return this__7649.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7650 = this;
  if(this__7650.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7650.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7651 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7652 = this;
  return new cljs.core.Cons(meta, this__7652.first, this__7652.rest, this__7652.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7653 = this;
  return this__7653.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7654 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7654.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____7659 = coll == null;
    if(or__3824__auto____7659) {
      return or__3824__auto____7659
    }else {
      var G__7660__7661 = coll;
      if(G__7660__7661) {
        if(function() {
          var or__3824__auto____7662 = G__7660__7661.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____7662) {
            return or__3824__auto____7662
          }else {
            return G__7660__7661.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7660__7661.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7660__7661)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7660__7661)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7666__7667 = x;
  if(G__7666__7667) {
    if(function() {
      var or__3824__auto____7668 = G__7666__7667.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____7668) {
        return or__3824__auto____7668
      }else {
        return G__7666__7667.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7666__7667.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7666__7667)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7666__7667)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7669 = null;
  var G__7669__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7669__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7669 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7669__2.call(this, string, f);
      case 3:
        return G__7669__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7669
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7670 = null;
  var G__7670__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7670__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7670 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7670__2.call(this, string, k);
      case 3:
        return G__7670__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7670
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7671 = null;
  var G__7671__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7671__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7671 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7671__2.call(this, string, n);
      case 3:
        return G__7671__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7671
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7683 = null;
  var G__7683__2 = function(this_sym7674, coll) {
    var this__7676 = this;
    var this_sym7674__7677 = this;
    var ___7678 = this_sym7674__7677;
    if(coll == null) {
      return null
    }else {
      var strobj__7679 = coll.strobj;
      if(strobj__7679 == null) {
        return cljs.core._lookup.call(null, coll, this__7676.k, null)
      }else {
        return strobj__7679[this__7676.k]
      }
    }
  };
  var G__7683__3 = function(this_sym7675, coll, not_found) {
    var this__7676 = this;
    var this_sym7675__7680 = this;
    var ___7681 = this_sym7675__7680;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7676.k, not_found)
    }
  };
  G__7683 = function(this_sym7675, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7683__2.call(this, this_sym7675, coll);
      case 3:
        return G__7683__3.call(this, this_sym7675, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7683
}();
cljs.core.Keyword.prototype.apply = function(this_sym7672, args7673) {
  var this__7682 = this;
  return this_sym7672.call.apply(this_sym7672, [this_sym7672].concat(args7673.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7692 = null;
  var G__7692__2 = function(this_sym7686, coll) {
    var this_sym7686__7688 = this;
    var this__7689 = this_sym7686__7688;
    return cljs.core._lookup.call(null, coll, this__7689.toString(), null)
  };
  var G__7692__3 = function(this_sym7687, coll, not_found) {
    var this_sym7687__7690 = this;
    var this__7691 = this_sym7687__7690;
    return cljs.core._lookup.call(null, coll, this__7691.toString(), not_found)
  };
  G__7692 = function(this_sym7687, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7692__2.call(this, this_sym7687, coll);
      case 3:
        return G__7692__3.call(this, this_sym7687, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7692
}();
String.prototype.apply = function(this_sym7684, args7685) {
  return this_sym7684.call.apply(this_sym7684, [this_sym7684].concat(args7685.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7694 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7694
  }else {
    lazy_seq.x = x__7694.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7695 = this;
  var h__2188__auto____7696 = this__7695.__hash;
  if(!(h__2188__auto____7696 == null)) {
    return h__2188__auto____7696
  }else {
    var h__2188__auto____7697 = cljs.core.hash_coll.call(null, coll);
    this__7695.__hash = h__2188__auto____7697;
    return h__2188__auto____7697
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7698 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7699 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7700 = this;
  var this__7701 = this;
  return cljs.core.pr_str.call(null, this__7701)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7702 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7703 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7704 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7705 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7706 = this;
  return new cljs.core.LazySeq(meta, this__7706.realized, this__7706.x, this__7706.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7707 = this;
  return this__7707.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7708 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7708.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7709 = this;
  return this__7709.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7710 = this;
  var ___7711 = this;
  this__7710.buf[this__7710.end] = o;
  return this__7710.end = this__7710.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7712 = this;
  var ___7713 = this;
  var ret__7714 = new cljs.core.ArrayChunk(this__7712.buf, 0, this__7712.end);
  this__7712.buf = null;
  return ret__7714
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7715 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7715.arr[this__7715.off], this__7715.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7716 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7716.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7717 = this;
  if(this__7717.off === this__7717.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7717.arr, this__7717.off + 1, this__7717.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7718 = this;
  return this__7718.arr[this__7718.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7719 = this;
  if(function() {
    var and__3822__auto____7720 = i >= 0;
    if(and__3822__auto____7720) {
      return i < this__7719.end - this__7719.off
    }else {
      return and__3822__auto____7720
    }
  }()) {
    return this__7719.arr[this__7719.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7721 = this;
  return this__7721.end - this__7721.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7722 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7723 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7724 = this;
  return cljs.core._nth.call(null, this__7724.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7725 = this;
  if(cljs.core._count.call(null, this__7725.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7725.chunk), this__7725.more, this__7725.meta)
  }else {
    if(this__7725.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7725.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7726 = this;
  if(this__7726.more == null) {
    return null
  }else {
    return this__7726.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7727 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7728 = this;
  return new cljs.core.ChunkedCons(this__7728.chunk, this__7728.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7729 = this;
  return this__7729.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7730 = this;
  return this__7730.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7731 = this;
  if(this__7731.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7731.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7735__7736 = s;
    if(G__7735__7736) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____7737 = null;
        if(cljs.core.truth_(or__3824__auto____7737)) {
          return or__3824__auto____7737
        }else {
          return G__7735__7736.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7735__7736.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7735__7736)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7735__7736)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7740 = [];
  var s__7741 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7741)) {
      ary__7740.push(cljs.core.first.call(null, s__7741));
      var G__7742 = cljs.core.next.call(null, s__7741);
      s__7741 = G__7742;
      continue
    }else {
      return ary__7740
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7746 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7747 = 0;
  var xs__7748 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7748) {
      ret__7746[i__7747] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7748));
      var G__7749 = i__7747 + 1;
      var G__7750 = cljs.core.next.call(null, xs__7748);
      i__7747 = G__7749;
      xs__7748 = G__7750;
      continue
    }else {
    }
    break
  }
  return ret__7746
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7758 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7759 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7760 = 0;
      var s__7761 = s__7759;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7762 = s__7761;
          if(and__3822__auto____7762) {
            return i__7760 < size
          }else {
            return and__3822__auto____7762
          }
        }())) {
          a__7758[i__7760] = cljs.core.first.call(null, s__7761);
          var G__7765 = i__7760 + 1;
          var G__7766 = cljs.core.next.call(null, s__7761);
          i__7760 = G__7765;
          s__7761 = G__7766;
          continue
        }else {
          return a__7758
        }
        break
      }
    }else {
      var n__2523__auto____7763 = size;
      var i__7764 = 0;
      while(true) {
        if(i__7764 < n__2523__auto____7763) {
          a__7758[i__7764] = init_val_or_seq;
          var G__7767 = i__7764 + 1;
          i__7764 = G__7767;
          continue
        }else {
        }
        break
      }
      return a__7758
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7775 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7776 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7777 = 0;
      var s__7778 = s__7776;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7779 = s__7778;
          if(and__3822__auto____7779) {
            return i__7777 < size
          }else {
            return and__3822__auto____7779
          }
        }())) {
          a__7775[i__7777] = cljs.core.first.call(null, s__7778);
          var G__7782 = i__7777 + 1;
          var G__7783 = cljs.core.next.call(null, s__7778);
          i__7777 = G__7782;
          s__7778 = G__7783;
          continue
        }else {
          return a__7775
        }
        break
      }
    }else {
      var n__2523__auto____7780 = size;
      var i__7781 = 0;
      while(true) {
        if(i__7781 < n__2523__auto____7780) {
          a__7775[i__7781] = init_val_or_seq;
          var G__7784 = i__7781 + 1;
          i__7781 = G__7784;
          continue
        }else {
        }
        break
      }
      return a__7775
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7792 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7793 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7794 = 0;
      var s__7795 = s__7793;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____7796 = s__7795;
          if(and__3822__auto____7796) {
            return i__7794 < size
          }else {
            return and__3822__auto____7796
          }
        }())) {
          a__7792[i__7794] = cljs.core.first.call(null, s__7795);
          var G__7799 = i__7794 + 1;
          var G__7800 = cljs.core.next.call(null, s__7795);
          i__7794 = G__7799;
          s__7795 = G__7800;
          continue
        }else {
          return a__7792
        }
        break
      }
    }else {
      var n__2523__auto____7797 = size;
      var i__7798 = 0;
      while(true) {
        if(i__7798 < n__2523__auto____7797) {
          a__7792[i__7798] = init_val_or_seq;
          var G__7801 = i__7798 + 1;
          i__7798 = G__7801;
          continue
        }else {
        }
        break
      }
      return a__7792
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7806 = s;
    var i__7807 = n;
    var sum__7808 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____7809 = i__7807 > 0;
        if(and__3822__auto____7809) {
          return cljs.core.seq.call(null, s__7806)
        }else {
          return and__3822__auto____7809
        }
      }())) {
        var G__7810 = cljs.core.next.call(null, s__7806);
        var G__7811 = i__7807 - 1;
        var G__7812 = sum__7808 + 1;
        s__7806 = G__7810;
        i__7807 = G__7811;
        sum__7808 = G__7812;
        continue
      }else {
        return sum__7808
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7817 = cljs.core.seq.call(null, x);
      if(s__7817) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7817)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7817), concat.call(null, cljs.core.chunk_rest.call(null, s__7817), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7817), concat.call(null, cljs.core.rest.call(null, s__7817), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7821__delegate = function(x, y, zs) {
      var cat__7820 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7819 = cljs.core.seq.call(null, xys);
          if(xys__7819) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7819)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7819), cat.call(null, cljs.core.chunk_rest.call(null, xys__7819), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7819), cat.call(null, cljs.core.rest.call(null, xys__7819), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7820.call(null, concat.call(null, x, y), zs)
    };
    var G__7821 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7821__delegate.call(this, x, y, zs)
    };
    G__7821.cljs$lang$maxFixedArity = 2;
    G__7821.cljs$lang$applyTo = function(arglist__7822) {
      var x = cljs.core.first(arglist__7822);
      var y = cljs.core.first(cljs.core.next(arglist__7822));
      var zs = cljs.core.rest(cljs.core.next(arglist__7822));
      return G__7821__delegate(x, y, zs)
    };
    G__7821.cljs$lang$arity$variadic = G__7821__delegate;
    return G__7821
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7823__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7823 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7823__delegate.call(this, a, b, c, d, more)
    };
    G__7823.cljs$lang$maxFixedArity = 4;
    G__7823.cljs$lang$applyTo = function(arglist__7824) {
      var a = cljs.core.first(arglist__7824);
      var b = cljs.core.first(cljs.core.next(arglist__7824));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7824)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7824))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7824))));
      return G__7823__delegate(a, b, c, d, more)
    };
    G__7823.cljs$lang$arity$variadic = G__7823__delegate;
    return G__7823
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7866 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7867 = cljs.core._first.call(null, args__7866);
    var args__7868 = cljs.core._rest.call(null, args__7866);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7867)
      }else {
        return f.call(null, a__7867)
      }
    }else {
      var b__7869 = cljs.core._first.call(null, args__7868);
      var args__7870 = cljs.core._rest.call(null, args__7868);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7867, b__7869)
        }else {
          return f.call(null, a__7867, b__7869)
        }
      }else {
        var c__7871 = cljs.core._first.call(null, args__7870);
        var args__7872 = cljs.core._rest.call(null, args__7870);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7867, b__7869, c__7871)
          }else {
            return f.call(null, a__7867, b__7869, c__7871)
          }
        }else {
          var d__7873 = cljs.core._first.call(null, args__7872);
          var args__7874 = cljs.core._rest.call(null, args__7872);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7867, b__7869, c__7871, d__7873)
            }else {
              return f.call(null, a__7867, b__7869, c__7871, d__7873)
            }
          }else {
            var e__7875 = cljs.core._first.call(null, args__7874);
            var args__7876 = cljs.core._rest.call(null, args__7874);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7867, b__7869, c__7871, d__7873, e__7875)
              }else {
                return f.call(null, a__7867, b__7869, c__7871, d__7873, e__7875)
              }
            }else {
              var f__7877 = cljs.core._first.call(null, args__7876);
              var args__7878 = cljs.core._rest.call(null, args__7876);
              if(argc === 6) {
                if(f__7877.cljs$lang$arity$6) {
                  return f__7877.cljs$lang$arity$6(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877)
                }else {
                  return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877)
                }
              }else {
                var g__7879 = cljs.core._first.call(null, args__7878);
                var args__7880 = cljs.core._rest.call(null, args__7878);
                if(argc === 7) {
                  if(f__7877.cljs$lang$arity$7) {
                    return f__7877.cljs$lang$arity$7(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879)
                  }else {
                    return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879)
                  }
                }else {
                  var h__7881 = cljs.core._first.call(null, args__7880);
                  var args__7882 = cljs.core._rest.call(null, args__7880);
                  if(argc === 8) {
                    if(f__7877.cljs$lang$arity$8) {
                      return f__7877.cljs$lang$arity$8(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881)
                    }else {
                      return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881)
                    }
                  }else {
                    var i__7883 = cljs.core._first.call(null, args__7882);
                    var args__7884 = cljs.core._rest.call(null, args__7882);
                    if(argc === 9) {
                      if(f__7877.cljs$lang$arity$9) {
                        return f__7877.cljs$lang$arity$9(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883)
                      }else {
                        return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883)
                      }
                    }else {
                      var j__7885 = cljs.core._first.call(null, args__7884);
                      var args__7886 = cljs.core._rest.call(null, args__7884);
                      if(argc === 10) {
                        if(f__7877.cljs$lang$arity$10) {
                          return f__7877.cljs$lang$arity$10(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885)
                        }else {
                          return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885)
                        }
                      }else {
                        var k__7887 = cljs.core._first.call(null, args__7886);
                        var args__7888 = cljs.core._rest.call(null, args__7886);
                        if(argc === 11) {
                          if(f__7877.cljs$lang$arity$11) {
                            return f__7877.cljs$lang$arity$11(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887)
                          }else {
                            return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887)
                          }
                        }else {
                          var l__7889 = cljs.core._first.call(null, args__7888);
                          var args__7890 = cljs.core._rest.call(null, args__7888);
                          if(argc === 12) {
                            if(f__7877.cljs$lang$arity$12) {
                              return f__7877.cljs$lang$arity$12(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889)
                            }else {
                              return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889)
                            }
                          }else {
                            var m__7891 = cljs.core._first.call(null, args__7890);
                            var args__7892 = cljs.core._rest.call(null, args__7890);
                            if(argc === 13) {
                              if(f__7877.cljs$lang$arity$13) {
                                return f__7877.cljs$lang$arity$13(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891)
                              }else {
                                return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891)
                              }
                            }else {
                              var n__7893 = cljs.core._first.call(null, args__7892);
                              var args__7894 = cljs.core._rest.call(null, args__7892);
                              if(argc === 14) {
                                if(f__7877.cljs$lang$arity$14) {
                                  return f__7877.cljs$lang$arity$14(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893)
                                }else {
                                  return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893)
                                }
                              }else {
                                var o__7895 = cljs.core._first.call(null, args__7894);
                                var args__7896 = cljs.core._rest.call(null, args__7894);
                                if(argc === 15) {
                                  if(f__7877.cljs$lang$arity$15) {
                                    return f__7877.cljs$lang$arity$15(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895)
                                  }else {
                                    return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895)
                                  }
                                }else {
                                  var p__7897 = cljs.core._first.call(null, args__7896);
                                  var args__7898 = cljs.core._rest.call(null, args__7896);
                                  if(argc === 16) {
                                    if(f__7877.cljs$lang$arity$16) {
                                      return f__7877.cljs$lang$arity$16(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897)
                                    }else {
                                      return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897)
                                    }
                                  }else {
                                    var q__7899 = cljs.core._first.call(null, args__7898);
                                    var args__7900 = cljs.core._rest.call(null, args__7898);
                                    if(argc === 17) {
                                      if(f__7877.cljs$lang$arity$17) {
                                        return f__7877.cljs$lang$arity$17(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899)
                                      }else {
                                        return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899)
                                      }
                                    }else {
                                      var r__7901 = cljs.core._first.call(null, args__7900);
                                      var args__7902 = cljs.core._rest.call(null, args__7900);
                                      if(argc === 18) {
                                        if(f__7877.cljs$lang$arity$18) {
                                          return f__7877.cljs$lang$arity$18(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899, r__7901)
                                        }else {
                                          return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899, r__7901)
                                        }
                                      }else {
                                        var s__7903 = cljs.core._first.call(null, args__7902);
                                        var args__7904 = cljs.core._rest.call(null, args__7902);
                                        if(argc === 19) {
                                          if(f__7877.cljs$lang$arity$19) {
                                            return f__7877.cljs$lang$arity$19(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899, r__7901, s__7903)
                                          }else {
                                            return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899, r__7901, s__7903)
                                          }
                                        }else {
                                          var t__7905 = cljs.core._first.call(null, args__7904);
                                          var args__7906 = cljs.core._rest.call(null, args__7904);
                                          if(argc === 20) {
                                            if(f__7877.cljs$lang$arity$20) {
                                              return f__7877.cljs$lang$arity$20(a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899, r__7901, s__7903, t__7905)
                                            }else {
                                              return f__7877.call(null, a__7867, b__7869, c__7871, d__7873, e__7875, f__7877, g__7879, h__7881, i__7883, j__7885, k__7887, l__7889, m__7891, n__7893, o__7895, p__7897, q__7899, r__7901, s__7903, t__7905)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7921 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7922 = cljs.core.bounded_count.call(null, args, fixed_arity__7921 + 1);
      if(bc__7922 <= fixed_arity__7921) {
        return cljs.core.apply_to.call(null, f, bc__7922, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7923 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7924 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7925 = cljs.core.bounded_count.call(null, arglist__7923, fixed_arity__7924 + 1);
      if(bc__7925 <= fixed_arity__7924) {
        return cljs.core.apply_to.call(null, f, bc__7925, arglist__7923)
      }else {
        return f.cljs$lang$applyTo(arglist__7923)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7923))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7926 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7927 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7928 = cljs.core.bounded_count.call(null, arglist__7926, fixed_arity__7927 + 1);
      if(bc__7928 <= fixed_arity__7927) {
        return cljs.core.apply_to.call(null, f, bc__7928, arglist__7926)
      }else {
        return f.cljs$lang$applyTo(arglist__7926)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7926))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7929 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7930 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7931 = cljs.core.bounded_count.call(null, arglist__7929, fixed_arity__7930 + 1);
      if(bc__7931 <= fixed_arity__7930) {
        return cljs.core.apply_to.call(null, f, bc__7931, arglist__7929)
      }else {
        return f.cljs$lang$applyTo(arglist__7929)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7929))
    }
  };
  var apply__6 = function() {
    var G__7935__delegate = function(f, a, b, c, d, args) {
      var arglist__7932 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7933 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7934 = cljs.core.bounded_count.call(null, arglist__7932, fixed_arity__7933 + 1);
        if(bc__7934 <= fixed_arity__7933) {
          return cljs.core.apply_to.call(null, f, bc__7934, arglist__7932)
        }else {
          return f.cljs$lang$applyTo(arglist__7932)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7932))
      }
    };
    var G__7935 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7935__delegate.call(this, f, a, b, c, d, args)
    };
    G__7935.cljs$lang$maxFixedArity = 5;
    G__7935.cljs$lang$applyTo = function(arglist__7936) {
      var f = cljs.core.first(arglist__7936);
      var a = cljs.core.first(cljs.core.next(arglist__7936));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7936)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7936))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7936)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7936)))));
      return G__7935__delegate(f, a, b, c, d, args)
    };
    G__7935.cljs$lang$arity$variadic = G__7935__delegate;
    return G__7935
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7937) {
    var obj = cljs.core.first(arglist__7937);
    var f = cljs.core.first(cljs.core.next(arglist__7937));
    var args = cljs.core.rest(cljs.core.next(arglist__7937));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7938__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7938 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7938__delegate.call(this, x, y, more)
    };
    G__7938.cljs$lang$maxFixedArity = 2;
    G__7938.cljs$lang$applyTo = function(arglist__7939) {
      var x = cljs.core.first(arglist__7939);
      var y = cljs.core.first(cljs.core.next(arglist__7939));
      var more = cljs.core.rest(cljs.core.next(arglist__7939));
      return G__7938__delegate(x, y, more)
    };
    G__7938.cljs$lang$arity$variadic = G__7938__delegate;
    return G__7938
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7940 = pred;
        var G__7941 = cljs.core.next.call(null, coll);
        pred = G__7940;
        coll = G__7941;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____7943 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____7943)) {
        return or__3824__auto____7943
      }else {
        var G__7944 = pred;
        var G__7945 = cljs.core.next.call(null, coll);
        pred = G__7944;
        coll = G__7945;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7946 = null;
    var G__7946__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7946__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7946__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7946__3 = function() {
      var G__7947__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7947 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7947__delegate.call(this, x, y, zs)
      };
      G__7947.cljs$lang$maxFixedArity = 2;
      G__7947.cljs$lang$applyTo = function(arglist__7948) {
        var x = cljs.core.first(arglist__7948);
        var y = cljs.core.first(cljs.core.next(arglist__7948));
        var zs = cljs.core.rest(cljs.core.next(arglist__7948));
        return G__7947__delegate(x, y, zs)
      };
      G__7947.cljs$lang$arity$variadic = G__7947__delegate;
      return G__7947
    }();
    G__7946 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7946__0.call(this);
        case 1:
          return G__7946__1.call(this, x);
        case 2:
          return G__7946__2.call(this, x, y);
        default:
          return G__7946__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7946.cljs$lang$maxFixedArity = 2;
    G__7946.cljs$lang$applyTo = G__7946__3.cljs$lang$applyTo;
    return G__7946
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7949__delegate = function(args) {
      return x
    };
    var G__7949 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7949__delegate.call(this, args)
    };
    G__7949.cljs$lang$maxFixedArity = 0;
    G__7949.cljs$lang$applyTo = function(arglist__7950) {
      var args = cljs.core.seq(arglist__7950);
      return G__7949__delegate(args)
    };
    G__7949.cljs$lang$arity$variadic = G__7949__delegate;
    return G__7949
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7957 = null;
      var G__7957__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7957__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7957__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7957__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7957__4 = function() {
        var G__7958__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7958 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7958__delegate.call(this, x, y, z, args)
        };
        G__7958.cljs$lang$maxFixedArity = 3;
        G__7958.cljs$lang$applyTo = function(arglist__7959) {
          var x = cljs.core.first(arglist__7959);
          var y = cljs.core.first(cljs.core.next(arglist__7959));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7959)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7959)));
          return G__7958__delegate(x, y, z, args)
        };
        G__7958.cljs$lang$arity$variadic = G__7958__delegate;
        return G__7958
      }();
      G__7957 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7957__0.call(this);
          case 1:
            return G__7957__1.call(this, x);
          case 2:
            return G__7957__2.call(this, x, y);
          case 3:
            return G__7957__3.call(this, x, y, z);
          default:
            return G__7957__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7957.cljs$lang$maxFixedArity = 3;
      G__7957.cljs$lang$applyTo = G__7957__4.cljs$lang$applyTo;
      return G__7957
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7960 = null;
      var G__7960__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7960__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7960__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7960__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7960__4 = function() {
        var G__7961__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7961 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7961__delegate.call(this, x, y, z, args)
        };
        G__7961.cljs$lang$maxFixedArity = 3;
        G__7961.cljs$lang$applyTo = function(arglist__7962) {
          var x = cljs.core.first(arglist__7962);
          var y = cljs.core.first(cljs.core.next(arglist__7962));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7962)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7962)));
          return G__7961__delegate(x, y, z, args)
        };
        G__7961.cljs$lang$arity$variadic = G__7961__delegate;
        return G__7961
      }();
      G__7960 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7960__0.call(this);
          case 1:
            return G__7960__1.call(this, x);
          case 2:
            return G__7960__2.call(this, x, y);
          case 3:
            return G__7960__3.call(this, x, y, z);
          default:
            return G__7960__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7960.cljs$lang$maxFixedArity = 3;
      G__7960.cljs$lang$applyTo = G__7960__4.cljs$lang$applyTo;
      return G__7960
    }()
  };
  var comp__4 = function() {
    var G__7963__delegate = function(f1, f2, f3, fs) {
      var fs__7954 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7964__delegate = function(args) {
          var ret__7955 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7954), args);
          var fs__7956 = cljs.core.next.call(null, fs__7954);
          while(true) {
            if(fs__7956) {
              var G__7965 = cljs.core.first.call(null, fs__7956).call(null, ret__7955);
              var G__7966 = cljs.core.next.call(null, fs__7956);
              ret__7955 = G__7965;
              fs__7956 = G__7966;
              continue
            }else {
              return ret__7955
            }
            break
          }
        };
        var G__7964 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7964__delegate.call(this, args)
        };
        G__7964.cljs$lang$maxFixedArity = 0;
        G__7964.cljs$lang$applyTo = function(arglist__7967) {
          var args = cljs.core.seq(arglist__7967);
          return G__7964__delegate(args)
        };
        G__7964.cljs$lang$arity$variadic = G__7964__delegate;
        return G__7964
      }()
    };
    var G__7963 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7963__delegate.call(this, f1, f2, f3, fs)
    };
    G__7963.cljs$lang$maxFixedArity = 3;
    G__7963.cljs$lang$applyTo = function(arglist__7968) {
      var f1 = cljs.core.first(arglist__7968);
      var f2 = cljs.core.first(cljs.core.next(arglist__7968));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7968)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7968)));
      return G__7963__delegate(f1, f2, f3, fs)
    };
    G__7963.cljs$lang$arity$variadic = G__7963__delegate;
    return G__7963
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7969__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7969 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7969__delegate.call(this, args)
      };
      G__7969.cljs$lang$maxFixedArity = 0;
      G__7969.cljs$lang$applyTo = function(arglist__7970) {
        var args = cljs.core.seq(arglist__7970);
        return G__7969__delegate(args)
      };
      G__7969.cljs$lang$arity$variadic = G__7969__delegate;
      return G__7969
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7971__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7971 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7971__delegate.call(this, args)
      };
      G__7971.cljs$lang$maxFixedArity = 0;
      G__7971.cljs$lang$applyTo = function(arglist__7972) {
        var args = cljs.core.seq(arglist__7972);
        return G__7971__delegate(args)
      };
      G__7971.cljs$lang$arity$variadic = G__7971__delegate;
      return G__7971
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7973__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7973 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7973__delegate.call(this, args)
      };
      G__7973.cljs$lang$maxFixedArity = 0;
      G__7973.cljs$lang$applyTo = function(arglist__7974) {
        var args = cljs.core.seq(arglist__7974);
        return G__7973__delegate(args)
      };
      G__7973.cljs$lang$arity$variadic = G__7973__delegate;
      return G__7973
    }()
  };
  var partial__5 = function() {
    var G__7975__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7976__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7976 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7976__delegate.call(this, args)
        };
        G__7976.cljs$lang$maxFixedArity = 0;
        G__7976.cljs$lang$applyTo = function(arglist__7977) {
          var args = cljs.core.seq(arglist__7977);
          return G__7976__delegate(args)
        };
        G__7976.cljs$lang$arity$variadic = G__7976__delegate;
        return G__7976
      }()
    };
    var G__7975 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7975__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7975.cljs$lang$maxFixedArity = 4;
    G__7975.cljs$lang$applyTo = function(arglist__7978) {
      var f = cljs.core.first(arglist__7978);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7978));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7978)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7978))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7978))));
      return G__7975__delegate(f, arg1, arg2, arg3, more)
    };
    G__7975.cljs$lang$arity$variadic = G__7975__delegate;
    return G__7975
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7979 = null;
      var G__7979__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7979__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7979__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7979__4 = function() {
        var G__7980__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7980 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7980__delegate.call(this, a, b, c, ds)
        };
        G__7980.cljs$lang$maxFixedArity = 3;
        G__7980.cljs$lang$applyTo = function(arglist__7981) {
          var a = cljs.core.first(arglist__7981);
          var b = cljs.core.first(cljs.core.next(arglist__7981));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7981)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7981)));
          return G__7980__delegate(a, b, c, ds)
        };
        G__7980.cljs$lang$arity$variadic = G__7980__delegate;
        return G__7980
      }();
      G__7979 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7979__1.call(this, a);
          case 2:
            return G__7979__2.call(this, a, b);
          case 3:
            return G__7979__3.call(this, a, b, c);
          default:
            return G__7979__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7979.cljs$lang$maxFixedArity = 3;
      G__7979.cljs$lang$applyTo = G__7979__4.cljs$lang$applyTo;
      return G__7979
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7982 = null;
      var G__7982__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7982__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7982__4 = function() {
        var G__7983__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7983 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7983__delegate.call(this, a, b, c, ds)
        };
        G__7983.cljs$lang$maxFixedArity = 3;
        G__7983.cljs$lang$applyTo = function(arglist__7984) {
          var a = cljs.core.first(arglist__7984);
          var b = cljs.core.first(cljs.core.next(arglist__7984));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7984)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7984)));
          return G__7983__delegate(a, b, c, ds)
        };
        G__7983.cljs$lang$arity$variadic = G__7983__delegate;
        return G__7983
      }();
      G__7982 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7982__2.call(this, a, b);
          case 3:
            return G__7982__3.call(this, a, b, c);
          default:
            return G__7982__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7982.cljs$lang$maxFixedArity = 3;
      G__7982.cljs$lang$applyTo = G__7982__4.cljs$lang$applyTo;
      return G__7982
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7985 = null;
      var G__7985__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7985__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7985__4 = function() {
        var G__7986__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7986 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7986__delegate.call(this, a, b, c, ds)
        };
        G__7986.cljs$lang$maxFixedArity = 3;
        G__7986.cljs$lang$applyTo = function(arglist__7987) {
          var a = cljs.core.first(arglist__7987);
          var b = cljs.core.first(cljs.core.next(arglist__7987));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7987)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7987)));
          return G__7986__delegate(a, b, c, ds)
        };
        G__7986.cljs$lang$arity$variadic = G__7986__delegate;
        return G__7986
      }();
      G__7985 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7985__2.call(this, a, b);
          case 3:
            return G__7985__3.call(this, a, b, c);
          default:
            return G__7985__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7985.cljs$lang$maxFixedArity = 3;
      G__7985.cljs$lang$applyTo = G__7985__4.cljs$lang$applyTo;
      return G__7985
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__8003 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8011 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8011) {
        var s__8012 = temp__3974__auto____8011;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8012)) {
          var c__8013 = cljs.core.chunk_first.call(null, s__8012);
          var size__8014 = cljs.core.count.call(null, c__8013);
          var b__8015 = cljs.core.chunk_buffer.call(null, size__8014);
          var n__2523__auto____8016 = size__8014;
          var i__8017 = 0;
          while(true) {
            if(i__8017 < n__2523__auto____8016) {
              cljs.core.chunk_append.call(null, b__8015, f.call(null, idx + i__8017, cljs.core._nth.call(null, c__8013, i__8017)));
              var G__8018 = i__8017 + 1;
              i__8017 = G__8018;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8015), mapi.call(null, idx + size__8014, cljs.core.chunk_rest.call(null, s__8012)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__8012)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__8012)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__8003.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8028 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8028) {
      var s__8029 = temp__3974__auto____8028;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8029)) {
        var c__8030 = cljs.core.chunk_first.call(null, s__8029);
        var size__8031 = cljs.core.count.call(null, c__8030);
        var b__8032 = cljs.core.chunk_buffer.call(null, size__8031);
        var n__2523__auto____8033 = size__8031;
        var i__8034 = 0;
        while(true) {
          if(i__8034 < n__2523__auto____8033) {
            var x__8035 = f.call(null, cljs.core._nth.call(null, c__8030, i__8034));
            if(x__8035 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__8032, x__8035)
            }
            var G__8037 = i__8034 + 1;
            i__8034 = G__8037;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8032), keep.call(null, f, cljs.core.chunk_rest.call(null, s__8029)))
      }else {
        var x__8036 = f.call(null, cljs.core.first.call(null, s__8029));
        if(x__8036 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__8029))
        }else {
          return cljs.core.cons.call(null, x__8036, keep.call(null, f, cljs.core.rest.call(null, s__8029)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__8063 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8073 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8073) {
        var s__8074 = temp__3974__auto____8073;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8074)) {
          var c__8075 = cljs.core.chunk_first.call(null, s__8074);
          var size__8076 = cljs.core.count.call(null, c__8075);
          var b__8077 = cljs.core.chunk_buffer.call(null, size__8076);
          var n__2523__auto____8078 = size__8076;
          var i__8079 = 0;
          while(true) {
            if(i__8079 < n__2523__auto____8078) {
              var x__8080 = f.call(null, idx + i__8079, cljs.core._nth.call(null, c__8075, i__8079));
              if(x__8080 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__8077, x__8080)
              }
              var G__8082 = i__8079 + 1;
              i__8079 = G__8082;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8077), keepi.call(null, idx + size__8076, cljs.core.chunk_rest.call(null, s__8074)))
        }else {
          var x__8081 = f.call(null, idx, cljs.core.first.call(null, s__8074));
          if(x__8081 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8074))
          }else {
            return cljs.core.cons.call(null, x__8081, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__8074)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__8063.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8168 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8168)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____8168
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8169 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8169)) {
            var and__3822__auto____8170 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8170)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____8170
            }
          }else {
            return and__3822__auto____8169
          }
        }())
      };
      var ep1__4 = function() {
        var G__8239__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8171 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8171)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____8171
            }
          }())
        };
        var G__8239 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8239__delegate.call(this, x, y, z, args)
        };
        G__8239.cljs$lang$maxFixedArity = 3;
        G__8239.cljs$lang$applyTo = function(arglist__8240) {
          var x = cljs.core.first(arglist__8240);
          var y = cljs.core.first(cljs.core.next(arglist__8240));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8240)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8240)));
          return G__8239__delegate(x, y, z, args)
        };
        G__8239.cljs$lang$arity$variadic = G__8239__delegate;
        return G__8239
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8183 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8183)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____8183
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8184 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8184)) {
            var and__3822__auto____8185 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8185)) {
              var and__3822__auto____8186 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8186)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____8186
              }
            }else {
              return and__3822__auto____8185
            }
          }else {
            return and__3822__auto____8184
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8187 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8187)) {
            var and__3822__auto____8188 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____8188)) {
              var and__3822__auto____8189 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____8189)) {
                var and__3822__auto____8190 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____8190)) {
                  var and__3822__auto____8191 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8191)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____8191
                  }
                }else {
                  return and__3822__auto____8190
                }
              }else {
                return and__3822__auto____8189
              }
            }else {
              return and__3822__auto____8188
            }
          }else {
            return and__3822__auto____8187
          }
        }())
      };
      var ep2__4 = function() {
        var G__8241__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8192 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8192)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8038_SHARP_) {
                var and__3822__auto____8193 = p1.call(null, p1__8038_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8193)) {
                  return p2.call(null, p1__8038_SHARP_)
                }else {
                  return and__3822__auto____8193
                }
              }, args)
            }else {
              return and__3822__auto____8192
            }
          }())
        };
        var G__8241 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8241__delegate.call(this, x, y, z, args)
        };
        G__8241.cljs$lang$maxFixedArity = 3;
        G__8241.cljs$lang$applyTo = function(arglist__8242) {
          var x = cljs.core.first(arglist__8242);
          var y = cljs.core.first(cljs.core.next(arglist__8242));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8242)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8242)));
          return G__8241__delegate(x, y, z, args)
        };
        G__8241.cljs$lang$arity$variadic = G__8241__delegate;
        return G__8241
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8212 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8212)) {
            var and__3822__auto____8213 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8213)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____8213
            }
          }else {
            return and__3822__auto____8212
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8214 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8214)) {
            var and__3822__auto____8215 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8215)) {
              var and__3822__auto____8216 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8216)) {
                var and__3822__auto____8217 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8217)) {
                  var and__3822__auto____8218 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8218)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____8218
                  }
                }else {
                  return and__3822__auto____8217
                }
              }else {
                return and__3822__auto____8216
              }
            }else {
              return and__3822__auto____8215
            }
          }else {
            return and__3822__auto____8214
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____8219 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____8219)) {
            var and__3822__auto____8220 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8220)) {
              var and__3822__auto____8221 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____8221)) {
                var and__3822__auto____8222 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____8222)) {
                  var and__3822__auto____8223 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____8223)) {
                    var and__3822__auto____8224 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____8224)) {
                      var and__3822__auto____8225 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____8225)) {
                        var and__3822__auto____8226 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____8226)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____8226
                        }
                      }else {
                        return and__3822__auto____8225
                      }
                    }else {
                      return and__3822__auto____8224
                    }
                  }else {
                    return and__3822__auto____8223
                  }
                }else {
                  return and__3822__auto____8222
                }
              }else {
                return and__3822__auto____8221
              }
            }else {
              return and__3822__auto____8220
            }
          }else {
            return and__3822__auto____8219
          }
        }())
      };
      var ep3__4 = function() {
        var G__8243__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____8227 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____8227)) {
              return cljs.core.every_QMARK_.call(null, function(p1__8039_SHARP_) {
                var and__3822__auto____8228 = p1.call(null, p1__8039_SHARP_);
                if(cljs.core.truth_(and__3822__auto____8228)) {
                  var and__3822__auto____8229 = p2.call(null, p1__8039_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____8229)) {
                    return p3.call(null, p1__8039_SHARP_)
                  }else {
                    return and__3822__auto____8229
                  }
                }else {
                  return and__3822__auto____8228
                }
              }, args)
            }else {
              return and__3822__auto____8227
            }
          }())
        };
        var G__8243 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8243__delegate.call(this, x, y, z, args)
        };
        G__8243.cljs$lang$maxFixedArity = 3;
        G__8243.cljs$lang$applyTo = function(arglist__8244) {
          var x = cljs.core.first(arglist__8244);
          var y = cljs.core.first(cljs.core.next(arglist__8244));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8244)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8244)));
          return G__8243__delegate(x, y, z, args)
        };
        G__8243.cljs$lang$arity$variadic = G__8243__delegate;
        return G__8243
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__8245__delegate = function(p1, p2, p3, ps) {
      var ps__8230 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__8040_SHARP_) {
            return p1__8040_SHARP_.call(null, x)
          }, ps__8230)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__8041_SHARP_) {
            var and__3822__auto____8235 = p1__8041_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8235)) {
              return p1__8041_SHARP_.call(null, y)
            }else {
              return and__3822__auto____8235
            }
          }, ps__8230)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__8042_SHARP_) {
            var and__3822__auto____8236 = p1__8042_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____8236)) {
              var and__3822__auto____8237 = p1__8042_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____8237)) {
                return p1__8042_SHARP_.call(null, z)
              }else {
                return and__3822__auto____8237
              }
            }else {
              return and__3822__auto____8236
            }
          }, ps__8230)
        };
        var epn__4 = function() {
          var G__8246__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____8238 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____8238)) {
                return cljs.core.every_QMARK_.call(null, function(p1__8043_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__8043_SHARP_, args)
                }, ps__8230)
              }else {
                return and__3822__auto____8238
              }
            }())
          };
          var G__8246 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8246__delegate.call(this, x, y, z, args)
          };
          G__8246.cljs$lang$maxFixedArity = 3;
          G__8246.cljs$lang$applyTo = function(arglist__8247) {
            var x = cljs.core.first(arglist__8247);
            var y = cljs.core.first(cljs.core.next(arglist__8247));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8247)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8247)));
            return G__8246__delegate(x, y, z, args)
          };
          G__8246.cljs$lang$arity$variadic = G__8246__delegate;
          return G__8246
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__8245 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8245__delegate.call(this, p1, p2, p3, ps)
    };
    G__8245.cljs$lang$maxFixedArity = 3;
    G__8245.cljs$lang$applyTo = function(arglist__8248) {
      var p1 = cljs.core.first(arglist__8248);
      var p2 = cljs.core.first(cljs.core.next(arglist__8248));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8248)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8248)));
      return G__8245__delegate(p1, p2, p3, ps)
    };
    G__8245.cljs$lang$arity$variadic = G__8245__delegate;
    return G__8245
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____8329 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8329)) {
          return or__3824__auto____8329
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____8330 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8330)) {
          return or__3824__auto____8330
        }else {
          var or__3824__auto____8331 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8331)) {
            return or__3824__auto____8331
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__8400__delegate = function(x, y, z, args) {
          var or__3824__auto____8332 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8332)) {
            return or__3824__auto____8332
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__8400 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8400__delegate.call(this, x, y, z, args)
        };
        G__8400.cljs$lang$maxFixedArity = 3;
        G__8400.cljs$lang$applyTo = function(arglist__8401) {
          var x = cljs.core.first(arglist__8401);
          var y = cljs.core.first(cljs.core.next(arglist__8401));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8401)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8401)));
          return G__8400__delegate(x, y, z, args)
        };
        G__8400.cljs$lang$arity$variadic = G__8400__delegate;
        return G__8400
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____8344 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8344)) {
          return or__3824__auto____8344
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____8345 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8345)) {
          return or__3824__auto____8345
        }else {
          var or__3824__auto____8346 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8346)) {
            return or__3824__auto____8346
          }else {
            var or__3824__auto____8347 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8347)) {
              return or__3824__auto____8347
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____8348 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8348)) {
          return or__3824__auto____8348
        }else {
          var or__3824__auto____8349 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____8349)) {
            return or__3824__auto____8349
          }else {
            var or__3824__auto____8350 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____8350)) {
              return or__3824__auto____8350
            }else {
              var or__3824__auto____8351 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____8351)) {
                return or__3824__auto____8351
              }else {
                var or__3824__auto____8352 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8352)) {
                  return or__3824__auto____8352
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__8402__delegate = function(x, y, z, args) {
          var or__3824__auto____8353 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8353)) {
            return or__3824__auto____8353
          }else {
            return cljs.core.some.call(null, function(p1__8083_SHARP_) {
              var or__3824__auto____8354 = p1.call(null, p1__8083_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8354)) {
                return or__3824__auto____8354
              }else {
                return p2.call(null, p1__8083_SHARP_)
              }
            }, args)
          }
        };
        var G__8402 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8402__delegate.call(this, x, y, z, args)
        };
        G__8402.cljs$lang$maxFixedArity = 3;
        G__8402.cljs$lang$applyTo = function(arglist__8403) {
          var x = cljs.core.first(arglist__8403);
          var y = cljs.core.first(cljs.core.next(arglist__8403));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8403)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8403)));
          return G__8402__delegate(x, y, z, args)
        };
        G__8402.cljs$lang$arity$variadic = G__8402__delegate;
        return G__8402
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____8373 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8373)) {
          return or__3824__auto____8373
        }else {
          var or__3824__auto____8374 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8374)) {
            return or__3824__auto____8374
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____8375 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8375)) {
          return or__3824__auto____8375
        }else {
          var or__3824__auto____8376 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8376)) {
            return or__3824__auto____8376
          }else {
            var or__3824__auto____8377 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8377)) {
              return or__3824__auto____8377
            }else {
              var or__3824__auto____8378 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8378)) {
                return or__3824__auto____8378
              }else {
                var or__3824__auto____8379 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8379)) {
                  return or__3824__auto____8379
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____8380 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____8380)) {
          return or__3824__auto____8380
        }else {
          var or__3824__auto____8381 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____8381)) {
            return or__3824__auto____8381
          }else {
            var or__3824__auto____8382 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8382)) {
              return or__3824__auto____8382
            }else {
              var or__3824__auto____8383 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8383)) {
                return or__3824__auto____8383
              }else {
                var or__3824__auto____8384 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____8384)) {
                  return or__3824__auto____8384
                }else {
                  var or__3824__auto____8385 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____8385)) {
                    return or__3824__auto____8385
                  }else {
                    var or__3824__auto____8386 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____8386)) {
                      return or__3824__auto____8386
                    }else {
                      var or__3824__auto____8387 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____8387)) {
                        return or__3824__auto____8387
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__8404__delegate = function(x, y, z, args) {
          var or__3824__auto____8388 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____8388)) {
            return or__3824__auto____8388
          }else {
            return cljs.core.some.call(null, function(p1__8084_SHARP_) {
              var or__3824__auto____8389 = p1.call(null, p1__8084_SHARP_);
              if(cljs.core.truth_(or__3824__auto____8389)) {
                return or__3824__auto____8389
              }else {
                var or__3824__auto____8390 = p2.call(null, p1__8084_SHARP_);
                if(cljs.core.truth_(or__3824__auto____8390)) {
                  return or__3824__auto____8390
                }else {
                  return p3.call(null, p1__8084_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__8404 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8404__delegate.call(this, x, y, z, args)
        };
        G__8404.cljs$lang$maxFixedArity = 3;
        G__8404.cljs$lang$applyTo = function(arglist__8405) {
          var x = cljs.core.first(arglist__8405);
          var y = cljs.core.first(cljs.core.next(arglist__8405));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8405)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8405)));
          return G__8404__delegate(x, y, z, args)
        };
        G__8404.cljs$lang$arity$variadic = G__8404__delegate;
        return G__8404
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__8406__delegate = function(p1, p2, p3, ps) {
      var ps__8391 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__8085_SHARP_) {
            return p1__8085_SHARP_.call(null, x)
          }, ps__8391)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__8086_SHARP_) {
            var or__3824__auto____8396 = p1__8086_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8396)) {
              return or__3824__auto____8396
            }else {
              return p1__8086_SHARP_.call(null, y)
            }
          }, ps__8391)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__8087_SHARP_) {
            var or__3824__auto____8397 = p1__8087_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____8397)) {
              return or__3824__auto____8397
            }else {
              var or__3824__auto____8398 = p1__8087_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____8398)) {
                return or__3824__auto____8398
              }else {
                return p1__8087_SHARP_.call(null, z)
              }
            }
          }, ps__8391)
        };
        var spn__4 = function() {
          var G__8407__delegate = function(x, y, z, args) {
            var or__3824__auto____8399 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____8399)) {
              return or__3824__auto____8399
            }else {
              return cljs.core.some.call(null, function(p1__8088_SHARP_) {
                return cljs.core.some.call(null, p1__8088_SHARP_, args)
              }, ps__8391)
            }
          };
          var G__8407 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8407__delegate.call(this, x, y, z, args)
          };
          G__8407.cljs$lang$maxFixedArity = 3;
          G__8407.cljs$lang$applyTo = function(arglist__8408) {
            var x = cljs.core.first(arglist__8408);
            var y = cljs.core.first(cljs.core.next(arglist__8408));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8408)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8408)));
            return G__8407__delegate(x, y, z, args)
          };
          G__8407.cljs$lang$arity$variadic = G__8407__delegate;
          return G__8407
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__8406 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8406__delegate.call(this, p1, p2, p3, ps)
    };
    G__8406.cljs$lang$maxFixedArity = 3;
    G__8406.cljs$lang$applyTo = function(arglist__8409) {
      var p1 = cljs.core.first(arglist__8409);
      var p2 = cljs.core.first(cljs.core.next(arglist__8409));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8409)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8409)));
      return G__8406__delegate(p1, p2, p3, ps)
    };
    G__8406.cljs$lang$arity$variadic = G__8406__delegate;
    return G__8406
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8428 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8428) {
        var s__8429 = temp__3974__auto____8428;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__8429)) {
          var c__8430 = cljs.core.chunk_first.call(null, s__8429);
          var size__8431 = cljs.core.count.call(null, c__8430);
          var b__8432 = cljs.core.chunk_buffer.call(null, size__8431);
          var n__2523__auto____8433 = size__8431;
          var i__8434 = 0;
          while(true) {
            if(i__8434 < n__2523__auto____8433) {
              cljs.core.chunk_append.call(null, b__8432, f.call(null, cljs.core._nth.call(null, c__8430, i__8434)));
              var G__8446 = i__8434 + 1;
              i__8434 = G__8446;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8432), map.call(null, f, cljs.core.chunk_rest.call(null, s__8429)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__8429)), map.call(null, f, cljs.core.rest.call(null, s__8429)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8435 = cljs.core.seq.call(null, c1);
      var s2__8436 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8437 = s1__8435;
        if(and__3822__auto____8437) {
          return s2__8436
        }else {
          return and__3822__auto____8437
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8435), cljs.core.first.call(null, s2__8436)), map.call(null, f, cljs.core.rest.call(null, s1__8435), cljs.core.rest.call(null, s2__8436)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8438 = cljs.core.seq.call(null, c1);
      var s2__8439 = cljs.core.seq.call(null, c2);
      var s3__8440 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____8441 = s1__8438;
        if(and__3822__auto____8441) {
          var and__3822__auto____8442 = s2__8439;
          if(and__3822__auto____8442) {
            return s3__8440
          }else {
            return and__3822__auto____8442
          }
        }else {
          return and__3822__auto____8441
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__8438), cljs.core.first.call(null, s2__8439), cljs.core.first.call(null, s3__8440)), map.call(null, f, cljs.core.rest.call(null, s1__8438), cljs.core.rest.call(null, s2__8439), cljs.core.rest.call(null, s3__8440)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__8447__delegate = function(f, c1, c2, c3, colls) {
      var step__8445 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__8444 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8444)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__8444), step.call(null, map.call(null, cljs.core.rest, ss__8444)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__8249_SHARP_) {
        return cljs.core.apply.call(null, f, p1__8249_SHARP_)
      }, step__8445.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__8447 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8447__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8447.cljs$lang$maxFixedArity = 4;
    G__8447.cljs$lang$applyTo = function(arglist__8448) {
      var f = cljs.core.first(arglist__8448);
      var c1 = cljs.core.first(cljs.core.next(arglist__8448));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8448)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8448))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8448))));
      return G__8447__delegate(f, c1, c2, c3, colls)
    };
    G__8447.cljs$lang$arity$variadic = G__8447__delegate;
    return G__8447
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____8451 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8451) {
        var s__8452 = temp__3974__auto____8451;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8452), take.call(null, n - 1, cljs.core.rest.call(null, s__8452)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8458 = function(n, coll) {
    while(true) {
      var s__8456 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8457 = n > 0;
        if(and__3822__auto____8457) {
          return s__8456
        }else {
          return and__3822__auto____8457
        }
      }())) {
        var G__8459 = n - 1;
        var G__8460 = cljs.core.rest.call(null, s__8456);
        n = G__8459;
        coll = G__8460;
        continue
      }else {
        return s__8456
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8458.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8463 = cljs.core.seq.call(null, coll);
  var lead__8464 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8464) {
      var G__8465 = cljs.core.next.call(null, s__8463);
      var G__8466 = cljs.core.next.call(null, lead__8464);
      s__8463 = G__8465;
      lead__8464 = G__8466;
      continue
    }else {
      return s__8463
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8472 = function(pred, coll) {
    while(true) {
      var s__8470 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____8471 = s__8470;
        if(and__3822__auto____8471) {
          return pred.call(null, cljs.core.first.call(null, s__8470))
        }else {
          return and__3822__auto____8471
        }
      }())) {
        var G__8473 = pred;
        var G__8474 = cljs.core.rest.call(null, s__8470);
        pred = G__8473;
        coll = G__8474;
        continue
      }else {
        return s__8470
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8472.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8477 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8477) {
      var s__8478 = temp__3974__auto____8477;
      return cljs.core.concat.call(null, s__8478, cycle.call(null, s__8478))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8483 = cljs.core.seq.call(null, c1);
      var s2__8484 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____8485 = s1__8483;
        if(and__3822__auto____8485) {
          return s2__8484
        }else {
          return and__3822__auto____8485
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8483), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8484), interleave.call(null, cljs.core.rest.call(null, s1__8483), cljs.core.rest.call(null, s2__8484))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8487__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8486 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8486)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8486), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8486)))
        }else {
          return null
        }
      }, null)
    };
    var G__8487 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8487__delegate.call(this, c1, c2, colls)
    };
    G__8487.cljs$lang$maxFixedArity = 2;
    G__8487.cljs$lang$applyTo = function(arglist__8488) {
      var c1 = cljs.core.first(arglist__8488);
      var c2 = cljs.core.first(cljs.core.next(arglist__8488));
      var colls = cljs.core.rest(cljs.core.next(arglist__8488));
      return G__8487__delegate(c1, c2, colls)
    };
    G__8487.cljs$lang$arity$variadic = G__8487__delegate;
    return G__8487
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8498 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8496 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8496) {
        var coll__8497 = temp__3971__auto____8496;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8497), cat.call(null, cljs.core.rest.call(null, coll__8497), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8498.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8499__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8499 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8499__delegate.call(this, f, coll, colls)
    };
    G__8499.cljs$lang$maxFixedArity = 2;
    G__8499.cljs$lang$applyTo = function(arglist__8500) {
      var f = cljs.core.first(arglist__8500);
      var coll = cljs.core.first(cljs.core.next(arglist__8500));
      var colls = cljs.core.rest(cljs.core.next(arglist__8500));
      return G__8499__delegate(f, coll, colls)
    };
    G__8499.cljs$lang$arity$variadic = G__8499__delegate;
    return G__8499
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8510 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8510) {
      var s__8511 = temp__3974__auto____8510;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8511)) {
        var c__8512 = cljs.core.chunk_first.call(null, s__8511);
        var size__8513 = cljs.core.count.call(null, c__8512);
        var b__8514 = cljs.core.chunk_buffer.call(null, size__8513);
        var n__2523__auto____8515 = size__8513;
        var i__8516 = 0;
        while(true) {
          if(i__8516 < n__2523__auto____8515) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8512, i__8516)))) {
              cljs.core.chunk_append.call(null, b__8514, cljs.core._nth.call(null, c__8512, i__8516))
            }else {
            }
            var G__8519 = i__8516 + 1;
            i__8516 = G__8519;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8514), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8511)))
      }else {
        var f__8517 = cljs.core.first.call(null, s__8511);
        var r__8518 = cljs.core.rest.call(null, s__8511);
        if(cljs.core.truth_(pred.call(null, f__8517))) {
          return cljs.core.cons.call(null, f__8517, filter.call(null, pred, r__8518))
        }else {
          return filter.call(null, pred, r__8518)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8522 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8522.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8520_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8520_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8526__8527 = to;
    if(G__8526__8527) {
      if(function() {
        var or__3824__auto____8528 = G__8526__8527.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____8528) {
          return or__3824__auto____8528
        }else {
          return G__8526__8527.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8526__8527.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8526__8527)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8526__8527)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8529__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8529 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8529__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8529.cljs$lang$maxFixedArity = 4;
    G__8529.cljs$lang$applyTo = function(arglist__8530) {
      var f = cljs.core.first(arglist__8530);
      var c1 = cljs.core.first(cljs.core.next(arglist__8530));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8530)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8530))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8530))));
      return G__8529__delegate(f, c1, c2, c3, colls)
    };
    G__8529.cljs$lang$arity$variadic = G__8529__delegate;
    return G__8529
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8537 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8537) {
        var s__8538 = temp__3974__auto____8537;
        var p__8539 = cljs.core.take.call(null, n, s__8538);
        if(n === cljs.core.count.call(null, p__8539)) {
          return cljs.core.cons.call(null, p__8539, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8538)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8540 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8540) {
        var s__8541 = temp__3974__auto____8540;
        var p__8542 = cljs.core.take.call(null, n, s__8541);
        if(n === cljs.core.count.call(null, p__8542)) {
          return cljs.core.cons.call(null, p__8542, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8541)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8542, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8547 = cljs.core.lookup_sentinel;
    var m__8548 = m;
    var ks__8549 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8549) {
        var m__8550 = cljs.core._lookup.call(null, m__8548, cljs.core.first.call(null, ks__8549), sentinel__8547);
        if(sentinel__8547 === m__8550) {
          return not_found
        }else {
          var G__8551 = sentinel__8547;
          var G__8552 = m__8550;
          var G__8553 = cljs.core.next.call(null, ks__8549);
          sentinel__8547 = G__8551;
          m__8548 = G__8552;
          ks__8549 = G__8553;
          continue
        }
      }else {
        return m__8548
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8554, v) {
  var vec__8559__8560 = p__8554;
  var k__8561 = cljs.core.nth.call(null, vec__8559__8560, 0, null);
  var ks__8562 = cljs.core.nthnext.call(null, vec__8559__8560, 1);
  if(cljs.core.truth_(ks__8562)) {
    return cljs.core.assoc.call(null, m, k__8561, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8561, null), ks__8562, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8561, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8563, f, args) {
    var vec__8568__8569 = p__8563;
    var k__8570 = cljs.core.nth.call(null, vec__8568__8569, 0, null);
    var ks__8571 = cljs.core.nthnext.call(null, vec__8568__8569, 1);
    if(cljs.core.truth_(ks__8571)) {
      return cljs.core.assoc.call(null, m, k__8570, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8570, null), ks__8571, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8570, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8570, null), args))
    }
  };
  var update_in = function(m, p__8563, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8563, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8572) {
    var m = cljs.core.first(arglist__8572);
    var p__8563 = cljs.core.first(cljs.core.next(arglist__8572));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8572)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8572)));
    return update_in__delegate(m, p__8563, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8575 = this;
  var h__2188__auto____8576 = this__8575.__hash;
  if(!(h__2188__auto____8576 == null)) {
    return h__2188__auto____8576
  }else {
    var h__2188__auto____8577 = cljs.core.hash_coll.call(null, coll);
    this__8575.__hash = h__2188__auto____8577;
    return h__2188__auto____8577
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8578 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8579 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8580 = this;
  var new_array__8581 = this__8580.array.slice();
  new_array__8581[k] = v;
  return new cljs.core.Vector(this__8580.meta, new_array__8581, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8612 = null;
  var G__8612__2 = function(this_sym8582, k) {
    var this__8584 = this;
    var this_sym8582__8585 = this;
    var coll__8586 = this_sym8582__8585;
    return coll__8586.cljs$core$ILookup$_lookup$arity$2(coll__8586, k)
  };
  var G__8612__3 = function(this_sym8583, k, not_found) {
    var this__8584 = this;
    var this_sym8583__8587 = this;
    var coll__8588 = this_sym8583__8587;
    return coll__8588.cljs$core$ILookup$_lookup$arity$3(coll__8588, k, not_found)
  };
  G__8612 = function(this_sym8583, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8612__2.call(this, this_sym8583, k);
      case 3:
        return G__8612__3.call(this, this_sym8583, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8612
}();
cljs.core.Vector.prototype.apply = function(this_sym8573, args8574) {
  var this__8589 = this;
  return this_sym8573.call.apply(this_sym8573, [this_sym8573].concat(args8574.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8590 = this;
  var new_array__8591 = this__8590.array.slice();
  new_array__8591.push(o);
  return new cljs.core.Vector(this__8590.meta, new_array__8591, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8592 = this;
  var this__8593 = this;
  return cljs.core.pr_str.call(null, this__8593)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8594 = this;
  return cljs.core.ci_reduce.call(null, this__8594.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8595 = this;
  return cljs.core.ci_reduce.call(null, this__8595.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8596 = this;
  if(this__8596.array.length > 0) {
    var vector_seq__8597 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8596.array.length) {
          return cljs.core.cons.call(null, this__8596.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8597.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8598 = this;
  return this__8598.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8599 = this;
  var count__8600 = this__8599.array.length;
  if(count__8600 > 0) {
    return this__8599.array[count__8600 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8601 = this;
  if(this__8601.array.length > 0) {
    var new_array__8602 = this__8601.array.slice();
    new_array__8602.pop();
    return new cljs.core.Vector(this__8601.meta, new_array__8602, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8603 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8604 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8605 = this;
  return new cljs.core.Vector(meta, this__8605.array, this__8605.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8606 = this;
  return this__8606.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8607 = this;
  if(function() {
    var and__3822__auto____8608 = 0 <= n;
    if(and__3822__auto____8608) {
      return n < this__8607.array.length
    }else {
      return and__3822__auto____8608
    }
  }()) {
    return this__8607.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8609 = this;
  if(function() {
    var and__3822__auto____8610 = 0 <= n;
    if(and__3822__auto____8610) {
      return n < this__8609.array.length
    }else {
      return and__3822__auto____8610
    }
  }()) {
    return this__8609.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8611 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8611.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2306__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8614 = pv.cnt;
  if(cnt__8614 < 32) {
    return 0
  }else {
    return cnt__8614 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8620 = level;
  var ret__8621 = node;
  while(true) {
    if(ll__8620 === 0) {
      return ret__8621
    }else {
      var embed__8622 = ret__8621;
      var r__8623 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8624 = cljs.core.pv_aset.call(null, r__8623, 0, embed__8622);
      var G__8625 = ll__8620 - 5;
      var G__8626 = r__8623;
      ll__8620 = G__8625;
      ret__8621 = G__8626;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8632 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8633 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8632, subidx__8633, tailnode);
    return ret__8632
  }else {
    var child__8634 = cljs.core.pv_aget.call(null, parent, subidx__8633);
    if(!(child__8634 == null)) {
      var node_to_insert__8635 = push_tail.call(null, pv, level - 5, child__8634, tailnode);
      cljs.core.pv_aset.call(null, ret__8632, subidx__8633, node_to_insert__8635);
      return ret__8632
    }else {
      var node_to_insert__8636 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8632, subidx__8633, node_to_insert__8636);
      return ret__8632
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____8640 = 0 <= i;
    if(and__3822__auto____8640) {
      return i < pv.cnt
    }else {
      return and__3822__auto____8640
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8641 = pv.root;
      var level__8642 = pv.shift;
      while(true) {
        if(level__8642 > 0) {
          var G__8643 = cljs.core.pv_aget.call(null, node__8641, i >>> level__8642 & 31);
          var G__8644 = level__8642 - 5;
          node__8641 = G__8643;
          level__8642 = G__8644;
          continue
        }else {
          return node__8641.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8647 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8647, i & 31, val);
    return ret__8647
  }else {
    var subidx__8648 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8647, subidx__8648, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8648), i, val));
    return ret__8647
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8654 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8655 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8654));
    if(function() {
      var and__3822__auto____8656 = new_child__8655 == null;
      if(and__3822__auto____8656) {
        return subidx__8654 === 0
      }else {
        return and__3822__auto____8656
      }
    }()) {
      return null
    }else {
      var ret__8657 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8657, subidx__8654, new_child__8655);
      return ret__8657
    }
  }else {
    if(subidx__8654 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8658 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8658, subidx__8654, null);
        return ret__8658
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8661 = this;
  return new cljs.core.TransientVector(this__8661.cnt, this__8661.shift, cljs.core.tv_editable_root.call(null, this__8661.root), cljs.core.tv_editable_tail.call(null, this__8661.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8662 = this;
  var h__2188__auto____8663 = this__8662.__hash;
  if(!(h__2188__auto____8663 == null)) {
    return h__2188__auto____8663
  }else {
    var h__2188__auto____8664 = cljs.core.hash_coll.call(null, coll);
    this__8662.__hash = h__2188__auto____8664;
    return h__2188__auto____8664
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8665 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8666 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8667 = this;
  if(function() {
    var and__3822__auto____8668 = 0 <= k;
    if(and__3822__auto____8668) {
      return k < this__8667.cnt
    }else {
      return and__3822__auto____8668
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8669 = this__8667.tail.slice();
      new_tail__8669[k & 31] = v;
      return new cljs.core.PersistentVector(this__8667.meta, this__8667.cnt, this__8667.shift, this__8667.root, new_tail__8669, null)
    }else {
      return new cljs.core.PersistentVector(this__8667.meta, this__8667.cnt, this__8667.shift, cljs.core.do_assoc.call(null, coll, this__8667.shift, this__8667.root, k, v), this__8667.tail, null)
    }
  }else {
    if(k === this__8667.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8667.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8717 = null;
  var G__8717__2 = function(this_sym8670, k) {
    var this__8672 = this;
    var this_sym8670__8673 = this;
    var coll__8674 = this_sym8670__8673;
    return coll__8674.cljs$core$ILookup$_lookup$arity$2(coll__8674, k)
  };
  var G__8717__3 = function(this_sym8671, k, not_found) {
    var this__8672 = this;
    var this_sym8671__8675 = this;
    var coll__8676 = this_sym8671__8675;
    return coll__8676.cljs$core$ILookup$_lookup$arity$3(coll__8676, k, not_found)
  };
  G__8717 = function(this_sym8671, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8717__2.call(this, this_sym8671, k);
      case 3:
        return G__8717__3.call(this, this_sym8671, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8717
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8659, args8660) {
  var this__8677 = this;
  return this_sym8659.call.apply(this_sym8659, [this_sym8659].concat(args8660.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8678 = this;
  var step_init__8679 = [0, init];
  var i__8680 = 0;
  while(true) {
    if(i__8680 < this__8678.cnt) {
      var arr__8681 = cljs.core.array_for.call(null, v, i__8680);
      var len__8682 = arr__8681.length;
      var init__8686 = function() {
        var j__8683 = 0;
        var init__8684 = step_init__8679[1];
        while(true) {
          if(j__8683 < len__8682) {
            var init__8685 = f.call(null, init__8684, j__8683 + i__8680, arr__8681[j__8683]);
            if(cljs.core.reduced_QMARK_.call(null, init__8685)) {
              return init__8685
            }else {
              var G__8718 = j__8683 + 1;
              var G__8719 = init__8685;
              j__8683 = G__8718;
              init__8684 = G__8719;
              continue
            }
          }else {
            step_init__8679[0] = len__8682;
            step_init__8679[1] = init__8684;
            return init__8684
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8686)) {
        return cljs.core.deref.call(null, init__8686)
      }else {
        var G__8720 = i__8680 + step_init__8679[0];
        i__8680 = G__8720;
        continue
      }
    }else {
      return step_init__8679[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8687 = this;
  if(this__8687.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8688 = this__8687.tail.slice();
    new_tail__8688.push(o);
    return new cljs.core.PersistentVector(this__8687.meta, this__8687.cnt + 1, this__8687.shift, this__8687.root, new_tail__8688, null)
  }else {
    var root_overflow_QMARK___8689 = this__8687.cnt >>> 5 > 1 << this__8687.shift;
    var new_shift__8690 = root_overflow_QMARK___8689 ? this__8687.shift + 5 : this__8687.shift;
    var new_root__8692 = root_overflow_QMARK___8689 ? function() {
      var n_r__8691 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8691, 0, this__8687.root);
      cljs.core.pv_aset.call(null, n_r__8691, 1, cljs.core.new_path.call(null, null, this__8687.shift, new cljs.core.VectorNode(null, this__8687.tail)));
      return n_r__8691
    }() : cljs.core.push_tail.call(null, coll, this__8687.shift, this__8687.root, new cljs.core.VectorNode(null, this__8687.tail));
    return new cljs.core.PersistentVector(this__8687.meta, this__8687.cnt + 1, new_shift__8690, new_root__8692, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8693 = this;
  if(this__8693.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8693.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8694 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8695 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8696 = this;
  var this__8697 = this;
  return cljs.core.pr_str.call(null, this__8697)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8698 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8699 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8700 = this;
  if(this__8700.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8701 = this;
  return this__8701.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8702 = this;
  if(this__8702.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8702.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8703 = this;
  if(this__8703.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8703.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8703.meta)
    }else {
      if(1 < this__8703.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8703.meta, this__8703.cnt - 1, this__8703.shift, this__8703.root, this__8703.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8704 = cljs.core.array_for.call(null, coll, this__8703.cnt - 2);
          var nr__8705 = cljs.core.pop_tail.call(null, coll, this__8703.shift, this__8703.root);
          var new_root__8706 = nr__8705 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8705;
          var cnt_1__8707 = this__8703.cnt - 1;
          if(function() {
            var and__3822__auto____8708 = 5 < this__8703.shift;
            if(and__3822__auto____8708) {
              return cljs.core.pv_aget.call(null, new_root__8706, 1) == null
            }else {
              return and__3822__auto____8708
            }
          }()) {
            return new cljs.core.PersistentVector(this__8703.meta, cnt_1__8707, this__8703.shift - 5, cljs.core.pv_aget.call(null, new_root__8706, 0), new_tail__8704, null)
          }else {
            return new cljs.core.PersistentVector(this__8703.meta, cnt_1__8707, this__8703.shift, new_root__8706, new_tail__8704, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8709 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8710 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8711 = this;
  return new cljs.core.PersistentVector(meta, this__8711.cnt, this__8711.shift, this__8711.root, this__8711.tail, this__8711.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8712 = this;
  return this__8712.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8713 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8714 = this;
  if(function() {
    var and__3822__auto____8715 = 0 <= n;
    if(and__3822__auto____8715) {
      return n < this__8714.cnt
    }else {
      return and__3822__auto____8715
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8716 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8716.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8721 = xs.length;
  var xs__8722 = no_clone === true ? xs : xs.slice();
  if(l__8721 < 32) {
    return new cljs.core.PersistentVector(null, l__8721, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8722, null)
  }else {
    var node__8723 = xs__8722.slice(0, 32);
    var v__8724 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8723, null);
    var i__8725 = 32;
    var out__8726 = cljs.core._as_transient.call(null, v__8724);
    while(true) {
      if(i__8725 < l__8721) {
        var G__8727 = i__8725 + 1;
        var G__8728 = cljs.core.conj_BANG_.call(null, out__8726, xs__8722[i__8725]);
        i__8725 = G__8727;
        out__8726 = G__8728;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8726)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8729) {
    var args = cljs.core.seq(arglist__8729);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8730 = this;
  if(this__8730.off + 1 < this__8730.node.length) {
    var s__8731 = cljs.core.chunked_seq.call(null, this__8730.vec, this__8730.node, this__8730.i, this__8730.off + 1);
    if(s__8731 == null) {
      return null
    }else {
      return s__8731
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8732 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8733 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8734 = this;
  return this__8734.node[this__8734.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8735 = this;
  if(this__8735.off + 1 < this__8735.node.length) {
    var s__8736 = cljs.core.chunked_seq.call(null, this__8735.vec, this__8735.node, this__8735.i, this__8735.off + 1);
    if(s__8736 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8736
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8737 = this;
  var l__8738 = this__8737.node.length;
  var s__8739 = this__8737.i + l__8738 < cljs.core._count.call(null, this__8737.vec) ? cljs.core.chunked_seq.call(null, this__8737.vec, this__8737.i + l__8738, 0) : null;
  if(s__8739 == null) {
    return null
  }else {
    return s__8739
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8740 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8741 = this;
  return cljs.core.chunked_seq.call(null, this__8741.vec, this__8741.node, this__8741.i, this__8741.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8742 = this;
  return this__8742.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8743 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8743.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8744 = this;
  return cljs.core.array_chunk.call(null, this__8744.node, this__8744.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8745 = this;
  var l__8746 = this__8745.node.length;
  var s__8747 = this__8745.i + l__8746 < cljs.core._count.call(null, this__8745.vec) ? cljs.core.chunked_seq.call(null, this__8745.vec, this__8745.i + l__8746, 0) : null;
  if(s__8747 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8747
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8750 = this;
  var h__2188__auto____8751 = this__8750.__hash;
  if(!(h__2188__auto____8751 == null)) {
    return h__2188__auto____8751
  }else {
    var h__2188__auto____8752 = cljs.core.hash_coll.call(null, coll);
    this__8750.__hash = h__2188__auto____8752;
    return h__2188__auto____8752
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8753 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8754 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8755 = this;
  var v_pos__8756 = this__8755.start + key;
  return new cljs.core.Subvec(this__8755.meta, cljs.core._assoc.call(null, this__8755.v, v_pos__8756, val), this__8755.start, this__8755.end > v_pos__8756 + 1 ? this__8755.end : v_pos__8756 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8782 = null;
  var G__8782__2 = function(this_sym8757, k) {
    var this__8759 = this;
    var this_sym8757__8760 = this;
    var coll__8761 = this_sym8757__8760;
    return coll__8761.cljs$core$ILookup$_lookup$arity$2(coll__8761, k)
  };
  var G__8782__3 = function(this_sym8758, k, not_found) {
    var this__8759 = this;
    var this_sym8758__8762 = this;
    var coll__8763 = this_sym8758__8762;
    return coll__8763.cljs$core$ILookup$_lookup$arity$3(coll__8763, k, not_found)
  };
  G__8782 = function(this_sym8758, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8782__2.call(this, this_sym8758, k);
      case 3:
        return G__8782__3.call(this, this_sym8758, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8782
}();
cljs.core.Subvec.prototype.apply = function(this_sym8748, args8749) {
  var this__8764 = this;
  return this_sym8748.call.apply(this_sym8748, [this_sym8748].concat(args8749.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8765 = this;
  return new cljs.core.Subvec(this__8765.meta, cljs.core._assoc_n.call(null, this__8765.v, this__8765.end, o), this__8765.start, this__8765.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8766 = this;
  var this__8767 = this;
  return cljs.core.pr_str.call(null, this__8767)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8768 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8769 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8770 = this;
  var subvec_seq__8771 = function subvec_seq(i) {
    if(i === this__8770.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8770.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8771.call(null, this__8770.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8772 = this;
  return this__8772.end - this__8772.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8773 = this;
  return cljs.core._nth.call(null, this__8773.v, this__8773.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8774 = this;
  if(this__8774.start === this__8774.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8774.meta, this__8774.v, this__8774.start, this__8774.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8775 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8776 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8777 = this;
  return new cljs.core.Subvec(meta, this__8777.v, this__8777.start, this__8777.end, this__8777.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8778 = this;
  return this__8778.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8779 = this;
  return cljs.core._nth.call(null, this__8779.v, this__8779.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8780 = this;
  return cljs.core._nth.call(null, this__8780.v, this__8780.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8781 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8781.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8784 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8784, 0, tl.length);
  return ret__8784
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8788 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8789 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8788, subidx__8789, level === 5 ? tail_node : function() {
    var child__8790 = cljs.core.pv_aget.call(null, ret__8788, subidx__8789);
    if(!(child__8790 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8790, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8788
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8795 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8796 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8797 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8795, subidx__8796));
    if(function() {
      var and__3822__auto____8798 = new_child__8797 == null;
      if(and__3822__auto____8798) {
        return subidx__8796 === 0
      }else {
        return and__3822__auto____8798
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8795, subidx__8796, new_child__8797);
      return node__8795
    }
  }else {
    if(subidx__8796 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8795, subidx__8796, null);
        return node__8795
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____8803 = 0 <= i;
    if(and__3822__auto____8803) {
      return i < tv.cnt
    }else {
      return and__3822__auto____8803
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8804 = tv.root;
      var node__8805 = root__8804;
      var level__8806 = tv.shift;
      while(true) {
        if(level__8806 > 0) {
          var G__8807 = cljs.core.tv_ensure_editable.call(null, root__8804.edit, cljs.core.pv_aget.call(null, node__8805, i >>> level__8806 & 31));
          var G__8808 = level__8806 - 5;
          node__8805 = G__8807;
          level__8806 = G__8808;
          continue
        }else {
          return node__8805.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8848 = null;
  var G__8848__2 = function(this_sym8811, k) {
    var this__8813 = this;
    var this_sym8811__8814 = this;
    var coll__8815 = this_sym8811__8814;
    return coll__8815.cljs$core$ILookup$_lookup$arity$2(coll__8815, k)
  };
  var G__8848__3 = function(this_sym8812, k, not_found) {
    var this__8813 = this;
    var this_sym8812__8816 = this;
    var coll__8817 = this_sym8812__8816;
    return coll__8817.cljs$core$ILookup$_lookup$arity$3(coll__8817, k, not_found)
  };
  G__8848 = function(this_sym8812, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8848__2.call(this, this_sym8812, k);
      case 3:
        return G__8848__3.call(this, this_sym8812, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8848
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8809, args8810) {
  var this__8818 = this;
  return this_sym8809.call.apply(this_sym8809, [this_sym8809].concat(args8810.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8819 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8820 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8821 = this;
  if(this__8821.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8822 = this;
  if(function() {
    var and__3822__auto____8823 = 0 <= n;
    if(and__3822__auto____8823) {
      return n < this__8822.cnt
    }else {
      return and__3822__auto____8823
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8824 = this;
  if(this__8824.root.edit) {
    return this__8824.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8825 = this;
  if(this__8825.root.edit) {
    if(function() {
      var and__3822__auto____8826 = 0 <= n;
      if(and__3822__auto____8826) {
        return n < this__8825.cnt
      }else {
        return and__3822__auto____8826
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8825.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8831 = function go(level, node) {
          var node__8829 = cljs.core.tv_ensure_editable.call(null, this__8825.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8829, n & 31, val);
            return node__8829
          }else {
            var subidx__8830 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8829, subidx__8830, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8829, subidx__8830)));
            return node__8829
          }
        }.call(null, this__8825.shift, this__8825.root);
        this__8825.root = new_root__8831;
        return tcoll
      }
    }else {
      if(n === this__8825.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8825.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8832 = this;
  if(this__8832.root.edit) {
    if(this__8832.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8832.cnt) {
        this__8832.cnt = 0;
        return tcoll
      }else {
        if((this__8832.cnt - 1 & 31) > 0) {
          this__8832.cnt = this__8832.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8833 = cljs.core.editable_array_for.call(null, tcoll, this__8832.cnt - 2);
            var new_root__8835 = function() {
              var nr__8834 = cljs.core.tv_pop_tail.call(null, tcoll, this__8832.shift, this__8832.root);
              if(!(nr__8834 == null)) {
                return nr__8834
              }else {
                return new cljs.core.VectorNode(this__8832.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____8836 = 5 < this__8832.shift;
              if(and__3822__auto____8836) {
                return cljs.core.pv_aget.call(null, new_root__8835, 1) == null
              }else {
                return and__3822__auto____8836
              }
            }()) {
              var new_root__8837 = cljs.core.tv_ensure_editable.call(null, this__8832.root.edit, cljs.core.pv_aget.call(null, new_root__8835, 0));
              this__8832.root = new_root__8837;
              this__8832.shift = this__8832.shift - 5;
              this__8832.cnt = this__8832.cnt - 1;
              this__8832.tail = new_tail__8833;
              return tcoll
            }else {
              this__8832.root = new_root__8835;
              this__8832.cnt = this__8832.cnt - 1;
              this__8832.tail = new_tail__8833;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8838 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8839 = this;
  if(this__8839.root.edit) {
    if(this__8839.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8839.tail[this__8839.cnt & 31] = o;
      this__8839.cnt = this__8839.cnt + 1;
      return tcoll
    }else {
      var tail_node__8840 = new cljs.core.VectorNode(this__8839.root.edit, this__8839.tail);
      var new_tail__8841 = cljs.core.make_array.call(null, 32);
      new_tail__8841[0] = o;
      this__8839.tail = new_tail__8841;
      if(this__8839.cnt >>> 5 > 1 << this__8839.shift) {
        var new_root_array__8842 = cljs.core.make_array.call(null, 32);
        var new_shift__8843 = this__8839.shift + 5;
        new_root_array__8842[0] = this__8839.root;
        new_root_array__8842[1] = cljs.core.new_path.call(null, this__8839.root.edit, this__8839.shift, tail_node__8840);
        this__8839.root = new cljs.core.VectorNode(this__8839.root.edit, new_root_array__8842);
        this__8839.shift = new_shift__8843;
        this__8839.cnt = this__8839.cnt + 1;
        return tcoll
      }else {
        var new_root__8844 = cljs.core.tv_push_tail.call(null, tcoll, this__8839.shift, this__8839.root, tail_node__8840);
        this__8839.root = new_root__8844;
        this__8839.cnt = this__8839.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8845 = this;
  if(this__8845.root.edit) {
    this__8845.root.edit = null;
    var len__8846 = this__8845.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8847 = cljs.core.make_array.call(null, len__8846);
    cljs.core.array_copy.call(null, this__8845.tail, 0, trimmed_tail__8847, 0, len__8846);
    return new cljs.core.PersistentVector(null, this__8845.cnt, this__8845.shift, this__8845.root, trimmed_tail__8847, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8849 = this;
  var h__2188__auto____8850 = this__8849.__hash;
  if(!(h__2188__auto____8850 == null)) {
    return h__2188__auto____8850
  }else {
    var h__2188__auto____8851 = cljs.core.hash_coll.call(null, coll);
    this__8849.__hash = h__2188__auto____8851;
    return h__2188__auto____8851
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8852 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8853 = this;
  var this__8854 = this;
  return cljs.core.pr_str.call(null, this__8854)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8855 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8856 = this;
  return cljs.core._first.call(null, this__8856.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8857 = this;
  var temp__3971__auto____8858 = cljs.core.next.call(null, this__8857.front);
  if(temp__3971__auto____8858) {
    var f1__8859 = temp__3971__auto____8858;
    return new cljs.core.PersistentQueueSeq(this__8857.meta, f1__8859, this__8857.rear, null)
  }else {
    if(this__8857.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8857.meta, this__8857.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8860 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8861 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8861.front, this__8861.rear, this__8861.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8862 = this;
  return this__8862.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8863 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8863.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8864 = this;
  var h__2188__auto____8865 = this__8864.__hash;
  if(!(h__2188__auto____8865 == null)) {
    return h__2188__auto____8865
  }else {
    var h__2188__auto____8866 = cljs.core.hash_coll.call(null, coll);
    this__8864.__hash = h__2188__auto____8866;
    return h__2188__auto____8866
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8867 = this;
  if(cljs.core.truth_(this__8867.front)) {
    return new cljs.core.PersistentQueue(this__8867.meta, this__8867.count + 1, this__8867.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____8868 = this__8867.rear;
      if(cljs.core.truth_(or__3824__auto____8868)) {
        return or__3824__auto____8868
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8867.meta, this__8867.count + 1, cljs.core.conj.call(null, this__8867.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8869 = this;
  var this__8870 = this;
  return cljs.core.pr_str.call(null, this__8870)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8871 = this;
  var rear__8872 = cljs.core.seq.call(null, this__8871.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____8873 = this__8871.front;
    if(cljs.core.truth_(or__3824__auto____8873)) {
      return or__3824__auto____8873
    }else {
      return rear__8872
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8871.front, cljs.core.seq.call(null, rear__8872), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8874 = this;
  return this__8874.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8875 = this;
  return cljs.core._first.call(null, this__8875.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8876 = this;
  if(cljs.core.truth_(this__8876.front)) {
    var temp__3971__auto____8877 = cljs.core.next.call(null, this__8876.front);
    if(temp__3971__auto____8877) {
      var f1__8878 = temp__3971__auto____8877;
      return new cljs.core.PersistentQueue(this__8876.meta, this__8876.count - 1, f1__8878, this__8876.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8876.meta, this__8876.count - 1, cljs.core.seq.call(null, this__8876.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8879 = this;
  return cljs.core.first.call(null, this__8879.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8880 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8881 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8882 = this;
  return new cljs.core.PersistentQueue(meta, this__8882.count, this__8882.front, this__8882.rear, this__8882.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8883 = this;
  return this__8883.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8884 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8885 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8888 = array.length;
  var i__8889 = 0;
  while(true) {
    if(i__8889 < len__8888) {
      if(k === array[i__8889]) {
        return i__8889
      }else {
        var G__8890 = i__8889 + incr;
        i__8889 = G__8890;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8893 = cljs.core.hash.call(null, a);
  var b__8894 = cljs.core.hash.call(null, b);
  if(a__8893 < b__8894) {
    return-1
  }else {
    if(a__8893 > b__8894) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8902 = m.keys;
  var len__8903 = ks__8902.length;
  var so__8904 = m.strobj;
  var out__8905 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8906 = 0;
  var out__8907 = cljs.core.transient$.call(null, out__8905);
  while(true) {
    if(i__8906 < len__8903) {
      var k__8908 = ks__8902[i__8906];
      var G__8909 = i__8906 + 1;
      var G__8910 = cljs.core.assoc_BANG_.call(null, out__8907, k__8908, so__8904[k__8908]);
      i__8906 = G__8909;
      out__8907 = G__8910;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8907, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8916 = {};
  var l__8917 = ks.length;
  var i__8918 = 0;
  while(true) {
    if(i__8918 < l__8917) {
      var k__8919 = ks[i__8918];
      new_obj__8916[k__8919] = obj[k__8919];
      var G__8920 = i__8918 + 1;
      i__8918 = G__8920;
      continue
    }else {
    }
    break
  }
  return new_obj__8916
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8923 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8924 = this;
  var h__2188__auto____8925 = this__8924.__hash;
  if(!(h__2188__auto____8925 == null)) {
    return h__2188__auto____8925
  }else {
    var h__2188__auto____8926 = cljs.core.hash_imap.call(null, coll);
    this__8924.__hash = h__2188__auto____8926;
    return h__2188__auto____8926
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8927 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8928 = this;
  if(function() {
    var and__3822__auto____8929 = goog.isString(k);
    if(and__3822__auto____8929) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8928.keys) == null)
    }else {
      return and__3822__auto____8929
    }
  }()) {
    return this__8928.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8930 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____8931 = this__8930.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____8931) {
        return or__3824__auto____8931
      }else {
        return this__8930.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8930.keys) == null)) {
        var new_strobj__8932 = cljs.core.obj_clone.call(null, this__8930.strobj, this__8930.keys);
        new_strobj__8932[k] = v;
        return new cljs.core.ObjMap(this__8930.meta, this__8930.keys, new_strobj__8932, this__8930.update_count + 1, null)
      }else {
        var new_strobj__8933 = cljs.core.obj_clone.call(null, this__8930.strobj, this__8930.keys);
        var new_keys__8934 = this__8930.keys.slice();
        new_strobj__8933[k] = v;
        new_keys__8934.push(k);
        return new cljs.core.ObjMap(this__8930.meta, new_keys__8934, new_strobj__8933, this__8930.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8935 = this;
  if(function() {
    var and__3822__auto____8936 = goog.isString(k);
    if(and__3822__auto____8936) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8935.keys) == null)
    }else {
      return and__3822__auto____8936
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8958 = null;
  var G__8958__2 = function(this_sym8937, k) {
    var this__8939 = this;
    var this_sym8937__8940 = this;
    var coll__8941 = this_sym8937__8940;
    return coll__8941.cljs$core$ILookup$_lookup$arity$2(coll__8941, k)
  };
  var G__8958__3 = function(this_sym8938, k, not_found) {
    var this__8939 = this;
    var this_sym8938__8942 = this;
    var coll__8943 = this_sym8938__8942;
    return coll__8943.cljs$core$ILookup$_lookup$arity$3(coll__8943, k, not_found)
  };
  G__8958 = function(this_sym8938, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8958__2.call(this, this_sym8938, k);
      case 3:
        return G__8958__3.call(this, this_sym8938, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8958
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8921, args8922) {
  var this__8944 = this;
  return this_sym8921.call.apply(this_sym8921, [this_sym8921].concat(args8922.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8945 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8946 = this;
  var this__8947 = this;
  return cljs.core.pr_str.call(null, this__8947)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8948 = this;
  if(this__8948.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8911_SHARP_) {
      return cljs.core.vector.call(null, p1__8911_SHARP_, this__8948.strobj[p1__8911_SHARP_])
    }, this__8948.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8949 = this;
  return this__8949.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8950 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8951 = this;
  return new cljs.core.ObjMap(meta, this__8951.keys, this__8951.strobj, this__8951.update_count, this__8951.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8952 = this;
  return this__8952.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8953 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8953.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8954 = this;
  if(function() {
    var and__3822__auto____8955 = goog.isString(k);
    if(and__3822__auto____8955) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8954.keys) == null)
    }else {
      return and__3822__auto____8955
    }
  }()) {
    var new_keys__8956 = this__8954.keys.slice();
    var new_strobj__8957 = cljs.core.obj_clone.call(null, this__8954.strobj, this__8954.keys);
    new_keys__8956.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8956), 1);
    cljs.core.js_delete.call(null, new_strobj__8957, k);
    return new cljs.core.ObjMap(this__8954.meta, new_keys__8956, new_strobj__8957, this__8954.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8962 = this;
  var h__2188__auto____8963 = this__8962.__hash;
  if(!(h__2188__auto____8963 == null)) {
    return h__2188__auto____8963
  }else {
    var h__2188__auto____8964 = cljs.core.hash_imap.call(null, coll);
    this__8962.__hash = h__2188__auto____8964;
    return h__2188__auto____8964
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8965 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8966 = this;
  var bucket__8967 = this__8966.hashobj[cljs.core.hash.call(null, k)];
  var i__8968 = cljs.core.truth_(bucket__8967) ? cljs.core.scan_array.call(null, 2, k, bucket__8967) : null;
  if(cljs.core.truth_(i__8968)) {
    return bucket__8967[i__8968 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8969 = this;
  var h__8970 = cljs.core.hash.call(null, k);
  var bucket__8971 = this__8969.hashobj[h__8970];
  if(cljs.core.truth_(bucket__8971)) {
    var new_bucket__8972 = bucket__8971.slice();
    var new_hashobj__8973 = goog.object.clone(this__8969.hashobj);
    new_hashobj__8973[h__8970] = new_bucket__8972;
    var temp__3971__auto____8974 = cljs.core.scan_array.call(null, 2, k, new_bucket__8972);
    if(cljs.core.truth_(temp__3971__auto____8974)) {
      var i__8975 = temp__3971__auto____8974;
      new_bucket__8972[i__8975 + 1] = v;
      return new cljs.core.HashMap(this__8969.meta, this__8969.count, new_hashobj__8973, null)
    }else {
      new_bucket__8972.push(k, v);
      return new cljs.core.HashMap(this__8969.meta, this__8969.count + 1, new_hashobj__8973, null)
    }
  }else {
    var new_hashobj__8976 = goog.object.clone(this__8969.hashobj);
    new_hashobj__8976[h__8970] = [k, v];
    return new cljs.core.HashMap(this__8969.meta, this__8969.count + 1, new_hashobj__8976, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8977 = this;
  var bucket__8978 = this__8977.hashobj[cljs.core.hash.call(null, k)];
  var i__8979 = cljs.core.truth_(bucket__8978) ? cljs.core.scan_array.call(null, 2, k, bucket__8978) : null;
  if(cljs.core.truth_(i__8979)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__9004 = null;
  var G__9004__2 = function(this_sym8980, k) {
    var this__8982 = this;
    var this_sym8980__8983 = this;
    var coll__8984 = this_sym8980__8983;
    return coll__8984.cljs$core$ILookup$_lookup$arity$2(coll__8984, k)
  };
  var G__9004__3 = function(this_sym8981, k, not_found) {
    var this__8982 = this;
    var this_sym8981__8985 = this;
    var coll__8986 = this_sym8981__8985;
    return coll__8986.cljs$core$ILookup$_lookup$arity$3(coll__8986, k, not_found)
  };
  G__9004 = function(this_sym8981, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9004__2.call(this, this_sym8981, k);
      case 3:
        return G__9004__3.call(this, this_sym8981, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9004
}();
cljs.core.HashMap.prototype.apply = function(this_sym8960, args8961) {
  var this__8987 = this;
  return this_sym8960.call.apply(this_sym8960, [this_sym8960].concat(args8961.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8988 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8989 = this;
  var this__8990 = this;
  return cljs.core.pr_str.call(null, this__8990)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8991 = this;
  if(this__8991.count > 0) {
    var hashes__8992 = cljs.core.js_keys.call(null, this__8991.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8959_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8991.hashobj[p1__8959_SHARP_]))
    }, hashes__8992)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8993 = this;
  return this__8993.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8994 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8995 = this;
  return new cljs.core.HashMap(meta, this__8995.count, this__8995.hashobj, this__8995.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8996 = this;
  return this__8996.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8997 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8997.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8998 = this;
  var h__8999 = cljs.core.hash.call(null, k);
  var bucket__9000 = this__8998.hashobj[h__8999];
  var i__9001 = cljs.core.truth_(bucket__9000) ? cljs.core.scan_array.call(null, 2, k, bucket__9000) : null;
  if(cljs.core.not.call(null, i__9001)) {
    return coll
  }else {
    var new_hashobj__9002 = goog.object.clone(this__8998.hashobj);
    if(3 > bucket__9000.length) {
      cljs.core.js_delete.call(null, new_hashobj__9002, h__8999)
    }else {
      var new_bucket__9003 = bucket__9000.slice();
      new_bucket__9003.splice(i__9001, 2);
      new_hashobj__9002[h__8999] = new_bucket__9003
    }
    return new cljs.core.HashMap(this__8998.meta, this__8998.count - 1, new_hashobj__9002, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__9005 = ks.length;
  var i__9006 = 0;
  var out__9007 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__9006 < len__9005) {
      var G__9008 = i__9006 + 1;
      var G__9009 = cljs.core.assoc.call(null, out__9007, ks[i__9006], vs[i__9006]);
      i__9006 = G__9008;
      out__9007 = G__9009;
      continue
    }else {
      return out__9007
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__9013 = m.arr;
  var len__9014 = arr__9013.length;
  var i__9015 = 0;
  while(true) {
    if(len__9014 <= i__9015) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__9013[i__9015], k)) {
        return i__9015
      }else {
        if("\ufdd0'else") {
          var G__9016 = i__9015 + 2;
          i__9015 = G__9016;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9019 = this;
  return new cljs.core.TransientArrayMap({}, this__9019.arr.length, this__9019.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9020 = this;
  var h__2188__auto____9021 = this__9020.__hash;
  if(!(h__2188__auto____9021 == null)) {
    return h__2188__auto____9021
  }else {
    var h__2188__auto____9022 = cljs.core.hash_imap.call(null, coll);
    this__9020.__hash = h__2188__auto____9022;
    return h__2188__auto____9022
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9023 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9024 = this;
  var idx__9025 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9025 === -1) {
    return not_found
  }else {
    return this__9024.arr[idx__9025 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9026 = this;
  var idx__9027 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9027 === -1) {
    if(this__9026.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__9026.meta, this__9026.cnt + 1, function() {
        var G__9028__9029 = this__9026.arr.slice();
        G__9028__9029.push(k);
        G__9028__9029.push(v);
        return G__9028__9029
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__9026.arr[idx__9027 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__9026.meta, this__9026.cnt, function() {
          var G__9030__9031 = this__9026.arr.slice();
          G__9030__9031[idx__9027 + 1] = v;
          return G__9030__9031
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9032 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__9064 = null;
  var G__9064__2 = function(this_sym9033, k) {
    var this__9035 = this;
    var this_sym9033__9036 = this;
    var coll__9037 = this_sym9033__9036;
    return coll__9037.cljs$core$ILookup$_lookup$arity$2(coll__9037, k)
  };
  var G__9064__3 = function(this_sym9034, k, not_found) {
    var this__9035 = this;
    var this_sym9034__9038 = this;
    var coll__9039 = this_sym9034__9038;
    return coll__9039.cljs$core$ILookup$_lookup$arity$3(coll__9039, k, not_found)
  };
  G__9064 = function(this_sym9034, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9064__2.call(this, this_sym9034, k);
      case 3:
        return G__9064__3.call(this, this_sym9034, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9064
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym9017, args9018) {
  var this__9040 = this;
  return this_sym9017.call.apply(this_sym9017, [this_sym9017].concat(args9018.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9041 = this;
  var len__9042 = this__9041.arr.length;
  var i__9043 = 0;
  var init__9044 = init;
  while(true) {
    if(i__9043 < len__9042) {
      var init__9045 = f.call(null, init__9044, this__9041.arr[i__9043], this__9041.arr[i__9043 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__9045)) {
        return cljs.core.deref.call(null, init__9045)
      }else {
        var G__9065 = i__9043 + 2;
        var G__9066 = init__9045;
        i__9043 = G__9065;
        init__9044 = G__9066;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9046 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__9047 = this;
  var this__9048 = this;
  return cljs.core.pr_str.call(null, this__9048)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9049 = this;
  if(this__9049.cnt > 0) {
    var len__9050 = this__9049.arr.length;
    var array_map_seq__9051 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__9050) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__9049.arr[i], this__9049.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__9051.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9052 = this;
  return this__9052.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9053 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9054 = this;
  return new cljs.core.PersistentArrayMap(meta, this__9054.cnt, this__9054.arr, this__9054.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9055 = this;
  return this__9055.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9056 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__9056.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9057 = this;
  var idx__9058 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__9058 >= 0) {
    var len__9059 = this__9057.arr.length;
    var new_len__9060 = len__9059 - 2;
    if(new_len__9060 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__9061 = cljs.core.make_array.call(null, new_len__9060);
      var s__9062 = 0;
      var d__9063 = 0;
      while(true) {
        if(s__9062 >= len__9059) {
          return new cljs.core.PersistentArrayMap(this__9057.meta, this__9057.cnt - 1, new_arr__9061, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__9057.arr[s__9062])) {
            var G__9067 = s__9062 + 2;
            var G__9068 = d__9063;
            s__9062 = G__9067;
            d__9063 = G__9068;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__9061[d__9063] = this__9057.arr[s__9062];
              new_arr__9061[d__9063 + 1] = this__9057.arr[s__9062 + 1];
              var G__9069 = s__9062 + 2;
              var G__9070 = d__9063 + 2;
              s__9062 = G__9069;
              d__9063 = G__9070;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__9071 = cljs.core.count.call(null, ks);
  var i__9072 = 0;
  var out__9073 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__9072 < len__9071) {
      var G__9074 = i__9072 + 1;
      var G__9075 = cljs.core.assoc_BANG_.call(null, out__9073, ks[i__9072], vs[i__9072]);
      i__9072 = G__9074;
      out__9073 = G__9075;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9073)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9076 = this;
  if(cljs.core.truth_(this__9076.editable_QMARK_)) {
    var idx__9077 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9077 >= 0) {
      this__9076.arr[idx__9077] = this__9076.arr[this__9076.len - 2];
      this__9076.arr[idx__9077 + 1] = this__9076.arr[this__9076.len - 1];
      var G__9078__9079 = this__9076.arr;
      G__9078__9079.pop();
      G__9078__9079.pop();
      G__9078__9079;
      this__9076.len = this__9076.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9080 = this;
  if(cljs.core.truth_(this__9080.editable_QMARK_)) {
    var idx__9081 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__9081 === -1) {
      if(this__9080.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__9080.len = this__9080.len + 2;
        this__9080.arr.push(key);
        this__9080.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__9080.len, this__9080.arr), key, val)
      }
    }else {
      if(val === this__9080.arr[idx__9081 + 1]) {
        return tcoll
      }else {
        this__9080.arr[idx__9081 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9082 = this;
  if(cljs.core.truth_(this__9082.editable_QMARK_)) {
    if(function() {
      var G__9083__9084 = o;
      if(G__9083__9084) {
        if(function() {
          var or__3824__auto____9085 = G__9083__9084.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9085) {
            return or__3824__auto____9085
          }else {
            return G__9083__9084.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9083__9084.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9083__9084)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9083__9084)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9086 = cljs.core.seq.call(null, o);
      var tcoll__9087 = tcoll;
      while(true) {
        var temp__3971__auto____9088 = cljs.core.first.call(null, es__9086);
        if(cljs.core.truth_(temp__3971__auto____9088)) {
          var e__9089 = temp__3971__auto____9088;
          var G__9095 = cljs.core.next.call(null, es__9086);
          var G__9096 = tcoll__9087.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__9087, cljs.core.key.call(null, e__9089), cljs.core.val.call(null, e__9089));
          es__9086 = G__9095;
          tcoll__9087 = G__9096;
          continue
        }else {
          return tcoll__9087
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9090 = this;
  if(cljs.core.truth_(this__9090.editable_QMARK_)) {
    this__9090.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__9090.len, 2), this__9090.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9091 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9092 = this;
  if(cljs.core.truth_(this__9092.editable_QMARK_)) {
    var idx__9093 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__9093 === -1) {
      return not_found
    }else {
      return this__9092.arr[idx__9093 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9094 = this;
  if(cljs.core.truth_(this__9094.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__9094.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__9099 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__9100 = 0;
  while(true) {
    if(i__9100 < len) {
      var G__9101 = cljs.core.assoc_BANG_.call(null, out__9099, arr[i__9100], arr[i__9100 + 1]);
      var G__9102 = i__9100 + 2;
      out__9099 = G__9101;
      i__9100 = G__9102;
      continue
    }else {
      return out__9099
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2306__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__9107__9108 = arr.slice();
    G__9107__9108[i] = a;
    return G__9107__9108
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__9109__9110 = arr.slice();
    G__9109__9110[i] = a;
    G__9109__9110[j] = b;
    return G__9109__9110
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__9112 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__9112, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__9112, 2 * i, new_arr__9112.length - 2 * i);
  return new_arr__9112
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__9115 = inode.ensure_editable(edit);
    editable__9115.arr[i] = a;
    return editable__9115
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__9116 = inode.ensure_editable(edit);
    editable__9116.arr[i] = a;
    editable__9116.arr[j] = b;
    return editable__9116
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__9123 = arr.length;
  var i__9124 = 0;
  var init__9125 = init;
  while(true) {
    if(i__9124 < len__9123) {
      var init__9128 = function() {
        var k__9126 = arr[i__9124];
        if(!(k__9126 == null)) {
          return f.call(null, init__9125, k__9126, arr[i__9124 + 1])
        }else {
          var node__9127 = arr[i__9124 + 1];
          if(!(node__9127 == null)) {
            return node__9127.kv_reduce(f, init__9125)
          }else {
            return init__9125
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9128)) {
        return cljs.core.deref.call(null, init__9128)
      }else {
        var G__9129 = i__9124 + 2;
        var G__9130 = init__9128;
        i__9124 = G__9129;
        init__9125 = G__9130;
        continue
      }
    }else {
      return init__9125
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__9131 = this;
  var inode__9132 = this;
  if(this__9131.bitmap === bit) {
    return null
  }else {
    var editable__9133 = inode__9132.ensure_editable(e);
    var earr__9134 = editable__9133.arr;
    var len__9135 = earr__9134.length;
    editable__9133.bitmap = bit ^ editable__9133.bitmap;
    cljs.core.array_copy.call(null, earr__9134, 2 * (i + 1), earr__9134, 2 * i, len__9135 - 2 * (i + 1));
    earr__9134[len__9135 - 2] = null;
    earr__9134[len__9135 - 1] = null;
    return editable__9133
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9136 = this;
  var inode__9137 = this;
  var bit__9138 = 1 << (hash >>> shift & 31);
  var idx__9139 = cljs.core.bitmap_indexed_node_index.call(null, this__9136.bitmap, bit__9138);
  if((this__9136.bitmap & bit__9138) === 0) {
    var n__9140 = cljs.core.bit_count.call(null, this__9136.bitmap);
    if(2 * n__9140 < this__9136.arr.length) {
      var editable__9141 = inode__9137.ensure_editable(edit);
      var earr__9142 = editable__9141.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__9142, 2 * idx__9139, earr__9142, 2 * (idx__9139 + 1), 2 * (n__9140 - idx__9139));
      earr__9142[2 * idx__9139] = key;
      earr__9142[2 * idx__9139 + 1] = val;
      editable__9141.bitmap = editable__9141.bitmap | bit__9138;
      return editable__9141
    }else {
      if(n__9140 >= 16) {
        var nodes__9143 = cljs.core.make_array.call(null, 32);
        var jdx__9144 = hash >>> shift & 31;
        nodes__9143[jdx__9144] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__9145 = 0;
        var j__9146 = 0;
        while(true) {
          if(i__9145 < 32) {
            if((this__9136.bitmap >>> i__9145 & 1) === 0) {
              var G__9199 = i__9145 + 1;
              var G__9200 = j__9146;
              i__9145 = G__9199;
              j__9146 = G__9200;
              continue
            }else {
              nodes__9143[i__9145] = !(this__9136.arr[j__9146] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__9136.arr[j__9146]), this__9136.arr[j__9146], this__9136.arr[j__9146 + 1], added_leaf_QMARK_) : this__9136.arr[j__9146 + 1];
              var G__9201 = i__9145 + 1;
              var G__9202 = j__9146 + 2;
              i__9145 = G__9201;
              j__9146 = G__9202;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__9140 + 1, nodes__9143)
      }else {
        if("\ufdd0'else") {
          var new_arr__9147 = cljs.core.make_array.call(null, 2 * (n__9140 + 4));
          cljs.core.array_copy.call(null, this__9136.arr, 0, new_arr__9147, 0, 2 * idx__9139);
          new_arr__9147[2 * idx__9139] = key;
          new_arr__9147[2 * idx__9139 + 1] = val;
          cljs.core.array_copy.call(null, this__9136.arr, 2 * idx__9139, new_arr__9147, 2 * (idx__9139 + 1), 2 * (n__9140 - idx__9139));
          added_leaf_QMARK_.val = true;
          var editable__9148 = inode__9137.ensure_editable(edit);
          editable__9148.arr = new_arr__9147;
          editable__9148.bitmap = editable__9148.bitmap | bit__9138;
          return editable__9148
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__9149 = this__9136.arr[2 * idx__9139];
    var val_or_node__9150 = this__9136.arr[2 * idx__9139 + 1];
    if(key_or_nil__9149 == null) {
      var n__9151 = val_or_node__9150.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9151 === val_or_node__9150) {
        return inode__9137
      }else {
        return cljs.core.edit_and_set.call(null, inode__9137, edit, 2 * idx__9139 + 1, n__9151)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9149)) {
        if(val === val_or_node__9150) {
          return inode__9137
        }else {
          return cljs.core.edit_and_set.call(null, inode__9137, edit, 2 * idx__9139 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__9137, edit, 2 * idx__9139, null, 2 * idx__9139 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__9149, val_or_node__9150, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__9152 = this;
  var inode__9153 = this;
  return cljs.core.create_inode_seq.call(null, this__9152.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9154 = this;
  var inode__9155 = this;
  var bit__9156 = 1 << (hash >>> shift & 31);
  if((this__9154.bitmap & bit__9156) === 0) {
    return inode__9155
  }else {
    var idx__9157 = cljs.core.bitmap_indexed_node_index.call(null, this__9154.bitmap, bit__9156);
    var key_or_nil__9158 = this__9154.arr[2 * idx__9157];
    var val_or_node__9159 = this__9154.arr[2 * idx__9157 + 1];
    if(key_or_nil__9158 == null) {
      var n__9160 = val_or_node__9159.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__9160 === val_or_node__9159) {
        return inode__9155
      }else {
        if(!(n__9160 == null)) {
          return cljs.core.edit_and_set.call(null, inode__9155, edit, 2 * idx__9157 + 1, n__9160)
        }else {
          if(this__9154.bitmap === bit__9156) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__9155.edit_and_remove_pair(edit, bit__9156, idx__9157)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9158)) {
        removed_leaf_QMARK_[0] = true;
        return inode__9155.edit_and_remove_pair(edit, bit__9156, idx__9157)
      }else {
        if("\ufdd0'else") {
          return inode__9155
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__9161 = this;
  var inode__9162 = this;
  if(e === this__9161.edit) {
    return inode__9162
  }else {
    var n__9163 = cljs.core.bit_count.call(null, this__9161.bitmap);
    var new_arr__9164 = cljs.core.make_array.call(null, n__9163 < 0 ? 4 : 2 * (n__9163 + 1));
    cljs.core.array_copy.call(null, this__9161.arr, 0, new_arr__9164, 0, 2 * n__9163);
    return new cljs.core.BitmapIndexedNode(e, this__9161.bitmap, new_arr__9164)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__9165 = this;
  var inode__9166 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9165.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9167 = this;
  var inode__9168 = this;
  var bit__9169 = 1 << (hash >>> shift & 31);
  if((this__9167.bitmap & bit__9169) === 0) {
    return not_found
  }else {
    var idx__9170 = cljs.core.bitmap_indexed_node_index.call(null, this__9167.bitmap, bit__9169);
    var key_or_nil__9171 = this__9167.arr[2 * idx__9170];
    var val_or_node__9172 = this__9167.arr[2 * idx__9170 + 1];
    if(key_or_nil__9171 == null) {
      return val_or_node__9172.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9171)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__9171, val_or_node__9172], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__9173 = this;
  var inode__9174 = this;
  var bit__9175 = 1 << (hash >>> shift & 31);
  if((this__9173.bitmap & bit__9175) === 0) {
    return inode__9174
  }else {
    var idx__9176 = cljs.core.bitmap_indexed_node_index.call(null, this__9173.bitmap, bit__9175);
    var key_or_nil__9177 = this__9173.arr[2 * idx__9176];
    var val_or_node__9178 = this__9173.arr[2 * idx__9176 + 1];
    if(key_or_nil__9177 == null) {
      var n__9179 = val_or_node__9178.inode_without(shift + 5, hash, key);
      if(n__9179 === val_or_node__9178) {
        return inode__9174
      }else {
        if(!(n__9179 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__9173.bitmap, cljs.core.clone_and_set.call(null, this__9173.arr, 2 * idx__9176 + 1, n__9179))
        }else {
          if(this__9173.bitmap === bit__9175) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__9173.bitmap ^ bit__9175, cljs.core.remove_pair.call(null, this__9173.arr, idx__9176))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9177)) {
        return new cljs.core.BitmapIndexedNode(null, this__9173.bitmap ^ bit__9175, cljs.core.remove_pair.call(null, this__9173.arr, idx__9176))
      }else {
        if("\ufdd0'else") {
          return inode__9174
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9180 = this;
  var inode__9181 = this;
  var bit__9182 = 1 << (hash >>> shift & 31);
  var idx__9183 = cljs.core.bitmap_indexed_node_index.call(null, this__9180.bitmap, bit__9182);
  if((this__9180.bitmap & bit__9182) === 0) {
    var n__9184 = cljs.core.bit_count.call(null, this__9180.bitmap);
    if(n__9184 >= 16) {
      var nodes__9185 = cljs.core.make_array.call(null, 32);
      var jdx__9186 = hash >>> shift & 31;
      nodes__9185[jdx__9186] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__9187 = 0;
      var j__9188 = 0;
      while(true) {
        if(i__9187 < 32) {
          if((this__9180.bitmap >>> i__9187 & 1) === 0) {
            var G__9203 = i__9187 + 1;
            var G__9204 = j__9188;
            i__9187 = G__9203;
            j__9188 = G__9204;
            continue
          }else {
            nodes__9185[i__9187] = !(this__9180.arr[j__9188] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__9180.arr[j__9188]), this__9180.arr[j__9188], this__9180.arr[j__9188 + 1], added_leaf_QMARK_) : this__9180.arr[j__9188 + 1];
            var G__9205 = i__9187 + 1;
            var G__9206 = j__9188 + 2;
            i__9187 = G__9205;
            j__9188 = G__9206;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__9184 + 1, nodes__9185)
    }else {
      var new_arr__9189 = cljs.core.make_array.call(null, 2 * (n__9184 + 1));
      cljs.core.array_copy.call(null, this__9180.arr, 0, new_arr__9189, 0, 2 * idx__9183);
      new_arr__9189[2 * idx__9183] = key;
      new_arr__9189[2 * idx__9183 + 1] = val;
      cljs.core.array_copy.call(null, this__9180.arr, 2 * idx__9183, new_arr__9189, 2 * (idx__9183 + 1), 2 * (n__9184 - idx__9183));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__9180.bitmap | bit__9182, new_arr__9189)
    }
  }else {
    var key_or_nil__9190 = this__9180.arr[2 * idx__9183];
    var val_or_node__9191 = this__9180.arr[2 * idx__9183 + 1];
    if(key_or_nil__9190 == null) {
      var n__9192 = val_or_node__9191.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__9192 === val_or_node__9191) {
        return inode__9181
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__9180.bitmap, cljs.core.clone_and_set.call(null, this__9180.arr, 2 * idx__9183 + 1, n__9192))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9190)) {
        if(val === val_or_node__9191) {
          return inode__9181
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__9180.bitmap, cljs.core.clone_and_set.call(null, this__9180.arr, 2 * idx__9183 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__9180.bitmap, cljs.core.clone_and_set.call(null, this__9180.arr, 2 * idx__9183, null, 2 * idx__9183 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__9190, val_or_node__9191, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9193 = this;
  var inode__9194 = this;
  var bit__9195 = 1 << (hash >>> shift & 31);
  if((this__9193.bitmap & bit__9195) === 0) {
    return not_found
  }else {
    var idx__9196 = cljs.core.bitmap_indexed_node_index.call(null, this__9193.bitmap, bit__9195);
    var key_or_nil__9197 = this__9193.arr[2 * idx__9196];
    var val_or_node__9198 = this__9193.arr[2 * idx__9196 + 1];
    if(key_or_nil__9197 == null) {
      return val_or_node__9198.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__9197)) {
        return val_or_node__9198
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__9214 = array_node.arr;
  var len__9215 = 2 * (array_node.cnt - 1);
  var new_arr__9216 = cljs.core.make_array.call(null, len__9215);
  var i__9217 = 0;
  var j__9218 = 1;
  var bitmap__9219 = 0;
  while(true) {
    if(i__9217 < len__9215) {
      if(function() {
        var and__3822__auto____9220 = !(i__9217 === idx);
        if(and__3822__auto____9220) {
          return!(arr__9214[i__9217] == null)
        }else {
          return and__3822__auto____9220
        }
      }()) {
        new_arr__9216[j__9218] = arr__9214[i__9217];
        var G__9221 = i__9217 + 1;
        var G__9222 = j__9218 + 2;
        var G__9223 = bitmap__9219 | 1 << i__9217;
        i__9217 = G__9221;
        j__9218 = G__9222;
        bitmap__9219 = G__9223;
        continue
      }else {
        var G__9224 = i__9217 + 1;
        var G__9225 = j__9218;
        var G__9226 = bitmap__9219;
        i__9217 = G__9224;
        j__9218 = G__9225;
        bitmap__9219 = G__9226;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__9219, new_arr__9216)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9227 = this;
  var inode__9228 = this;
  var idx__9229 = hash >>> shift & 31;
  var node__9230 = this__9227.arr[idx__9229];
  if(node__9230 == null) {
    var editable__9231 = cljs.core.edit_and_set.call(null, inode__9228, edit, idx__9229, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__9231.cnt = editable__9231.cnt + 1;
    return editable__9231
  }else {
    var n__9232 = node__9230.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9232 === node__9230) {
      return inode__9228
    }else {
      return cljs.core.edit_and_set.call(null, inode__9228, edit, idx__9229, n__9232)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__9233 = this;
  var inode__9234 = this;
  return cljs.core.create_array_node_seq.call(null, this__9233.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9235 = this;
  var inode__9236 = this;
  var idx__9237 = hash >>> shift & 31;
  var node__9238 = this__9235.arr[idx__9237];
  if(node__9238 == null) {
    return inode__9236
  }else {
    var n__9239 = node__9238.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__9239 === node__9238) {
      return inode__9236
    }else {
      if(n__9239 == null) {
        if(this__9235.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9236, edit, idx__9237)
        }else {
          var editable__9240 = cljs.core.edit_and_set.call(null, inode__9236, edit, idx__9237, n__9239);
          editable__9240.cnt = editable__9240.cnt - 1;
          return editable__9240
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__9236, edit, idx__9237, n__9239)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__9241 = this;
  var inode__9242 = this;
  if(e === this__9241.edit) {
    return inode__9242
  }else {
    return new cljs.core.ArrayNode(e, this__9241.cnt, this__9241.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__9243 = this;
  var inode__9244 = this;
  var len__9245 = this__9243.arr.length;
  var i__9246 = 0;
  var init__9247 = init;
  while(true) {
    if(i__9246 < len__9245) {
      var node__9248 = this__9243.arr[i__9246];
      if(!(node__9248 == null)) {
        var init__9249 = node__9248.kv_reduce(f, init__9247);
        if(cljs.core.reduced_QMARK_.call(null, init__9249)) {
          return cljs.core.deref.call(null, init__9249)
        }else {
          var G__9268 = i__9246 + 1;
          var G__9269 = init__9249;
          i__9246 = G__9268;
          init__9247 = G__9269;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__9247
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9250 = this;
  var inode__9251 = this;
  var idx__9252 = hash >>> shift & 31;
  var node__9253 = this__9250.arr[idx__9252];
  if(!(node__9253 == null)) {
    return node__9253.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__9254 = this;
  var inode__9255 = this;
  var idx__9256 = hash >>> shift & 31;
  var node__9257 = this__9254.arr[idx__9256];
  if(!(node__9257 == null)) {
    var n__9258 = node__9257.inode_without(shift + 5, hash, key);
    if(n__9258 === node__9257) {
      return inode__9255
    }else {
      if(n__9258 == null) {
        if(this__9254.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__9255, null, idx__9256)
        }else {
          return new cljs.core.ArrayNode(null, this__9254.cnt - 1, cljs.core.clone_and_set.call(null, this__9254.arr, idx__9256, n__9258))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__9254.cnt, cljs.core.clone_and_set.call(null, this__9254.arr, idx__9256, n__9258))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__9255
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9259 = this;
  var inode__9260 = this;
  var idx__9261 = hash >>> shift & 31;
  var node__9262 = this__9259.arr[idx__9261];
  if(node__9262 == null) {
    return new cljs.core.ArrayNode(null, this__9259.cnt + 1, cljs.core.clone_and_set.call(null, this__9259.arr, idx__9261, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__9263 = node__9262.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__9263 === node__9262) {
      return inode__9260
    }else {
      return new cljs.core.ArrayNode(null, this__9259.cnt, cljs.core.clone_and_set.call(null, this__9259.arr, idx__9261, n__9263))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9264 = this;
  var inode__9265 = this;
  var idx__9266 = hash >>> shift & 31;
  var node__9267 = this__9264.arr[idx__9266];
  if(!(node__9267 == null)) {
    return node__9267.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__9272 = 2 * cnt;
  var i__9273 = 0;
  while(true) {
    if(i__9273 < lim__9272) {
      if(cljs.core.key_test.call(null, key, arr[i__9273])) {
        return i__9273
      }else {
        var G__9274 = i__9273 + 2;
        i__9273 = G__9274;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__9275 = this;
  var inode__9276 = this;
  if(hash === this__9275.collision_hash) {
    var idx__9277 = cljs.core.hash_collision_node_find_index.call(null, this__9275.arr, this__9275.cnt, key);
    if(idx__9277 === -1) {
      if(this__9275.arr.length > 2 * this__9275.cnt) {
        var editable__9278 = cljs.core.edit_and_set.call(null, inode__9276, edit, 2 * this__9275.cnt, key, 2 * this__9275.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__9278.cnt = editable__9278.cnt + 1;
        return editable__9278
      }else {
        var len__9279 = this__9275.arr.length;
        var new_arr__9280 = cljs.core.make_array.call(null, len__9279 + 2);
        cljs.core.array_copy.call(null, this__9275.arr, 0, new_arr__9280, 0, len__9279);
        new_arr__9280[len__9279] = key;
        new_arr__9280[len__9279 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__9276.ensure_editable_array(edit, this__9275.cnt + 1, new_arr__9280)
      }
    }else {
      if(this__9275.arr[idx__9277 + 1] === val) {
        return inode__9276
      }else {
        return cljs.core.edit_and_set.call(null, inode__9276, edit, idx__9277 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__9275.collision_hash >>> shift & 31), [null, inode__9276, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__9281 = this;
  var inode__9282 = this;
  return cljs.core.create_inode_seq.call(null, this__9281.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__9283 = this;
  var inode__9284 = this;
  var idx__9285 = cljs.core.hash_collision_node_find_index.call(null, this__9283.arr, this__9283.cnt, key);
  if(idx__9285 === -1) {
    return inode__9284
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__9283.cnt === 1) {
      return null
    }else {
      var editable__9286 = inode__9284.ensure_editable(edit);
      var earr__9287 = editable__9286.arr;
      earr__9287[idx__9285] = earr__9287[2 * this__9283.cnt - 2];
      earr__9287[idx__9285 + 1] = earr__9287[2 * this__9283.cnt - 1];
      earr__9287[2 * this__9283.cnt - 1] = null;
      earr__9287[2 * this__9283.cnt - 2] = null;
      editable__9286.cnt = editable__9286.cnt - 1;
      return editable__9286
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__9288 = this;
  var inode__9289 = this;
  if(e === this__9288.edit) {
    return inode__9289
  }else {
    var new_arr__9290 = cljs.core.make_array.call(null, 2 * (this__9288.cnt + 1));
    cljs.core.array_copy.call(null, this__9288.arr, 0, new_arr__9290, 0, 2 * this__9288.cnt);
    return new cljs.core.HashCollisionNode(e, this__9288.collision_hash, this__9288.cnt, new_arr__9290)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__9291 = this;
  var inode__9292 = this;
  return cljs.core.inode_kv_reduce.call(null, this__9291.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__9293 = this;
  var inode__9294 = this;
  var idx__9295 = cljs.core.hash_collision_node_find_index.call(null, this__9293.arr, this__9293.cnt, key);
  if(idx__9295 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9293.arr[idx__9295])) {
      return cljs.core.PersistentVector.fromArray([this__9293.arr[idx__9295], this__9293.arr[idx__9295 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__9296 = this;
  var inode__9297 = this;
  var idx__9298 = cljs.core.hash_collision_node_find_index.call(null, this__9296.arr, this__9296.cnt, key);
  if(idx__9298 === -1) {
    return inode__9297
  }else {
    if(this__9296.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__9296.collision_hash, this__9296.cnt - 1, cljs.core.remove_pair.call(null, this__9296.arr, cljs.core.quot.call(null, idx__9298, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__9299 = this;
  var inode__9300 = this;
  if(hash === this__9299.collision_hash) {
    var idx__9301 = cljs.core.hash_collision_node_find_index.call(null, this__9299.arr, this__9299.cnt, key);
    if(idx__9301 === -1) {
      var len__9302 = this__9299.arr.length;
      var new_arr__9303 = cljs.core.make_array.call(null, len__9302 + 2);
      cljs.core.array_copy.call(null, this__9299.arr, 0, new_arr__9303, 0, len__9302);
      new_arr__9303[len__9302] = key;
      new_arr__9303[len__9302 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__9299.collision_hash, this__9299.cnt + 1, new_arr__9303)
    }else {
      if(cljs.core._EQ_.call(null, this__9299.arr[idx__9301], val)) {
        return inode__9300
      }else {
        return new cljs.core.HashCollisionNode(null, this__9299.collision_hash, this__9299.cnt, cljs.core.clone_and_set.call(null, this__9299.arr, idx__9301 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__9299.collision_hash >>> shift & 31), [null, inode__9300])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__9304 = this;
  var inode__9305 = this;
  var idx__9306 = cljs.core.hash_collision_node_find_index.call(null, this__9304.arr, this__9304.cnt, key);
  if(idx__9306 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__9304.arr[idx__9306])) {
      return this__9304.arr[idx__9306 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__9307 = this;
  var inode__9308 = this;
  if(e === this__9307.edit) {
    this__9307.arr = array;
    this__9307.cnt = count;
    return inode__9308
  }else {
    return new cljs.core.HashCollisionNode(this__9307.edit, this__9307.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9313 = cljs.core.hash.call(null, key1);
    if(key1hash__9313 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9313, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9314 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__9313, key1, val1, added_leaf_QMARK___9314).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___9314)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__9315 = cljs.core.hash.call(null, key1);
    if(key1hash__9315 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__9315, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___9316 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__9315, key1, val1, added_leaf_QMARK___9316).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___9316)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9317 = this;
  var h__2188__auto____9318 = this__9317.__hash;
  if(!(h__2188__auto____9318 == null)) {
    return h__2188__auto____9318
  }else {
    var h__2188__auto____9319 = cljs.core.hash_coll.call(null, coll);
    this__9317.__hash = h__2188__auto____9319;
    return h__2188__auto____9319
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9320 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__9321 = this;
  var this__9322 = this;
  return cljs.core.pr_str.call(null, this__9322)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9323 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9324 = this;
  if(this__9324.s == null) {
    return cljs.core.PersistentVector.fromArray([this__9324.nodes[this__9324.i], this__9324.nodes[this__9324.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__9324.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9325 = this;
  if(this__9325.s == null) {
    return cljs.core.create_inode_seq.call(null, this__9325.nodes, this__9325.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__9325.nodes, this__9325.i, cljs.core.next.call(null, this__9325.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9326 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9327 = this;
  return new cljs.core.NodeSeq(meta, this__9327.nodes, this__9327.i, this__9327.s, this__9327.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9328 = this;
  return this__9328.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9329 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9329.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__9336 = nodes.length;
      var j__9337 = i;
      while(true) {
        if(j__9337 < len__9336) {
          if(!(nodes[j__9337] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__9337, null, null)
          }else {
            var temp__3971__auto____9338 = nodes[j__9337 + 1];
            if(cljs.core.truth_(temp__3971__auto____9338)) {
              var node__9339 = temp__3971__auto____9338;
              var temp__3971__auto____9340 = node__9339.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____9340)) {
                var node_seq__9341 = temp__3971__auto____9340;
                return new cljs.core.NodeSeq(null, nodes, j__9337 + 2, node_seq__9341, null)
              }else {
                var G__9342 = j__9337 + 2;
                j__9337 = G__9342;
                continue
              }
            }else {
              var G__9343 = j__9337 + 2;
              j__9337 = G__9343;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9344 = this;
  var h__2188__auto____9345 = this__9344.__hash;
  if(!(h__2188__auto____9345 == null)) {
    return h__2188__auto____9345
  }else {
    var h__2188__auto____9346 = cljs.core.hash_coll.call(null, coll);
    this__9344.__hash = h__2188__auto____9346;
    return h__2188__auto____9346
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9347 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__9348 = this;
  var this__9349 = this;
  return cljs.core.pr_str.call(null, this__9349)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9350 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9351 = this;
  return cljs.core.first.call(null, this__9351.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9352 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__9352.nodes, this__9352.i, cljs.core.next.call(null, this__9352.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9353 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9354 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__9354.nodes, this__9354.i, this__9354.s, this__9354.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9355 = this;
  return this__9355.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9356 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9356.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__9363 = nodes.length;
      var j__9364 = i;
      while(true) {
        if(j__9364 < len__9363) {
          var temp__3971__auto____9365 = nodes[j__9364];
          if(cljs.core.truth_(temp__3971__auto____9365)) {
            var nj__9366 = temp__3971__auto____9365;
            var temp__3971__auto____9367 = nj__9366.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____9367)) {
              var ns__9368 = temp__3971__auto____9367;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__9364 + 1, ns__9368, null)
            }else {
              var G__9369 = j__9364 + 1;
              j__9364 = G__9369;
              continue
            }
          }else {
            var G__9370 = j__9364 + 1;
            j__9364 = G__9370;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9373 = this;
  return new cljs.core.TransientHashMap({}, this__9373.root, this__9373.cnt, this__9373.has_nil_QMARK_, this__9373.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9374 = this;
  var h__2188__auto____9375 = this__9374.__hash;
  if(!(h__2188__auto____9375 == null)) {
    return h__2188__auto____9375
  }else {
    var h__2188__auto____9376 = cljs.core.hash_imap.call(null, coll);
    this__9374.__hash = h__2188__auto____9376;
    return h__2188__auto____9376
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9377 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9378 = this;
  if(k == null) {
    if(this__9378.has_nil_QMARK_) {
      return this__9378.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9378.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__9378.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9379 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____9380 = this__9379.has_nil_QMARK_;
      if(and__3822__auto____9380) {
        return v === this__9379.nil_val
      }else {
        return and__3822__auto____9380
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9379.meta, this__9379.has_nil_QMARK_ ? this__9379.cnt : this__9379.cnt + 1, this__9379.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___9381 = new cljs.core.Box(false);
    var new_root__9382 = (this__9379.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9379.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9381);
    if(new_root__9382 === this__9379.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__9379.meta, added_leaf_QMARK___9381.val ? this__9379.cnt + 1 : this__9379.cnt, new_root__9382, this__9379.has_nil_QMARK_, this__9379.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9383 = this;
  if(k == null) {
    return this__9383.has_nil_QMARK_
  }else {
    if(this__9383.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__9383.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__9406 = null;
  var G__9406__2 = function(this_sym9384, k) {
    var this__9386 = this;
    var this_sym9384__9387 = this;
    var coll__9388 = this_sym9384__9387;
    return coll__9388.cljs$core$ILookup$_lookup$arity$2(coll__9388, k)
  };
  var G__9406__3 = function(this_sym9385, k, not_found) {
    var this__9386 = this;
    var this_sym9385__9389 = this;
    var coll__9390 = this_sym9385__9389;
    return coll__9390.cljs$core$ILookup$_lookup$arity$3(coll__9390, k, not_found)
  };
  G__9406 = function(this_sym9385, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9406__2.call(this, this_sym9385, k);
      case 3:
        return G__9406__3.call(this, this_sym9385, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9406
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym9371, args9372) {
  var this__9391 = this;
  return this_sym9371.call.apply(this_sym9371, [this_sym9371].concat(args9372.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9392 = this;
  var init__9393 = this__9392.has_nil_QMARK_ ? f.call(null, init, null, this__9392.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__9393)) {
    return cljs.core.deref.call(null, init__9393)
  }else {
    if(!(this__9392.root == null)) {
      return this__9392.root.kv_reduce(f, init__9393)
    }else {
      if("\ufdd0'else") {
        return init__9393
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9394 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__9395 = this;
  var this__9396 = this;
  return cljs.core.pr_str.call(null, this__9396)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9397 = this;
  if(this__9397.cnt > 0) {
    var s__9398 = !(this__9397.root == null) ? this__9397.root.inode_seq() : null;
    if(this__9397.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__9397.nil_val], true), s__9398)
    }else {
      return s__9398
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9399 = this;
  return this__9399.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9400 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9401 = this;
  return new cljs.core.PersistentHashMap(meta, this__9401.cnt, this__9401.root, this__9401.has_nil_QMARK_, this__9401.nil_val, this__9401.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9402 = this;
  return this__9402.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9403 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__9403.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9404 = this;
  if(k == null) {
    if(this__9404.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__9404.meta, this__9404.cnt - 1, this__9404.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__9404.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__9405 = this__9404.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__9405 === this__9404.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__9404.meta, this__9404.cnt - 1, new_root__9405, this__9404.has_nil_QMARK_, this__9404.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__9407 = ks.length;
  var i__9408 = 0;
  var out__9409 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__9408 < len__9407) {
      var G__9410 = i__9408 + 1;
      var G__9411 = cljs.core.assoc_BANG_.call(null, out__9409, ks[i__9408], vs[i__9408]);
      i__9408 = G__9410;
      out__9409 = G__9411;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9409)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__9412 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9413 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__9414 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9415 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__9416 = this;
  if(k == null) {
    if(this__9416.has_nil_QMARK_) {
      return this__9416.nil_val
    }else {
      return null
    }
  }else {
    if(this__9416.root == null) {
      return null
    }else {
      return this__9416.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__9417 = this;
  if(k == null) {
    if(this__9417.has_nil_QMARK_) {
      return this__9417.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__9417.root == null) {
      return not_found
    }else {
      return this__9417.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9418 = this;
  if(this__9418.edit) {
    return this__9418.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__9419 = this;
  var tcoll__9420 = this;
  if(this__9419.edit) {
    if(function() {
      var G__9421__9422 = o;
      if(G__9421__9422) {
        if(function() {
          var or__3824__auto____9423 = G__9421__9422.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____9423) {
            return or__3824__auto____9423
          }else {
            return G__9421__9422.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__9421__9422.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9421__9422)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__9421__9422)
      }
    }()) {
      return tcoll__9420.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__9424 = cljs.core.seq.call(null, o);
      var tcoll__9425 = tcoll__9420;
      while(true) {
        var temp__3971__auto____9426 = cljs.core.first.call(null, es__9424);
        if(cljs.core.truth_(temp__3971__auto____9426)) {
          var e__9427 = temp__3971__auto____9426;
          var G__9438 = cljs.core.next.call(null, es__9424);
          var G__9439 = tcoll__9425.assoc_BANG_(cljs.core.key.call(null, e__9427), cljs.core.val.call(null, e__9427));
          es__9424 = G__9438;
          tcoll__9425 = G__9439;
          continue
        }else {
          return tcoll__9425
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__9428 = this;
  var tcoll__9429 = this;
  if(this__9428.edit) {
    if(k == null) {
      if(this__9428.nil_val === v) {
      }else {
        this__9428.nil_val = v
      }
      if(this__9428.has_nil_QMARK_) {
      }else {
        this__9428.count = this__9428.count + 1;
        this__9428.has_nil_QMARK_ = true
      }
      return tcoll__9429
    }else {
      var added_leaf_QMARK___9430 = new cljs.core.Box(false);
      var node__9431 = (this__9428.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__9428.root).inode_assoc_BANG_(this__9428.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___9430);
      if(node__9431 === this__9428.root) {
      }else {
        this__9428.root = node__9431
      }
      if(added_leaf_QMARK___9430.val) {
        this__9428.count = this__9428.count + 1
      }else {
      }
      return tcoll__9429
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__9432 = this;
  var tcoll__9433 = this;
  if(this__9432.edit) {
    if(k == null) {
      if(this__9432.has_nil_QMARK_) {
        this__9432.has_nil_QMARK_ = false;
        this__9432.nil_val = null;
        this__9432.count = this__9432.count - 1;
        return tcoll__9433
      }else {
        return tcoll__9433
      }
    }else {
      if(this__9432.root == null) {
        return tcoll__9433
      }else {
        var removed_leaf_QMARK___9434 = new cljs.core.Box(false);
        var node__9435 = this__9432.root.inode_without_BANG_(this__9432.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___9434);
        if(node__9435 === this__9432.root) {
        }else {
          this__9432.root = node__9435
        }
        if(cljs.core.truth_(removed_leaf_QMARK___9434[0])) {
          this__9432.count = this__9432.count - 1
        }else {
        }
        return tcoll__9433
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__9436 = this;
  var tcoll__9437 = this;
  if(this__9436.edit) {
    this__9436.edit = null;
    return new cljs.core.PersistentHashMap(null, this__9436.count, this__9436.root, this__9436.has_nil_QMARK_, this__9436.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__9442 = node;
  var stack__9443 = stack;
  while(true) {
    if(!(t__9442 == null)) {
      var G__9444 = ascending_QMARK_ ? t__9442.left : t__9442.right;
      var G__9445 = cljs.core.conj.call(null, stack__9443, t__9442);
      t__9442 = G__9444;
      stack__9443 = G__9445;
      continue
    }else {
      return stack__9443
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9446 = this;
  var h__2188__auto____9447 = this__9446.__hash;
  if(!(h__2188__auto____9447 == null)) {
    return h__2188__auto____9447
  }else {
    var h__2188__auto____9448 = cljs.core.hash_coll.call(null, coll);
    this__9446.__hash = h__2188__auto____9448;
    return h__2188__auto____9448
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9449 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__9450 = this;
  var this__9451 = this;
  return cljs.core.pr_str.call(null, this__9451)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9452 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9453 = this;
  if(this__9453.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9453.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9454 = this;
  return cljs.core.peek.call(null, this__9454.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9455 = this;
  var t__9456 = cljs.core.first.call(null, this__9455.stack);
  var next_stack__9457 = cljs.core.tree_map_seq_push.call(null, this__9455.ascending_QMARK_ ? t__9456.right : t__9456.left, cljs.core.next.call(null, this__9455.stack), this__9455.ascending_QMARK_);
  if(!(next_stack__9457 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9457, this__9455.ascending_QMARK_, this__9455.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9458 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9459 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9459.stack, this__9459.ascending_QMARK_, this__9459.cnt, this__9459.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9460 = this;
  return this__9460.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____9462 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____9462) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____9462
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____9464 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____9464) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____9464
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9468 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9468)) {
    return cljs.core.deref.call(null, init__9468)
  }else {
    var init__9469 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9468) : init__9468;
    if(cljs.core.reduced_QMARK_.call(null, init__9469)) {
      return cljs.core.deref.call(null, init__9469)
    }else {
      var init__9470 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9469) : init__9469;
      if(cljs.core.reduced_QMARK_.call(null, init__9470)) {
        return cljs.core.deref.call(null, init__9470)
      }else {
        return init__9470
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9473 = this;
  var h__2188__auto____9474 = this__9473.__hash;
  if(!(h__2188__auto____9474 == null)) {
    return h__2188__auto____9474
  }else {
    var h__2188__auto____9475 = cljs.core.hash_coll.call(null, coll);
    this__9473.__hash = h__2188__auto____9475;
    return h__2188__auto____9475
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9476 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9477 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9478 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9478.key, this__9478.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9526 = null;
  var G__9526__2 = function(this_sym9479, k) {
    var this__9481 = this;
    var this_sym9479__9482 = this;
    var node__9483 = this_sym9479__9482;
    return node__9483.cljs$core$ILookup$_lookup$arity$2(node__9483, k)
  };
  var G__9526__3 = function(this_sym9480, k, not_found) {
    var this__9481 = this;
    var this_sym9480__9484 = this;
    var node__9485 = this_sym9480__9484;
    return node__9485.cljs$core$ILookup$_lookup$arity$3(node__9485, k, not_found)
  };
  G__9526 = function(this_sym9480, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9526__2.call(this, this_sym9480, k);
      case 3:
        return G__9526__3.call(this, this_sym9480, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9526
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9471, args9472) {
  var this__9486 = this;
  return this_sym9471.call.apply(this_sym9471, [this_sym9471].concat(args9472.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9487 = this;
  return cljs.core.PersistentVector.fromArray([this__9487.key, this__9487.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9488 = this;
  return this__9488.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9489 = this;
  return this__9489.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9490 = this;
  var node__9491 = this;
  return ins.balance_right(node__9491)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9492 = this;
  var node__9493 = this;
  return new cljs.core.RedNode(this__9492.key, this__9492.val, this__9492.left, this__9492.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9494 = this;
  var node__9495 = this;
  return cljs.core.balance_right_del.call(null, this__9494.key, this__9494.val, this__9494.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9496 = this;
  var node__9497 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9498 = this;
  var node__9499 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9499, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9500 = this;
  var node__9501 = this;
  return cljs.core.balance_left_del.call(null, this__9500.key, this__9500.val, del, this__9500.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9502 = this;
  var node__9503 = this;
  return ins.balance_left(node__9503)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9504 = this;
  var node__9505 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9505, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9527 = null;
  var G__9527__0 = function() {
    var this__9506 = this;
    var this__9508 = this;
    return cljs.core.pr_str.call(null, this__9508)
  };
  G__9527 = function() {
    switch(arguments.length) {
      case 0:
        return G__9527__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9527
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9509 = this;
  var node__9510 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9510, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9511 = this;
  var node__9512 = this;
  return node__9512
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9513 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9514 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9515 = this;
  return cljs.core.list.call(null, this__9515.key, this__9515.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9516 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9517 = this;
  return this__9517.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9518 = this;
  return cljs.core.PersistentVector.fromArray([this__9518.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9519 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9519.key, this__9519.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9520 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9521 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9521.key, this__9521.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9522 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9523 = this;
  if(n === 0) {
    return this__9523.key
  }else {
    if(n === 1) {
      return this__9523.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9524 = this;
  if(n === 0) {
    return this__9524.key
  }else {
    if(n === 1) {
      return this__9524.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9525 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9530 = this;
  var h__2188__auto____9531 = this__9530.__hash;
  if(!(h__2188__auto____9531 == null)) {
    return h__2188__auto____9531
  }else {
    var h__2188__auto____9532 = cljs.core.hash_coll.call(null, coll);
    this__9530.__hash = h__2188__auto____9532;
    return h__2188__auto____9532
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9533 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9534 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9535 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9535.key, this__9535.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9583 = null;
  var G__9583__2 = function(this_sym9536, k) {
    var this__9538 = this;
    var this_sym9536__9539 = this;
    var node__9540 = this_sym9536__9539;
    return node__9540.cljs$core$ILookup$_lookup$arity$2(node__9540, k)
  };
  var G__9583__3 = function(this_sym9537, k, not_found) {
    var this__9538 = this;
    var this_sym9537__9541 = this;
    var node__9542 = this_sym9537__9541;
    return node__9542.cljs$core$ILookup$_lookup$arity$3(node__9542, k, not_found)
  };
  G__9583 = function(this_sym9537, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9583__2.call(this, this_sym9537, k);
      case 3:
        return G__9583__3.call(this, this_sym9537, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9583
}();
cljs.core.RedNode.prototype.apply = function(this_sym9528, args9529) {
  var this__9543 = this;
  return this_sym9528.call.apply(this_sym9528, [this_sym9528].concat(args9529.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9544 = this;
  return cljs.core.PersistentVector.fromArray([this__9544.key, this__9544.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9545 = this;
  return this__9545.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9546 = this;
  return this__9546.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9547 = this;
  var node__9548 = this;
  return new cljs.core.RedNode(this__9547.key, this__9547.val, this__9547.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9549 = this;
  var node__9550 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9551 = this;
  var node__9552 = this;
  return new cljs.core.RedNode(this__9551.key, this__9551.val, this__9551.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9553 = this;
  var node__9554 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9555 = this;
  var node__9556 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9556, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9557 = this;
  var node__9558 = this;
  return new cljs.core.RedNode(this__9557.key, this__9557.val, del, this__9557.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9559 = this;
  var node__9560 = this;
  return new cljs.core.RedNode(this__9559.key, this__9559.val, ins, this__9559.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9561 = this;
  var node__9562 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9561.left)) {
    return new cljs.core.RedNode(this__9561.key, this__9561.val, this__9561.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9561.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9561.right)) {
      return new cljs.core.RedNode(this__9561.right.key, this__9561.right.val, new cljs.core.BlackNode(this__9561.key, this__9561.val, this__9561.left, this__9561.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9561.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9562, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9584 = null;
  var G__9584__0 = function() {
    var this__9563 = this;
    var this__9565 = this;
    return cljs.core.pr_str.call(null, this__9565)
  };
  G__9584 = function() {
    switch(arguments.length) {
      case 0:
        return G__9584__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9584
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9566 = this;
  var node__9567 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9566.right)) {
    return new cljs.core.RedNode(this__9566.key, this__9566.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9566.left, null), this__9566.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9566.left)) {
      return new cljs.core.RedNode(this__9566.left.key, this__9566.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9566.left.left, null), new cljs.core.BlackNode(this__9566.key, this__9566.val, this__9566.left.right, this__9566.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9567, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9568 = this;
  var node__9569 = this;
  return new cljs.core.BlackNode(this__9568.key, this__9568.val, this__9568.left, this__9568.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9570 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9571 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9572 = this;
  return cljs.core.list.call(null, this__9572.key, this__9572.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9573 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9574 = this;
  return this__9574.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9575 = this;
  return cljs.core.PersistentVector.fromArray([this__9575.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9576 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9576.key, this__9576.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9577 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9578 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9578.key, this__9578.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9579 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9580 = this;
  if(n === 0) {
    return this__9580.key
  }else {
    if(n === 1) {
      return this__9580.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9581 = this;
  if(n === 0) {
    return this__9581.key
  }else {
    if(n === 1) {
      return this__9581.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9582 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9588 = comp.call(null, k, tree.key);
    if(c__9588 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9588 < 0) {
        var ins__9589 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9589 == null)) {
          return tree.add_left(ins__9589)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9590 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9590 == null)) {
            return tree.add_right(ins__9590)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9593 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9593)) {
            return new cljs.core.RedNode(app__9593.key, app__9593.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9593.left, null), new cljs.core.RedNode(right.key, right.val, app__9593.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9593, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9594 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9594)) {
              return new cljs.core.RedNode(app__9594.key, app__9594.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9594.left, null), new cljs.core.BlackNode(right.key, right.val, app__9594.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9594, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9600 = comp.call(null, k, tree.key);
    if(c__9600 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9600 < 0) {
        var del__9601 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____9602 = !(del__9601 == null);
          if(or__3824__auto____9602) {
            return or__3824__auto____9602
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9601, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9601, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9603 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____9604 = !(del__9603 == null);
            if(or__3824__auto____9604) {
              return or__3824__auto____9604
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9603)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9603, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9607 = tree.key;
  var c__9608 = comp.call(null, k, tk__9607);
  if(c__9608 === 0) {
    return tree.replace(tk__9607, v, tree.left, tree.right)
  }else {
    if(c__9608 < 0) {
      return tree.replace(tk__9607, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9607, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9611 = this;
  var h__2188__auto____9612 = this__9611.__hash;
  if(!(h__2188__auto____9612 == null)) {
    return h__2188__auto____9612
  }else {
    var h__2188__auto____9613 = cljs.core.hash_imap.call(null, coll);
    this__9611.__hash = h__2188__auto____9613;
    return h__2188__auto____9613
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9614 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9615 = this;
  var n__9616 = coll.entry_at(k);
  if(!(n__9616 == null)) {
    return n__9616.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9617 = this;
  var found__9618 = [null];
  var t__9619 = cljs.core.tree_map_add.call(null, this__9617.comp, this__9617.tree, k, v, found__9618);
  if(t__9619 == null) {
    var found_node__9620 = cljs.core.nth.call(null, found__9618, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9620.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9617.comp, cljs.core.tree_map_replace.call(null, this__9617.comp, this__9617.tree, k, v), this__9617.cnt, this__9617.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9617.comp, t__9619.blacken(), this__9617.cnt + 1, this__9617.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9621 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9655 = null;
  var G__9655__2 = function(this_sym9622, k) {
    var this__9624 = this;
    var this_sym9622__9625 = this;
    var coll__9626 = this_sym9622__9625;
    return coll__9626.cljs$core$ILookup$_lookup$arity$2(coll__9626, k)
  };
  var G__9655__3 = function(this_sym9623, k, not_found) {
    var this__9624 = this;
    var this_sym9623__9627 = this;
    var coll__9628 = this_sym9623__9627;
    return coll__9628.cljs$core$ILookup$_lookup$arity$3(coll__9628, k, not_found)
  };
  G__9655 = function(this_sym9623, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9655__2.call(this, this_sym9623, k);
      case 3:
        return G__9655__3.call(this, this_sym9623, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9655
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9609, args9610) {
  var this__9629 = this;
  return this_sym9609.call.apply(this_sym9609, [this_sym9609].concat(args9610.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9630 = this;
  if(!(this__9630.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9630.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9631 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9632 = this;
  if(this__9632.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9632.tree, false, this__9632.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9633 = this;
  var this__9634 = this;
  return cljs.core.pr_str.call(null, this__9634)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9635 = this;
  var coll__9636 = this;
  var t__9637 = this__9635.tree;
  while(true) {
    if(!(t__9637 == null)) {
      var c__9638 = this__9635.comp.call(null, k, t__9637.key);
      if(c__9638 === 0) {
        return t__9637
      }else {
        if(c__9638 < 0) {
          var G__9656 = t__9637.left;
          t__9637 = G__9656;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9657 = t__9637.right;
            t__9637 = G__9657;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9639 = this;
  if(this__9639.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9639.tree, ascending_QMARK_, this__9639.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9640 = this;
  if(this__9640.cnt > 0) {
    var stack__9641 = null;
    var t__9642 = this__9640.tree;
    while(true) {
      if(!(t__9642 == null)) {
        var c__9643 = this__9640.comp.call(null, k, t__9642.key);
        if(c__9643 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9641, t__9642), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9643 < 0) {
              var G__9658 = cljs.core.conj.call(null, stack__9641, t__9642);
              var G__9659 = t__9642.left;
              stack__9641 = G__9658;
              t__9642 = G__9659;
              continue
            }else {
              var G__9660 = stack__9641;
              var G__9661 = t__9642.right;
              stack__9641 = G__9660;
              t__9642 = G__9661;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9643 > 0) {
                var G__9662 = cljs.core.conj.call(null, stack__9641, t__9642);
                var G__9663 = t__9642.right;
                stack__9641 = G__9662;
                t__9642 = G__9663;
                continue
              }else {
                var G__9664 = stack__9641;
                var G__9665 = t__9642.left;
                stack__9641 = G__9664;
                t__9642 = G__9665;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9641 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9641, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9644 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9645 = this;
  return this__9645.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9646 = this;
  if(this__9646.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9646.tree, true, this__9646.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9647 = this;
  return this__9647.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9648 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9649 = this;
  return new cljs.core.PersistentTreeMap(this__9649.comp, this__9649.tree, this__9649.cnt, meta, this__9649.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9650 = this;
  return this__9650.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9651 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9651.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9652 = this;
  var found__9653 = [null];
  var t__9654 = cljs.core.tree_map_remove.call(null, this__9652.comp, this__9652.tree, k, found__9653);
  if(t__9654 == null) {
    if(cljs.core.nth.call(null, found__9653, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9652.comp, null, 0, this__9652.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9652.comp, t__9654.blacken(), this__9652.cnt - 1, this__9652.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9668 = cljs.core.seq.call(null, keyvals);
    var out__9669 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9668) {
        var G__9670 = cljs.core.nnext.call(null, in__9668);
        var G__9671 = cljs.core.assoc_BANG_.call(null, out__9669, cljs.core.first.call(null, in__9668), cljs.core.second.call(null, in__9668));
        in__9668 = G__9670;
        out__9669 = G__9671;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9669)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9672) {
    var keyvals = cljs.core.seq(arglist__9672);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9673) {
    var keyvals = cljs.core.seq(arglist__9673);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9677 = [];
    var obj__9678 = {};
    var kvs__9679 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9679) {
        ks__9677.push(cljs.core.first.call(null, kvs__9679));
        obj__9678[cljs.core.first.call(null, kvs__9679)] = cljs.core.second.call(null, kvs__9679);
        var G__9680 = cljs.core.nnext.call(null, kvs__9679);
        kvs__9679 = G__9680;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9677, obj__9678)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9681) {
    var keyvals = cljs.core.seq(arglist__9681);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9684 = cljs.core.seq.call(null, keyvals);
    var out__9685 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9684) {
        var G__9686 = cljs.core.nnext.call(null, in__9684);
        var G__9687 = cljs.core.assoc.call(null, out__9685, cljs.core.first.call(null, in__9684), cljs.core.second.call(null, in__9684));
        in__9684 = G__9686;
        out__9685 = G__9687;
        continue
      }else {
        return out__9685
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9688) {
    var keyvals = cljs.core.seq(arglist__9688);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9691 = cljs.core.seq.call(null, keyvals);
    var out__9692 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9691) {
        var G__9693 = cljs.core.nnext.call(null, in__9691);
        var G__9694 = cljs.core.assoc.call(null, out__9692, cljs.core.first.call(null, in__9691), cljs.core.second.call(null, in__9691));
        in__9691 = G__9693;
        out__9692 = G__9694;
        continue
      }else {
        return out__9692
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9695) {
    var comparator = cljs.core.first(arglist__9695);
    var keyvals = cljs.core.rest(arglist__9695);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9696_SHARP_, p2__9697_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____9699 = p1__9696_SHARP_;
          if(cljs.core.truth_(or__3824__auto____9699)) {
            return or__3824__auto____9699
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9697_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9700) {
    var maps = cljs.core.seq(arglist__9700);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9708 = function(m, e) {
        var k__9706 = cljs.core.first.call(null, e);
        var v__9707 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9706)) {
          return cljs.core.assoc.call(null, m, k__9706, f.call(null, cljs.core._lookup.call(null, m, k__9706, null), v__9707))
        }else {
          return cljs.core.assoc.call(null, m, k__9706, v__9707)
        }
      };
      var merge2__9710 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9708, function() {
          var or__3824__auto____9709 = m1;
          if(cljs.core.truth_(or__3824__auto____9709)) {
            return or__3824__auto____9709
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9710, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9711) {
    var f = cljs.core.first(arglist__9711);
    var maps = cljs.core.rest(arglist__9711);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9716 = cljs.core.ObjMap.EMPTY;
  var keys__9717 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9717) {
      var key__9718 = cljs.core.first.call(null, keys__9717);
      var entry__9719 = cljs.core._lookup.call(null, map, key__9718, "\ufdd0'user/not-found");
      var G__9720 = cljs.core.not_EQ_.call(null, entry__9719, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__9716, key__9718, entry__9719) : ret__9716;
      var G__9721 = cljs.core.next.call(null, keys__9717);
      ret__9716 = G__9720;
      keys__9717 = G__9721;
      continue
    }else {
      return ret__9716
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9725 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9725.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9726 = this;
  var h__2188__auto____9727 = this__9726.__hash;
  if(!(h__2188__auto____9727 == null)) {
    return h__2188__auto____9727
  }else {
    var h__2188__auto____9728 = cljs.core.hash_iset.call(null, coll);
    this__9726.__hash = h__2188__auto____9728;
    return h__2188__auto____9728
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9729 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9730 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9730.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9751 = null;
  var G__9751__2 = function(this_sym9731, k) {
    var this__9733 = this;
    var this_sym9731__9734 = this;
    var coll__9735 = this_sym9731__9734;
    return coll__9735.cljs$core$ILookup$_lookup$arity$2(coll__9735, k)
  };
  var G__9751__3 = function(this_sym9732, k, not_found) {
    var this__9733 = this;
    var this_sym9732__9736 = this;
    var coll__9737 = this_sym9732__9736;
    return coll__9737.cljs$core$ILookup$_lookup$arity$3(coll__9737, k, not_found)
  };
  G__9751 = function(this_sym9732, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9751__2.call(this, this_sym9732, k);
      case 3:
        return G__9751__3.call(this, this_sym9732, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9751
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9723, args9724) {
  var this__9738 = this;
  return this_sym9723.call.apply(this_sym9723, [this_sym9723].concat(args9724.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9739 = this;
  return new cljs.core.PersistentHashSet(this__9739.meta, cljs.core.assoc.call(null, this__9739.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9740 = this;
  var this__9741 = this;
  return cljs.core.pr_str.call(null, this__9741)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9742 = this;
  return cljs.core.keys.call(null, this__9742.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9743 = this;
  return new cljs.core.PersistentHashSet(this__9743.meta, cljs.core.dissoc.call(null, this__9743.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9744 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9745 = this;
  var and__3822__auto____9746 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9746) {
    var and__3822__auto____9747 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9747) {
      return cljs.core.every_QMARK_.call(null, function(p1__9722_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9722_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9747
    }
  }else {
    return and__3822__auto____9746
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9748 = this;
  return new cljs.core.PersistentHashSet(meta, this__9748.hash_map, this__9748.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9749 = this;
  return this__9749.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9750 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9750.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9752 = cljs.core.count.call(null, items);
  var i__9753 = 0;
  var out__9754 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9753 < len__9752) {
      var G__9755 = i__9753 + 1;
      var G__9756 = cljs.core.conj_BANG_.call(null, out__9754, items[i__9753]);
      i__9753 = G__9755;
      out__9754 = G__9756;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9754)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9774 = null;
  var G__9774__2 = function(this_sym9760, k) {
    var this__9762 = this;
    var this_sym9760__9763 = this;
    var tcoll__9764 = this_sym9760__9763;
    if(cljs.core._lookup.call(null, this__9762.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9774__3 = function(this_sym9761, k, not_found) {
    var this__9762 = this;
    var this_sym9761__9765 = this;
    var tcoll__9766 = this_sym9761__9765;
    if(cljs.core._lookup.call(null, this__9762.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9774 = function(this_sym9761, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9774__2.call(this, this_sym9761, k);
      case 3:
        return G__9774__3.call(this, this_sym9761, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9774
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9758, args9759) {
  var this__9767 = this;
  return this_sym9758.call.apply(this_sym9758, [this_sym9758].concat(args9759.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9768 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9769 = this;
  if(cljs.core._lookup.call(null, this__9769.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9770 = this;
  return cljs.core.count.call(null, this__9770.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9771 = this;
  this__9771.transient_map = cljs.core.dissoc_BANG_.call(null, this__9771.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9772 = this;
  this__9772.transient_map = cljs.core.assoc_BANG_.call(null, this__9772.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9773 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9773.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9777 = this;
  var h__2188__auto____9778 = this__9777.__hash;
  if(!(h__2188__auto____9778 == null)) {
    return h__2188__auto____9778
  }else {
    var h__2188__auto____9779 = cljs.core.hash_iset.call(null, coll);
    this__9777.__hash = h__2188__auto____9779;
    return h__2188__auto____9779
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9780 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9781 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9781.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9807 = null;
  var G__9807__2 = function(this_sym9782, k) {
    var this__9784 = this;
    var this_sym9782__9785 = this;
    var coll__9786 = this_sym9782__9785;
    return coll__9786.cljs$core$ILookup$_lookup$arity$2(coll__9786, k)
  };
  var G__9807__3 = function(this_sym9783, k, not_found) {
    var this__9784 = this;
    var this_sym9783__9787 = this;
    var coll__9788 = this_sym9783__9787;
    return coll__9788.cljs$core$ILookup$_lookup$arity$3(coll__9788, k, not_found)
  };
  G__9807 = function(this_sym9783, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9807__2.call(this, this_sym9783, k);
      case 3:
        return G__9807__3.call(this, this_sym9783, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9807
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9775, args9776) {
  var this__9789 = this;
  return this_sym9775.call.apply(this_sym9775, [this_sym9775].concat(args9776.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9790 = this;
  return new cljs.core.PersistentTreeSet(this__9790.meta, cljs.core.assoc.call(null, this__9790.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9791 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9791.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9792 = this;
  var this__9793 = this;
  return cljs.core.pr_str.call(null, this__9793)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9794 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9794.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9795 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9795.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9796 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9797 = this;
  return cljs.core._comparator.call(null, this__9797.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9798 = this;
  return cljs.core.keys.call(null, this__9798.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9799 = this;
  return new cljs.core.PersistentTreeSet(this__9799.meta, cljs.core.dissoc.call(null, this__9799.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9800 = this;
  return cljs.core.count.call(null, this__9800.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9801 = this;
  var and__3822__auto____9802 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____9802) {
    var and__3822__auto____9803 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____9803) {
      return cljs.core.every_QMARK_.call(null, function(p1__9757_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9757_SHARP_)
      }, other)
    }else {
      return and__3822__auto____9803
    }
  }else {
    return and__3822__auto____9802
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9804 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9804.tree_map, this__9804.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9805 = this;
  return this__9805.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9806 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9806.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9812__delegate = function(keys) {
      var in__9810 = cljs.core.seq.call(null, keys);
      var out__9811 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9810)) {
          var G__9813 = cljs.core.next.call(null, in__9810);
          var G__9814 = cljs.core.conj_BANG_.call(null, out__9811, cljs.core.first.call(null, in__9810));
          in__9810 = G__9813;
          out__9811 = G__9814;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9811)
        }
        break
      }
    };
    var G__9812 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9812__delegate.call(this, keys)
    };
    G__9812.cljs$lang$maxFixedArity = 0;
    G__9812.cljs$lang$applyTo = function(arglist__9815) {
      var keys = cljs.core.seq(arglist__9815);
      return G__9812__delegate(keys)
    };
    G__9812.cljs$lang$arity$variadic = G__9812__delegate;
    return G__9812
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9816) {
    var keys = cljs.core.seq(arglist__9816);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9818) {
    var comparator = cljs.core.first(arglist__9818);
    var keys = cljs.core.rest(arglist__9818);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9824 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____9825 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____9825)) {
        var e__9826 = temp__3971__auto____9825;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9826))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9824, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9817_SHARP_) {
      var temp__3971__auto____9827 = cljs.core.find.call(null, smap, p1__9817_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____9827)) {
        var e__9828 = temp__3971__auto____9827;
        return cljs.core.second.call(null, e__9828)
      }else {
        return p1__9817_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9858 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9851, seen) {
        while(true) {
          var vec__9852__9853 = p__9851;
          var f__9854 = cljs.core.nth.call(null, vec__9852__9853, 0, null);
          var xs__9855 = vec__9852__9853;
          var temp__3974__auto____9856 = cljs.core.seq.call(null, xs__9855);
          if(temp__3974__auto____9856) {
            var s__9857 = temp__3974__auto____9856;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9854)) {
              var G__9859 = cljs.core.rest.call(null, s__9857);
              var G__9860 = seen;
              p__9851 = G__9859;
              seen = G__9860;
              continue
            }else {
              return cljs.core.cons.call(null, f__9854, step.call(null, cljs.core.rest.call(null, s__9857), cljs.core.conj.call(null, seen, f__9854)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9858.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9863 = cljs.core.PersistentVector.EMPTY;
  var s__9864 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9864)) {
      var G__9865 = cljs.core.conj.call(null, ret__9863, cljs.core.first.call(null, s__9864));
      var G__9866 = cljs.core.next.call(null, s__9864);
      ret__9863 = G__9865;
      s__9864 = G__9866;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9863)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____9869 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____9869) {
        return or__3824__auto____9869
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9870 = x.lastIndexOf("/");
      if(i__9870 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9870 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____9873 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____9873) {
      return or__3824__auto____9873
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9874 = x.lastIndexOf("/");
    if(i__9874 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9874)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9881 = cljs.core.ObjMap.EMPTY;
  var ks__9882 = cljs.core.seq.call(null, keys);
  var vs__9883 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____9884 = ks__9882;
      if(and__3822__auto____9884) {
        return vs__9883
      }else {
        return and__3822__auto____9884
      }
    }()) {
      var G__9885 = cljs.core.assoc.call(null, map__9881, cljs.core.first.call(null, ks__9882), cljs.core.first.call(null, vs__9883));
      var G__9886 = cljs.core.next.call(null, ks__9882);
      var G__9887 = cljs.core.next.call(null, vs__9883);
      map__9881 = G__9885;
      ks__9882 = G__9886;
      vs__9883 = G__9887;
      continue
    }else {
      return map__9881
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9890__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9875_SHARP_, p2__9876_SHARP_) {
        return max_key.call(null, k, p1__9875_SHARP_, p2__9876_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9890 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9890__delegate.call(this, k, x, y, more)
    };
    G__9890.cljs$lang$maxFixedArity = 3;
    G__9890.cljs$lang$applyTo = function(arglist__9891) {
      var k = cljs.core.first(arglist__9891);
      var x = cljs.core.first(cljs.core.next(arglist__9891));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9891)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9891)));
      return G__9890__delegate(k, x, y, more)
    };
    G__9890.cljs$lang$arity$variadic = G__9890__delegate;
    return G__9890
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9892__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9888_SHARP_, p2__9889_SHARP_) {
        return min_key.call(null, k, p1__9888_SHARP_, p2__9889_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9892 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9892__delegate.call(this, k, x, y, more)
    };
    G__9892.cljs$lang$maxFixedArity = 3;
    G__9892.cljs$lang$applyTo = function(arglist__9893) {
      var k = cljs.core.first(arglist__9893);
      var x = cljs.core.first(cljs.core.next(arglist__9893));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9893)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9893)));
      return G__9892__delegate(k, x, y, more)
    };
    G__9892.cljs$lang$arity$variadic = G__9892__delegate;
    return G__9892
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____9896 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____9896) {
        var s__9897 = temp__3974__auto____9896;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9897), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9897)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9900 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9900) {
      var s__9901 = temp__3974__auto____9900;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9901)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9901), take_while.call(null, pred, cljs.core.rest.call(null, s__9901)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9903 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9903.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9915 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____9916 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____9916)) {
        var vec__9917__9918 = temp__3974__auto____9916;
        var e__9919 = cljs.core.nth.call(null, vec__9917__9918, 0, null);
        var s__9920 = vec__9917__9918;
        if(cljs.core.truth_(include__9915.call(null, e__9919))) {
          return s__9920
        }else {
          return cljs.core.next.call(null, s__9920)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9915, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9921 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____9921)) {
      var vec__9922__9923 = temp__3974__auto____9921;
      var e__9924 = cljs.core.nth.call(null, vec__9922__9923, 0, null);
      var s__9925 = vec__9922__9923;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9924)) ? s__9925 : cljs.core.next.call(null, s__9925))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9937 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____9938 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____9938)) {
        var vec__9939__9940 = temp__3974__auto____9938;
        var e__9941 = cljs.core.nth.call(null, vec__9939__9940, 0, null);
        var s__9942 = vec__9939__9940;
        if(cljs.core.truth_(include__9937.call(null, e__9941))) {
          return s__9942
        }else {
          return cljs.core.next.call(null, s__9942)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9937, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____9943 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____9943)) {
      var vec__9944__9945 = temp__3974__auto____9943;
      var e__9946 = cljs.core.nth.call(null, vec__9944__9945, 0, null);
      var s__9947 = vec__9944__9945;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9946)) ? s__9947 : cljs.core.next.call(null, s__9947))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9948 = this;
  var h__2188__auto____9949 = this__9948.__hash;
  if(!(h__2188__auto____9949 == null)) {
    return h__2188__auto____9949
  }else {
    var h__2188__auto____9950 = cljs.core.hash_coll.call(null, rng);
    this__9948.__hash = h__2188__auto____9950;
    return h__2188__auto____9950
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9951 = this;
  if(this__9951.step > 0) {
    if(this__9951.start + this__9951.step < this__9951.end) {
      return new cljs.core.Range(this__9951.meta, this__9951.start + this__9951.step, this__9951.end, this__9951.step, null)
    }else {
      return null
    }
  }else {
    if(this__9951.start + this__9951.step > this__9951.end) {
      return new cljs.core.Range(this__9951.meta, this__9951.start + this__9951.step, this__9951.end, this__9951.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9952 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9953 = this;
  var this__9954 = this;
  return cljs.core.pr_str.call(null, this__9954)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9955 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9956 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9957 = this;
  if(this__9957.step > 0) {
    if(this__9957.start < this__9957.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9957.start > this__9957.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9958 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9958.end - this__9958.start) / this__9958.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9959 = this;
  return this__9959.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9960 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9960.meta, this__9960.start + this__9960.step, this__9960.end, this__9960.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9961 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9962 = this;
  return new cljs.core.Range(meta, this__9962.start, this__9962.end, this__9962.step, this__9962.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9963 = this;
  return this__9963.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9964 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9964.start + n * this__9964.step
  }else {
    if(function() {
      var and__3822__auto____9965 = this__9964.start > this__9964.end;
      if(and__3822__auto____9965) {
        return this__9964.step === 0
      }else {
        return and__3822__auto____9965
      }
    }()) {
      return this__9964.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9966 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9966.start + n * this__9966.step
  }else {
    if(function() {
      var and__3822__auto____9967 = this__9966.start > this__9966.end;
      if(and__3822__auto____9967) {
        return this__9966.step === 0
      }else {
        return and__3822__auto____9967
      }
    }()) {
      return this__9966.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9968 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9968.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9971 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9971) {
      var s__9972 = temp__3974__auto____9971;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9972), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9972)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____9979 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____9979) {
      var s__9980 = temp__3974__auto____9979;
      var fst__9981 = cljs.core.first.call(null, s__9980);
      var fv__9982 = f.call(null, fst__9981);
      var run__9983 = cljs.core.cons.call(null, fst__9981, cljs.core.take_while.call(null, function(p1__9973_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9982, f.call(null, p1__9973_SHARP_))
      }, cljs.core.next.call(null, s__9980)));
      return cljs.core.cons.call(null, run__9983, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9983), s__9980))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____9998 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____9998) {
        var s__9999 = temp__3971__auto____9998;
        return reductions.call(null, f, cljs.core.first.call(null, s__9999), cljs.core.rest.call(null, s__9999))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____10000 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____10000) {
        var s__10001 = temp__3974__auto____10000;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10001)), cljs.core.rest.call(null, s__10001))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__10004 = null;
      var G__10004__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10004__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10004__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10004__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10004__4 = function() {
        var G__10005__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10005 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10005__delegate.call(this, x, y, z, args)
        };
        G__10005.cljs$lang$maxFixedArity = 3;
        G__10005.cljs$lang$applyTo = function(arglist__10006) {
          var x = cljs.core.first(arglist__10006);
          var y = cljs.core.first(cljs.core.next(arglist__10006));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10006)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10006)));
          return G__10005__delegate(x, y, z, args)
        };
        G__10005.cljs$lang$arity$variadic = G__10005__delegate;
        return G__10005
      }();
      G__10004 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10004__0.call(this);
          case 1:
            return G__10004__1.call(this, x);
          case 2:
            return G__10004__2.call(this, x, y);
          case 3:
            return G__10004__3.call(this, x, y, z);
          default:
            return G__10004__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10004.cljs$lang$maxFixedArity = 3;
      G__10004.cljs$lang$applyTo = G__10004__4.cljs$lang$applyTo;
      return G__10004
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10007 = null;
      var G__10007__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10007__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10007__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10007__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10007__4 = function() {
        var G__10008__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10008 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10008__delegate.call(this, x, y, z, args)
        };
        G__10008.cljs$lang$maxFixedArity = 3;
        G__10008.cljs$lang$applyTo = function(arglist__10009) {
          var x = cljs.core.first(arglist__10009);
          var y = cljs.core.first(cljs.core.next(arglist__10009));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10009)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10009)));
          return G__10008__delegate(x, y, z, args)
        };
        G__10008.cljs$lang$arity$variadic = G__10008__delegate;
        return G__10008
      }();
      G__10007 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10007__0.call(this);
          case 1:
            return G__10007__1.call(this, x);
          case 2:
            return G__10007__2.call(this, x, y);
          case 3:
            return G__10007__3.call(this, x, y, z);
          default:
            return G__10007__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10007.cljs$lang$maxFixedArity = 3;
      G__10007.cljs$lang$applyTo = G__10007__4.cljs$lang$applyTo;
      return G__10007
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10010 = null;
      var G__10010__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10010__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10010__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10010__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10010__4 = function() {
        var G__10011__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10011 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10011__delegate.call(this, x, y, z, args)
        };
        G__10011.cljs$lang$maxFixedArity = 3;
        G__10011.cljs$lang$applyTo = function(arglist__10012) {
          var x = cljs.core.first(arglist__10012);
          var y = cljs.core.first(cljs.core.next(arglist__10012));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10012)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10012)));
          return G__10011__delegate(x, y, z, args)
        };
        G__10011.cljs$lang$arity$variadic = G__10011__delegate;
        return G__10011
      }();
      G__10010 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10010__0.call(this);
          case 1:
            return G__10010__1.call(this, x);
          case 2:
            return G__10010__2.call(this, x, y);
          case 3:
            return G__10010__3.call(this, x, y, z);
          default:
            return G__10010__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10010.cljs$lang$maxFixedArity = 3;
      G__10010.cljs$lang$applyTo = G__10010__4.cljs$lang$applyTo;
      return G__10010
    }()
  };
  var juxt__4 = function() {
    var G__10013__delegate = function(f, g, h, fs) {
      var fs__10003 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10014 = null;
        var G__10014__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9984_SHARP_, p2__9985_SHARP_) {
            return cljs.core.conj.call(null, p1__9984_SHARP_, p2__9985_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__10003)
        };
        var G__10014__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9986_SHARP_, p2__9987_SHARP_) {
            return cljs.core.conj.call(null, p1__9986_SHARP_, p2__9987_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__10003)
        };
        var G__10014__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9988_SHARP_, p2__9989_SHARP_) {
            return cljs.core.conj.call(null, p1__9988_SHARP_, p2__9989_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__10003)
        };
        var G__10014__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9990_SHARP_, p2__9991_SHARP_) {
            return cljs.core.conj.call(null, p1__9990_SHARP_, p2__9991_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__10003)
        };
        var G__10014__4 = function() {
          var G__10015__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9992_SHARP_, p2__9993_SHARP_) {
              return cljs.core.conj.call(null, p1__9992_SHARP_, cljs.core.apply.call(null, p2__9993_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__10003)
          };
          var G__10015 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10015__delegate.call(this, x, y, z, args)
          };
          G__10015.cljs$lang$maxFixedArity = 3;
          G__10015.cljs$lang$applyTo = function(arglist__10016) {
            var x = cljs.core.first(arglist__10016);
            var y = cljs.core.first(cljs.core.next(arglist__10016));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10016)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10016)));
            return G__10015__delegate(x, y, z, args)
          };
          G__10015.cljs$lang$arity$variadic = G__10015__delegate;
          return G__10015
        }();
        G__10014 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10014__0.call(this);
            case 1:
              return G__10014__1.call(this, x);
            case 2:
              return G__10014__2.call(this, x, y);
            case 3:
              return G__10014__3.call(this, x, y, z);
            default:
              return G__10014__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10014.cljs$lang$maxFixedArity = 3;
        G__10014.cljs$lang$applyTo = G__10014__4.cljs$lang$applyTo;
        return G__10014
      }()
    };
    var G__10013 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10013__delegate.call(this, f, g, h, fs)
    };
    G__10013.cljs$lang$maxFixedArity = 3;
    G__10013.cljs$lang$applyTo = function(arglist__10017) {
      var f = cljs.core.first(arglist__10017);
      var g = cljs.core.first(cljs.core.next(arglist__10017));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10017)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10017)));
      return G__10013__delegate(f, g, h, fs)
    };
    G__10013.cljs$lang$arity$variadic = G__10013__delegate;
    return G__10013
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__10020 = cljs.core.next.call(null, coll);
        coll = G__10020;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____10019 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____10019) {
          return n > 0
        }else {
          return and__3822__auto____10019
        }
      }())) {
        var G__10021 = n - 1;
        var G__10022 = cljs.core.next.call(null, coll);
        n = G__10021;
        coll = G__10022;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10024 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10024), s)) {
    if(cljs.core.count.call(null, matches__10024) === 1) {
      return cljs.core.first.call(null, matches__10024)
    }else {
      return cljs.core.vec.call(null, matches__10024)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10026 = re.exec(s);
  if(matches__10026 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10026) === 1) {
      return cljs.core.first.call(null, matches__10026)
    }else {
      return cljs.core.vec.call(null, matches__10026)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10031 = cljs.core.re_find.call(null, re, s);
  var match_idx__10032 = s.search(re);
  var match_str__10033 = cljs.core.coll_QMARK_.call(null, match_data__10031) ? cljs.core.first.call(null, match_data__10031) : match_data__10031;
  var post_match__10034 = cljs.core.subs.call(null, s, match_idx__10032 + cljs.core.count.call(null, match_str__10033));
  if(cljs.core.truth_(match_data__10031)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10031, re_seq.call(null, re, post_match__10034))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10041__10042 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10043 = cljs.core.nth.call(null, vec__10041__10042, 0, null);
  var flags__10044 = cljs.core.nth.call(null, vec__10041__10042, 1, null);
  var pattern__10045 = cljs.core.nth.call(null, vec__10041__10042, 2, null);
  return new RegExp(pattern__10045, flags__10044)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__10035_SHARP_) {
    return print_one.call(null, p1__10035_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____10055 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____10055)) {
            var and__3822__auto____10059 = function() {
              var G__10056__10057 = obj;
              if(G__10056__10057) {
                if(function() {
                  var or__3824__auto____10058 = G__10056__10057.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____10058) {
                    return or__3824__auto____10058
                  }else {
                    return G__10056__10057.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10056__10057.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10056__10057)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10056__10057)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____10059)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____10059
            }
          }else {
            return and__3822__auto____10055
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____10060 = !(obj == null);
          if(and__3822__auto____10060) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____10060
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10061__10062 = obj;
          if(G__10061__10062) {
            if(function() {
              var or__3824__auto____10063 = G__10061__10062.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____10063) {
                return or__3824__auto____10063
              }else {
                return G__10061__10062.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10061__10062.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10061__10062)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10061__10062)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__10083 = new goog.string.StringBuffer;
  var G__10084__10085 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10084__10085) {
    var string__10086 = cljs.core.first.call(null, G__10084__10085);
    var G__10084__10087 = G__10084__10085;
    while(true) {
      sb__10083.append(string__10086);
      var temp__3974__auto____10088 = cljs.core.next.call(null, G__10084__10087);
      if(temp__3974__auto____10088) {
        var G__10084__10089 = temp__3974__auto____10088;
        var G__10102 = cljs.core.first.call(null, G__10084__10089);
        var G__10103 = G__10084__10089;
        string__10086 = G__10102;
        G__10084__10087 = G__10103;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10090__10091 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10090__10091) {
    var obj__10092 = cljs.core.first.call(null, G__10090__10091);
    var G__10090__10093 = G__10090__10091;
    while(true) {
      sb__10083.append(" ");
      var G__10094__10095 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10092, opts));
      if(G__10094__10095) {
        var string__10096 = cljs.core.first.call(null, G__10094__10095);
        var G__10094__10097 = G__10094__10095;
        while(true) {
          sb__10083.append(string__10096);
          var temp__3974__auto____10098 = cljs.core.next.call(null, G__10094__10097);
          if(temp__3974__auto____10098) {
            var G__10094__10099 = temp__3974__auto____10098;
            var G__10104 = cljs.core.first.call(null, G__10094__10099);
            var G__10105 = G__10094__10099;
            string__10096 = G__10104;
            G__10094__10097 = G__10105;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10100 = cljs.core.next.call(null, G__10090__10093);
      if(temp__3974__auto____10100) {
        var G__10090__10101 = temp__3974__auto____10100;
        var G__10106 = cljs.core.first.call(null, G__10090__10101);
        var G__10107 = G__10090__10101;
        obj__10092 = G__10106;
        G__10090__10093 = G__10107;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10083
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10109 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10109.append("\n");
  return[cljs.core.str(sb__10109)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__10128__10129 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__10128__10129) {
    var string__10130 = cljs.core.first.call(null, G__10128__10129);
    var G__10128__10131 = G__10128__10129;
    while(true) {
      cljs.core.string_print.call(null, string__10130);
      var temp__3974__auto____10132 = cljs.core.next.call(null, G__10128__10131);
      if(temp__3974__auto____10132) {
        var G__10128__10133 = temp__3974__auto____10132;
        var G__10146 = cljs.core.first.call(null, G__10128__10133);
        var G__10147 = G__10128__10133;
        string__10130 = G__10146;
        G__10128__10131 = G__10147;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__10134__10135 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__10134__10135) {
    var obj__10136 = cljs.core.first.call(null, G__10134__10135);
    var G__10134__10137 = G__10134__10135;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__10138__10139 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10136, opts));
      if(G__10138__10139) {
        var string__10140 = cljs.core.first.call(null, G__10138__10139);
        var G__10138__10141 = G__10138__10139;
        while(true) {
          cljs.core.string_print.call(null, string__10140);
          var temp__3974__auto____10142 = cljs.core.next.call(null, G__10138__10141);
          if(temp__3974__auto____10142) {
            var G__10138__10143 = temp__3974__auto____10142;
            var G__10148 = cljs.core.first.call(null, G__10138__10143);
            var G__10149 = G__10138__10143;
            string__10140 = G__10148;
            G__10138__10141 = G__10149;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____10144 = cljs.core.next.call(null, G__10134__10137);
      if(temp__3974__auto____10144) {
        var G__10134__10145 = temp__3974__auto____10144;
        var G__10150 = cljs.core.first.call(null, G__10134__10145);
        var G__10151 = G__10134__10145;
        obj__10136 = G__10150;
        G__10134__10137 = G__10151;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__10152) {
    var objs = cljs.core.seq(arglist__10152);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__10153) {
    var objs = cljs.core.seq(arglist__10153);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__10154) {
    var objs = cljs.core.seq(arglist__10154);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__10155) {
    var objs = cljs.core.seq(arglist__10155);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__10156) {
    var objs = cljs.core.seq(arglist__10156);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__10157) {
    var objs = cljs.core.seq(arglist__10157);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__10158) {
    var objs = cljs.core.seq(arglist__10158);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__10159) {
    var objs = cljs.core.seq(arglist__10159);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__10160) {
    var fmt = cljs.core.first(arglist__10160);
    var args = cljs.core.rest(arglist__10160);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10161 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10161, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10162 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10162, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10163 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10163, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____10164 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____10164)) {
        var nspc__10165 = temp__3974__auto____10164;
        return[cljs.core.str(nspc__10165), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____10166 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____10166)) {
          var nspc__10167 = temp__3974__auto____10166;
          return[cljs.core.str(nspc__10167), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10168 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10168, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__10170 = function(n, len) {
    var ns__10169 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__10169) < len) {
        var G__10172 = [cljs.core.str("0"), cljs.core.str(ns__10169)].join("");
        ns__10169 = G__10172;
        continue
      }else {
        return ns__10169
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__10170.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__10170.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__10170.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10170.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__10170.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__10170.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10171 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10171, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10173 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10174 = this;
  var G__10175__10176 = cljs.core.seq.call(null, this__10174.watches);
  if(G__10175__10176) {
    var G__10178__10180 = cljs.core.first.call(null, G__10175__10176);
    var vec__10179__10181 = G__10178__10180;
    var key__10182 = cljs.core.nth.call(null, vec__10179__10181, 0, null);
    var f__10183 = cljs.core.nth.call(null, vec__10179__10181, 1, null);
    var G__10175__10184 = G__10175__10176;
    var G__10178__10185 = G__10178__10180;
    var G__10175__10186 = G__10175__10184;
    while(true) {
      var vec__10187__10188 = G__10178__10185;
      var key__10189 = cljs.core.nth.call(null, vec__10187__10188, 0, null);
      var f__10190 = cljs.core.nth.call(null, vec__10187__10188, 1, null);
      var G__10175__10191 = G__10175__10186;
      f__10190.call(null, key__10189, this$, oldval, newval);
      var temp__3974__auto____10192 = cljs.core.next.call(null, G__10175__10191);
      if(temp__3974__auto____10192) {
        var G__10175__10193 = temp__3974__auto____10192;
        var G__10200 = cljs.core.first.call(null, G__10175__10193);
        var G__10201 = G__10175__10193;
        G__10178__10185 = G__10200;
        G__10175__10186 = G__10201;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__10194 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10194.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10195 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10195.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10196 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__10196.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10197 = this;
  return this__10197.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10198 = this;
  return this__10198.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10199 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10213__delegate = function(x, p__10202) {
      var map__10208__10209 = p__10202;
      var map__10208__10210 = cljs.core.seq_QMARK_.call(null, map__10208__10209) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10208__10209) : map__10208__10209;
      var validator__10211 = cljs.core._lookup.call(null, map__10208__10210, "\ufdd0'validator", null);
      var meta__10212 = cljs.core._lookup.call(null, map__10208__10210, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__10212, validator__10211, null)
    };
    var G__10213 = function(x, var_args) {
      var p__10202 = null;
      if(goog.isDef(var_args)) {
        p__10202 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10213__delegate.call(this, x, p__10202)
    };
    G__10213.cljs$lang$maxFixedArity = 1;
    G__10213.cljs$lang$applyTo = function(arglist__10214) {
      var x = cljs.core.first(arglist__10214);
      var p__10202 = cljs.core.rest(arglist__10214);
      return G__10213__delegate(x, p__10202)
    };
    G__10213.cljs$lang$arity$variadic = G__10213__delegate;
    return G__10213
  }();
  atom = function(x, var_args) {
    var p__10202 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____10218 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____10218)) {
    var validate__10219 = temp__3974__auto____10218;
    if(cljs.core.truth_(validate__10219.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__10220 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10220, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__10221__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10221 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10221__delegate.call(this, a, f, x, y, z, more)
    };
    G__10221.cljs$lang$maxFixedArity = 5;
    G__10221.cljs$lang$applyTo = function(arglist__10222) {
      var a = cljs.core.first(arglist__10222);
      var f = cljs.core.first(cljs.core.next(arglist__10222));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10222)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10222))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10222)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10222)))));
      return G__10221__delegate(a, f, x, y, z, more)
    };
    G__10221.cljs$lang$arity$variadic = G__10221__delegate;
    return G__10221
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10223) {
    var iref = cljs.core.first(arglist__10223);
    var f = cljs.core.first(cljs.core.next(arglist__10223));
    var args = cljs.core.rest(cljs.core.next(arglist__10223));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__10224 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__10224.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10225 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__10225.state, function(p__10226) {
    var map__10227__10228 = p__10226;
    var map__10227__10229 = cljs.core.seq_QMARK_.call(null, map__10227__10228) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10227__10228) : map__10227__10228;
    var curr_state__10230 = map__10227__10229;
    var done__10231 = cljs.core._lookup.call(null, map__10227__10229, "\ufdd0'done", null);
    if(cljs.core.truth_(done__10231)) {
      return curr_state__10230
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10225.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__10252__10253 = options;
    var map__10252__10254 = cljs.core.seq_QMARK_.call(null, map__10252__10253) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10252__10253) : map__10252__10253;
    var keywordize_keys__10255 = cljs.core._lookup.call(null, map__10252__10254, "\ufdd0'keywordize-keys", null);
    var keyfn__10256 = cljs.core.truth_(keywordize_keys__10255) ? cljs.core.keyword : cljs.core.str;
    var f__10271 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2458__auto____10270 = function iter__10264(s__10265) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__10265__10268 = s__10265;
                    while(true) {
                      if(cljs.core.seq.call(null, s__10265__10268)) {
                        var k__10269 = cljs.core.first.call(null, s__10265__10268);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10256.call(null, k__10269), thisfn.call(null, x[k__10269])], true), iter__10264.call(null, cljs.core.rest.call(null, s__10265__10268)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2458__auto____10270.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__10271.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__10272) {
    var x = cljs.core.first(arglist__10272);
    var options = cljs.core.rest(arglist__10272);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__10277 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__10281__delegate = function(args) {
      var temp__3971__auto____10278 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__10277), args, null);
      if(cljs.core.truth_(temp__3971__auto____10278)) {
        var v__10279 = temp__3971__auto____10278;
        return v__10279
      }else {
        var ret__10280 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__10277, cljs.core.assoc, args, ret__10280);
        return ret__10280
      }
    };
    var G__10281 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10281__delegate.call(this, args)
    };
    G__10281.cljs$lang$maxFixedArity = 0;
    G__10281.cljs$lang$applyTo = function(arglist__10282) {
      var args = cljs.core.seq(arglist__10282);
      return G__10281__delegate(args)
    };
    G__10281.cljs$lang$arity$variadic = G__10281__delegate;
    return G__10281
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__10284 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__10284)) {
        var G__10285 = ret__10284;
        f = G__10285;
        continue
      }else {
        return ret__10284
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__10286__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__10286 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10286__delegate.call(this, f, args)
    };
    G__10286.cljs$lang$maxFixedArity = 1;
    G__10286.cljs$lang$applyTo = function(arglist__10287) {
      var f = cljs.core.first(arglist__10287);
      var args = cljs.core.rest(arglist__10287);
      return G__10286__delegate(f, args)
    };
    G__10286.cljs$lang$arity$variadic = G__10286__delegate;
    return G__10286
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__10289 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__10289, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__10289, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____10298 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____10298) {
      return or__3824__auto____10298
    }else {
      var or__3824__auto____10299 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____10299) {
        return or__3824__auto____10299
      }else {
        var and__3822__auto____10300 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____10300) {
          var and__3822__auto____10301 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____10301) {
            var and__3822__auto____10302 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____10302) {
              var ret__10303 = true;
              var i__10304 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____10305 = cljs.core.not.call(null, ret__10303);
                  if(or__3824__auto____10305) {
                    return or__3824__auto____10305
                  }else {
                    return i__10304 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__10303
                }else {
                  var G__10306 = isa_QMARK_.call(null, h, child.call(null, i__10304), parent.call(null, i__10304));
                  var G__10307 = i__10304 + 1;
                  ret__10303 = G__10306;
                  i__10304 = G__10307;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____10302
            }
          }else {
            return and__3822__auto____10301
          }
        }else {
          return and__3822__auto____10300
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__10316 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__10317 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__10318 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__10319 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____10320 = cljs.core.contains_QMARK_.call(null, tp__10316.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__10318.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__10318.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__10316, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__10319.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__10317, parent, ta__10318), "\ufdd0'descendants":tf__10319.call(null, 
      (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), parent, ta__10318, tag, td__10317)})
    }();
    if(cljs.core.truth_(or__3824__auto____10320)) {
      return or__3824__auto____10320
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__10325 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__10326 = cljs.core.truth_(parentMap__10325.call(null, tag)) ? cljs.core.disj.call(null, parentMap__10325.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__10327 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__10326)) ? cljs.core.assoc.call(null, parentMap__10325, tag, childsParents__10326) : cljs.core.dissoc.call(null, parentMap__10325, tag);
    var deriv_seq__10328 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__10308_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__10308_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__10308_SHARP_), cljs.core.second.call(null, p1__10308_SHARP_)))
    }, cljs.core.seq.call(null, newParents__10327)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__10325.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__10309_SHARP_, p2__10310_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__10309_SHARP_, p2__10310_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__10328))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__10336 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____10338 = cljs.core.truth_(function() {
    var and__3822__auto____10337 = xprefs__10336;
    if(cljs.core.truth_(and__3822__auto____10337)) {
      return xprefs__10336.call(null, y)
    }else {
      return and__3822__auto____10337
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____10338)) {
    return or__3824__auto____10338
  }else {
    var or__3824__auto____10340 = function() {
      var ps__10339 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__10339) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__10339), prefer_table))) {
          }else {
          }
          var G__10343 = cljs.core.rest.call(null, ps__10339);
          ps__10339 = G__10343;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10340)) {
      return or__3824__auto____10340
    }else {
      var or__3824__auto____10342 = function() {
        var ps__10341 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__10341) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__10341), y, prefer_table))) {
            }else {
            }
            var G__10344 = cljs.core.rest.call(null, ps__10341);
            ps__10341 = G__10344;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____10342)) {
        return or__3824__auto____10342
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____10346 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____10346)) {
    return or__3824__auto____10346
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__10364 = cljs.core.reduce.call(null, function(be, p__10356) {
    var vec__10357__10358 = p__10356;
    var k__10359 = cljs.core.nth.call(null, vec__10357__10358, 0, null);
    var ___10360 = cljs.core.nth.call(null, vec__10357__10358, 1, null);
    var e__10361 = vec__10357__10358;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__10359)) {
      var be2__10363 = cljs.core.truth_(function() {
        var or__3824__auto____10362 = be == null;
        if(or__3824__auto____10362) {
          return or__3824__auto____10362
        }else {
          return cljs.core.dominates.call(null, k__10359, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__10361 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__10363), k__10359, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__10359), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__10363)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__10363
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__10364)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__10364));
      return cljs.core.second.call(null, best_entry__10364)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____10369 = mf;
    if(and__3822__auto____10369) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____10369
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2359__auto____10370 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10371 = cljs.core._reset[goog.typeOf(x__2359__auto____10370)];
      if(or__3824__auto____10371) {
        return or__3824__auto____10371
      }else {
        var or__3824__auto____10372 = cljs.core._reset["_"];
        if(or__3824__auto____10372) {
          return or__3824__auto____10372
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____10377 = mf;
    if(and__3822__auto____10377) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____10377
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2359__auto____10378 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10379 = cljs.core._add_method[goog.typeOf(x__2359__auto____10378)];
      if(or__3824__auto____10379) {
        return or__3824__auto____10379
      }else {
        var or__3824__auto____10380 = cljs.core._add_method["_"];
        if(or__3824__auto____10380) {
          return or__3824__auto____10380
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10385 = mf;
    if(and__3822__auto____10385) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____10385
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2359__auto____10386 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10387 = cljs.core._remove_method[goog.typeOf(x__2359__auto____10386)];
      if(or__3824__auto____10387) {
        return or__3824__auto____10387
      }else {
        var or__3824__auto____10388 = cljs.core._remove_method["_"];
        if(or__3824__auto____10388) {
          return or__3824__auto____10388
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____10393 = mf;
    if(and__3822__auto____10393) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____10393
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2359__auto____10394 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10395 = cljs.core._prefer_method[goog.typeOf(x__2359__auto____10394)];
      if(or__3824__auto____10395) {
        return or__3824__auto____10395
      }else {
        var or__3824__auto____10396 = cljs.core._prefer_method["_"];
        if(or__3824__auto____10396) {
          return or__3824__auto____10396
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____10401 = mf;
    if(and__3822__auto____10401) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____10401
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2359__auto____10402 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10403 = cljs.core._get_method[goog.typeOf(x__2359__auto____10402)];
      if(or__3824__auto____10403) {
        return or__3824__auto____10403
      }else {
        var or__3824__auto____10404 = cljs.core._get_method["_"];
        if(or__3824__auto____10404) {
          return or__3824__auto____10404
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____10409 = mf;
    if(and__3822__auto____10409) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____10409
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2359__auto____10410 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10411 = cljs.core._methods[goog.typeOf(x__2359__auto____10410)];
      if(or__3824__auto____10411) {
        return or__3824__auto____10411
      }else {
        var or__3824__auto____10412 = cljs.core._methods["_"];
        if(or__3824__auto____10412) {
          return or__3824__auto____10412
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____10417 = mf;
    if(and__3822__auto____10417) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____10417
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2359__auto____10418 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10419 = cljs.core._prefers[goog.typeOf(x__2359__auto____10418)];
      if(or__3824__auto____10419) {
        return or__3824__auto____10419
      }else {
        var or__3824__auto____10420 = cljs.core._prefers["_"];
        if(or__3824__auto____10420) {
          return or__3824__auto____10420
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____10425 = mf;
    if(and__3822__auto____10425) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____10425
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2359__auto____10426 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____10427 = cljs.core._dispatch[goog.typeOf(x__2359__auto____10426)];
      if(or__3824__auto____10427) {
        return or__3824__auto____10427
      }else {
        var or__3824__auto____10428 = cljs.core._dispatch["_"];
        if(or__3824__auto____10428) {
          return or__3824__auto____10428
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__10431 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__10432 = cljs.core._get_method.call(null, mf, dispatch_val__10431);
  if(cljs.core.truth_(target_fn__10432)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__10431)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__10432, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10433 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__10434 = this;
  cljs.core.swap_BANG_.call(null, this__10434.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10434.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10434.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__10434.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10435 = this;
  cljs.core.swap_BANG_.call(null, this__10435.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10435.method_cache, this__10435.method_table, this__10435.cached_hierarchy, this__10435.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10436 = this;
  cljs.core.swap_BANG_.call(null, this__10436.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10436.method_cache, this__10436.method_table, this__10436.cached_hierarchy, this__10436.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10437 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10437.cached_hierarchy), cljs.core.deref.call(null, this__10437.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10437.method_cache, this__10437.method_table, this__10437.cached_hierarchy, this__10437.hierarchy)
  }
  var temp__3971__auto____10438 = cljs.core.deref.call(null, this__10437.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____10438)) {
    var target_fn__10439 = temp__3971__auto____10438;
    return target_fn__10439
  }else {
    var temp__3971__auto____10440 = cljs.core.find_and_cache_best_method.call(null, this__10437.name, dispatch_val, this__10437.hierarchy, this__10437.method_table, this__10437.prefer_table, this__10437.method_cache, this__10437.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____10440)) {
      var target_fn__10441 = temp__3971__auto____10440;
      return target_fn__10441
    }else {
      return cljs.core.deref.call(null, this__10437.method_table).call(null, this__10437.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10442 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10442.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10442.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10442.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10442.method_cache, this__10442.method_table, this__10442.cached_hierarchy, this__10442.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10443 = this;
  return cljs.core.deref.call(null, this__10443.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10444 = this;
  return cljs.core.deref.call(null, this__10444.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10445 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10445.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10447__delegate = function(_, args) {
    var self__10446 = this;
    return cljs.core._dispatch.call(null, self__10446, args)
  };
  var G__10447 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10447__delegate.call(this, _, args)
  };
  G__10447.cljs$lang$maxFixedArity = 1;
  G__10447.cljs$lang$applyTo = function(arglist__10448) {
    var _ = cljs.core.first(arglist__10448);
    var args = cljs.core.rest(arglist__10448);
    return G__10447__delegate(_, args)
  };
  G__10447.cljs$lang$arity$variadic = G__10447__delegate;
  return G__10447
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10449 = this;
  return cljs.core._dispatch.call(null, self__10449, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10450 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10452, _) {
  var this__10451 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10451.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10453 = this;
  var and__3822__auto____10454 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____10454) {
    return this__10453.uuid === other.uuid
  }else {
    return and__3822__auto____10454
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10455 = this;
  var this__10456 = this;
  return cljs.core.pr_str.call(null, this__10456)
};
cljs.core.UUID;
goog.provide("hlisp.repl");
goog.require("cljs.core");
goog.provide("hlisp.interp");
goog.require("cljs.core");
hlisp.interp.mkenv = function() {
  var mkenv = null;
  var mkenv__0 = function() {
    return cljs.core.ObjMap.fromObject(["\ufdd0'parent", "\ufdd0'dict"], {"\ufdd0'parent":null, "\ufdd0'dict":cljs.core.ObjMap.EMPTY})
  };
  var mkenv__1 = function(env) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'parent", "\ufdd0'dict"], {"\ufdd0'parent":env, "\ufdd0'dict":cljs.core.ObjMap.EMPTY})
  };
  mkenv = function(env) {
    switch(arguments.length) {
      case 0:
        return mkenv__0.call(this);
      case 1:
        return mkenv__1.call(this, env)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mkenv.cljs$lang$arity$0 = mkenv__0;
  mkenv.cljs$lang$arity$1 = mkenv__1;
  return mkenv
}();
hlisp.interp.analyze_error = function analyze_error(expr) {
  throw new Error("analyze error");
};
hlisp.interp.analyze = function analyze(expr) {
  return hlisp.interp.analyze_error.call(null, expr)
};
hlisp.interp.eval = function eval(expr, env) {
  return hlisp.interp.analyze.call(null, expr).call(null, env)
};
goog.provide("cljs.reader");
goog.require("cljs.core");
goog.require("goog.string");
cljs.reader.PushbackReader = {};
cljs.reader.read_char = function read_char(reader) {
  if(function() {
    var and__3822__auto____10462 = reader;
    if(and__3822__auto____10462) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto____10462
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    var x__2359__auto____10463 = reader == null ? null : reader;
    return function() {
      var or__3824__auto____10464 = cljs.reader.read_char[goog.typeOf(x__2359__auto____10463)];
      if(or__3824__auto____10464) {
        return or__3824__auto____10464
      }else {
        var or__3824__auto____10465 = cljs.reader.read_char["_"];
        if(or__3824__auto____10465) {
          return or__3824__auto____10465
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto____10470 = reader;
    if(and__3822__auto____10470) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto____10470
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    var x__2359__auto____10471 = reader == null ? null : reader;
    return function() {
      var or__3824__auto____10472 = cljs.reader.unread[goog.typeOf(x__2359__auto____10471)];
      if(or__3824__auto____10472) {
        return or__3824__auto____10472
      }else {
        var or__3824__auto____10473 = cljs.reader.unread["_"];
        if(or__3824__auto____10473) {
          return or__3824__auto____10473
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.unread", reader);
        }
      }
    }().call(null, reader, ch)
  }
};
cljs.reader.StringPushbackReader = function(s, index_atom, buffer_atom) {
  this.s = s;
  this.index_atom = index_atom;
  this.buffer_atom = buffer_atom
};
cljs.reader.StringPushbackReader.cljs$lang$type = true;
cljs.reader.StringPushbackReader.cljs$lang$ctorPrSeq = function(this__2305__auto__) {
  return cljs.core.list.call(null, "cljs.reader/StringPushbackReader")
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$ = true;
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$read_char$arity$1 = function(reader) {
  var this__10474 = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, this__10474.buffer_atom))) {
    var idx__10475 = cljs.core.deref.call(null, this__10474.index_atom);
    cljs.core.swap_BANG_.call(null, this__10474.index_atom, cljs.core.inc);
    return this__10474.s[idx__10475]
  }else {
    var buf__10476 = cljs.core.deref.call(null, this__10474.buffer_atom);
    cljs.core.swap_BANG_.call(null, this__10474.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf__10476)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var this__10477 = this;
  return cljs.core.swap_BANG_.call(null, this__10477.buffer_atom, function(p1__10457_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__10457_SHARP_)
  })
};
cljs.reader.StringPushbackReader;
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto____10479 = goog.string.isBreakingWhitespace(ch);
  if(cljs.core.truth_(or__3824__auto____10479)) {
    return or__3824__auto____10479
  }else {
    return"," === ch
  }
};
cljs.reader.numeric_QMARK_ = function numeric_QMARK_(ch) {
  return goog.string.isNumeric(ch)
};
cljs.reader.comment_prefix_QMARK_ = function comment_prefix_QMARK_(ch) {
  return";" === ch
};
cljs.reader.number_literal_QMARK_ = function number_literal_QMARK_(reader, initch) {
  var or__3824__auto____10484 = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto____10484) {
    return or__3824__auto____10484
  }else {
    var and__3822__auto____10486 = function() {
      var or__3824__auto____10485 = "+" === initch;
      if(or__3824__auto____10485) {
        return or__3824__auto____10485
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto____10486)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch__10487 = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch__10487);
        return next_ch__10487
      }())
    }else {
      return and__3822__auto____10486
    }
  }
};
cljs.reader.reader_error = function() {
  var reader_error__delegate = function(rdr, msg) {
    throw new Error(cljs.core.apply.call(null, cljs.core.str, msg));
  };
  var reader_error = function(rdr, var_args) {
    var msg = null;
    if(goog.isDef(var_args)) {
      msg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return reader_error__delegate.call(this, rdr, msg)
  };
  reader_error.cljs$lang$maxFixedArity = 1;
  reader_error.cljs$lang$applyTo = function(arglist__10488) {
    var rdr = cljs.core.first(arglist__10488);
    var msg = cljs.core.rest(arglist__10488);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto____10492 = !(ch === "#");
  if(and__3822__auto____10492) {
    var and__3822__auto____10493 = !(ch === "'");
    if(and__3822__auto____10493) {
      var and__3822__auto____10494 = !(ch === ":");
      if(and__3822__auto____10494) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____10494
      }
    }else {
      return and__3822__auto____10493
    }
  }else {
    return and__3822__auto____10492
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb__10499 = new goog.string.StringBuffer(initch);
  var ch__10500 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto____10501 = ch__10500 == null;
      if(or__3824__auto____10501) {
        return or__3824__auto____10501
      }else {
        var or__3824__auto____10502 = cljs.reader.whitespace_QMARK_.call(null, ch__10500);
        if(or__3824__auto____10502) {
          return or__3824__auto____10502
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch__10500)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch__10500);
      return sb__10499.toString()
    }else {
      var G__10503 = function() {
        sb__10499.append(ch__10500);
        return sb__10499
      }();
      var G__10504 = cljs.reader.read_char.call(null, rdr);
      sb__10499 = G__10503;
      ch__10500 = G__10504;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch__10508 = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto____10509 = ch__10508 === "n";
      if(or__3824__auto____10509) {
        return or__3824__auto____10509
      }else {
        var or__3824__auto____10510 = ch__10508 === "r";
        if(or__3824__auto____10510) {
          return or__3824__auto____10510
        }else {
          return ch__10508 == null
        }
      }
    }()) {
      return reader
    }else {
      continue
    }
    break
  }
};
cljs.reader.int_pattern = cljs.core.re_pattern.call(null, "([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+)|0[0-9]+)(N)?");
cljs.reader.ratio_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+)/([0-9]+)");
cljs.reader.float_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+(\\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?");
cljs.reader.symbol_pattern = cljs.core.re_pattern.call(null, "[:]?([^0-9/].*/)?([^0-9/][^/]*)");
cljs.reader.re_find_STAR_ = function re_find_STAR_(re, s) {
  var matches__10512 = re.exec(s);
  if(matches__10512 == null) {
    return null
  }else {
    if(matches__10512.length === 1) {
      return matches__10512[0]
    }else {
      return matches__10512
    }
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups__10520 = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3__10521 = groups__10520[2];
  if(!function() {
    var or__3824__auto____10522 = group3__10521 == null;
    if(or__3824__auto____10522) {
      return or__3824__auto____10522
    }else {
      return group3__10521.length < 1
    }
  }()) {
    return 0
  }else {
    var negate__10523 = "-" === groups__10520[1] ? -1 : 1;
    var a__10524 = cljs.core.truth_(groups__10520[3]) ? [groups__10520[3], 10] : cljs.core.truth_(groups__10520[4]) ? [groups__10520[4], 16] : cljs.core.truth_(groups__10520[5]) ? [groups__10520[5], 8] : cljs.core.truth_(groups__10520[7]) ? [groups__10520[7], parseInt(groups__10520[7])] : "\ufdd0'default" ? [null, null] : null;
    var n__10525 = a__10524[0];
    var radix__10526 = a__10524[1];
    if(n__10525 == null) {
      return null
    }else {
      return negate__10523 * parseInt(n__10525, radix__10526)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups__10530 = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator__10531 = groups__10530[1];
  var denominator__10532 = groups__10530[2];
  return parseInt(numinator__10531) / parseInt(denominator__10532)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches__10535 = re.exec(s);
  if(function() {
    var and__3822__auto____10536 = !(matches__10535 == null);
    if(and__3822__auto____10536) {
      return matches__10535[0] === s
    }else {
      return and__3822__auto____10536
    }
  }()) {
    if(matches__10535.length === 1) {
      return matches__10535[0]
    }else {
      return matches__10535
    }
  }else {
    return null
  }
};
cljs.reader.match_number = function match_number(s) {
  if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.int_pattern, s))) {
    return cljs.reader.match_int.call(null, s)
  }else {
    if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.ratio_pattern, s))) {
      return cljs.reader.match_ratio.call(null, s)
    }else {
      if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.float_pattern, s))) {
        return cljs.reader.match_float.call(null, s)
      }else {
        return null
      }
    }
  }
};
cljs.reader.escape_char_map = function escape_char_map(c) {
  if(c === "t") {
    return"\t"
  }else {
    if(c === "r") {
      return"\r"
    }else {
      if(c === "n") {
        return"\n"
      }else {
        if(c === "\\") {
          return"\\"
        }else {
          if(c === '"') {
            return'"'
          }else {
            if(c === "b") {
              return"\u0008"
            }else {
              if(c === "f") {
                return"\u000c"
              }else {
                if("\ufdd0'else") {
                  return null
                }else {
                  return null
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.reader.read_2_chars = function read_2_chars(reader) {
  return(new goog.string.StringBuffer(cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader))).toString()
};
cljs.reader.read_4_chars = function read_4_chars(reader) {
  return(new goog.string.StringBuffer(cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader))).toString()
};
cljs.reader.unicode_2_pattern = cljs.core.re_pattern.call(null, "[0-9A-Fa-f]{2}");
cljs.reader.unicode_4_pattern = cljs.core.re_pattern.call(null, "[0-9A-Fa-f]{4}");
cljs.reader.validate_unicode_escape = function validate_unicode_escape(unicode_pattern, reader, escape_char, unicode_str) {
  if(cljs.core.truth_(cljs.core.re_matches.call(null, unicode_pattern, unicode_str))) {
    return unicode_str
  }else {
    return cljs.reader.reader_error.call(null, reader, "Unexpected unicode escape \\", escape_char, unicode_str)
  }
};
cljs.reader.make_unicode_char = function make_unicode_char(code_str) {
  var code__10538 = parseInt(code_str, 16);
  return String.fromCharCode(code__10538)
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch__10541 = cljs.reader.read_char.call(null, reader);
  var mapresult__10542 = cljs.reader.escape_char_map.call(null, ch__10541);
  if(cljs.core.truth_(mapresult__10542)) {
    return mapresult__10542
  }else {
    if(ch__10541 === "x") {
      return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_2_pattern, reader, ch__10541, cljs.reader.read_2_chars.call(null, reader)))
    }else {
      if(ch__10541 === "u") {
        return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_4_pattern, reader, ch__10541, cljs.reader.read_4_chars.call(null, reader)))
      }else {
        if(cljs.reader.numeric_QMARK_.call(null, ch__10541)) {
          return String.fromCharCode(ch__10541)
        }else {
          if("\ufdd0'else") {
            return cljs.reader.reader_error.call(null, reader, "Unexpected unicode escape \\", ch__10541)
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch__10544 = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch__10544))) {
      var G__10545 = cljs.reader.read_char.call(null, rdr);
      ch__10544 = G__10545;
      continue
    }else {
      return ch__10544
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a__10552 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    var ch__10553 = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch__10553)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF")
    }
    if(delim === ch__10553) {
      return cljs.core.persistent_BANG_.call(null, a__10552)
    }else {
      var temp__3971__auto____10554 = cljs.reader.macros.call(null, ch__10553);
      if(cljs.core.truth_(temp__3971__auto____10554)) {
        var macrofn__10555 = temp__3971__auto____10554;
        var mret__10556 = macrofn__10555.call(null, rdr, ch__10553);
        var G__10558 = mret__10556 === rdr ? a__10552 : cljs.core.conj_BANG_.call(null, a__10552, mret__10556);
        a__10552 = G__10558;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch__10553);
        var o__10557 = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__10559 = o__10557 === rdr ? a__10552 : cljs.core.conj_BANG_.call(null, a__10552, o__10557);
        a__10552 = G__10559;
        continue
      }
    }
    break
  }
};
cljs.reader.not_implemented = function not_implemented(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Reader for ", ch, " not implemented yet")
};
cljs.reader.read_dispatch = function read_dispatch(rdr, _) {
  var ch__10564 = cljs.reader.read_char.call(null, rdr);
  var dm__10565 = cljs.reader.dispatch_macros.call(null, ch__10564);
  if(cljs.core.truth_(dm__10565)) {
    return dm__10565.call(null, rdr, _)
  }else {
    var temp__3971__auto____10566 = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch__10564);
    if(cljs.core.truth_(temp__3971__auto____10566)) {
      var obj__10567 = temp__3971__auto____10566;
      return obj__10567
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch__10564)
    }
  }
};
cljs.reader.read_unmatched_delimiter = function read_unmatched_delimiter(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Unmached delimiter ", ch)
};
cljs.reader.read_list = function read_list(rdr, _) {
  return cljs.core.apply.call(null, cljs.core.list, cljs.reader.read_delimited_list.call(null, ")", rdr, true))
};
cljs.reader.read_comment = cljs.reader.skip_line;
cljs.reader.read_vector = function read_vector(rdr, _) {
  return cljs.reader.read_delimited_list.call(null, "]", rdr, true)
};
cljs.reader.read_map = function read_map(rdr, _) {
  var l__10569 = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l__10569))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l__10569)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer__10576 = new goog.string.StringBuffer(initch);
  var ch__10577 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____10578 = ch__10577 == null;
      if(or__3824__auto____10578) {
        return or__3824__auto____10578
      }else {
        var or__3824__auto____10579 = cljs.reader.whitespace_QMARK_.call(null, ch__10577);
        if(or__3824__auto____10579) {
          return or__3824__auto____10579
        }else {
          return cljs.reader.macros.call(null, ch__10577)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch__10577);
      var s__10580 = buffer__10576.toString();
      var or__3824__auto____10581 = cljs.reader.match_number.call(null, s__10580);
      if(cljs.core.truth_(or__3824__auto____10581)) {
        return or__3824__auto____10581
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s__10580, "]")
      }
    }else {
      var G__10582 = function() {
        buffer__10576.append(ch__10577);
        return buffer__10576
      }();
      var G__10583 = cljs.reader.read_char.call(null, reader);
      buffer__10576 = G__10582;
      ch__10577 = G__10583;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer__10586 = new goog.string.StringBuffer;
  var ch__10587 = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch__10587 == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading string")
    }else {
      if("\\" === ch__10587) {
        var G__10588 = function() {
          buffer__10586.append(cljs.reader.escape_char.call(null, buffer__10586, reader));
          return buffer__10586
        }();
        var G__10589 = cljs.reader.read_char.call(null, reader);
        buffer__10586 = G__10588;
        ch__10587 = G__10589;
        continue
      }else {
        if('"' === ch__10587) {
          return buffer__10586.toString()
        }else {
          if("\ufdd0'default") {
            var G__10590 = function() {
              buffer__10586.append(ch__10587);
              return buffer__10586
            }();
            var G__10591 = cljs.reader.read_char.call(null, reader);
            buffer__10586 = G__10590;
            ch__10587 = G__10591;
            continue
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.special_symbols = function special_symbols(t, not_found) {
  if(t === "nil") {
    return null
  }else {
    if(t === "true") {
      return true
    }else {
      if(t === "false") {
        return false
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.reader.read_symbol = function read_symbol(reader, initch) {
  var token__10593 = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains(token__10593, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token__10593, 0, token__10593.indexOf("/")), cljs.core.subs.call(null, token__10593, token__10593.indexOf("/") + 1, token__10593.length))
  }else {
    return cljs.reader.special_symbols.call(null, token__10593, cljs.core.symbol.call(null, token__10593))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token__10603 = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a__10604 = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token__10603);
  var token__10605 = a__10604[0];
  var ns__10606 = a__10604[1];
  var name__10607 = a__10604[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto____10609 = function() {
      var and__3822__auto____10608 = !(void 0 === ns__10606);
      if(and__3822__auto____10608) {
        return ns__10606.substring(ns__10606.length - 2, ns__10606.length) === ":/"
      }else {
        return and__3822__auto____10608
      }
    }();
    if(cljs.core.truth_(or__3824__auto____10609)) {
      return or__3824__auto____10609
    }else {
      var or__3824__auto____10610 = name__10607[name__10607.length - 1] === ":";
      if(or__3824__auto____10610) {
        return or__3824__auto____10610
      }else {
        return!(token__10605.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__10605)
  }else {
    if(function() {
      var and__3822__auto____10611 = !(ns__10606 == null);
      if(and__3822__auto____10611) {
        return ns__10606.length > 0
      }else {
        return and__3822__auto____10611
      }
    }()) {
      return cljs.core.keyword.call(null, ns__10606.substring(0, ns__10606.indexOf("/")), name__10607)
    }else {
      return cljs.core.keyword.call(null, token__10605)
    }
  }
};
cljs.reader.desugar_meta = function desugar_meta(f) {
  if(cljs.core.symbol_QMARK_.call(null, f)) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
  }else {
    if(cljs.core.string_QMARK_.call(null, f)) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
    }else {
      if(cljs.core.keyword_QMARK_.call(null, f)) {
        return cljs.core.PersistentArrayMap.fromArrays([f], [true])
      }else {
        if("\ufdd0'else") {
          return f
        }else {
          return null
        }
      }
    }
  }
};
cljs.reader.wrapping_reader = function wrapping_reader(sym) {
  return function(rdr, _) {
    return cljs.core.list.call(null, sym, cljs.reader.read.call(null, rdr, true, null, true))
  }
};
cljs.reader.throwing_reader = function throwing_reader(msg) {
  return function(rdr, _) {
    return cljs.reader.reader_error.call(null, rdr, msg)
  }
};
cljs.reader.read_meta = function read_meta(rdr, _) {
  var m__10617 = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m__10617)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o__10618 = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__10619__10620 = o__10618;
    if(G__10619__10620) {
      if(function() {
        var or__3824__auto____10621 = G__10619__10620.cljs$lang$protocol_mask$partition0$ & 262144;
        if(or__3824__auto____10621) {
          return or__3824__auto____10621
        }else {
          return G__10619__10620.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__10619__10620.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__10619__10620)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__10619__10620)
    }
  }()) {
    return cljs.core.with_meta.call(null, o__10618, cljs.core.merge.call(null, cljs.core.meta.call(null, o__10618), m__10617))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Metadata can only be applied to IWithMetas")
  }
};
cljs.reader.read_set = function read_set(rdr, _) {
  return cljs.core.set.call(null, cljs.reader.read_delimited_list.call(null, "}", rdr, true))
};
cljs.reader.read_regex = function read_regex(rdr, ch) {
  return cljs.core.re_pattern.call(null, cljs.reader.read_string_STAR_.call(null, rdr, ch))
};
cljs.reader.read_discard = function read_discard(rdr, _) {
  cljs.reader.read.call(null, rdr, true, null, true);
  return rdr
};
cljs.reader.macros = function macros(c) {
  if(c === '"') {
    return cljs.reader.read_string_STAR_
  }else {
    if(c === ":") {
      return cljs.reader.read_keyword
    }else {
      if(c === ";") {
        return cljs.reader.not_implemented
      }else {
        if(c === "'") {
          return cljs.reader.wrapping_reader.call(null, "\ufdd1'quote")
        }else {
          if(c === "@") {
            return cljs.reader.wrapping_reader.call(null, "\ufdd1'deref")
          }else {
            if(c === "^") {
              return cljs.reader.read_meta
            }else {
              if(c === "`") {
                return cljs.reader.not_implemented
              }else {
                if(c === "~") {
                  return cljs.reader.not_implemented
                }else {
                  if(c === "(") {
                    return cljs.reader.read_list
                  }else {
                    if(c === ")") {
                      return cljs.reader.read_unmatched_delimiter
                    }else {
                      if(c === "[") {
                        return cljs.reader.read_vector
                      }else {
                        if(c === "]") {
                          return cljs.reader.read_unmatched_delimiter
                        }else {
                          if(c === "{") {
                            return cljs.reader.read_map
                          }else {
                            if(c === "}") {
                              return cljs.reader.read_unmatched_delimiter
                            }else {
                              if(c === "\\") {
                                return cljs.reader.read_char
                              }else {
                                if(c === "%") {
                                  return cljs.reader.not_implemented
                                }else {
                                  if(c === "#") {
                                    return cljs.reader.read_dispatch
                                  }else {
                                    if("\ufdd0'else") {
                                      return null
                                    }else {
                                      return null
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.reader.dispatch_macros = function dispatch_macros(s) {
  if(s === "{") {
    return cljs.reader.read_set
  }else {
    if(s === "<") {
      return cljs.reader.throwing_reader.call(null, "Unreadable form")
    }else {
      if(s === '"') {
        return cljs.reader.read_regex
      }else {
        if(s === "!") {
          return cljs.reader.read_comment
        }else {
          if(s === "_") {
            return cljs.reader.read_discard
          }else {
            if("\ufdd0'else") {
              return null
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.reader.read = function read(reader, eof_is_error, sentinel, is_recursive) {
  while(true) {
    var ch__10625 = cljs.reader.read_char.call(null, reader);
    if(ch__10625 == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch__10625)) {
        var G__10628 = reader;
        var G__10629 = eof_is_error;
        var G__10630 = sentinel;
        var G__10631 = is_recursive;
        reader = G__10628;
        eof_is_error = G__10629;
        sentinel = G__10630;
        is_recursive = G__10631;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch__10625)) {
          var G__10632 = cljs.reader.read_comment.call(null, reader, ch__10625);
          var G__10633 = eof_is_error;
          var G__10634 = sentinel;
          var G__10635 = is_recursive;
          reader = G__10632;
          eof_is_error = G__10633;
          sentinel = G__10634;
          is_recursive = G__10635;
          continue
        }else {
          if("\ufdd0'else") {
            var f__10626 = cljs.reader.macros.call(null, ch__10625);
            var res__10627 = cljs.core.truth_(f__10626) ? f__10626.call(null, reader, ch__10625) : cljs.reader.number_literal_QMARK_.call(null, reader, ch__10625) ? cljs.reader.read_number.call(null, reader, ch__10625) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch__10625) : null;
            if(res__10627 === reader) {
              var G__10636 = reader;
              var G__10637 = eof_is_error;
              var G__10638 = sentinel;
              var G__10639 = is_recursive;
              reader = G__10636;
              eof_is_error = G__10637;
              sentinel = G__10638;
              is_recursive = G__10639;
              continue
            }else {
              return res__10627
            }
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.read_string = function read_string(s) {
  var r__10641 = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r__10641, true, null, false)
};
cljs.reader.zero_fill_right = function zero_fill_right(s, width) {
  if(cljs.core._EQ_.call(null, width, cljs.core.count.call(null, s))) {
    return s
  }else {
    if(width < cljs.core.count.call(null, s)) {
      return s.substring(0, width)
    }else {
      if("\ufdd0'else") {
        var b__10643 = new goog.string.StringBuffer(s);
        while(true) {
          if(b__10643.getLength() < width) {
            var G__10644 = b__10643.append("0");
            b__10643 = G__10644;
            continue
          }else {
            return b__10643.toString()
          }
          break
        }
      }else {
        return null
      }
    }
  }
};
cljs.reader.divisible_QMARK_ = function divisible_QMARK_(num, div) {
  return num % div === 0
};
cljs.reader.indivisible_QMARK_ = function indivisible_QMARK_(num, div) {
  return cljs.core.not.call(null, cljs.reader.divisible_QMARK_.call(null, num, div))
};
cljs.reader.leap_year_QMARK_ = function leap_year_QMARK_(year) {
  var and__3822__auto____10647 = cljs.reader.divisible_QMARK_.call(null, year, 4);
  if(cljs.core.truth_(and__3822__auto____10647)) {
    var or__3824__auto____10648 = cljs.reader.indivisible_QMARK_.call(null, year, 100);
    if(cljs.core.truth_(or__3824__auto____10648)) {
      return or__3824__auto____10648
    }else {
      return cljs.reader.divisible_QMARK_.call(null, year, 400)
    }
  }else {
    return and__3822__auto____10647
  }
};
cljs.reader.days_in_month = function() {
  var dim_norm__10653 = cljs.core.PersistentVector.fromArray([null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  var dim_leap__10654 = cljs.core.PersistentVector.fromArray([null, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  return function(month, leap_year_QMARK_) {
    return cljs.core._lookup.call(null, cljs.core.truth_(leap_year_QMARK_) ? dim_leap__10654 : dim_norm__10653, month, null)
  }
}();
cljs.reader.parse_and_validate_timestamp = function() {
  var timestamp__10655 = /(\d\d\d\d)(?:-(\d\d)(?:-(\d\d)(?:[T](\d\d)(?::(\d\d)(?::(\d\d)(?:[.](\d+))?)?)?)?)?)?(?:[Z]|([-+])(\d\d):(\d\d))?/;
  var check__10657 = function(low, n, high, msg) {
    if(function() {
      var and__3822__auto____10656 = low <= n;
      if(and__3822__auto____10656) {
        return n <= high
      }else {
        return and__3822__auto____10656
      }
    }()) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str(msg), cljs.core.str(" Failed:  "), cljs.core.str(low), cljs.core.str("<="), cljs.core.str(n), cljs.core.str("<="), cljs.core.str(high)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'<=", "\ufdd1'low", "\ufdd1'n", "\ufdd1'high"), cljs.core.hash_map("\ufdd0'line", 474))))].join(""));
    }
    return n
  };
  return function(ts) {
    var temp__3974__auto____10658 = cljs.core.map.call(null, cljs.core.vec, cljs.core.split_at.call(null, 8, cljs.core.re_matches.call(null, timestamp__10655, ts)));
    if(cljs.core.truth_(temp__3974__auto____10658)) {
      var vec__10659__10662 = temp__3974__auto____10658;
      var vec__10660__10663 = cljs.core.nth.call(null, vec__10659__10662, 0, null);
      var ___10664 = cljs.core.nth.call(null, vec__10660__10663, 0, null);
      var years__10665 = cljs.core.nth.call(null, vec__10660__10663, 1, null);
      var months__10666 = cljs.core.nth.call(null, vec__10660__10663, 2, null);
      var days__10667 = cljs.core.nth.call(null, vec__10660__10663, 3, null);
      var hours__10668 = cljs.core.nth.call(null, vec__10660__10663, 4, null);
      var minutes__10669 = cljs.core.nth.call(null, vec__10660__10663, 5, null);
      var seconds__10670 = cljs.core.nth.call(null, vec__10660__10663, 6, null);
      var milliseconds__10671 = cljs.core.nth.call(null, vec__10660__10663, 7, null);
      var vec__10661__10672 = cljs.core.nth.call(null, vec__10659__10662, 1, null);
      var ___10673 = cljs.core.nth.call(null, vec__10661__10672, 0, null);
      var ___10674 = cljs.core.nth.call(null, vec__10661__10672, 1, null);
      var ___10675 = cljs.core.nth.call(null, vec__10661__10672, 2, null);
      var V__10676 = vec__10659__10662;
      var vec__10677__10680 = cljs.core.map.call(null, function(v) {
        return cljs.core.map.call(null, function(p1__10652_SHARP_) {
          return parseInt(p1__10652_SHARP_)
        }, v)
      }, cljs.core.map.call(null, function(p1__10650_SHARP_, p2__10649_SHARP_) {
        return cljs.core.update_in.call(null, p2__10649_SHARP_, cljs.core.PersistentVector.fromArray([0], true), p1__10650_SHARP_)
      }, cljs.core.PersistentVector.fromArray([cljs.core.constantly.call(null, null), function(p1__10651_SHARP_) {
        if(cljs.core._EQ_.call(null, p1__10651_SHARP_, "-")) {
          return"-1"
        }else {
          return"1"
        }
      }], true), V__10676));
      var vec__10678__10681 = cljs.core.nth.call(null, vec__10677__10680, 0, null);
      var ___10682 = cljs.core.nth.call(null, vec__10678__10681, 0, null);
      var y__10683 = cljs.core.nth.call(null, vec__10678__10681, 1, null);
      var mo__10684 = cljs.core.nth.call(null, vec__10678__10681, 2, null);
      var d__10685 = cljs.core.nth.call(null, vec__10678__10681, 3, null);
      var h__10686 = cljs.core.nth.call(null, vec__10678__10681, 4, null);
      var m__10687 = cljs.core.nth.call(null, vec__10678__10681, 5, null);
      var s__10688 = cljs.core.nth.call(null, vec__10678__10681, 6, null);
      var ms__10689 = cljs.core.nth.call(null, vec__10678__10681, 7, null);
      var vec__10679__10690 = cljs.core.nth.call(null, vec__10677__10680, 1, null);
      var offset_sign__10691 = cljs.core.nth.call(null, vec__10679__10690, 0, null);
      var offset_hours__10692 = cljs.core.nth.call(null, vec__10679__10690, 1, null);
      var offset_minutes__10693 = cljs.core.nth.call(null, vec__10679__10690, 2, null);
      var offset__10694 = offset_sign__10691 * (offset_hours__10692 * 60 + offset_minutes__10693);
      return cljs.core.PersistentVector.fromArray([cljs.core.not.call(null, years__10665) ? 1970 : y__10683, cljs.core.not.call(null, months__10666) ? 1 : check__10657.call(null, 1, mo__10684, 12, "timestamp month field must be in range 1..12"), cljs.core.not.call(null, days__10667) ? 1 : check__10657.call(null, 1, d__10685, cljs.reader.days_in_month.call(null, mo__10684, cljs.reader.leap_year_QMARK_.call(null, y__10683)), "timestamp day field must be in range 1..last day in month"), cljs.core.not.call(null, 
      hours__10668) ? 0 : check__10657.call(null, 0, h__10686, 23, "timestamp hour field must be in range 0..23"), cljs.core.not.call(null, minutes__10669) ? 0 : check__10657.call(null, 0, m__10687, 59, "timestamp minute field must be in range 0..59"), cljs.core.not.call(null, seconds__10670) ? 0 : check__10657.call(null, 0, s__10688, cljs.core._EQ_.call(null, m__10687, 59) ? 60 : 59, "timestamp second field must be in range 0..60"), cljs.core.not.call(null, milliseconds__10671) ? 0 : check__10657.call(null, 
      0, ms__10689, 999, "timestamp millisecond field must be in range 0..999"), offset__10694], true)
    }else {
      return null
    }
  }
}();
cljs.reader.parse_timestamp = function parse_timestamp(ts) {
  var temp__3971__auto____10706 = cljs.reader.parse_and_validate_timestamp.call(null, ts);
  if(cljs.core.truth_(temp__3971__auto____10706)) {
    var vec__10707__10708 = temp__3971__auto____10706;
    var years__10709 = cljs.core.nth.call(null, vec__10707__10708, 0, null);
    var months__10710 = cljs.core.nth.call(null, vec__10707__10708, 1, null);
    var days__10711 = cljs.core.nth.call(null, vec__10707__10708, 2, null);
    var hours__10712 = cljs.core.nth.call(null, vec__10707__10708, 3, null);
    var minutes__10713 = cljs.core.nth.call(null, vec__10707__10708, 4, null);
    var seconds__10714 = cljs.core.nth.call(null, vec__10707__10708, 5, null);
    var ms__10715 = cljs.core.nth.call(null, vec__10707__10708, 6, null);
    var offset__10716 = cljs.core.nth.call(null, vec__10707__10708, 7, null);
    return new Date(Date.UTC(years__10709, months__10710 - 1, days__10711, hours__10712, minutes__10713, seconds__10714, ms__10715) - offset__10716 * 60 * 1E3)
  }else {
    return cljs.reader.reader_error.call(null, null, [cljs.core.str("Unrecognized date/time syntax: "), cljs.core.str(ts)].join(""))
  }
};
cljs.reader.read_date = function read_date(s) {
  if(cljs.core.string_QMARK_.call(null, s)) {
    return cljs.reader.parse_timestamp.call(null, s)
  }else {
    return cljs.reader.reader_error.call(null, null, "Instance literal expects a string for its timestamp.")
  }
};
cljs.reader.read_queue = function read_queue(elems) {
  if(cljs.core.vector_QMARK_.call(null, elems)) {
    return cljs.core.into.call(null, cljs.core.PersistentQueue.EMPTY, elems)
  }else {
    return cljs.reader.reader_error.call(null, null, "Queue literal expects a vector for its elements.")
  }
};
cljs.reader.read_uuid = function read_uuid(uuid) {
  if(cljs.core.string_QMARK_.call(null, uuid)) {
    return new cljs.core.UUID(uuid)
  }else {
    return cljs.reader.reader_error.call(null, null, "UUID literal expects a string as its representation.")
  }
};
cljs.reader._STAR_tag_table_STAR_ = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["inst", "uuid", "queue"], {"inst":cljs.reader.read_date, "uuid":cljs.reader.read_uuid, "queue":cljs.reader.read_queue}));
cljs.reader.maybe_read_tagged_type = function maybe_read_tagged_type(rdr, initch) {
  var tag__10720 = cljs.reader.read_symbol.call(null, rdr, initch);
  var temp__3971__auto____10721 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag__10720), null);
  if(cljs.core.truth_(temp__3971__auto____10721)) {
    var pfn__10722 = temp__3971__auto____10721;
    return pfn__10722.call(null, cljs.reader.read.call(null, rdr, true, null, false))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag__10720), " in ", cljs.core.pr_str.call(null, cljs.core.keys.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_))))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__10725 = cljs.core.name.call(null, tag);
  var old_parser__10726 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__10725, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__10725, f);
  return old_parser__10726
};
cljs.reader.deregister_tag_parser_BANG_ = function deregister_tag_parser_BANG_(tag) {
  var tag__10729 = cljs.core.name.call(null, tag);
  var old_parser__10730 = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__10729, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.dissoc, tag__10729);
  return old_parser__10730
};
goog.provide("hlisp.reader");
goog.require("cljs.core");
goog.require("cljs.reader");
hlisp.reader.third = function third(s) {
  return cljs.core.first.call(null, cljs.core.rest.call(null, cljs.core.rest.call(null, s)))
};
hlisp.reader.valid_tag_QMARK_ = function valid_tag_QMARK_(tag) {
  var and__3822__auto____35715 = cljs.core.string_QMARK_.call(null, tag);
  if(and__3822__auto____35715) {
    return cljs.core.re_matches.call(null, /^#?[a-zA-Z0-9_:-]+$/, tag)
  }else {
    return and__3822__auto____35715
  }
};
hlisp.reader.mkexp = function() {
  var mkexp = null;
  var mkexp__0 = function() {
    return cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'attr", "\ufdd0'chld", "\ufdd0'text", "\ufdd0'aparams", "\ufdd0'cparams", "\ufdd0'env", "\ufdd0'proc"], {"\ufdd0'type":"", "\ufdd0'attr":cljs.core.ObjMap.EMPTY, "\ufdd0'chld":cljs.core.PersistentVector.EMPTY, "\ufdd0'text":"", "\ufdd0'aparams":cljs.core.ObjMap.EMPTY, "\ufdd0'cparams":cljs.core.PersistentVector.EMPTY, "\ufdd0'env":cljs.core.ObjMap.EMPTY, "\ufdd0'proc":null})
  };
  var mkexp__1 = function(type) {
    if(cljs.core.truth_(hlisp.reader.valid_tag_QMARK_.call(null, type))) {
      return cljs.core.assoc.call(null, mkexp.call(null), "\ufdd0'type", [cljs.core.str(type)].join(""))
    }else {
      throw new Error([cljs.core.str(type), cljs.core.str(" is not a valid tag")].join(""));
    }
  };
  var mkexp__2 = function() {
    var G__35720__delegate = function(type, more) {
      return cljs.core.reduce.call(null, function(xs, x) {
        var y__35719 = cljs.core.js__GT_clj.call(null, x);
        return cljs.core.assoc.call(null, xs, cljs.core.string_QMARK_.call(null, y__35719) ? "\ufdd0'text" : cljs.core.map_QMARK_.call(null, y__35719) ? "\ufdd0'attr" : cljs.core.vector_QMARK_.call(null, y__35719) ? "\ufdd0'chld" : "\ufdd0'else" ? function() {
          throw new Error([cljs.core.str(y__35719), cljs.core.str(" is not a string, vector, or map")].join(""));
        }() : null, y__35719)
      }, mkexp.call(null, type), more)
    };
    var G__35720 = function(type, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__35720__delegate.call(this, type, more)
    };
    G__35720.cljs$lang$maxFixedArity = 1;
    G__35720.cljs$lang$applyTo = function(arglist__35721) {
      var type = cljs.core.first(arglist__35721);
      var more = cljs.core.rest(arglist__35721);
      return G__35720__delegate(type, more)
    };
    G__35720.cljs$lang$arity$variadic = G__35720__delegate;
    return G__35720
  }();
  mkexp = function(type, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return mkexp__0.call(this);
      case 1:
        return mkexp__1.call(this, type);
      default:
        return mkexp__2.cljs$lang$arity$variadic(type, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mkexp.cljs$lang$maxFixedArity = 1;
  mkexp.cljs$lang$applyTo = mkexp__2.cljs$lang$applyTo;
  mkexp.cljs$lang$arity$0 = mkexp__0;
  mkexp.cljs$lang$arity$1 = mkexp__1;
  mkexp.cljs$lang$arity$variadic = mkexp__2.cljs$lang$arity$variadic;
  return mkexp
}();
hlisp.reader.read_attrs_pairs = function read_attrs_pairs(s) {
  return cljs.core.map.call(null, function(p1__35716_SHARP_) {
    return cljs.core.list.call(null, cljs.core.first.call(null, p1__35716_SHARP_), cljs.core.string_QMARK_.call(null, cljs.core.second.call(null, p1__35716_SHARP_)) ? cljs.core.second.call(null, p1__35716_SHARP_) : [cljs.core.str(cljs.core.first.call(null, p1__35716_SHARP_))].join(""))
  }, cljs.core.filter.call(null, function(p1__35717_SHARP_) {
    return cljs.core.symbol_QMARK_.call(null, cljs.core.first.call(null, p1__35717_SHARP_))
  }, cljs.core.partition.call(null, 2, cljs.core.interleave.call(null, s, cljs.core.concat.call(null, cljs.core.rest.call(null, s), cljs.core.list.call(null, cljs.core.last.call(null, s)))))))
};
hlisp.reader.read_attrs = function read_attrs(s) {
  return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, cljs.core.vec.call(null, cljs.core.map.call(null, cljs.core.vec, hlisp.reader.read_attrs_pairs.call(null, s))))
};
hlisp.reader.read_list = function read_list(s) {
  if(cljs.core.count.call(null, s) < 1) {
    throw new Error([cljs.core.str("empty list read error")].join(""));
  }else {
    if(cljs.core.count.call(null, s) < 2) {
      return hlisp.reader.mkexp.call(null, [cljs.core.str(cljs.core.first.call(null, s))].join(""))
    }else {
      if("\ufdd0'else") {
        if(function() {
          var and__3822__auto____35723 = cljs.core.list_QMARK_.call(null, cljs.core.second.call(null, s));
          if(and__3822__auto____35723) {
            return cljs.core.list_QMARK_.call(null, cljs.core.first.call(null, cljs.core.second.call(null, s)))
          }else {
            return and__3822__auto____35723
          }
        }()) {
          return hlisp.reader.mkexp.call(null, [cljs.core.str(cljs.core.first.call(null, s))].join(""), hlisp.reader.read_attrs.call(null, cljs.core.first.call(null, cljs.core.second.call(null, s))), cljs.core.string_QMARK_.call(null, hlisp.reader.third.call(null, s)) ? cljs.core.PersistentVector.fromArray([hlisp.reader.mkexp.call(null, "#text", hlisp.reader.third.call(null, s))], true) : cljs.core.vec.call(null, cljs.core.map.call(null, hlisp.reader.read_exp, cljs.core.rest.call(null, cljs.core.rest.call(null, 
          s)))))
        }else {
          return read_list.call(null, cljs.core.concat.call(null, cljs.core.list.call(null, cljs.core.first.call(null, s), cljs.core.with_meta(cljs.core.list(cljs.core.List.EMPTY), cljs.core.hash_map("\ufdd0'line", 59))), cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }
  }
};
hlisp.reader.boxed_QMARK_ = function boxed_QMARK_(s) {
  var and__3822__auto____35726 = cljs.core.list_QMARK_.call(null, s);
  if(and__3822__auto____35726) {
    var and__3822__auto____35727 = cljs.core._EQ_.call(null, cljs.core.first.call(null, s), "\ufdd1'quote");
    if(and__3822__auto____35727) {
      return cljs.core.string_QMARK_.call(null, cljs.core.second.call(null, s))
    }else {
      return and__3822__auto____35727
    }
  }else {
    return and__3822__auto____35726
  }
};
hlisp.reader.read_exp = function read_exp(s) {
  if(cljs.core.symbol_QMARK_.call(null, s)) {
    return hlisp.reader.mkexp.call(null, [cljs.core.str(s)].join(""))
  }else {
    if(cljs.core.truth_(hlisp.reader.boxed_QMARK_.call(null, s))) {
      return hlisp.reader.read_list.call(null, cljs.core.list.call(null, "\ufdd1'val", cljs.core.second.call(null, s)))
    }else {
      if(cljs.core.list_QMARK_.call(null, s)) {
        return hlisp.reader.read_list.call(null, s)
      }else {
        if(cljs.core.vector_QMARK_.call(null, s)) {
          return hlisp.reader.read_list.call(null, cljs.core.cons.call(null, "\ufdd1'list", s))
        }else {
          if("\ufdd0'else") {
            throw new Error([cljs.core.str(s), cljs.core.str(" read error")].join(""));
          }else {
            return null
          }
        }
      }
    }
  }
};
hlisp.reader.read = function read(s) {
  return cljs.core.map.call(null, hlisp.reader.read_exp, cljs.reader.read_string.call(null, [cljs.core.str("("), cljs.core.str(s), cljs.core.str("\n"), cljs.core.str(")")].join("")))
};
hlisp.reader.doit = function doit(s) {
  return cljs.core.doall.call(null, hlisp.reader.read.call(null, s))
};
goog.provide("clojure.zip");
goog.require("cljs.core");
clojure.zip.zipper = function zipper(branch_QMARK_, children, make_node, root) {
  return cljs.core.with_meta(cljs.core.PersistentVector.fromArray([root, null], true), cljs.core.ObjMap.fromObject(["\ufdd0'zip/make-node", "\ufdd0'zip/children", "\ufdd0'zip/branch?"], {"\ufdd0'zip/make-node":make_node, "\ufdd0'zip/children":children, "\ufdd0'zip/branch?":branch_QMARK_}))
};
clojure.zip.seq_zip = function seq_zip(root) {
  return clojure.zip.zipper.call(null, cljs.core.seq_QMARK_, cljs.core.identity, function(node, children) {
    return cljs.core.with_meta.call(null, children, cljs.core.meta.call(null, node))
  }, root)
};
clojure.zip.vector_zip = function vector_zip(root) {
  return clojure.zip.zipper.call(null, cljs.core.vector_QMARK_, cljs.core.seq, function(node, children) {
    return cljs.core.with_meta.call(null, cljs.core.vec.call(null, children), cljs.core.meta.call(null, node))
  }, root)
};
clojure.zip.xml_zip = function xml_zip(root) {
  return clojure.zip.zipper.call(null, cljs.core.complement.call(null, cljs.core.string_QMARK_), cljs.core.comp.call(null, cljs.core.seq, "\ufdd0'content"), function(node, children) {
    return cljs.core.assoc.call(null, node, "\ufdd0'content", function() {
      var and__3822__auto____24657 = children;
      if(cljs.core.truth_(and__3822__auto____24657)) {
        return cljs.core.apply.call(null, cljs.core.vector, children)
      }else {
        return and__3822__auto____24657
      }
    }())
  }, root)
};
clojure.zip.node = function node(loc) {
  return loc.call(null, 0)
};
clojure.zip.branch_QMARK_ = function branch_QMARK_(loc) {
  return(new cljs.core.Keyword("\ufdd0'zip/branch?")).call(null, cljs.core.meta.call(null, loc)).call(null, clojure.zip.node.call(null, loc))
};
clojure.zip.children = function children(loc) {
  if(cljs.core.truth_(clojure.zip.branch_QMARK_.call(null, loc))) {
    return(new cljs.core.Keyword("\ufdd0'zip/children")).call(null, cljs.core.meta.call(null, loc)).call(null, clojure.zip.node.call(null, loc))
  }else {
    throw"called children on a leaf node";
  }
};
clojure.zip.make_node = function make_node(loc, node, children) {
  return(new cljs.core.Keyword("\ufdd0'zip/make-node")).call(null, cljs.core.meta.call(null, loc)).call(null, node, children)
};
clojure.zip.path = function path(loc) {
  return(new cljs.core.Keyword("\ufdd0'pnodes")).call(null, loc.call(null, 1))
};
clojure.zip.lefts = function lefts(loc) {
  return cljs.core.seq.call(null, (new cljs.core.Keyword("\ufdd0'l")).call(null, loc.call(null, 1)))
};
clojure.zip.rights = function rights(loc) {
  return(new cljs.core.Keyword("\ufdd0'r")).call(null, loc.call(null, 1))
};
clojure.zip.down = function down(loc) {
  if(cljs.core.truth_(clojure.zip.branch_QMARK_.call(null, loc))) {
    var vec__24667__24669 = loc;
    var node__24670 = cljs.core.nth.call(null, vec__24667__24669, 0, null);
    var path__24671 = cljs.core.nth.call(null, vec__24667__24669, 1, null);
    var vec__24668__24672 = clojure.zip.children.call(null, loc);
    var c__24673 = cljs.core.nth.call(null, vec__24668__24672, 0, null);
    var cnext__24674 = cljs.core.nthnext.call(null, vec__24668__24672, 1);
    var cs__24675 = vec__24668__24672;
    if(cljs.core.truth_(cs__24675)) {
      return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([c__24673, cljs.core.ObjMap.fromObject(["\ufdd0'l", "\ufdd0'pnodes", "\ufdd0'ppath", "\ufdd0'r"], {"\ufdd0'l":cljs.core.PersistentVector.EMPTY, "\ufdd0'pnodes":cljs.core.truth_(path__24671) ? cljs.core.conj.call(null, (new cljs.core.Keyword("\ufdd0'pnodes")).call(null, path__24671), node__24670) : cljs.core.PersistentVector.fromArray([node__24670], true), "\ufdd0'ppath":path__24671, "\ufdd0'r":cnext__24674})], true), 
      cljs.core.meta.call(null, loc))
    }else {
      return null
    }
  }else {
    return null
  }
};
clojure.zip.up = function up(loc) {
  var vec__24690__24692 = loc;
  var node__24693 = cljs.core.nth.call(null, vec__24690__24692, 0, null);
  var map__24691__24694 = cljs.core.nth.call(null, vec__24690__24692, 1, null);
  var map__24691__24695 = cljs.core.seq_QMARK_.call(null, map__24691__24694) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24691__24694) : map__24691__24694;
  var path__24696 = map__24691__24695;
  var l__24697 = cljs.core._lookup.call(null, map__24691__24695, "\ufdd0'l", null);
  var ppath__24698 = cljs.core._lookup.call(null, map__24691__24695, "\ufdd0'ppath", null);
  var pnodes__24699 = cljs.core._lookup.call(null, map__24691__24695, "\ufdd0'pnodes", null);
  var r__24700 = cljs.core._lookup.call(null, map__24691__24695, "\ufdd0'r", null);
  var changed_QMARK___24701 = cljs.core._lookup.call(null, map__24691__24695, "\ufdd0'changed?", null);
  if(cljs.core.truth_(pnodes__24699)) {
    var pnode__24702 = cljs.core.peek.call(null, pnodes__24699);
    return cljs.core.with_meta.call(null, cljs.core.truth_(changed_QMARK___24701) ? cljs.core.PersistentVector.fromArray([clojure.zip.make_node.call(null, loc, pnode__24702, cljs.core.concat.call(null, l__24697, cljs.core.cons.call(null, node__24693, r__24700))), function() {
      var and__3822__auto____24703 = ppath__24698;
      if(cljs.core.truth_(and__3822__auto____24703)) {
        return cljs.core.assoc.call(null, ppath__24698, "\ufdd0'changed?", true)
      }else {
        return and__3822__auto____24703
      }
    }()], true) : cljs.core.PersistentVector.fromArray([pnode__24702, ppath__24698], true), cljs.core.meta.call(null, loc))
  }else {
    return null
  }
};
clojure.zip.root = function root(loc) {
  while(true) {
    if(cljs.core._EQ_.call(null, "\ufdd0'end", loc.call(null, 1))) {
      return clojure.zip.node.call(null, loc)
    }else {
      var p__24705 = clojure.zip.up.call(null, loc);
      if(cljs.core.truth_(p__24705)) {
        var G__24706 = p__24705;
        loc = G__24706;
        continue
      }else {
        return clojure.zip.node.call(null, loc)
      }
    }
    break
  }
};
clojure.zip.right = function right(loc) {
  var vec__24721__24724 = loc;
  var node__24725 = cljs.core.nth.call(null, vec__24721__24724, 0, null);
  var map__24722__24726 = cljs.core.nth.call(null, vec__24721__24724, 1, null);
  var map__24722__24727 = cljs.core.seq_QMARK_.call(null, map__24722__24726) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24722__24726) : map__24722__24726;
  var path__24728 = map__24722__24727;
  var l__24729 = cljs.core._lookup.call(null, map__24722__24727, "\ufdd0'l", null);
  var vec__24723__24730 = cljs.core._lookup.call(null, map__24722__24727, "\ufdd0'r", null);
  var r__24731 = cljs.core.nth.call(null, vec__24723__24730, 0, null);
  var rnext__24732 = cljs.core.nthnext.call(null, vec__24723__24730, 1);
  var rs__24733 = vec__24723__24730;
  if(cljs.core.truth_(function() {
    var and__3822__auto____24734 = path__24728;
    if(cljs.core.truth_(and__3822__auto____24734)) {
      return rs__24733
    }else {
      return and__3822__auto____24734
    }
  }())) {
    return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([r__24731, cljs.core.assoc.call(null, path__24728, "\ufdd0'l", cljs.core.conj.call(null, l__24729, node__24725), "\ufdd0'r", rnext__24732)], true), cljs.core.meta.call(null, loc))
  }else {
    return null
  }
};
clojure.zip.rightmost = function rightmost(loc) {
  var vec__24745__24747 = loc;
  var node__24748 = cljs.core.nth.call(null, vec__24745__24747, 0, null);
  var map__24746__24749 = cljs.core.nth.call(null, vec__24745__24747, 1, null);
  var map__24746__24750 = cljs.core.seq_QMARK_.call(null, map__24746__24749) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24746__24749) : map__24746__24749;
  var path__24751 = map__24746__24750;
  var l__24752 = cljs.core._lookup.call(null, map__24746__24750, "\ufdd0'l", null);
  var r__24753 = cljs.core._lookup.call(null, map__24746__24750, "\ufdd0'r", null);
  if(cljs.core.truth_(function() {
    var and__3822__auto____24754 = path__24751;
    if(cljs.core.truth_(and__3822__auto____24754)) {
      return r__24753
    }else {
      return and__3822__auto____24754
    }
  }())) {
    return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([cljs.core.last.call(null, r__24753), cljs.core.assoc.call(null, path__24751, "\ufdd0'l", cljs.core.apply.call(null, cljs.core.conj, l__24752, node__24748, cljs.core.butlast.call(null, r__24753)), "\ufdd0'r", null)], true), cljs.core.meta.call(null, loc))
  }else {
    return loc
  }
};
clojure.zip.left = function left(loc) {
  var vec__24765__24767 = loc;
  var node__24768 = cljs.core.nth.call(null, vec__24765__24767, 0, null);
  var map__24766__24769 = cljs.core.nth.call(null, vec__24765__24767, 1, null);
  var map__24766__24770 = cljs.core.seq_QMARK_.call(null, map__24766__24769) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24766__24769) : map__24766__24769;
  var path__24771 = map__24766__24770;
  var l__24772 = cljs.core._lookup.call(null, map__24766__24770, "\ufdd0'l", null);
  var r__24773 = cljs.core._lookup.call(null, map__24766__24770, "\ufdd0'r", null);
  if(cljs.core.truth_(function() {
    var and__3822__auto____24774 = path__24771;
    if(cljs.core.truth_(and__3822__auto____24774)) {
      return cljs.core.seq.call(null, l__24772)
    }else {
      return and__3822__auto____24774
    }
  }())) {
    return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, l__24772), cljs.core.assoc.call(null, path__24771, "\ufdd0'l", cljs.core.pop.call(null, l__24772), "\ufdd0'r", cljs.core.cons.call(null, node__24768, r__24773))], true), cljs.core.meta.call(null, loc))
  }else {
    return null
  }
};
clojure.zip.leftmost = function leftmost(loc) {
  var vec__24785__24787 = loc;
  var node__24788 = cljs.core.nth.call(null, vec__24785__24787, 0, null);
  var map__24786__24789 = cljs.core.nth.call(null, vec__24785__24787, 1, null);
  var map__24786__24790 = cljs.core.seq_QMARK_.call(null, map__24786__24789) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24786__24789) : map__24786__24789;
  var path__24791 = map__24786__24790;
  var l__24792 = cljs.core._lookup.call(null, map__24786__24790, "\ufdd0'l", null);
  var r__24793 = cljs.core._lookup.call(null, map__24786__24790, "\ufdd0'r", null);
  if(cljs.core.truth_(function() {
    var and__3822__auto____24794 = path__24791;
    if(cljs.core.truth_(and__3822__auto____24794)) {
      return cljs.core.seq.call(null, l__24792)
    }else {
      return and__3822__auto____24794
    }
  }())) {
    return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([cljs.core.first.call(null, l__24792), cljs.core.assoc.call(null, path__24791, "\ufdd0'l", cljs.core.PersistentVector.EMPTY, "\ufdd0'r", cljs.core.concat.call(null, cljs.core.rest.call(null, l__24792), cljs.core.PersistentVector.fromArray([node__24788], true), r__24793))], true), cljs.core.meta.call(null, loc))
  }else {
    return loc
  }
};
clojure.zip.insert_left = function insert_left(loc, item) {
  var vec__24803__24805 = loc;
  var node__24806 = cljs.core.nth.call(null, vec__24803__24805, 0, null);
  var map__24804__24807 = cljs.core.nth.call(null, vec__24803__24805, 1, null);
  var map__24804__24808 = cljs.core.seq_QMARK_.call(null, map__24804__24807) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24804__24807) : map__24804__24807;
  var path__24809 = map__24804__24808;
  var l__24810 = cljs.core._lookup.call(null, map__24804__24808, "\ufdd0'l", null);
  if(path__24809 == null) {
    throw"Insert at top";
  }else {
    return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([node__24806, cljs.core.assoc.call(null, path__24809, "\ufdd0'l", cljs.core.conj.call(null, l__24810, item), "\ufdd0'changed?", true)], true), cljs.core.meta.call(null, loc))
  }
};
clojure.zip.insert_right = function insert_right(loc, item) {
  var vec__24819__24821 = loc;
  var node__24822 = cljs.core.nth.call(null, vec__24819__24821, 0, null);
  var map__24820__24823 = cljs.core.nth.call(null, vec__24819__24821, 1, null);
  var map__24820__24824 = cljs.core.seq_QMARK_.call(null, map__24820__24823) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24820__24823) : map__24820__24823;
  var path__24825 = map__24820__24824;
  var r__24826 = cljs.core._lookup.call(null, map__24820__24824, "\ufdd0'r", null);
  if(path__24825 == null) {
    throw"Insert at top";
  }else {
    return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([node__24822, cljs.core.assoc.call(null, path__24825, "\ufdd0'r", cljs.core.cons.call(null, item, r__24826), "\ufdd0'changed?", true)], true), cljs.core.meta.call(null, loc))
  }
};
clojure.zip.replace = function replace(loc, node) {
  var vec__24831__24832 = loc;
  var ___24833 = cljs.core.nth.call(null, vec__24831__24832, 0, null);
  var path__24834 = cljs.core.nth.call(null, vec__24831__24832, 1, null);
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([node, cljs.core.assoc.call(null, path__24834, "\ufdd0'changed?", true)], true), cljs.core.meta.call(null, loc))
};
clojure.zip.edit = function() {
  var edit__delegate = function(loc, f, args) {
    return clojure.zip.replace.call(null, loc, cljs.core.apply.call(null, f, clojure.zip.node.call(null, loc), args))
  };
  var edit = function(loc, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return edit__delegate.call(this, loc, f, args)
  };
  edit.cljs$lang$maxFixedArity = 2;
  edit.cljs$lang$applyTo = function(arglist__24835) {
    var loc = cljs.core.first(arglist__24835);
    var f = cljs.core.first(cljs.core.next(arglist__24835));
    var args = cljs.core.rest(cljs.core.next(arglist__24835));
    return edit__delegate(loc, f, args)
  };
  edit.cljs$lang$arity$variadic = edit__delegate;
  return edit
}();
clojure.zip.insert_child = function insert_child(loc, item) {
  return clojure.zip.replace.call(null, loc, clojure.zip.make_node.call(null, loc, clojure.zip.node.call(null, loc), cljs.core.cons.call(null, item, clojure.zip.children.call(null, loc))))
};
clojure.zip.append_child = function append_child(loc, item) {
  return clojure.zip.replace.call(null, loc, clojure.zip.make_node.call(null, loc, clojure.zip.node.call(null, loc), cljs.core.concat.call(null, clojure.zip.children.call(null, loc), cljs.core.PersistentVector.fromArray([item], true))))
};
clojure.zip.next = function next(loc) {
  if(cljs.core._EQ_.call(null, "\ufdd0'end", loc.call(null, 1))) {
    return loc
  }else {
    var or__3824__auto____24842 = function() {
      var and__3822__auto____24841 = clojure.zip.branch_QMARK_.call(null, loc);
      if(cljs.core.truth_(and__3822__auto____24841)) {
        return clojure.zip.down.call(null, loc)
      }else {
        return and__3822__auto____24841
      }
    }();
    if(cljs.core.truth_(or__3824__auto____24842)) {
      return or__3824__auto____24842
    }else {
      var or__3824__auto____24843 = clojure.zip.right.call(null, loc);
      if(cljs.core.truth_(or__3824__auto____24843)) {
        return or__3824__auto____24843
      }else {
        var p__24844 = loc;
        while(true) {
          if(cljs.core.truth_(clojure.zip.up.call(null, p__24844))) {
            var or__3824__auto____24845 = clojure.zip.right.call(null, clojure.zip.up.call(null, p__24844));
            if(cljs.core.truth_(or__3824__auto____24845)) {
              return or__3824__auto____24845
            }else {
              var G__24846 = clojure.zip.up.call(null, p__24844);
              p__24844 = G__24846;
              continue
            }
          }else {
            return cljs.core.PersistentVector.fromArray([clojure.zip.node.call(null, p__24844), "\ufdd0'end"], true)
          }
          break
        }
      }
    }
  }
};
clojure.zip.prev = function prev(loc) {
  var temp__3971__auto____24853 = clojure.zip.left.call(null, loc);
  if(cljs.core.truth_(temp__3971__auto____24853)) {
    var lloc__24854 = temp__3971__auto____24853;
    var loc__24855 = lloc__24854;
    while(true) {
      var temp__3971__auto____24857 = function() {
        var and__3822__auto____24856 = clojure.zip.branch_QMARK_.call(null, loc__24855);
        if(cljs.core.truth_(and__3822__auto____24856)) {
          return clojure.zip.down.call(null, loc__24855)
        }else {
          return and__3822__auto____24856
        }
      }();
      if(cljs.core.truth_(temp__3971__auto____24857)) {
        var child__24858 = temp__3971__auto____24857;
        var G__24859 = clojure.zip.rightmost.call(null, child__24858);
        loc__24855 = G__24859;
        continue
      }else {
        return loc__24855
      }
      break
    }
  }else {
    return clojure.zip.up.call(null, loc)
  }
};
clojure.zip.end_QMARK_ = function end_QMARK_(loc) {
  return cljs.core._EQ_.call(null, "\ufdd0'end", loc.call(null, 1))
};
clojure.zip.remove = function remove(loc) {
  var vec__24876__24878 = loc;
  var node__24879 = cljs.core.nth.call(null, vec__24876__24878, 0, null);
  var map__24877__24880 = cljs.core.nth.call(null, vec__24876__24878, 1, null);
  var map__24877__24881 = cljs.core.seq_QMARK_.call(null, map__24877__24880) ? cljs.core.apply.call(null, cljs.core.hash_map, map__24877__24880) : map__24877__24880;
  var path__24882 = map__24877__24881;
  var l__24883 = cljs.core._lookup.call(null, map__24877__24881, "\ufdd0'l", null);
  var ppath__24884 = cljs.core._lookup.call(null, map__24877__24881, "\ufdd0'ppath", null);
  var pnodes__24885 = cljs.core._lookup.call(null, map__24877__24881, "\ufdd0'pnodes", null);
  var rs__24886 = cljs.core._lookup.call(null, map__24877__24881, "\ufdd0'r", null);
  if(path__24882 == null) {
    throw"Remove at top";
  }else {
    if(cljs.core.count.call(null, l__24883) > 0) {
      var loc__24887 = cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([cljs.core.peek.call(null, l__24883), cljs.core.assoc.call(null, path__24882, "\ufdd0'l", cljs.core.pop.call(null, l__24883), "\ufdd0'changed?", true)], true), cljs.core.meta.call(null, loc));
      while(true) {
        var temp__3971__auto____24889 = function() {
          var and__3822__auto____24888 = clojure.zip.branch_QMARK_.call(null, loc__24887);
          if(cljs.core.truth_(and__3822__auto____24888)) {
            return clojure.zip.down.call(null, loc__24887)
          }else {
            return and__3822__auto____24888
          }
        }();
        if(cljs.core.truth_(temp__3971__auto____24889)) {
          var child__24890 = temp__3971__auto____24889;
          var G__24892 = clojure.zip.rightmost.call(null, child__24890);
          loc__24887 = G__24892;
          continue
        }else {
          return loc__24887
        }
        break
      }
    }else {
      return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([clojure.zip.make_node.call(null, loc, cljs.core.peek.call(null, pnodes__24885), rs__24886), function() {
        var and__3822__auto____24891 = ppath__24884;
        if(cljs.core.truth_(and__3822__auto____24891)) {
          return cljs.core.assoc.call(null, ppath__24884, "\ufdd0'changed?", true)
        }else {
          return and__3822__auto____24891
        }
      }()], true), cljs.core.meta.call(null, loc))
    }
  }
};
goog.provide("hlisp.zip");
goog.require("cljs.core");
goog.require("clojure.zip");
hlisp.zip.append_children_BANG_ = function append_children_BANG_(node, children) {
  var G__16911__16912 = cljs.core.seq.call(null, children);
  if(G__16911__16912) {
    var child__16913 = cljs.core.first.call(null, G__16911__16912);
    var G__16911__16914 = G__16911__16912;
    while(true) {
      node.appendChild(child__16913);
      var temp__3974__auto____16915 = cljs.core.next.call(null, G__16911__16914);
      if(temp__3974__auto____16915) {
        var G__16911__16916 = temp__3974__auto____16915;
        var G__16917 = cljs.core.first.call(null, G__16911__16916);
        var G__16918 = G__16911__16916;
        child__16913 = G__16917;
        G__16911__16914 = G__16918;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
hlisp.zip.dom_zip = function dom_zip(dom_node) {
  return clojure.zip.zipper.call(null, function(p1__16901_SHARP_) {
    var and__3822__auto____16922 = !(p1__16901_SHARP_ == null);
    if(and__3822__auto____16922) {
      return cljs.core._EQ_.call(null, "\ufdd0'element", hlisp.zip.node_types.call(null, p1__16901_SHARP_.nodeType))
    }else {
      return and__3822__auto____16922
    }
  }, function(p1__16902_SHARP_) {
    return hlisp.zip.nodelist_seq.call(null, p1__16902_SHARP_.childNodes)
  }, function(p1__16903_SHARP_, p2__16904_SHARP_) {
    var G__16923__16924 = p1__16903_SHARP_;
    hlisp.zip.append_children_BANG_.call(null, G__16923__16924, p2__16904_SHARP_);
    return G__16923__16924
  }, dom_node)
};
hlisp.zip.dom_seq = function dom_seq(loc) {
  return cljs.core.filter.call(null, cljs.core.identity, new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(clojure.zip.end_QMARK_.call(null, loc))) {
      return null
    }else {
      return cljs.core.cons.call(null, clojure.zip.node.call(null, loc), dom_seq.call(null, clojure.zip.next.call(null, loc)))
    }
  }, null))
};
hlisp.zip.postwalk_replace = function postwalk_replace(loc, f) {
  while(true) {
    if(cljs.core.not.call(null, clojure.zip.end_QMARK_.call(null, loc))) {
      var G__16926 = clojure.zip.next.call(null, function(loc, f) {
        return function loc(p1__16925_SHARP_) {
          return clojure.zip.replace.call(null, p1__16925_SHARP_, f.call(null, clojure.zip.node.call(null, p1__16925_SHARP_)))
        }
      }(loc, f));
      var G__16927 = f;
      loc = G__16926;
      f = G__16927;
      continue
    }else {
      return clojure.zip.node.call(null, clojure.zip.root.call(null, loc))
    }
    break
  }
};
goog.provide("hlisp.dom");
goog.require("cljs.core");
hlisp.dom.node_types = cljs.core.PersistentArrayMap.fromArrays([1], ["\ufdd0'element"]);
hlisp.dom.branch_QMARK_ = function branch_QMARK_(node) {
  var and__3822__auto____17326 = !(node == null);
  if(and__3822__auto____17326) {
    return cljs.core._EQ_.call(null, "\ufdd0'element", hlisp.dom.node_types.call(null, node.nodeType))
  }else {
    return and__3822__auto____17326
  }
};
hlisp.dom.nodelist_seq = function nodelist_seq(nodelist) {
  if(cljs.core.truth_(nodelist)) {
    var len__17329 = nodelist.length;
    return cljs.core.map.call(null, function(p1__17324_SHARP_) {
      return nodelist.item(p1__17324_SHARP_)
    }, cljs.core.range.call(null, 0, len__17329))
  }else {
    return null
  }
};
hlisp.dom.specified_attr_nodes = function specified_attr_nodes(node) {
  return cljs.core.filter.call(null, function(p1__17327_SHARP_) {
    return p1__17327_SHARP_.specified
  }, hlisp.dom.nodelist_seq.call(null, node.attributes))
};
hlisp.dom.attr_kv = function attr_kv(node, attr_node) {
  var vec__17337__17338 = attr_node.nodeName.toLowerCase();
  var x__17339 = cljs.core.nth.call(null, vec__17337__17338, 0, null);
  var ___17340 = cljs.core.nthnext.call(null, vec__17337__17338, 1);
  var s__17341 = vec__17337__17338;
  var k__17342 = cljs.core._EQ_.call(null, x__17339, "#") ? s__17341 : cljs.core.symbol.call(null, s__17341);
  var v__17343 = cljs.core._EQ_.call(null, k__17342, "style") ? node.style.cssText : attr_node.nodeValue;
  return cljs.core.list.call(null, k__17342, v__17343)
};
hlisp.dom.build_attrs = function build_attrs(node) {
  return cljs.core.list.call(null, cljs.core.mapcat.call(null, cljs.core.partial.call(null, hlisp.dom.attr_kv, node), hlisp.dom.specified_attr_nodes.call(null, node)))
};
hlisp.dom.dom__GT_list = function dom__GT_list(node) {
  return cljs.core.list_STAR_.call(null, node.nodeName.toLowerCase(), hlisp.dom.build_attrs.call(null, node), cljs.core.truth_(hlisp.dom.branch_QMARK_.call(null, node)) ? cljs.core.map.call(null, dom__GT_list, hlisp.dom.nodelist_seq.call(null, node.childNodes)) : cljs.core.list.call(null, node.nodeValue))
};
