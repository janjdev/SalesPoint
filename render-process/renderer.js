// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


//load helper functions
const helper = require('../main-process/helpers')
// const {remote} = require('electron');



window.addEventListener('DOMContentLoaded', () => {
    const {$} = require('jquery');
    
    //const currentWindow = remote.getCurrentWindow;

  let cancel = document.querySelector('#cancel');
    cancel.addEventListener('click', function(e){
      console.log('can see');
      //currentWindow.close();
    })
  
});