// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');
const path = require('path');

//check for first run
const firstRun = require('electron-first-run'); 
const isFirstRun = firstRun()
console.log(isFirstRun);
 
//get the process id 
let port = '' + 5000;
let script = path.join(__dirname, 'app.py');


const extitPy = () =>
{
  
  let subpy;
  do {
    subpy = require('child_process').spawn('python', [script, port]);
    subpy.kill();
    subpy = null;
    port = null;
  } 
  while (subpy != null )


  
}
var rq = require('request-promise');

//create main application window
let mainWindow;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    backgroundColor: '#fff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../static/img/icons/salespoint-green.png')
  });
  const startURL = 'http://127.0.0.1:5000/';
  //`file://${path.join(__dirname, "../templates/window_main.html")}`;  

  mainWindow.webContents.clearHistory();
  // and load the index.html of the app.
  mainWindow.loadURL(startURL);

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function ()  {
  //run the python flask server on local host
const { PythonShell } = require('python-shell');
PythonShell.run('app.py', null, function  (err, results)  {
  if  (err)  throw err;
  console.log('servre initiated');
  console.log('results', results);
 
 });
  createWindow();
  mainWindow.webContents.session.clearCache(function(){})
  
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') 
  {
    //extitPy();
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
