// Modules to control application life and create native browser window
const {app, BrowserWindow, protocol, Menu, ipcMain} = require('electron');
const path = require('path');
const { PythonShell } = require('python-shell');
const menu = app.menu
const sqlite3 = require('sqlite3').verbose();

// const flask = path.join(__dirname, '../venv/Scripts/flask.exe');

const flaskapp = path.join(__dirname, '../app.py');

// function startFlask() {
//   PythonShell.run(flask, null, function  (err, results)  {
//     if  (err){
//       console.log(err);;
//     }  
//     console.log('server initiated');
//     console.log('results', results);
//     });
// }

function startApp(){
  PythonShell.run(flaskapp, null, function  (err, results)  {
    if  (err){
      console.log(err);;
    }  
    console.log('server initiated');
    console.log('results', results);
    });

}

python_process = PythonShell.childProcess;

let db = new sqlite3.Database('./salespoint.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the salespoint database.');
});


// const executablePath = "../app/app.exe";

// const child = require('child_process').execFile;

// function startApp(){
//   child(executablePath, function (err, data) {
//     if (err) {    
//     console.error(err);    
//     return;    
//     }    
//     console.log(data.toString());    
//     });
// }


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
    icon: path.join(__dirname, '../app/static/assets/img/icons/salespoint-green.png')
  });
  // const startURL = firstRun==true? 'http://127.0.0.1:5000/first': 'http://127.0.0.1:5000/';
  // mainWindow.loadURL(startURL)
let sql = "SELECT first_name FROM STAFF"; 
  db.all(sql, (err, rows,) =>{
    if(err){
     console.log(err);
    }
    if (rows.length < 1)
    {
      mainWindow.loadURL('http://127.0.0.1:5000/first');
    }
    else{
      mainWindow.loadURL('http://127.0.0.1:5000/');
    }
  })
 
  //`file://${path.join(__dirname, "../templates/window_main.html")}`;  

  
  // and load the index.html of the app.
 
    
   

    // mainWindow.loadFile('index.html')

    mainWindow.once("ready-to-show", () => { mainWindow.show()});
    mainWindow.on("closed", () => {
    mainWindow = null
  });
  // startFlask();
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
          submenu: [
            {
              label: 'About'
            },
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
          label: 'Help'         
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
      const { exec } = require('child_process');
      exec('taskkill /f /t /im app.exe', (err, stdout, stderr) => {
        if (err) {
        console.log(err)
        return;
      }
    });
      app.quit();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


//get system fonts
const getSystemFonts = require("get-system-fonts");
const { count } = require('console');
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






