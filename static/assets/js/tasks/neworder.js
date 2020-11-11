window.addEventListener('DOMContentLoaded', () => {

    //Get Item buttons
    const items = document.querySelectorAll('a.item-btn');
    const ctasks = document.querySelectorAll('.c-task');
    const add_remove = document.querySelectorAll('.c-add-remove');
    const ncb = document.getElementById('newCustbtn');
    const ncform = document.querySelector('form#newCust');
    const editform = document.querySelector('form#updateCust');

    //Element with data
    let parent;

    // get the order ticket
    const orderform = document.querySelector('#new-ticket');

    //Table to append item rows
    const table = document.getElementById('orderlist');

    //Total ticket element
    const tickTotal = document.getElementById('ticket-total');

    //get the cancel trigger
    const canclebtn = document.querySelector('#cancelbtn');

    //Needed variables
    let itemId, itemname, itemprice, newRow, tax, func, cID ,isValid=true, page, inputs, m = window.innerHeight < 900 ? .225 : .335, pl= (m * window.innerHeight); console.log(pl); console.log(window.innerHeight);

    //Element to append to orderlist when menu item is clicked
    function elAppend(id, name, price)
    {
        let menuitem = 
    `
        <td id="qty${id}" class="qty pt-3-half" ><input class="dbAction text-center" name="qty" type="number" value="${1}" /><span></span></td>
        <td class="pt-3-half" ><input class="dbAction" hidden name="item" type="text" value="${id}" />${name}</td>
        <td class="pt-3-half" ><input class="dbAction" hidden name="price" type="text" pattern="[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?" value="${price}" />${price}</td>                              
        <td>
        <span class="table-remove"><button type="button"
            class="btn btn-danger btn-rounded btn-sm my-0">x</button></span>
        </td>
    `;
    return menuitem;
    }

    //Element to appdend a custom item
    function custAppend(){
        let customItem =
        `
        
        <td class="qty pt-3-half"><input class="dbAction text-center" name="qty" type="number" value="1" required/><span></span></td>
        <td class="name pt-3-half"><input class="dbAction text-center"  name="itemname" type="text" value="" required /></td>
        <td class="price pt-3-half"><input class="dbAction text-center" name="price" type="text" pattern="[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?" value="" required/></td>                              
        <td>
            <span class="table-remove">
                <button type="button" class="btn btn-danger btn-rounded btn-sm my-0">x</button>
            </span>
        </td>
       
        `;
        return customItem;
    }

  //--------------------------------FUNCTIONS----------------------------------

    //Sort the table
    const tableSort = $('#orderTable').DataTable({ "bSort": false, "bLengthChange": false, "bFilter": true, 
      "aaSorting": [],
      scrollX: false,      
			scrollY: pl+'px',
      scrollCollapse: true,
      paging: false,
      columnDefs: [{
      orderable: false,
      targets: []             
      }]
      });
    //tableSort.page.len(pl).draw();
    $('.dataTables_length').addClass('bs-select');
    $('div.dataTables_wrapper div.dataTables_filter').parent().prev().css({'display': 'none'});

    $(window).resize(function(){
      m = window.innerHeight < 900 ? .225 : .335
      pl= (m * window.innerHeight);
      $('div.dataTables_scrollBody').css({'max-height': pl+'px'});
      console.log(pl); console.log(window.innerHeight);
      tableSort.draw();
      
    })
   
  //-------------------------------------------------------------------------
  
      //Remove item button function
      $(table).on('click', '.table-remove', function () {     
        tableSort.row($(this).parents('tr')).remove().draw();        
        tickTotal.value = ticketTotal();        
      });

  //-----------------------------------------------------------------------------    
      
     //Filter menu items function
     document.querySelectorAll('button.cat-btn').forEach(function(filter){
        filter.addEventListener('click', function(e){
          const filtered = e.target.getAttribute('id');      
          $('div.menu-item').not('.'+filtered).css({'display': 'none'});
          $('div.menu-item.'+ filtered).css({display: 'block'});
        });
      });

  //-----------------------------------------------------------------------------------    
    
    //calculate the total
    function ticketTotal(){
        let total = 0.0, qty, price, rows = table.querySelectorAll('tr');
        rows.forEach(function(row){            
            qty = $(row).find('input[name="qty"]').val();
            price = $(row).find('input[name="price"]').val();
             if(qty && price)
             {
                 total += qty*parseFloat(price);
             }
        });
        return total.toFixed(2);
    }
    
  //-------------------------------------------------------------------------------------------  

  //Append custom item  
  $('.table-add').on('click', 'i', () => {
    let custRow = createRow(custAppend());
      tableSort.row.add( $(custRow)).draw();
      $('#orderlist tr').not($(custRow)).removeClass('active blue lighten-2');
      $(custRow).addClass('active blue lighten-2');
        custRow.scrollIntoView()      
        //$('tbody#orderlist').append(custAppend());
    });

  //---------------------------------------------------------------------------------------------

    //Function to add a new (non-custom) item
    items.forEach(function(item){
        item.addEventListener('click', function(e){
            e.preventDefault();
            parent = item.parentElement;            
            itemId = parent.getAttribute('id');            
            itemname = parent.getAttribute('data-name');
            itemprice = parent.getAttribute('data-price');

            menuitem = elAppend(itemId, itemname, itemprice);

            newRow = createRow(menuitem);

            newRow.setAttribute('id', itemId);            

            if($(table).find('tr#'+itemId).length > 0)
            {
              let qty = parseInt($('tr#'+itemId).find('input[name="qty"]').val()) + 1            
             
                $('tr#'+itemId).find('input[name="qty"]').val(qty);
                $('tr#'+itemId).find('input[name="qty"]').attr('value', qty);

                //document.getElementById('qty'+itemId).querySelector('span').innerText = qty;              
            }
            else
            {
              tableSort.row.add( $(newRow)[0] ).draw();
              $('#orderlist tr').not($(newRow)).removeClass('active blue lighten-2');
              $(newRow).addClass('active blue lighten-2'); 
              newRow.scrollIntoView()
                // table.appendChild(newRow);
            }

            tickTotal.value = ticketTotal();      
        });
    });


  //--------------------------------------------------------------------------  

    //Function to create table row element
    function createRow(str){
        let row = document.createElement('tr');        
        row.innerHTML = str;
        return row;
    }

  //--------------------------------------------------------------------------  
    //Calculate total on custom item when changed
    $(table).on('click keyup', 'input.dbAction', function(e){
      if ($(this).closest('input[name="qty"]').val() < 1){
        tableSort.row($(this).parents('tr')).remove().draw(); 
        //$(this).closest('tr').detach();        
      }
      tickTotal.value = ticketTotal();
    });

  //---------------------------------------------------------------------------  

    //Select items for changing qty or removing
    $('#orderlist').on('click keydown', 'tr', function(e){
      $('#orderlist tr').not($(this)).removeClass('active blue lighten-2');
      $(this).addClass('active blue lighten-2');
    });

  //------------------------------------------------------------------------------  
    
    //Functions to manipulate order items from side buttons

        //Traverse up the table
        $("#up").click(function() {
          let row = $(table).find('tr.active'); 

          if (table.querySelectorAll('tr').length > 1){
            let index = tableSort.row( row ).index();          
            if (index > 0) {
              document.querySelectorAll("tr.active")[0].previousSibling.scrollIntoView();

              $('#orderlist tr').removeClass('active blue lighten-2');
              $(row.prev()).addClass('active blue lighten-2');
            }
          }
          
          });

          //Traverse down the table
        $("#down").click(function() {
              let row = $(table).find('tr.active');
              let len = table.querySelectorAll('tr').length
            
              if (len > 1){
                let index = tableSort.row( row ).index();
                if (index < len-1) {
                  document.querySelectorAll("tr.active")[0].nextSibling.scrollIntoView();
                
                  $('#orderlist tr').removeClass('active blue lighten-2');
                  $(row.next()).addClass('active blue lighten-2');
                }
              }         
              });
          //Increase item quantity
          $('#add').click(function(e){
            e.preventDefault();
            let row = $(table).find('tr.active input[name="qty"]');
            let itemValue = row.val(); row.val(parseInt(itemValue) + 1);
            tickTotal.value = ticketTotal();
          });

          //Decrease item quantity
          $('#sub').click(function(e){
            e.preventDefault();
            let row = $(table).find('tr.active input[name="qty"]');
            let itemValue = row.val(); row.val(parseInt(itemValue) - 1);
            if (row.val() < 1){
              tableSort.row(row.parents('tr')).remove().draw(); 
              //$(this).closest('tr').detach();        
            }
            tickTotal.value = ticketTotal();
          });

          //Remove item button function
          $('#remove').click(function (e) {
            e.preventDefault();
            let row = $(table).find('tr.active');     
            tableSort.row($(row)).remove().draw();        
            tickTotal.value = ticketTotal();        
          });
  
  
  //---------------------------------------------------------------------------------------------
  
    //=============Cancel Form Function======================
    canclebtn.addEventListener('click', function(e){
      console.log(table.querySelectorAll('td.dataTables_empty'));
     
      if ( table.querySelectorAll('td.dataTables_empty').length < 1  ){
        Swal.fire({
          title: 'Cancel the Order',
          text: 'Cancels the entire order',
          type: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes!',
          cancelButtonText: 'No, cancel!',
          reverseButtons: true
        }).then((result) => {
          if (result.value) {
            orderform.reset();
            let rows = table.querySelectorAll('tr');    
            for(i = 0; i < rows.length; i++){
              if(rows)
              $(rows[i]).detach();
            }
            tableSort.clear().draw();
            orderform.querySelector('input[name="customer"]').value = 1;
            
          } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
          ) {
          }
        });
      }
      
      
      
    })


  //-----------------------------------------------------------------------------

   //Customer actions
   ctasks.forEach(function(task){
       task.addEventListener('click', function(e){
           e.preventDefault();
            func = task.getAttribute('data-func');
            cID = task.getAttribute('data-id');           
            page = '/edit_cust/' + cID;         
            if(func === 'delete')
            {
                document.querySelector('input[name="delete"]').setAttribute('checked', 'checked');
                Swal.fire({
                    title: 'Are you sure?',
                    text: 'Delete: ' +  $('tr#'+cID + ' span').text(),
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Yes!',
                    cancelButtonText: 'No, cancel!',
                    reverseButtons: true
                  }).then((result) => {
                    if (result.value) {
                        ajaxforms(page, 'POST', editform)
                    } else if (
                      /* Read more about handling dismissals below */
                      result.dismiss === Swal.DismissReason.cancel
                    ) {
                      document.querySelector('input[name="delete"]').removeAttribute('checked');
                      Swal.fire({
                      title:  'Cancelled',
                      text:  'Customer, ' +$('tr#'+cID + ' span').text() + ' was not deleted',
                      type:  'error'
                      })
                    }
                  });
            }           
            if (func === 'update')
            {
                document.querySelector('form#updateCust input[name="cname"]').value = $('tr#'+cID + ' span').text();
                $(editform).submit();
            }          
       });
   });

   //-------Add/Remove Customer to Order-----------------
   $(add_remove).click(function(e){
     if($(this).hasClass('c-remove'))
     {
      document.querySelector('input[name="customer"]').value = 1;
      $('span#custName').text('Guest'); 
      $(this).attr('data-original-title', 'Add to Order');
      $(this).find('i').text('add');
      $(add_remove).prop('disabled', false);
      $(this).next().next('button.c-delete').prop('disabled', false);

      $(this).removeClass('c-remove');
     }
     else
     {
      document.querySelector('input[name="customer"]').value = $(this).attr('data-id');
      $('span#custName').text($(this).closest('td').prev().find('span').text());                
      $('#addCustModal').modal('hide');
      $(add_remove).not($(this)).prop('disabled', true);
      $(this).next().next('button.c-delete').prop('disabled', true)
      $(this).addClass('c-remove');
      $(this).attr('data-original-title', 'Remove from Order');
      $(this).find('i').text('minimize');
     }
     
   })

ncb.addEventListener('click', function(e){
    e.preventDefault();
    $(ncform).submit();      
});

jQuery(ncform).on('submit', function(e){
e.preventDefault();    
validate(document.querySelectorAll('#newCust input.cAction'));
if(isValid){
    ajaxforms('/customer', 'POST', ncform)
}else{
    noMatch(ncform);
    isValid = true;
} 
});

jQuery(editform).on('submit', function(e){
    e.preventDefault();    
    validate(document.querySelectorAll('form#updateCust input.cAction'));
    if(isValid){
        ajaxforms(page, 'POST', editform)
    }else{
        noMatch(editform);
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

  function noMatch(form){
    jQuery(form).parent().parent().addClass('animated shake');
     setTimeout(function(){
       jQuery(form).parent().parent().removeClass('animated shake');
     }, 1000);
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

 });

//=============CALLBACK FUNCTIONS======================

function newCust(){
    $('#newCustModal').modal('hide');
 }


function updateCust(){
    $('#addCustModal').modal('hide');
}