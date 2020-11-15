window.addEventListener('DOMContentLoaded', () => {

    //get the generated list of items
    const taxlist = document.querySelector('#taxlist');

    //get the action buttons
    const editbtn = document.querySelector('#edit');
    const deletebtn = document.querySelector('#delete');

    //Form to edit current taxes
    const editForm = document.getElementById('taxEditForm');

    //Form to add new tax data
    const taxform = document.getElementById('taxForm');

    //get the tax form inputs
    let inputs = document.querySelectorAll('input.dbaction');

    //Flag to validate inputs
    let isValid = true;


    //Edite functions
    editbtn.addEventListener('click', function(e){
        e.preventDefault();
        let checked = document.querySelectorAll('input.taxRow:checked');

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
            
            
            validate(inputs);
            if(isValid)
            {
                ajaxforms('/tax_edit/', 'POST', formData, false, false)
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
            });
            $(this).addClass('update');
            $(this).attr('data-original-title', 'Update');
            $(this).find('i').text('arrow_circle_up');
        }
    });

    jQuery(taxform).on('submit', function(e){
        e.preventDefault();    
        validate(inputs);
        if(isValid){
        simpleAjaxforms('/tax/', 'POST', taxform)
        }else{
          noMatch(taxform);
          isValid = true;
        } 
      });

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
    
//---------------Callbacks----------------------------------
function loadTable(){
    $('#taxModal').modal('hide');
    $('#taxTable').load(document.URL +  '  #table');
}    

