window.addEventListener('DOMContentLoaded', () => {

    const multi = document.querySelector('#multiform');
    const editForm = document.querySelector('#tablesEditForm');
    const tablelist = document.querySelector('#tableList');   
    const editbtn = document.querySelector('#tableedit');
    const deletebtn = document.querySelector('#tabledelete');
    const taskbtns = document.querySelectorAll('.table-task');
    
    let isValid = true;

    const re = /[1-9]{1,3}/;

//Sort the table
$('#tablesTable').DataTable({
    "aaSorting": [],
    columnDefs: [{
    orderable: false,
    targets: [0,1,5,6,7,8]
    }]
  });
  $('.dataTables_length').addClass('bs-select');


//Toggle Actions Enabled
$('tr.True button[data-func="active"]').attr('disabled', true);
$('tr.False button[data-func="archived"]').attr('disabled', true);


//Enable/Disbale Tables
taskbtns.forEach(function(task){

  task.addEventListener('click', function(e){
    e.preventDefault();
    func = task.getAttribute('data-func');
    if(func == "archived")            
    {
      document.querySelector('input#tableAction').value = 'archive';
    }
    else
    {
      document.querySelector('input#tableAction').value = 'active';
    }
    id = task.getAttribute('data-id');
    simpleAjaxforms('/table_active/' + id, 'POST', editForm)
  });  
})
  
//Add more tables  
jQuery(multi).on('submit', function(e){
    e.preventDefault();  
    validate(multi.querySelectorAll('inputs'))
    console.log(isValid);
    if(isValid){
    simpleAjaxforms('/table-multi-add/', 'POST', multi)
    }else{
      noMatch(multi);
      isValid = true;
    } 
  });




//Cancel form edits
$('#editCancel').click(function(e){

  $(editbtn).removeClass('update');
  $('#edit_cancel').addClass('hide');
  $(editbtn).attr('data-original-title', 'Edit');
  $(editbtn).find('i').text('edit');    
  $('input.taxRow:checked').prop('checked', false);
  $('input.taxRow').closest('tr').find('input').not('input[type="checkbox"]').prop('disabled', true)
  location.reload();

});

//Delete function
deletebtn.addEventListener('click', function(e){
    e.preventDefault();
    let checked = document.querySelectorAll('input.tableRow:checked');
    console.log(checked);

    if(checked.length < 1)
    {
        Swal.fire({
            type: 'error',
            text: 'Select a row to delete.',
            timer: 2000,
          });
        return;
    }
    else
    {
        document.querySelector('input#tableAction').value = 'delete';
        dtables = [];
        tables = $(checked).closest('tr').toArray();
        tables.forEach(function(table){            
            dtables.push(table.querySelector('input[name="num"]').value);
        });        
        Swal.fire({
            title: 'Are you sure?',
            text: 'Delete Tables: ' + dtables.join(','),
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true
          }).then((result) => {
            if (result.value) {
                dtables.length = 0;
                tables.forEach(function(table){
                    dtables.push(table.querySelector('input[name="tableid"]').value)
                });
                let data = JSON.stringify(dtables);
                let formData = new FormData(editForm);
                formData.append('items', data)
                ajaxforms('/setTable/', 'POST', formData, false, false)        
            } else if (
              /* Read more about handling dismissals below */
              result.dismiss === Swal.DismissReason.cancel
            ) {
              Swal.fire({
              title:  'Cancelled',
              text:  'No tables deleted',
              type:  'error'
              })
            }
            
            
       });
    }

});  

//Edit functions
editbtn.addEventListener('click', function(e){
    e.preventDefault();
    let checked = document.querySelectorAll('input.tableRow:checked');
    console.log(checked);

    if(checked.length < 1)
    {
        Swal.fire({
            type: 'error',
            text: 'Select a row to edit',
            timer: 2000,
          });
        return;
    }

    if($(this).hasClass('update'))
    {   
        document.querySelector('input#tableAction').value = 'edit';
        let items = [];
        let rows = $(checked).closest('tr').toArray()
        console.log(rows);
        let inputs;
        
        rows.forEach(function(row){
            let item = [];
            inputs = row.querySelectorAll('input.dbAction');
            inputs.forEach(function(input){
                item.push($(input).serialize())
            });
            items.push(item);
        });
        let data = JSON.stringify(items)
        
        //convert form as needed
        let formData = new FormData(editForm);
        formData.append('items', data)        
        
        validate(editForm.querySelectorAll('input.dbAction:required'));
        console.log(editForm.querySelectorAll('input.dbAction:required'));
        if(isValid)
        {             
            ajaxforms('/setTable/', 'POST', formData, false, false)
            checked.forEach(function(check){
              $(check).closest('tr').find('input').not('input[type="checkbox"]').prop('disabled', true)
              $('input.tableRow:checked').prop('checked', false);
          });
          $(this).removeClass('update');
          $('#edit_cancel').addClass('hide');
          $(this).attr('data-original-title', 'Edit');
          $(this).find('i').text('edit');
        }
        else
        {
            noMatch(tablelist);
            isValid = true;
        }
       
    }
    else
    {
        checked.forEach(function(check){
            $(check).closest('tr').find('input').removeAttr('disabled')
            $(check).val('');
        });
        $(this).addClass('update');
        $(this).attr('data-original-title', 'Update');
        $(this).find('i').text('arrow_circle_up');
        $('#edit_cancel').removeClass('hide');
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
  else if (el.dataset.type == 'number'){
    if(!re.test(el.value)){
      isValid = false;
    }
  }
//   else if (el.dataset.type == 'text'){
//     if(!ra.test(el.value)){
//       isValid = false;
//     }
//   }     
});    

}

//Shake form if input is not valid
function noMatch(form){
jQuery(form).parent().parent().addClass('animated shake');
 setTimeout(function(){
   jQuery(form).parent().parent().removeClass('animated shake');
 }, 1000);
}

//==============================Complex Forms==========================================//
function ajaxforms(url, type, form, pData=true, cType='application/x-www-form-urlencoded; charset=UTF-8', dType='', convert=false){
  $.ajax({
    url: url,
    type: type,
    data: form,
    cache: false,
    processData: pData,
    contentType: cType,
    dataType: dType,
  //   converters: {
  //     'text json': convert
  //   }
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


//================================Simple Forms===============================//

function simpleAjaxforms(url, type, form){
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

}); //End of doc read function

//---------------Callbacks----------------------------------
function loadTable(){
$('#multiTableModal').modal('hide');
$('#tableRow').load(document.URL +  '  #tax_table');
}

function reup(){
    location.reload();
}

