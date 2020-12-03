// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const electron = require('electron');
const remote = require('electron').remote




window.addEventListener('DOMContentLoaded', () => { 
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
   

    
   
    
});






