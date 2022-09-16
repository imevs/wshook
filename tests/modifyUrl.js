// wsHook loaded wsHook.js
describe('Simple tests using the WebSocket object', function() {
  var wsClient

  describe('Modify Url', function() {
    it('Modify the url', function(done) {
        wsHook.modifyUrl = function(url) {
          return 'wss://ws.postman-echo.com/raw';
        }
        wsClient = new WebSocket('wss://echo2.websocket.org')
        wsClient.onopen = function() {
          expect(wsClient.url).to.equal('wss://ws.postman-echo.com/raw');
          done();
        }
    })
  })
})
