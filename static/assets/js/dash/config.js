window.addEventListener('DOMContentLoaded', () => {


  //--------------Business Info-------------------//

  $(document).on('click', '#busbtn', function(e){
    $('#businfoform').trigger('submit');
  })
    $('#businfoform').on('submit', function(e){
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

    $(document).on('click', '#termbtn', function(e){
        e.preventDefault(); 
        $('#terminalform').submit();
    })

    $('#terminalform').on('submit', function(e){
      e.preventDefault();
      ajaxforms('/term', 'POST', $(this));
    })
   
    /*--------------------Printers----------------------------*/

    $(document).on('click', '.test_printer', function(e){
        let id = $(this).attr('data-id');
        $('#overlay').removeClass('hide');
        $.ajax({
          url:'/test_print/'+id,
          type: 'POST',
          data: id
        }).done(function(response){
          $('#overlay').addClass('hide');
          Swal.fire({
            type: response.alertType,
            text: response.message,
            timer: response.timer,
          })

        })
    });

    let page, checked, title, pfunc, action, id, isValid=true, form= document.querySelector('#add-printer ');
    const modalTitle = document.querySelector('#modal-title');

    $(document).on('click', '.printer-action', function(e){
      //if a row (checkbox) is checked
        if (e.target.checked)
        {
         
          //remove checked property from all checkboxes but (not) this checkbox
          $('.printer-action').not(e.target).prop("checked", false);

          //get the check element
          checked = document.querySelectorAll('input.printer-action:checked');
        }
        else
        {
          //set checked input to an empty array           
          checked = document.querySelectorAll('input.printer-action:checked');
        } 
    });  

        $(document).on('click', '.printer-tasks', function(e){     
          e.preventDefault();
          let task = $(this);
          page = task.attr('data-href');
          title = task.attr('data-title');
          pfunc = task.attr('data-func');         
          modalTitle.innerText = title
          if(pfunc == 'edit' || pfunc == 'delete')
          {
            if(!checked || checked.length < 1)
            {
              Swal.fire({
                title: 'No Printer Selected',
                text: 'Choose a printer to ' + pfunc,
                type: 'error'
              });
              return;
            }
            id =  checked[0].closest('tr').getAttribute('id')
            page = '/printers/' + id;
            action = document.createElement('input');
            action.value=pfunc;
            action.setAttribute('name', 'action');
          }
          if(pfunc == 'edit')
          {
            $('input[name="printername"]').val($('tr#'+ id + ' td.name').text());

            $('select[name="device"]').val($('tr#'+ id + ' td.printer').text()).prop("selected", true).trigger('change');
            document.querySelector('select[name="printertype"]').value = $('tr#'+ id + ' td.type').attr('data-type');
            $('select[name="printertype"').prop("selected", true).trigger('change');
           
            $('#add-edit-Printer').modal('show');
          }
          if(pfunc=='delete')
          {
            $(form).trigger('submit');
          }
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

  //================Submit the Form======================= 

      $(form).on('submit', function(e){
        e.preventDefault();
        if (pfunc == 'edit' || pfunc == 'delete')
        {
          form.appendChild(action);
          console.log(form);
        }
        if (pfunc == 'delete')
        {
          ajaxforms(page, 'POST', form)
        }
        else
        {
            validate(form.querySelectorAll('.dbAction'));
            if(isValid){        
              ajaxforms(page, 'POST', form)
            }else{
              noMatch(itemform);
              isValid = true;
            }
        }
        
      })

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
  
 //validate form fields - checks that fields are not empty
 function validate(args){
  let fields = [];
  args.forEach(el => fields.push(el));
  fields.forEach(function(el){
    if (el.value == '' || /\S/.test(el.value) == false)
    {
      isValid = false;
    }     
  });    
}

//Shake if required fields are empty
function noMatch(form){
  jQuery(form).parent().parent().addClass('animated shake');
   setTimeout(function(){
     jQuery(form).parent().parent().removeClass('animated shake');
   }, 1000);
 }
});
// ---------------CallBacks----------------------
function loadTable(){
  $('#add-edit-Printer').modal('hide');
  $('#printer').load(document.URL + ' #printerrow');
  document.getElementById('add-printer').reset();
  $('input[name="action"]').detach();
}

function loadElement(el){
  $('#'+el + 'form').load(document.URL + ' #' + el +'Set');
}