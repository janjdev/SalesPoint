let tablesSort;
window.addEventListener('DOMContentLoaded', () => {

    //get the generated list of items
    const taxlist = document.querySelector('#taxlist');

    //get the action buttons
    const editbtn = document.querySelector('#edit');

    console.log(editbtn);

    const deletebtn = document.querySelector('#delete');

    //Form to edit current taxes
    const editForm = document.getElementById('taxEditForm');

    //Form to add new tax data
    const taxform = document.getElementById('taxForm');

    //get the tax form inputs
    let inputs = document.querySelectorAll('input.dbAction');

    const tinputs = taxform.querySelectorAll('input.dbAction');

    const re = /[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{1,4})?/;

    const ra = /^[A-Za-z]+$/;

    //Flag to validate inputs
    let isValid = true;

    //Sort the table
  tableSort = $('#table').DataTable({
    "aaSorting": [],
    columnDefs: [{
    orderable: false,
    targets: [1,2]
    }]
  });
  $('.dataTables_length').addClass('bs-select');

    $('#editCancel').on('click', function(e){

      $(editbtn).removeClass('update');
      $('#edit_cancel').addClass('hide');
      $(editbtn).attr('data-original-title', 'Edit');
      $(editbtn).find('i').text('edit');    
     $('input.taxRow:checked').prop('checked', false);
     $('input.taxRow').closest('tr').find('input').not('input[type="checkbox"]').prop('disabled', true)
      location.reload();
    
    });

    //Edite functions
    editbtn.addEventListener('click', function(e){
        e.preventDefault();
        let checked = document.querySelectorAll('input.taxRow:checked');
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

            console.log(items);
            
            
            validate(editForm.querySelectorAll('input.dbAction'));
            if(isValid)
            {             
                ajaxforms('/tax_edit/', 'POST', formData, false, false)
                checked.forEach(function(check){
                  $(check).closest('tr').find('input').not('input[type="checkbox"]').prop('disabled', true)
                  $('input.taxRow:checked').prop('checked', false);
              });
              $(this).removeClass('update');
              $('#edit_cancel').addClass('hide');
              $(this).attr('data-original-title', 'Edit');
              $(this).find('i').text('edit');
            }
            else
            {
                noMatch(taxlist);
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

  //New tax Form

    jQuery(taxform).on('submit', function(e){
        e.preventDefault();    
        validate(tinputs)
        if(isValid){
        simpleAjaxforms('/tax/', 'POST', taxform)
        }else{
          noMatch(taxform);
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
      else if (el.dataset.type == 'rate'){
        if(!re.test(el.value)){
          isValid = false;
        }
      }
      else if (el.dataset.type == 'text'){
        if(!ra.test(el.value)){
          isValid = false;
        }
      }     
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
}); //End of doc ready function
    
//---------------Callbacks----------------------------------
function loadTable(){
    $('#taxModal').modal('hide');
    tablesSort.destroy()
    $('#taxRow').load(document.URL +  '  #tax_table');
    setTimeout(function(){
      tableSort = $('#table').DataTable({
        "aaSorting": [],
        columnDefs: [{
        orderable: false,
        targets: [1,2]
        }]
      });
      $('.dataTables_length').addClass('bs-select');
    }, 150);
}

function reload(){
  location.reload();
}

