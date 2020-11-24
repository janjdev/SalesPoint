window.addEventListener('DOMContentLoaded', () => {

  //Actions buttons or links
  let tasks = document.querySelectorAll('.staff-tasks'), actions = document.querySelectorAll('.row_action');
  
  //Needed variables
  let page, title, func, id, isValid=true, inputs = document.querySelectorAll('.dbAction');

  //Element that holds the title of the form
  const modalTitle = document.querySelector('#modal-title');

  //The form to submit
  let form = document.querySelector('form#staff');  

  //All input checkboxes returns an HTML collection
  let staffChecks = document.querySelectorAll('.post-action');

  //Checked input checkboxes returns an HTMl collection
  let checked = document.querySelectorAll('input:checked');

  //Sort the table
  $('#table').DataTable({
    "aaSorting": [],
    columnDefs: [{
    orderable: false,
    targets: [0, 1, 7]
    }]
  });
  $('.dataTables_length').addClass('bs-select');
  
  
  //Toggle Actions Enabled
  $('tr.True button[data-func="active"]').attr('disabled', true);
  $('tr.False button[data-func="terminate"]').attr('disabled', true);

  //Function to disable multi row select in staff table
  staffChecks.forEach(function(check){
    check.addEventListener('change', function(e){
      //if a row (checkbox) is checked
        if (e.target.checked)
        {
          //remove checked property from all checkboxes but (not) this checkbox
          $(staffChecks).not(e.target).prop("checked", false);

          //get the check input
          checked = document.querySelectorAll('input:checked');
        }
        else
        {
          //set checked input to an empty array           
          checked = document.querySelectorAll('input:checked');
        } 
    });
  });

//tasks function for add, edit, copy
  tasks.forEach(function(task) {
        task.addEventListener('click', function(e){
          //get the route      
          page = task.getAttribute('data-href');
          //get the title of the action
          title = task.getAttribute('data-title');
          //get the specific task
          func =  task.getAttribute('data-func');
          //set the title of the modal
          modalTitle.innerText = title         

          //if the task is edit or copy get the selected row information
          if (func == 'edit' || func == 'copy')
          {
            if (checked.length < 1){
              Swal.fire({
                type: 'error',
                text: 'Select a staff row to ' + func,
                timer: 2000,

              })
            }
            else
            {
              id = checked[0].closest('tr').getAttribute('id');
              document.querySelector('input[name="fname"]').value = $('tr#' + id + ' td.first_name')[0].innerText;
              document.querySelector('input[name="lname"]').value = $('tr#' + id + ' td.last_name')[0].innerText;
              document.querySelector('#staff_pos').value = $('tr#' + id + ' td.pos')[0].getAttribute('data-pos');
              $('#staff_pos').change();
              document.querySelector('#staff_role').value = $('tr#' + id + ' td.rol')[0].getAttribute('data-rol');
              $('#staff_role').change();
              if ($('tr#' + id + ' td.status').attr('data-status') == 'True')
              {
              
                document.querySelector('input[name="status"]').checked = true;
              }
              else
              {
                document.querySelector('input[name="status"]').removeAttribute('checked');
              }
              $('#staffModal').modal('show');             

            }            
          }

        if (func == 'edit')
        {
          page = '/staff/edit/' + id;
        }
      
        //set the action of the form
        form.setAttribute('action', page);
        });
    });
    
    actions.forEach(function(action){
      action.addEventListener('click', function(e){
        e.preventDefault();
        id = action.getAttribute('data-id');
        func = action.getAttribute('data-func');
        if (func == 'edit')
        {
          page = '/staff/edit/' + id;
        }
        else
        {
          page = action.getAttribute('data-href');
        }
        if (func != 'terminate')
        {
          //Is offered         
          if ($('tr#' + id + ' td.status').attr('data-status') == 'True')
          {
           
            document.querySelector('input[name="status"]').checked = true;
          }
          else
          {
            document.querySelector('input[name="status"]').removeAttribute('checked');
          }
          document.querySelector('input[name="fname"]').value = $('tr#' + id + ' td.first_name')[0].innerText;
          document.querySelector('input[name="lname"]').value = $('tr#' + id + ' td.last_name')[0].innerText;
          document.querySelector('#staff_pos').value = $('tr#' + id + ' td.pos')[0].getAttribute('data-pos');
          $('#staff_pos').change();
          document.querySelector('#staff_role').value = $('tr#' + id + ' td.rol')[0].getAttribute('data-rol');
          $('#staff_role').change();
          $('#staffModal').modal('show');  
        }
        else{
          Swal.fire({
            title: 'Are you sure?',
            text: 'Terminate: ' + $('tr#' + id + ' td.first_name')[0].innerText + ' ' + $('tr#' + id + ' td.last_name')[0].innerText,
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true
          }).then((result) => {
            if (result.value) {
             Swal.fire({
              title: 'Deleted!',
              text: 'Your file has been deleted.',
               type: 'success'
             })
            } else if (
              /* Read more about handling dismissals below */
              result.dismiss === Swal.DismissReason.cancel
            ) {
              Swal.fire({
              title:  'Cancelled',
              text:  'Your imaginary file is safe :)',
              type:  'error'
              })
            }
            
            
          });
          

        }
        
      })
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


  function goToRegister(){
    window.location.href = '/register';
  }
function goToAdmin(){
  window.location.href='/admin';
  }
function goToLogin(){
  window.location.href ='/login';
  }

function goTo(page){
  $('#staffModal').modal('hide');
  window.location.href = page;
}  
function loadStaffTable(){
  document.querySelectorAll('.modal-backdrop')[0].remove();
  $('#staffModal').removeClass('show').css({'display': 'none'});
  $('#staff_table').load(document.URL +  '  #stafflist');
   
  
}
function clearPassFields(){
  $(document.querySelectorAll('input[type="password"]')).each(function(){$(this).val("");})    
  }
function clearEmailFields(){
  $(document.querySelectorAll('input[type="email"]')).each(function(){$(this).val("");})
  }
function unlock(url){
  window.location.href= url;
  }


  function noMatch(form){
   jQuery(form).parent().parent().addClass('animated shake');
    setTimeout(function(){
      jQuery(form).parent().parent().removeClass('animated shake');
    }, 1000);
  }

});


