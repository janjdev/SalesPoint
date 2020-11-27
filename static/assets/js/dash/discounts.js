window.addEventListener('DOMContentLoaded', () => {

    //get the generated list of items
    const taxlist = document.querySelector('#discountlist');

    //get the action buttons
    const editbtn = document.querySelector('#edit');

    const deletebtn = document.querySelector('#delete');

    //Form to edit current taxes
    const editForm = document.getElementById('discountEditForm');

    //Form to add new tax data
    const taxform = document.getElementById('discountForm');

    //get the tax form inputs
    let inputs = document.querySelectorAll('input.dbAction');

    const tinputs = taxform.querySelectorAll('input.dbAction');

    const re = /[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{1,2})?/;

    const ra = /^[A-Za-z]+$/;

    //Flag to validate inputs
    let isValid = true;

    //Cancel Update - gives smooth transition appearance, really just resets the entire form :)

    $('#editCancel').click(function(e){

        $(editbtn).removeClass('update');
        $('#edit_cancel').addClass('hide');
        $(editbtn).attr('data-original-title', 'Edit');
        $(editbtn).find('i').text('edit');    
        $('input.taxRow:checked').prop('checked', false);
        $('input.taxRow').closest('tr').find('input').not('input[type="checkbox"]').prop('disabled', true)
        $('input.taxRow').closest('tr').find('input[name="expdate"]').attr('hidden', '');
        $('input.taxRow').closest('tr').find('input[name="discountdate"]').removeAttr('hidden', '');
        $('input.taxRow').closest('tr').find('select[name="discounttypeid"]').attr('hidden', '');
        $('input.taxRow').closest('tr').find('.dropdown.bootstrap-select').addClass('hide');
        $('input.taxRow').closest('tr').find('input[name="discountype"]').removeAttr('hidden');
        location.reload();
    });

    //==================On date/type change======================

        //Date change
        $('body').on('click', 'input[name="expdate"]', function(e){           
            $(this).on('change', function(e){
                if ($(this).val() != '')
                {
                    $(this).next('input[name="discountdate"]').val($(this).val());
                    $(this).change();
                    console.log($(this).val());

                }
            });
        });

      

        //Type change
        $('body').on('change', 'select.typechg', function(e){             
                if ($(this).val() != '')
                {
                    $(this).next('input[name="discountdate"]').val($("option:selected", this).text());
                }           
        });

    // ===============On Checkbox Change============================
    $('body').on('click', '.dedits.form-check-input', function(e){
        $(this).toggleClass('dbAction');

    });

    //====================Edit functions============================
    editbtn.addEventListener('click', function(e){
        e.preventDefault();
        let checked = taxlist.querySelectorAll('input.taxRow:checked');
        
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
            $(checked).closest('tr').find('input[name="discountvalue"]').val( $(checked).closest('tr').find('input[name="discountvalue"]').val().replace(/\$|%/g,'') ); 
            $(checked).closest('tr').find('input[name="discountdate"]').val($(checked).closest('tr').find('input[name="expdate"]').val());
            console.log($(checked).closest('tr').find('input[name="discountdate"]').val());                  
            let items = [];
            let rows = $(checked).closest('tr').toArray()
            let inputs;
            
            rows.forEach(function(row){
                let item = [];
                inputs = row.querySelectorAll('.dbAction:not(.dropdown)');
                inputs.forEach(function(input){
                    console.log(input.value);
                    let i = $(input).serialize()
                    item.push( decodeURIComponent(i));
                });
                items.push(item);
            });
            let data = JSON.stringify(items)
            
            //convert form as needed
            let formData = new FormData(editForm);
            formData.append('items', data);            
            
            validate(editForm.querySelectorAll('.dbAction'));
            if(isValid)
            {             
                ajaxforms('/discount_edit/', 'POST', formData, false, false)
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
                $(check).closest('tr').find('input[name="expdate"]').removeAttr('hidden');
                $(check).closest('tr').find('input[name="expdate"]').val($(check).closest('tr').find('input[name="expdate"]').attr('data-date'))
                $(check).closest('tr').find('input[name="discountdate"]').attr('hidden', '');

                $(check).closest('tr').find('select[name="discounttypeid"]').val( $(check).closest('tr').find('select[name="discounttypeid"]').attr('data-discounttype'))
                $(check).closest('tr').find('select[name="discounttypeid"]').change()

                $(check).closest('tr').find('select[name="discounttypeid"]').removeAttr('hidden');
                $(check).closest('tr').find('.dropdown.bootstrap-select').removeClass('hide');
                $(check).closest('tr').find('input[name="discountype"]').attr('hidden', '');
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
        simpleAjaxforms('/discounts', 'POST', taxform)
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
        if(el.dataset.type != 'date')
        {
            if (el.value == '' || /\S/.test(el.value) == false)
            {
                console.log(el);
                isValid = false;
            }
            else if (el.dataset.type == 'rate'){
                str = el.value.replace(/\$|%/g,'')
                if(!re.test(str)){
                    console.log(el);
                isValid = false;
                }
            }
            else if (el.dataset.type == 'text'){
                if(!ra.test(el.value)){
                    console.log(el);
                isValid = false;
                }
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
    $('.datetimepicker').datetimepicker({
      format: 'MM/DD/YYYY',
      minDate: moment(),
      icons: {
          time: "fa fa-clock-o",
          date: "fa fa-calendar",
          up: "fa fa-chevron-up",
          down: "fa fa-chevron-down",
          previous: 'fa fa-chevron-left',
          next: 'fa fa-chevron-right',
          today: 'fa fa-screenshot',
          clear: 'fa fa-trash',
          close: 'fa fa-remove'
      }
   });

}); //End of doc ready function
    
//---------------Callbacks----------------------------------
function loadTable(){
    $('#discountModal').modal('hide');
    discountForm.reset();
    $('#discountsRow').load(document.URL +  '  #discount_table');
}

function reload(){
  location.reload();
}

