// Modules to control application life and create native browser window
const {app, BrowserWindow, protocol, Menu} = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const menu = app.menu



const flask = path.join(__dirname, '../venv/Scripts/flask.exe')

//Function to start the backend server
function startFlask() {
  PythonShell.run(flask, null, function  (err, results)  {
    if  (err){
      console.log(err);;
    }  
    console.log('server initiated');
    console.log('results', results);
    });
}

function startApp(){
  PythonShell.run('app.py', null, function  (err, results)  {
    if  (err){
      console.log(err);;
    }  
    console.log('server initiated');
    console.log('results', results);
    });

}

python_process = PythonShell.childProcess;

//create main application window
let mainWindow;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 850,
    backgroundColor: '#fff',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      webSecurity: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../static/assets/img/icons/salespoint-green.png')
  });
  const startURL = 'http://127.0.0.1:5000/';
  //`file://${path.join(__dirname, "../templates/window_main.html")}`;  

  
  // and load the index.html of the app.
  mainWindow.loadURL(startURL);

  mainWindow.webContents.session.clearCache(function(){});

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null
  });
  //start backend server
  startFlask();
  startApp();

}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function ()  { 
    protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
    }); 
    createWindow(); 
 });  
  
app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') 
  {    
      app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


//get system fonts
const getSystemFonts = require("get-system-fonts");
console.log(process.version);
async function files() {
  return files = await getSystemFonts();
};

files().then(function(val){

  const fs = require('fs'); 

  let data = JSON.stringify(val);
  
  fs.wr

  fs.writeFile('./lists/fonts.json', data, (err) => {
    if(err) {
      throw err;
    }
    console.log('file writen');

  });
});








