let staffTable;
window.addEventListener('DOMContentLoaded', () => {

  //Actions buttons or links
  let tasks = document.querySelectorAll('.staff-tasks');
  // let actions = document.querySelectorAll('.row_action');
  
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
  staffTable = $('#table').DataTable({
    "aaSorting": [],
    columnDefs: [{
    orderable: false,
    targets: [0, 1, 7]
    }]
  });
  $('.dataTables_length').addClass('bs-select');
  
  
  //Function to disable multi row select in staff table
  // staffChecks.forEach(function(check){
  //   check.addEventListener('change', function(e){
  //     //if a row (checkbox) is checked
  //       if (e.target.checked)
  //       {
  //         //remove checked property from all checkboxes but (not) this checkbox
  //         $(staffChecks).not(e.target).prop("checked", false);
  //         $('input', staffTable.cells().nodes()).not(e.target).prop('checked', false);

  //         //get the check input
  //         checked = document.querySelectorAll('input:checked');
  //       }
  //       else
  //       {
  //         //set checked input to an empty array           
  //         checked = document.querySelectorAll('input:checked');
  //       } 
  //   });
  // });

  // //Function to disable multi row select in table
  $(document).on('click','input.post-action', function(e){

    var $box = $(this);
    if ($box.is(":checked")) {
      // the name of the box is retrieved using the .attr() method
      // as it is assumed and expected to be immutable
      var group =  $("input.post-action");
      // the checked state of the group/box on the other hand will change
      // and the current value is retrieved using .prop() method
      $(group).prop("checked", false);
      $('input', staffTable.cells().nodes()).prop('checked', false);          
      $box.prop("checked", true);
      //get the check input
      checked = document.querySelectorAll('input.post-action:checked');
    } else {
      $box.prop("checked", false);
      $('input', staffTable.cells().nodes()).prop('checked', false);
      //set checked input to an empty array           
      checked = document.querySelectorAll('inputpost-action:checked');
    }
  });

//tasks function for add, edit, copy
 
        $(document).on('click', '.staff-tasks', function(e){
          //get the route      
          page = $(this).attr('data-href');
          //get the title of the action
          title =  $(this).attr('data-title');
          //get the specific task
          func =  $(this).attr('data-func');
          //set the title of the modal
          modalTitle.innerText = title         

          //if the task is edit or copy get the selected row information
          if (func == 'edit' || func == 'copy')
          {
            if (checked.length < 1){
              Swal.fire({
                type: 'error',
                title: 'No Staff Selected',
                text: 'Click the checkbox next to the user to' + func,
                timer: 2000,
              })
              return;
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
            }

              $('#staffModal').modal('show');             
          }

        if (func == 'edit')
        {
          page = '/staff/edit/' + id;
        }
        //set the action of the form
        form.setAttribute('action', page);
        });
 //======================ROW ACTIONS==========================     
      $(document).on('click', '.row_action', function(e){
        e.preventDefault();
        id = $(this).attr('data-id');
        func =$(this).attr('data-func'); 
       if (func == 'reset')
        {
          page = '/staff/pw/' + id
        }
        else if (func == 'copy')
        {
          page = $(this).attr('data-href');
        }
        else
        {       
          page = '/staff/edit/' + id;
        }
        console.log(page);
        if (func == 'copy' || func == 'edit')
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
          $('#staff_pos').trigger('change');
          document.querySelector('#staff_role').value = $('tr#' + id + ' td.rol')[0].getAttribute('data-rol');
          $('#staff_role').trigger('change');
          $('#staffModal').modal('show');  
        }
        else 
        {
          let aform = document.createElement('form'), bput = document.createElement('input');
          bput.value = id;
          bput.setAttribute('name', func)
          aform.appendChild(bput);
          url = page;
          type = 'POST';
          form = aform;
          ajaxforms(url, type, form);

        }
        
      })
    

  $('#cancel').on('click', function(e){
      form.reset();
  });

  // Delete a User
    $(document).on('click', '#delete', function(e){    
      if (checked.length < 1){
        Swal.fire({
          type: 'error',
          title: 'No Staff Selected',
          text: 'Click the checkbox next to the user to terminate',
          timer: 2000,
        })
      }else{  
        id = checked[0].closest('tr').getAttribute('id');
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
            let bform = document.createElement('form'), cput = document.createElement('input');
            cput.value = id; 
            console.log(cput.value); 
            cput.setAttribute('name', 'delete')
            bform.appendChild(cput);
            url = '/staff/edit/' + id;
            type = 'POST';
            form = bform;
            ajaxforms(url, type, form);
         
          } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
          ) {
            
          }
        });
      }    
    })

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

  function goTo(page){
    $('#staffModal').modal('hide');
    window.location.href = page;
  }  
  function noMatch(form){
   jQuery(form).parent().parent().addClass('animated shake');
    setTimeout(function(){
      jQuery(form).parent().parent().removeClass('animated shake');
    }, 1000);
  }

});
function loadStaffTable(){
  $('#staffModal').modal('hide');
  $('form#staff').trigger("reset");
  staffTable.destroy();
  $('#tableH').load(document.URL +  '  #table');   
  setTimeout(function(){
    staffTable = $('#table').DataTable({
      "aaSorting": [],
      columnDefs: [{
      orderable: false,
      targets: [0, 1, 7]
      }]
    });
    $('.dataTables_length').addClass('bs-select');
  }, 500)
}

function reUp(){
  location.reload();
}
