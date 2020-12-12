let posTable, form
window.addEventListener('DOMContentLoaded', () => { 

    //Actions buttons or links
    let tasks = document.querySelectorAll('.staff-tasks'), actions = document.querySelectorAll('.row_action');
    
    //Needed variables
    let page, title, func, id, isValid=true, inputs = document.querySelectorAll('.dbAction');
  
    //Element that holds the title of the form
    const modalTitle = document.querySelector('#modal-title');
  
    //The form to submit
    form = document.querySelector('form#staff');  
  
    //All input checkboxes returns an HTML collection
    let staffChecks = document.querySelectorAll('.post-action');
  
    //Checked input checkboxes returns an HTMl collection
    let checked = document.querySelectorAll('input:checked');

    //Sort the table
    posTable = $('#table').DataTable({
      "aaSorting": [],
      columnDefs: [{
      orderable: false,
      targets: [0, 1, 4]
      }]
    });
    $('.dataTables_length').addClass('bs-select');
    
    
    //Function to disable multi row select in table
    
    $(document).on('click change', '.post-action', function(e){
        //if a row (checkbox) is checked
          if ($(this).attr('checked', true))
          {
            //remove checked property from all checkboxes but (not) this checkbox
            $('.post-action').not($(this)).prop("checked", false);
            $('input', posTable.cells().nodes()).not($(this)).prop('checked', false);
  
            //get the check element
            checked = document.querySelectorAll('input:checked');
          }
          else
          {
            //set checked input to an empty array           
            checked = document.querySelectorAll('input:checked');
          } 
      });
    
  
  //tasks function for add, edit, copy
    tasks.forEach(function(task) {
          task.addEventListener('click', function(e){
            console.log('click');
            //get the route      
            page = task.getAttribute('data-href');
            //get the title of the action
            title = task.getAttribute('data-title');
            //get the specific task
            func =  task.getAttribute('data-func');
            //set the title of the modal
            modalTitle.innerText = title         
  
            //if the task is edit or copy get the selected row information
            if (func == 'edit' || func == 'copy' || func == 'terminate' )
            {
              if (checked.length < 1){
                Swal.fire({
                  type: 'error',
                  text: 'Select a position row to ' + func,
                  timer: 2000,
  
                })
              }
              else
              if(func == 'edit' || func == 'copy')
              {
                id = checked[0].closest('tr').getAttribute('id');
                document.querySelector('input[name="name"]').value = $('tr#' + id + ' td.pos')[0].innerText;                
                $('#staffModal').modal('show'); 
              }            
            }
  
          if (func == 'edit')
          {
            page = '/pos/edit/' + id;
          }
        
          //set the action of the form
          form.setAttribute('action', page);
          });
      });
      $(document).on('click', '.row_action', function(e){
          e.preventDefault();
          id = $(this).attr('data-id');
          func =$(this).attr('data-func'); 
          modalTitle.innerText =$(this).attr('data-title');
          
          if (func == 'edit' || func == 'terminate')
          {
            page = '/pos/edit/' + id;
          }
          else
          {
            page = $(this).attr('data-href');
          }
          if (func != 'terminate')
          {
            document.querySelector('input[name="name"]').value = $('tr#' + id + ' td.pos')[0].innerText; 
            $('#staffModal').modal('show');  
          }
          else{
            Swal.fire({
              title: 'Are you sure?',
              text: 'Eliminate: ' + $('tr#' + id + ' td.pos')[0].innerText,
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes!',
              cancelButtonText: 'No, cancel!',
              reverseButtons: true
            }).then((result) => {
              if (result.value) {
                form.querySelector('input[name="action"]').value = 'delete';
                ajaxforms(page, 'POST', form);              
              } else if (
                result.dismiss === Swal.DismissReason.cancel
              ) {
               
              }
            });
            
          }
          
        })  
    $('#cancel').on('click', function(e){
        form.reset();
    });
  
  
  
    jQuery(form).on('submit', function(e){
      e.preventDefault();    
      validate(inputs);
      if(isValid){
        ajaxforms(page, 'POST', form)
      }else{
        noMatch(form);
        isValid = true;
      } 
    });
  
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
  
    function noMatch(form){
     jQuery(form).parent().parent().addClass('animated shake');
      setTimeout(function(){
        jQuery(form).parent().parent().removeClass('animated shake');
      }, 1000);
    }
  
  });

  // =================CallBack=================

  function loadTable(){   
    $('#staffModal').modal('hide');
    form.reset();
    posTable.destroy()
    $('#tableP').load(document.URL +  '  #table');  
    setTimeout(function(){
      posTable = $('#table').DataTable({
        "aaSorting": [],
        columnDefs: [{
        orderable: false,
        targets: [0, 1, 4]
        }]
      });
      $('.dataTables_length').addClass('bs-select');  
    }, 500) ;
  }


  
  
  