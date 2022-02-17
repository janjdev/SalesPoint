//Variable for dataTables
let itemTable, itemform;

window.addEventListener('DOMContentLoaded', () => {

//---------------------Menu Items------------------------------//

//set the current tab
    $('a#menuitem[data-toggle="tab"]').on('show.bs.tab', function(e) {
        localStorage.clear();
        localStorage.setItem('itemTab', $(e.target).attr('href'));
    });
    let itemTab = localStorage.getItem('itemTab');
    if(itemTab){
        $('#menuTabs a[href="' + itemTab + '"]').tab('show');
        $('#menuitem').addClass('active show');
    
    }
  
    //Actions buttons or links
    // let itemtasks = document.querySelectorAll('.item-task');
  
    //The form to submit
    itemform = document.querySelector('form#itemform'); 
       
    //Needed variables
    let page, title, func, id, isValid=true, iteminputs = document.querySelectorAll('.itemAction');
  
    //Element that holds the title of the form
    const modalTitle = document.querySelector('#itemModal #modal-title');
    
    //Checked input checkboxes returns an HTMl collection
    let checked = document.querySelectorAll('#itemTable input.row-check:checked');
  
    //Toggle Actions Enabled
    $('#itemTable tr.True button[data-func="active"]').attr('disabled', true);
    $('#itemTable tr.False button[data-func="archive"]').attr('disabled', true);
  
     //Sort table function   
      itemTable = $('table#itemTable').DataTable({
      "aaSorting": [],
      // className: "row-check form-check-input",
      // targets:   0,
      // select: 'single',
      columnDefs: [{
      orderable: false,
      targets: [0,1,10],
      "scrollY": "10vh",
      "scrollCollapse": true,
      "scrollX": true
      }]
    });
    $('.dataTables_length').addClass('bs-select');
      
    //Filter table function
    document.querySelectorAll('a.selects').forEach(function(filter){
      filter.addEventListener('click', function(e){
        const filtered = e.target.getAttribute('data-filter');
        $.fn.dataTable.ext.search.pop();
        $.fn.dataTable.ext.search.push(
          function(settings, data, dataIndex) {
              return $(itemTable.row(dataIndex).node()).hasClass(filtered);
          }
       );      
        // $('tr[data-class="itemrow"]').not('.'+filtered).css({'display': 'none'});
        // $('tr[data-class="itemrow"].'+ filtered).css({display: 'table-row'});
        itemTable.draw();
      });
    });

    
  
  //tasks function for add, edit, copy  
    $(document).on('click', '.item-task', function(e){        
      //get the route      
      page = $(this).attr('data-href');      
      //get the title of the action
      title = $(this).attr('data-title');    
      //get the specific task
      func =  $(this).attr('data-func');    
      //set the title of the modal
      modalTitle.innerText = title         
  
      //if the task is edit or copy get the selected row information
      if (func != 'add')
      {
          if (func == 'edit' || func == 'delete')
          {
            if (checked.length < 1){
              Swal.fire({
              type: 'error',
              text: 'Select a row to ' + func,
              timer: 2000,
            });
              return;
            }
          }    
          if (func == 'edit' || func=="delete")
          {
           
            id = checked[0].closest('tr').getAttribute('id');
          }
          else
          {
            id =$(this).attr('data-id');
                    
          }        
          document.querySelector('input[name="item_name"]').value = $('tr#' + id + ' td.item_name')[0].innerText;
          document.querySelector('input[name="price"]').value = $('tr#' + id + ' td.price')[0].innerText;
          document.querySelector('#item_cat').value = $('tr#' + id + ' td.category').attr('data-cat');
          $('#item_cat').trigger('change');
          let taxids=[];
          $.each($('tr#' + id + ' td.tax span.taxtype'), function(i, el){
            taxids.push(el.getAttribute('data-taxid'));        
          });        
          $.each(taxids, function(i,e){
              $("#taxselection option[value='" + e + "']").prop("selected", true);
          });
          $('#taxselection').trigger('change');
          document.querySelector('input[name="desc"]').value = $('tr#' + id + ' td.desc')[0].innerText;
          if (document.querySelector('img.img' != null))
          {
            document.querySelector('input[name="image"]').value = $('tr#' + id + ' td.img img.img').attr('src');
          }          
          page = '/edit_item/' + id;  
          if (func == 'edit')
          {          
            //Is offered
            if ($('tr#' + id + ' td.offered')[0].innerText == 'True' )
            {
              document.querySelector('input[name="offered"]').checked;
            }
            else
            {
              document.querySelector('input[name="offered"]').removeAttribute('checked');
            }

            //Is special
            if ($('tr#' + id + ' td.special')[0].innerText == 'True' )
            {
              document.querySelector('input[name="special"]').checked;
            }
            else
            {
              document.querySelector('input[name="special"]').removeAttribute('checked');
            }
              
              $('#itemModal').modal('show');
          }
          else 
          { 
              if( func == 'archive')            
              {
                document.querySelector('input[name="offered"]').removeAttribute('checked');
              }
              if(func == 'active')
              {
                document.querySelector('input[name="offered"]').checked = true;
              }
              if (func == 'delete')
              {
                page = "/delete_items/" +id;
              }
                $('#itemform').trigger("submit");    
                      
          }
        }
      });
    
  
   //Add/Edit a Item
  $("#itemform").on('submit', function(e){
    e.preventDefault(); 
    validate(iteminputs);
    if(isValid){        
      let formData = new FormData(itemform);
      ajaxforms(page, 'POST', formData, false, false)
    }else{
      noMatch(itemform);
      isValid = true;
    } 
  });
     
    /*--------------------SHARED----------------------------*/  
  
    
   //Change value of is_active/is_offered
  // let active = document.querySelectorAll('.active-offered')[0];
 $(document).on('click, change', '.active-offered', function(e){
    if($(this).prop("checked", true)){
      $(this).val(1);
    }
    else{
      $(this).val(0);
      $(this).prop('checked', false)
    }
  });

    $('.cancel').on('click', function(e){
        itemform.reset();
    });
  
        // //Function to disable multi row select in table
        $(document).on('click','input.row-check', function(e){

          var $box = $(this);
          if ($box.is(":checked")) {
            // the name of the box is retrieved using the .attr() method
            // as it is assumed and expected to be immutable
            var group =  $("input.row-check");
            // the checked state of the group/box on the other hand will change
            // and the current value is retrieved using .prop() method
            $(group).prop("checked", false);
            $('input', itemTable.cells().nodes()).prop('checked', false);          
            $box.prop("checked", true);
            //get the check input
            checked = document.querySelectorAll('input.row-check:checked');
          } else {
            $box.prop("checked", false);
            $('input', itemTable.cells().nodes()).prop('checked', false);
            //set checked input to an empty array           
            checked = document.querySelectorAll('input.row-check:checked');
          }
        });
     
  function loadElement(el){
   $('#itemModal').modal('hide');
   itemform.reset();
   itemTable.destroy();
   $('#tableI').load(document.URL +  '  #itemTable');
   $('tr.True button[data-func="active"]').attr('disabled', true);
   $('tr.False button[data-func="archived"]').attr('disabled', true);
   setTimeout(function(){
    itemTable = $('table#itemTable').DataTable({
      "aaSorting": [],
      columnDefs: [{
      orderable: false,
      targets: [0,1,10],
      "scrollY": "10vh",
      "scrollCollapse": true,
      "scrollX": true
      }]
    });
    $('.dataTables_length').addClass('bs-select');
  }, 500)      
   
    setTimeout(function(){
    $('a.active').removeClass('active show');
    $('.tab-pane.active').removeClass('active');        
    $('#menu' +el).addClass('active show');
    $('#' + el).addClass('active show');
    },500)
  }




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

      
  //validate form fields - checks that fields are not empty
  function validate(args){
    let fields = [];
    args.forEach(el => fields.push(el));
    if (func != 'delete')
    {
      fields.forEach(function(el){
        if (el.value == '' || /\S/.test(el.value) == false)
        {
          isValid = false;
          console.log(el);
        }     
      }); 
    }   
  }
  
  //Shake if required fields are empty
  function noMatch(form){
    jQuery(form).parent().parent().addClass('animated shake');
     setTimeout(function(){
       jQuery(form).parent().parent().removeClass('animated shake');
     }, 1000);
   }
  
});