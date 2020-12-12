// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const electron = require('electron');
const remote = require('electron').remote
const path = require('path');
const customTitlebar = require('custom-electron-titlebar');

const BrowserWindow = electron.remote.BrowserWindow; 


window.addEventListener('DOMContentLoaded', () => { 

  let thisWin = BrowserWindow.getFocusedWindow();
  let currentURL = thisWin.webContents.getURL()
  console.log(currentURL);
  let loadFile;
    if (currentURL == 'http://127.0.0.1:5000/')
    {
      loadFile = `file://${path.join(__dirname, "./help/NavigatingtheSystem.html")}`
    }
    else
      {
        if( currentURL == 'http://127.0.0.1:5000/admin')
      {
        loadFile = `file://${path.join(__dirname, "./help/AdministratorFeatures.html")}`
      }
    else
    {
      if( currentURL == 'http://127.0.0.1:5000/first')
      {
        loadFile = `file://${path.join(__dirname, "./help/GettingStarted.html")}`
      }
      else
      {
          if( currentURL == 'http://127.0.0.1:5000/staff')
        {
          loadFile = `file://${path.join(__dirname, "./help/AddaStaffMember.html")}`
        }
        else
        {
          if( currentURL == 'http://127.0.0.1:5000/staff/positions')
          {
            loadFile = `file://${path.join(__dirname, "./help/AddaPosition.html")}`
          }
          else
          {
              if( currentURL == 'http://127.0.0.1:5000/discounts')
              {
                loadFile = `file://${path.join(__dirname, "./help/CouponsandDiscounts.html")}`
              }
              else
              {
                  if( currentURL == 'http://127.0.0.1:5000/tax/')
                  {
                    loadFile = `file://${path.join(__dirname, "./help/Taxes.html")}`
                  }
                  else
                  {
                    if( currentURL == 'http://127.0.0.1:5000/menu')
                    {
                      loadFile = `file://${path.join(__dirname, "./help/MenuManagement.html")}`
                    }
                    else
                    {
                      if( currentURL == 'http://127.0.0.1:5000/reports')
                        {
                          loadFile = `file://${path.join(__dirname, "./help/CreatingReports.html")}`
                        }
                        else
                        {
                          if( currentURL == 'http://127.0.0.1:5000/setTable/')
                          {
                            loadFile = `file://${path.join(__dirname, "./help/AddTables.html")}`
                          }
                          else
                          {
                            if( currentURL == 'http://127.0.0.1:5000/kitchen'){
                              loadFile = `file://${path.join(__dirname, "./help/Kitchen.html")}`
                            }
                            else
                            {
                              if( currentURL == 'http://127.0.0.1:5000/orders'){
                                loadFile = `file://${path.join(__dirname, "./help/CompletingAnOrder.html")}`
                              }
                              else
                              {
                                if( currentURL == 'http://127.0.0.1:5000/carry-out' || currentURL == 'http://127.0.0.1:5000/dine-in'){
                                  loadFile = `file://${path.join(__dirname, "./help/FromtheMenu1.html")}`
                                }
                              }
                            }
                          }
                        }
                    }
                  }
              }

          }
        }
      }
    }
  }
    
  $(document).on('click', '.menubar-menu-button', function(e){
    if ($(this).attr('aria-label') == 'Help'){

      const child = new BrowserWindow({ parent: thisWin, modal: true, show: false })

      child.loadURL(loadFile)
      child.once('ready-to-show', () => {
      child.show()
})
      
    }
  })
 
  new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#FFFFFF'),
    // icon: path.join(__dirname, '../static/assets/img/icons/help.png')
  }); 
  
  $(document).on('click', '#shutdownMain', function(e){
    shutdown();
  })

  var options = { 
      silent: false, 
      printBackground: true, 
      color: false, 
      margin: { 
          marginType: 'printableArea'
      }, 
     selectionOnly: true,
      landscape: false, 
      pagesPerSheet: 1, 
      collate: false, 
      copies: 1, 
      header: 'Header of the Page', 
      footer: 'Footer of the Page'
  }
  
  
    
 $(document).on('click', '#print', (event) => { 

      $("#editable").selectText();  
      let win = BrowserWindow.getFocusedWindow(); 
      // let win = BrowserWindow.getAllWindows()[0]; 
    
    win.webContents.print(options, (success, failureReason) => { 
          if (!success) console.log(failureReason); 
    
          console.log('Print Initiated'); 
      });
  }); 

const sw = require('../static/assets/js/plugins/sweetalert2.all.min.js');


$(document).on('click', '#shutdown', function(e){
    e.preventDefault();
  let user = document.querySelector('#user-role').innerText;
  if (user.toUpperCase() === "ADMINISTRATOR")
  {
    sw.fire({
        type: 'warning',
        title: 'Shut Down ?',
        // text: 'From Date cannot be greater than To Date',
        showCancelButton: true,
          confirmButtonText: 'Yes!',
          cancelButtonText: 'No, cancel!',
          reverseButtons: true
        }).then((result) => {
          if (result.value) 
          {
              let form = document.createElement('form');
              let input = document.createElement('input');
              input.setAttribute('name', 'admin')
              input.value = 'admin';
              form.appendChild(input);
            $.ajax({
                method: 'POST',
                url: 'http://127.0.0.1:5000/shut-down',
                data: $(form).serialize(),   
            }).done(function(response){
                let callback = eval(response.callback)
                if(response.param){
                  if(response.param == 'form'){
                    callback = callback(form)
                  }
                  else{
                    callback = callback(response.param)
                  }
                }
                Swal.fire({
                  type: response.alertType,
                  text: response.message,
                  timer: response.timer,
                  onClose: callback
                })
                
              })
          }
          else if( result.dismiss === Swal.DismissReason.cancel)
          {
            
          }  
        });
  
        }
        else
        {
            Swal.fire({
                title: 'Administrator Required',
                text: 'Enter Your Authorized ID',
                input: 'password',
                inputAttributes: {
                autocapitalize: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Shut Down',              
            }).then((result) => {
                if (result.value) 
                {
                    let form = document.createElement('form');
                    let input = document.createElement('input');
                    input.setAttribute('name', 'id')
                    input.value = result.value;
                    form.appendChild(input);
                    $.ajax({
                        method: 'POST',
                        url: 'http://127.0.0.1:5000/shut-down',
                        data: $(form).serialize(),   
                    }).done(function(response){
                        let callback = eval(response.callback)
                        if(response.param){
                        if(response.param == 'form'){
                            callback = callback(form)
                        }
                        else{
                            callback = callback(response.param)
                        }
                        }
                        Swal.fire({
                        type: response.alertType,
                        text: response.message,
                        timer: response.timer,
                        onClose: callback
                        })
                        
                    })
                }
            })
        }

        
        

});

  function shutdown(){
      remote.getCurrentWindow().close()
  } 

  jQuery.fn.selectText = function(){
    var doc = document;
    var element = document.getElementById('editContent');
    console.log(this, element);
    if (doc.body.createTextRange) {
        var range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();        
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};


    
  });

  






