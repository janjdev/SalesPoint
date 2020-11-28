window.addEventListener('DOMContentLoaded', () => {
    // get the order ticket
    const orderform = document.querySelector('#new-ticket');

    //get the generated list of items
    const orderlist = document.querySelector('#orderlist');

    // get the button to send the order
    const send = document.querySelector('button#send');

    //get the button for hold order
    const hold = document.querySelector('button#hold');

    const add_remove = document.querySelectorAll('.c-add-remove');

    //Ticket Table
    const table = document.getElementById('orderlist');

    //Flag to validate inputs
    let isValid = true;

  //=================Order Status Function=================
    hold.addEventListener('click', function(e){
      // e.preventDefault();
      document.querySelector('input[name="orderstatus"]').value = 5;
    });

    send.addEventListener('click', function(e){
      // e.preventDefault();
      document.querySelector('input[name="orderstatus"]').value = 1;
      // $(orderform).submit();
    });

  //=============Submit Form Function======================

    $(orderform).on('submit', function(e){
      e.preventDefault();


      let otype = $('input[name="ordertype"]').val();
      let tables = $('input[name="ordertable"]').length;
      if( otype == 1){
        if (tables < 1){
          Swal.fire({
            type: 'error',
            text: 'No tables added to Dine-In order. Please add a table or change the order type.',
            timer: 2000,
          });
        return;
        }
      }
        //get all hidden input fields
        let items = [];
        let rows = orderlist.querySelectorAll('tr');     

        //attach inputs to the form
        rows.forEach(function(row){
            let item = [];
            let inputs = row.querySelectorAll('input');
            inputs.forEach(function(input){
              let i = $(input).serialize()
              item.push( decodeURIComponent(i));
            });
            items.push(item);
            console.log(items)
            
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

   // clear the order ticket
   function clearOrder(){
    orderform.reset(); 
     $(add_remove).removeClass('c-remove');
     $(add_remove).text('Guest'); 
     $(add_remove).attr('data-original-title', 'Add to Order');
     $(add_remove).find('i').text('add');
     $(add_remove).prop('disabled', false);
     $(add_remove).next().next('button.c-delete').prop('disabled', false);
    
    let rows = table.querySelectorAll('tr');    
     for(i = 0; i < rows.length; i++){
       if(rows)
       $(rows[i]).detach();
     }
     tableSort.clear().draw();
     orderform.querySelector('input[name="customer"]').value = 1;   
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

//Shake form if input is not valid
function noMatch(form){
  jQuery(form).parent().parent().addClass('animated shake');
   setTimeout(function(){
     jQuery(form).parent().parent().removeClass('animated shake');
   }, 1000);
 }


//------------------------------------------------------------------------ 

    // Change Order type function
    $(document).on('click', 'a#chngtype', function(e){
      console.log('click');
      let tyname, typeid, currentclass;
      if ($(this).hasClass('dine-in')){tyname="carry-out"; typeid=2; currentclass="dine-in" }else{tyname="dine-in"; typeid=1; currentclass="carry-out"}
      Swal.fire({
        title: 'Change Order Type',
        text: 'Change order to ' + tyname + '?',
        type: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes!',
        cancelButtonText: 'No, cancel!',
        reverseButtons: true
      }).then((result) => {
        if (result.value) {
          $('body').removeClass('dinein');
          $(this).removeClass(currentclass);
          $(this).addClass(tyname);
          $(this).find('span.chgtyname').text(tyname);
          $('input[name="ordertable"]').detach();
          $('#addtablesbtn').closest('div').addClass('hide');
          orderform.querySelector('input[name="ordertype"]').value = typeid;
          if($(this).hasClass('dine-in')){
            $('body').addClass('dinein');
            $('#tablesModal').modal('show');
            $('#addtablesbtn').closest('div').removeClass('hide');
          }
        } else if (            
          result.dismiss === Swal.DismissReason.cancel
        ) {
        }
      });
    });


//==========Add/Remove Tables to/from Order============
$(document).on('click', 'button.table-btn', function(e){
let tableid = $(this).attr('id');
$(this).toggleClass('active');
if( $(this).hasClass('active') ){            
  let table = document.createElement('input');
  table.setAttribute('name', 'ordertable')
  table.setAttribute('hidden', '');
  table.value = tableid.slice(5);
  $(table).addClass('order-'+tableid);
  orderform.appendChild(table);
}
else{
  $('input.order-'+tableid).detach();
}
});



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

});
  
// ----------------------------CallBacks------------------------------------
function goTo(page){
  window.location.href = page;
}  
  