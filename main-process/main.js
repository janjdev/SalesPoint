// Modules to control application life and create native browser window
const {app, BrowserWindow, protocol, Menu, ipcMain} = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const menu = app.menu

const firstRun = require('electron-first-run');
 
const isFirstRun = firstRun()
console.log(isFirstRun);

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
    height: 880,
    minHeight: 880,
    minWidth: 1216,
    frame: false,
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
  const startURL = firstRun==true? 'http://127.0.0.1:5000/first': 'http://127.0.0.1:5000/';
  //`file://${path.join(__dirname, "../templates/window_main.html")}`;  

  
  // and load the index.html of the app.
  mainWindow.loadURL(startURL);
 

  mainWindow.webContents.session.clearCache(function(){});
  mainWindow.webContents.send('MSG_FROM_MAIN', 'hello renderer');

  mainWindow.once("ready-to-show", () => { mainWindow.show()});
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

    const template = [
      //   { role: 'editMenu' },
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ]
        },
      //   { role: 'viewMenu' },
        {
          label: 'View',
          submenu: [
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetzoom' },
            { role: 'zoomin' },
            { role: 'zoomout' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
          ]
        },
      //   { role: 'windowMenu' },
        {
          label: 'Window',
          submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            { role: 'close' }
          ]
        },
        {
          role: 'About',
          id: 'about',
          submenu: [
            {
              label: 'Learn More',
              click: async () => {
                const { shell } = require('electron')
                await shell.openExternal('https://github.com/janjdev/SalesPoint')
              }
            },
          ]
        },
        {
          role: 'Help',
          label: 'Help',
          icon: path.join(__dirname, '../static/assets/img/icons/help.png'),
      },
      ]
    const menu =  Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

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

const createModal = (htmlFile, parentWindow, width, height) => {
  let modal = new BrowserWindow({
    width: width,
    height: height,
    modal: true,
    parent: parentWindow,
    webPreferences: {
      nodeIntegration: true
    }
  })

  modal.loadFile(htmlFile)

  return modal;

}






