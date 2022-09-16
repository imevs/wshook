/* eslint-disable no-proto */
/* eslint-disable accessor-pairs */
/* eslint-disable no-global-assign */
/* eslint-disable @typescript-eslint/no-this-alias */

/* wsHook.js
 * https://github.com/skepticfx/wshook
 * Reference: http://www.w3.org/TR/2011/WD-websockets-20110419/#websocket
 */

/**
 * wsHook implementation is copied from https://github.com/skepticfx/wshook for further improvements and fixing issues,
 * such as: fixed typos, implemented correct inheritance of Websocket wrapper, so it can substitute the original correctly
 * As a next improvement it is planned to rewrite wsHook on typescript
 */

var wsHook = {};
(function () {
  // Mutable MessageEvent.
  // Subclasses MessageEvent and makes data, origin and other MessageEvent properties mutable.
  function MutableMessageEvent(o) {
    this.bubbles = o.bubbles || false;
    this.cancelBubble = o.cancelBubble || false;
    this.cancelable = o.cancelable || false;
    this.currentTarget = o.currentTarget || null;
    this.data = o.data || null;
    this.defaultPrevented = o.defaultPrevented || false;
    this.eventPhase = o.eventPhase || 0;
    this.lastEventId = o.lastEventId || "";
    this.origin = o.origin || "";
    this.path = o.path || new Array(0);
    this.parts = o.parts || new Array(0);
    this.returnValue = o.returnValue || true;
    this.source = o.source || null;
    this.srcElement = o.srcElement || null;
    this.target = o.target || null;
    this.timeStamp = o.timeStamp || null;
    this.type = o.type || "message";
    this.__proto__ = o.__proto__ || MessageEvent.__proto__;
  }

  var before = wsHook.before = function (data, url, wsObject) {
    return data;
  };
  var after = wsHook.after = function (e, url, wsObject) {
    return e;
  };
  var modifyUrl = wsHook.modifyUrl = function (url) {
    return url;
  };
  wsHook.resetHooks = function () {
    wsHook.before = before;
    wsHook.after = after;
    wsHook.modifyUrl = modifyUrl;
  };

  // __extends is a polyfill for class from TS playground
  var __extends = (function () {
    var extendStatics = function (d, b) {
      extendStatics = Object.setPrototypeOf ||
        ({__proto__: []} instanceof Array && function (d, b) {
          d.__proto__ = b;
        }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }

      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  })();
  WebSocket = (function (_WS) {
    __extends(WebSocketWrapper, _WS);
    function WebSocketWrapper(url, protocols) {
      var WSObject;
      url = wsHook.modifyUrl(url) || url;
      this.url = url;
      this.protocols = protocols;
      if (!this.protocols) {
        WSObject = new _WS(url);
      } else {
        WSObject = new _WS(url, protocols);
      }

      var _send = WSObject.send;
      WSObject.send = function (data) {
        arguments[0] = wsHook.before(data, WSObject.url, WSObject) || data;
        _send.apply(this, arguments);
      };

      // Events needs to be proxied and bubbled down.
      WSObject._addEventListener = WSObject.addEventListener;
      WSObject.addEventListener = function () {
        var eventThis = this;
        // if eventName is 'message'
        if (arguments[0] === "message") {
          arguments[1] = (function (userFunc) {
            return function instrumentAddEventListener() {
              arguments[0] = wsHook.after(new MutableMessageEvent(arguments[0]), WSObject.url, WSObject);
              if (arguments[0] === null) return;
              userFunc.apply(eventThis, arguments);
            };
          })(arguments[1]);
        }
        return WSObject._addEventListener.apply(this, arguments);
      };

      Object.defineProperty(WSObject, "onmessage", {
        "set": function () {
          var eventThis = this;
          var userFunc = arguments[0];
          var onMessageHandler = function () {
            arguments[0] = wsHook.after(new MutableMessageEvent(arguments[0]), WSObject.url, WSObject);
            if (arguments[0] === null) return;
            userFunc.apply(eventThis, arguments);
          };
          WSObject._addEventListener.apply(this, ["message", onMessageHandler, false]);
        }
      });

      return WSObject;
    }
    return WebSocketWrapper;
  }(WebSocket));
})();