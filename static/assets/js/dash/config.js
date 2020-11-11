window.addEventListener('DOMContentLoaded', () => {


  //--------------Business Info-------------------//

$('#businfo').on('submit', function(e){
  e.preventDefault();
  ajaxforms('/bus', 'POST', $(this));
});


  //---------------------Terminal------------------------------//

   
  const autolog = document.querySelector('input[name="autolog"]');

  if(autolog.checked){
    autolog.value = "checked";
    document.querySelector('input[name="timer"]').required = true;
  }
  

  autolog.addEventListener('click', function(e){
    if (e.target.checked){
      e.target.value = "checked";
      document.querySelector('input[name="timer"]').required = true;
    }
    else
    {
      e.target.value= "false";
      document.querySelector('input[name="timer"]').required = false;
    }
    
  })

    const fontList = document.querySelector('#fontlist');
    const fontpath = document.querySelector('#fontpath');
    fontList.addEventListener('change', function(e){
      fontpath.value = e.target.selectedOptions[0].dataset.value
    });

    $('#terminalSet').on('submit', function(e){
      e.preventDefault();
      ajaxforms('/term', 'POST', $(this));
    })

    /*--------------------Printers----------------------------*/

    let tasks = document.querySelectorAll('.printer-tasks');
    let page, title, pfunc, id, form= document.querySelector('add-printer ');
    const modalTitle = document.querySelector('#modal-title');

    tasks.forEach(function(task) {
        task.addEventListener('click', function(e){      
          page = task.getAttribute('data-href');
          title = task.getAttribute('data-title');
          pfunc = task.getAttribute('data-func');         
          modalTitle.innerText = title

          if(pfunc == 'edit'){
            id = task.getAttribute('data-id');
            let name = $('tr#'+ id + 'td.name').innerText;
            
          }
        });
    });

//Sort printer table
$('#printerTable').DataTable({
  "aaSorting": [],
  columnDefs: [{
  orderable: false,
  targets: [0, 1, 5]
  }]
});
$('.dataTables_length').addClass('bs-select');


function loadElement(el){
  if($('#add-edit-Printer').hasClass('show'))
  {
    $('#add-edit-Printer').modal('hide');
  }
  location.reload();
  //$('#configRow').load(document.URL +  ' #configCard');    
  setTimeout(function(){
    $('a.active').removeClass('active show');
    $('.tab-pane.active').removeClass('active');        
     $('#config' +el).addClass('active show');
     $('#' + el).addClass('active show');
   },100)
}


function ajaxforms(url, type, form){
  $.ajax({
    url: url,
    type: type,
    data: $(form).serialize()
  })
  .done(function(response){
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
    


});