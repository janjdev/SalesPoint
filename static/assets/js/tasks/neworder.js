let tableSort,  customerTable;
window.addEventListener('DOMContentLoaded', () => {

  //Get Item buttons
    const items = document.querySelectorAll('a.item-btn');
    const ctasks = document.querySelectorAll('.c-task');
    const add_remove = document.querySelectorAll('.c-add-remove');
    const ncb = document.getElementById('newCustbtn');
    const ncform = document.querySelector('form#newCust');
    const editform = document.querySelector('form#updateCust');
    const catbtns = document.querySelectorAll('.cat-page');

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

    //Pagination Links
      //Next Items
      const nextItem = document.querySelector('#menu_items a#nextitem');
      //Previous Items
      const prevItem = document.querySelector('#menu_items a#previtem')

      //Next Categories
      const nextCat = document.querySelector('#menu_categories a#nextcat');
      //Previous Categories
      const prevCat = document.querySelector('#menu_categories a#prevcat')

    //Needed variables
    let itemId, itemname, itemprice, newRow, tax, func, cID ,isValid=true, page, currentitems=$('.menu-item'), itemsend = false, catend=false, itemstart=true, catstart=false,  inputs, m = window.innerHeight < 900 ? .225 : .335, pl= (m * window.innerHeight);

    //Element to append to orderlist when menu item is clicked
    function elAppend(id, name, price)
    {
        let menuitem = 
    `
        <td id="qty${id}" class="qty pt-3-half" ><input class="dbAction text-center" name="qty" type="number" value="${1}" /><span></span></td>
        <td class="pt-3-half" ><input class="dbAction" hidden name="item" type="text" value="${id}" />${name}</td>
        <td class="pt-3-half" ><input class="dbAction" hidden name="price" type="text" pattern="[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{1,2})?" value="${price}" />${price}</td>
        <td class="pt-3-half" ><input class="itemNote" name="itemnote" type="text" value="" /></td>                              
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
        <td class="name pt-3-half"><input class="dbAction text-center text-capitalize"  name="itemname" type="text" value="" required /></td>
        <td class="price pt-3-half"><input class="dbAction text-center" name="price" type="number" min=".01" step=".01" pattern="[+-]?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{1,2})?" value="" required/></td>
        <td class="pt-3-half" ><input class="itemNote" name="itemnote" type="text" value="" /></td>                              
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
    tableSort = $('#orderTable').DataTable({ "bSort": false, "bLengthChange": false, "bFilter": true, 
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
     
    customerTable = $('#customer-table').DataTable({"bSort": true, "bLengthChange": false, "bFilter": true, 
    "aaSorting": [],    
    columnDefs: [{
      orderable: false,
      targets: [1]             
      }]})
    customerTable.page.len(6).draw();

    $('.dataTables_length').addClass('bs-select');
    $('div.dataTables_wrapper div.dataTables_filter').parent().prev().css({'display': 'none'});

    $(window).resize(function(){
      m = window.innerHeight < 900 ? .225 : .335
      pl= (m * window.innerHeight);
      $('div.dataTables_scrollBody').css({'max-height': pl+'px'});
      tableSort.draw();      
    });
   
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
          $('div.menu-item').not('.'+filtered).removeClass('active')
          $('div.menu-item.'+ filtered).css({display: 'block'});
          currentitems = $('div.menu-item.'+ filtered);       
          for(i = 0; i < currentitems.length; i++){
              currentitems[i].classList.remove('active')
              if (i < 5){
                currentitems[i].classList.add('active');
              }             
          }
        itemsend = false;
        itemstart = true;
        });
      });

      //Paginate items
        nextItem.addEventListener('click', function(e){
          e.preventDefault();
          let aitems=[];
          if (!itemsend && currentitems.length > 5)
          {
            currentitems.each(function(i, el){
              if (el.classList.contains('active')){
                el.classList.remove('active')
                aitems.push(i);
              }
            });
            let start = Math.max(...aitems) + 1;
            let end = start+5;
            if (end >= currentitems.length)
            {
              itemsend = true;
            }
            for (i = start; i < end && i < currentitems.length; i++){
              currentitems[i].classList.add('active');
            }
            itemstart = false;
  
          }
        });
        prevItem.addEventListener('click', function(e){
          e.preventDefault();
          let bitems=[];
          if (!itemstart && currentitems.length > 5)
          {
            currentitems.each(function(i, el){
              if (el.classList.contains('active')){
                el.classList.remove('active')
                bitems.push(i);
              }
            });
            let start = Math.min(...bitems) - 1;
            let end = start-5;
            if (end <= 0)
            {
              itemstart = true;
              itemsend = false;
            }
            for (i = start; i > end && i > -1; i--){
              currentitems[i].classList.add('active');
            }
          }
        });

        nextCat.addEventListener('click', function(e){
          e.preventDefault();
          if(!catend && catbtns.length > 2){
              let acats =[];
              catbtns.forEach(function(el, i){
                if (el.classList.contains('active')){
                  el.classList.remove('active')
                  acats.push(i);
                }
              });

              let start = Math.max(...acats) + 1;
              let end = start+2;
              if (end >= catbtns.length)
              {
                catend = true;
              }
              for (i = start; i < end && i < catbtns.length; i++){
                catbtns[i].classList.add('active');
              }
              catstart = false;
            }
        });

        prevCat.addEventListener('click', function(e){
          e.preventDefault();
          let bcats=[];
          if (!catstart && catbtns.length > 2)
          {
            catbtns.forEach(function(el, i){
              if (el.classList.contains('active')){
                el.classList.remove('active')
                bcats.push(i);
              }
            });
            let start = Math.min(...bcats) - 1;
            let end = start-2;
            if (end <= 0)
            {
              catstart = true;
              catend = false;
            }
            for (i = start; i > end && i > -1; i--){
              catbtns[i].classList.add('active');
            }
          }
        });

  //-----------------------------------------------------------------------------------    
    //calculate the total
    function ticketTotal(){
        let total = 0.0, qty, price, totalTax=0, rows = table.querySelectorAll('tr');
        rows.forEach(function(row){ 
          let subtotal=0, tax=0;           
            qty = $(row).find('input[name="qty"]').val();
            price = $(row).find('input[name="price"]').val();
            row.querySelectorAll('span.taxes').forEach(function(itax){
              tax+= parseFloat(itax.innerText)/100
            });
             if(qty && price)
             {
                subtotal = qty*parseFloat(price);
                totalTax+= (subtotal*tax);                
                total+= (subtotal*tax)+subtotal;
             }
        });
        return total.toFixed(2);
    }
    
  //-------------------------------------------------------------------------------------------  

  //Append custom item  
  $('.table-add').on('click', 'i', () => {
      $('#custTaxModal').modal('show');
    });
    
    document.querySelector('#addCustTax').addEventListener('click', function(e){
      let taxes = document.querySelector('#taxselection').selectedOptions;
      let custRow = createRow(custAppend());
      taxes.forEach(function(tax){
        let sp = document.createElement('span');
        sp.classList.add('taxes');
        sp.innerText = tax.value;
        custRow.appendChild(sp);
      });      

      //------Custom Item Tax Modal Function--------
        tableSort.row.add( $(custRow)).draw();
        $('#orderlist tr').not($(custRow)).removeClass('active blue lighten-2');
        $(custRow).addClass('active blue lighten-2');
        custRow.scrollIntoView();
        $('#custTaxModal').modal('hide');      
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
            parent.querySelectorAll('span.taxes').forEach(function(tax){
              newtax = tax.cloneNode(true)
                newRow.appendChild(newtax)
            });

            if($(table).find('tr#'+itemId).length > 0)
            {
              let qty = parseInt($('tr#'+itemId).find('input[name="qty"]').val()) + 1            
             
                $('tr#'+itemId).find('input[name="qty"]').val(qty);
                $('tr#'+itemId).find('input[name="qty"]').attr('value', qty);
                             
            }
            else
            {
              tableSort.row.add( $(newRow)[0] ).draw();
              $('#orderlist tr').not($(newRow)).removeClass('active blue lighten-2');
              $(newRow).addClass('active blue lighten-2'); 
              newRow.scrollIntoView()                
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
  
    //===================Cancel Form Function======================
    canclebtn.addEventListener('click', function(e){     
     
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
            result.dismiss === Swal.DismissReason.cancel
          ) {
          }
        });
      }
    });
  //-----------------------------------------------------------------------------


    $(document).on('click', '.c-task', function(e){
      e.preventDefault();
      func = $(this).attr('data-func');
      cID =  $(this).attr('data-id');           
      page = '/edit_cust/' + cID;         
      if(func === 'delete')
      {
          document.querySelector('input[name="delete"]').setAttribute('checked', 'checked');
          Swal.fire({
              title: 'Are you sure?',
              text: 'Delete: ' +  $('tr#cust'+cID + ' span').text(),
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes!',
              cancelButtonText: 'No, cancel!',
              reverseButtons: true
            }).then((result) => {
              if (result.value) {
                  ajaxforms(page, 'POST', editform)
              } else if (               
                result.dismiss === Swal.DismissReason.cancel
              ) {
                document.querySelector('input[name="delete"]').removeAttribute('checked');
                Swal.fire({
                title:  'Cancelled',
                text:  'Customer, ' +$('tr#cust'+cID + ' span').text() + ' was not deleted',
                type:  'error'
                })
              }
            });
      }           
      if (func === 'update')
      {
          document.querySelector('form#updateCust input[name="cname"]').value = $('tr#cust'+cID + ' span').text();
          $(editform).submit();
      }        
 });
    
   //-------Add/Remove Customer to Order-----------------
   $(document).on('click', '.c-add-remove', function(e){
     if($(this).hasClass('c-remove'))
     {
      document.querySelector('input[name="customer"]').value = 1;
      $('span#custName').text('Guest'); 
      $(this).attr('data-original-title', 'Add to Order');
      $(this).find('i').text('add');
      $('.c-add-remove').prop('disabled', false);
      $(this).next().next('button.c-delete').prop('disabled', false);

      $(this).removeClass('c-remove');
     }
     else
     {
      document.querySelector('input[name="customer"]').value = $(this).attr('data-id');
      $('span#custName').text($(this).closest('td').prev().find('span').text());
      console.log($(this).closest('td').prev().find('span').text());                
      $('#addCustModal').modal('toggle');    
      $('.c-add-remove').not($(this)).prop('disabled', true);
      $(this).next().next('button.c-delete').prop('disabled', true)
      $(this).addClass('c-remove');
      $(this).attr('data-original-title', 'Remove from Order');
      $(this).find('i').text('minimize');
     }
   });

 

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
 
    document.querySelector('#newCust').reset();
    $('#newCustModal').modal('hide');


    customerTable.destroy();
    $('#addCustWrapper').load(document.URL + ' #cust-content');
    setTimeout(function(){
      customerTable = $('#customer-table').DataTable({"bSort": true, "bLengthChange": true, "bFilter": true, 
      "pageLength": 6,
      "aaSorting": [],
      "scrollY":"500px", 
      "scrollCollapse":true, 
      columnDefs: [{
        orderable: false,
        targets: [1]             
        }]})
        $('.dataTables_length').addClass('bs-select');
        $('div.dataTables_wrapper div.dataTables_filter').parent().prev().css({'display': 'none'});
      }, 150)
}
 
function updateCust(){
    $('#addCustModal').modal('hide');
}