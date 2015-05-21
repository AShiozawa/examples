var fs = require('fs');

var httpServer = require('http').createServer(function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.end(fs.readFileSync('client.html'));
}).listen(8000);

var WSServer = require('websocket').server;
var webSocketServer = new WSServer({
  httpServer: httpServer
});

var _ports = [196,197,198,199];
var connection;

webSocketServer.on('request', function (request) {
  connection = request.accept(null, request.origin);

  connection.on('message', function(message) {
    console.log('message:' + message.utf8Data);
    var msgJson = JSON.parse(message.utf8Data);
    var flag = false;
    for(var i in _ports){
      if(parseInt(msgJson.portno) == _ports[i]){
        flag = true;
        switch (msgJson.command) {
          case 'READ':
            readValue(_ports[i],
              function(readValue){
                connection.send(JSON.stringify({
                  'succeeded' : true,
                  'message' : readValue
                }));
              },
              function(){
                connection.send(JSON.stringify({
                  'succeeded' : true
                }));
              }
            );
            break;
          case 'GET':
            exportPin(_ports[i],
              function(){
                connection.send(JSON.stringify({
                  'succeeded' : true
                }));
              },
              function(){
                connection.send(JSON.stringify({
                  'succeeded' : false
                }));
              }
            );
            break;
          case 'WRITE':
            writeValue(_ports[i],msgJson.value,
              function(){
                connection.send(JSON.stringify({
                  'succeeded' : true
                }));
              },
              function(){
                connection.send(JSON.stringify({
                  'succeeded' : false
                }));
              }
            );
            break;
          case 'EXPORT':
            writeDirection(_ports[i],msgJson.dest,
              function(){
                connection.send(JSON.stringify({
                  'succeeded' : true
                }));
              },
              function(){
                connection.send(JSON.stringify({
                  'succeeded' : false
                }));
              }
            );
            break;
          default:
            connection.send(JSON.stringify({
              'succeeded' : false,
              'message' : 'wrong command'
            }));
            break;
        }
        break;
      }
    }
    if(!flag){
      connection.send(JSON.stringify({
        'succeeded' : false
      }));
    }
    
    
  });

  connection.on('close', function() {
    //console.log('connection closed');
  });
});

function unexportPin(pin,resolve,reject){
  exeCommand('echo '+pin+' > /sys/class/gpio/unexport',resolve,reject);
}

function exportPin(pin,resolve,reject){
  exeCommand('echo '+pin+' > /sys/class/gpio/export',resolve,reject);
}

function writeDirection(pin,dest,resolve,reject){
  exeCommand('echo '+dest+' > /sys/class/gpio/gpio'+pin+'/direction',resolve,reject);
}
function writeValue(pin,value,resolve,reject){
  exeCommand('echo '+value+' > /sys/class/gpio/gpio'+pin+'/value',resolve,reject);
}
function readValue(pin,resolve,reject){
  //todo
  exeCommand('cat /sys/class/gpio/gpio'+pin+'/value',resolve,reject);
}

function exeCommand(cmd,resolve,reject){
  console.log("shell command " + cmd);

  var exec = require('child_process').exec;

  var child = exec(cmd, function(err, stdout, stderr) {
    if (!err) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      
      resolve(stdout);
      
    } else {
      console.log(err);
      console.log(err.code);
      console.log(err.signal);
      reject();
    }
  }); 
};

