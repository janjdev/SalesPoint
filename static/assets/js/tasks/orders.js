
let orderstable, m, pl, checked;
window.addEventListener('DOMContentLoaded', () => {

    m = window.innerHeight < 900 ? .225 : .335; pl= (m * window.innerHeight); 
    const chgstat = document.querySelector('#changeStaus');
    const chgorder = document.querySelector('#changeOrder');


    orderstable = $('#ordersTable').DataTable({ "bSort": true, "bLengthChange": true, "bFilter": true, 
        "aaSorting": [],
        scrollX: false,      
        scrollY: pl+'px',
        scrollCollapse: true,
        paging: true,
        columnDefs: [{
        orderable: false,
        targets: [0]             
        }]
    });

    $('.dataTables_length').addClass('bs-select');
    $(window).resize(function(){
        m = window.innerHeight < 900 ? .225 : .335
        pl= (m * window.innerHeight);
        $('div.dataTables_scrollBody').css({'max-height': pl+'px'});
        orderstable.draw();      
      });


    //Filter table function
    let filter = {}
        $(document).on('click', 'button.filters', function(e){

            if($(this).hasClass('status')){
                $('button.status, button.all').not($(this)).removeClass('active');

                if($(this).hasClass('active')){
                    $(this).removeClass('active')
                }
                else{
                    $(this).addClass('active');
                }

                if($(this).hasClass('active')){
                    const filtered = e.target.getAttribute('data-filter');
                    console.log(filtered);
                    filter['status'] = filtered;
                }
                else{
                    delete filter.status
                }
            }
            if($(this).hasClass('type')){
                $('button.type, button.all').not($(this)).removeClass('active');

                if($(this).hasClass('active')){
                    $(this).removeClass('active')
                }
                else{
                    $(this).addClass('active');
                   
                }

                if($(this).hasClass('active')){
                    const filtered = e.target.getAttribute('data-filter');
                    console.log(filtered);
                    filter['type'] = filtered;
                }
                else{
                    delete filter.type;
                }
            }

            if($(this).hasClass('all')){
                $(this).toggleClass('active');
                if($(this).hasClass('active')){
                    $('button.filters').not($(this)).removeClass('active');
                    delete filter.type;
                    delete filter.status
                }
            }            
                if (!('status' in filter) && ! ('type' in filter) ){
                    $('tr[data-class="orders"].all').css({display: 'table-row'})
                };

                if ('status' in filter && !('type' in filter)){
                    $('tr[data-class="orders"]').not('.stat'+filter['status']).css({display: 'none'});
                    $('tr[data-class="orders"].stat'+ filter['status']).css({display: 'table-row'});
                }
                if('type' in filter && !('status' in filter)){
                    $('tr[data-class="orders"]').not('.type'+filter['type']).css({display: 'none'});
                    $('tr[data-class="orders"].type'+ filter['type']).css({display: 'table-row'});
                }
                
                if('type' in filter && 'status' in filter){
                    $('tr[data-class="orders"].all').css({display: 'none'})
                    $('tr[data-class="orders"].stat'+ filter.status + '.type'+filter.type).css({display: 'table-row'});
                }
        });

    //Single row selection
    $('#ordersTable').on('click keydown', 'tr', function(e){
        $('#ordersTable tr').not($(this)).removeClass('active blue lighten-2');
        $(this).addClass('active blue lighten-2');
        $('input[name="rowSelect"]').prop('checked', false)
        $(this).find('input[name="rowSelect"]').prop('checked', true);
      });

    $(document).on('click', 'button.o-actions', function(e){
        let func = $(this).attr('data-action');
        if (func == 'refund' || func == 'void'){
            if (! $('#user-role').text().toUpperCase() == "ADMINISTRATOR"){
                Swal.fire({
                    type: 'error',
                    text: 'Administrator required to ' + func + 'an order',
                    timer: 2000,
                  });
                return;
            }
        }    
        if (document.querySelectorAll('input.row-check:checked').length == 1){
            checked = $('input.row-check:checked').closest('tr[data-class="orders"]');
            chgstat.querySelector('input[name="action"').value = func;
            let id = $(checked).attr('id');
            ajaxforms('/staus/' + id, 'POST', chgstat);
        }
        else{
            Swal.fire({
                type: 'error',
                text: 'Select 1 row to ' + func,
                timer: 2000,
            });
                return;
        }
    });


    // ==============Reopen Order======================
    $(document).on('click', 'button.reopen', function(e){

        if (document.querySelectorAll('input.row-check:checked').length == 1){
            checked = $('input.row-check:checked').closest('tr[data-class="orders"]');
            let status = $(checked).attr('data-status');
            console.log(status);
            if(status != 1 && status != 5){
                Swal.fire({
                    type: 'error',
                    text: 'Only open or pending orders can be changed.',
                    timer: 2000,
                });
                return;
            }
            let id = $(checked).attr('id');
            window.location.href = "/reopen/" + id;
            
        }
        else{
            Swal.fire({
                type: 'error',
                text: 'Select 1 row to ' + func,
                timer: 2500,
            });
                return;
        }

    });

    // ==============Get order info ==========================
        $(document).on('click', 'button#orderinfobtn', function(e){

            if (document.querySelectorAll('input.row-check:checked').length == 1){
                checked = $('input.row-check:checked').closest('tr[data-class="orders"]');
                let id = $(checked).attr('id');
                let url =  "/return_orders/" + id;
               
                $.ajax({
                    url: url,
                    type: "POST",
                    success: function(resp){
                        $('#orderinfoAppend').append(resp.data)
                        $('#infoModal').modal('show');
                    }
                })
            }
            else{
                Swal.fire({
                    type: 'error',
                    text: 'Select an order to view its details',
                    timer: 2500,
                });
                    return;
            }

        });

    $(document).on('click', '#closeTicketInfo', function(e){
       clearTicketData();
    });

    $(document).on('click', '.modal-header button.close', function(e){
        clearTicketData();
     });
    

    function clearTicketData(){
        $('#Ticket_Information').detach();
    }

    // ====================Ajax==========================
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





// =========================Callabck========================
function updateOrders(){
    document.querySelector('#changeStaus').reset();
    orderstable.destroy();
    $('#ordersWrapper').load(document.URL + ' #ordersCard');
    setTimeout(function(){
        orderstable = $('#ordersTable').DataTable({ "bSort": true, "bLengthChange": true, "bFilter": true, 
            "aaSorting": [],
            scrollX: false,      
            scrollY: pl+'px',
            scrollCollapse: true,
            paging: true,
            columnDefs: [{
            orderable: false,
            targets: [0]             
            }]
        });
        $('.dataTables_length').addClass('bs-select');
    }, 350)
}