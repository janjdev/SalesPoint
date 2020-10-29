// Modules to control application life and create native browser window
const {app, Menu, BrowserWindow} = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');





//Function to start the backend server
function startFlask() {
  PythonShell.run('app.py', null, function  (err, results)  {
    if  (err)  throw err;
    console.log('server initiated');
    console.log('results', results);
    });
}



//create main application window
let mainWindow;
function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 665,
    backgroundColor: '#fff',
    show: false,
    webPreferences: {
      nodeIntegration: false,
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

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()


  //start backend server
  startFlask();

}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function ()  {  
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


