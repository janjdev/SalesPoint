window.addEventListener('DOMContentLoaded', () => {
    // get the order ticket
    const orderform = document.querySelector('#new-ticket');

    //get the generated list of items
    const orderlist = document.querySelector('#orderlist');

    //get the button for hold order
    const hold = document.querySelector('button#hold');

    //Flag to validate inputs
    let isValid = true;

  //=================Order Hold Function=================
    hold.addEventListener('click', function(e){
      document.querySelector('input[name="orderstatus"]').value = 5;
    });


  //=============Submit Form Function======================

    $(orderform).on('submit', function(e){
      e.preventDefault();
        //get all hidden input fields
        let items = [];
        let rows = orderlist.querySelectorAll('tr');     

        //attach inputs to the form
        rows.forEach(function(row){
            let item = [];
            let inputs = row.querySelectorAll('input');
            inputs.forEach(function(input){
                item.push($(input).serialize())
            });
            items.push(item);
            
        });

         let data = JSON.stringify(items);

        //convert form as needed
         let formData = new FormData(orderform);
         formData.append('items', data)

        //get the required inputs
        let order_inputs = orderlist.querySelectorAll('input.dbAction'); 

        if (order_inputs.length < 1)
        {
          noMatch(orderlist);
        }
        else
        {
          //send form to server
          validate(order_inputs);
          if(isValid){
            ajaxforms('/order/', 'POST', formData, false, false);
          }else{
            noMatch(orderlist);
            isValid = true;
          } 
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
  
  