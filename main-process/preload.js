// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {remote} = require('electron');
const {BrowserWindow} = remote;
const path = require('path');
const url = require('url');


//load helper functions
const helper = require('./helpers')


window.addEventListener('DOMContentLoaded', () => { 

  const currentWindow = remote.getCurrentWindow;
  
    let tasks = document.querySelectorAll('.tasks');
    let base_url = helper.jsonReader('./configs/app.json');
    console.log(currentWindow);
  
    // tasks.forEach(function(task) {
    //     task.addEventListener('click', function(e){      
    //       let page = base_url['base'] + task.getAttribute('data-href').split('/')[1];
    //       console.log(page);
    //       authorize(page);
    //     });
    // });


    //Create Authorization Window
    function authorize(page){
      let authWin = new BrowserWindow({
        //frame: false,
        parent: currentWindow,
        modal: true,
        transparent: true,
        alwaysOnTop: true,
        width: 400,
        height: 600,
        show: false,    
        icon: path.join(__dirname, '../static/assets/img/icons/salespoint-green.png'),
        webPreferences: {
          preload: path.join(__dirname, '../render-process/renderer.js'),
          enableRemoteModule: true,
          nodeIntegration: false
        }
      });
    
      // and load the index.html of the app.
      authWin.loadURL(page);
    
      //window.$ = window.jQuery = require('../static/assets/js/core/jquery.min.js');
    
      authWin.once("ready-to-show", () => authWin.show());
      authWin.on("closed", () => {
        authWin = null
      });
    }
});






