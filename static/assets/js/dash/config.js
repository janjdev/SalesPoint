window.addEventListener('DOMContentLoaded', () => {
   
    const fontList = document.querySelector('#fontlist');

    fontList.addEventListener('change', function(){

    });

    /*--------------------Printers----------------------------*/

    let tasks = document.querySelectorAll('.printer-tasks');
    let page, title, pfunc, id, form= document.querySelector('add-printer ');

    tasks.forEach(function(task) {
        task.addEventListener('click', function(e){      
          page = task.getAttribute('data-href');
          title = task.getAttribute('data-title');
          pfunc = task.getAttribute('data-func');         
          document.getElementById('printer-modal-title').innerText = title;

          if(pfunc == 'edit'){
            id = task.getAttribute('data-id');
            let name = $('tr#'+ id + 'td.name').innerText;
            
          }
        });
    });


    


});