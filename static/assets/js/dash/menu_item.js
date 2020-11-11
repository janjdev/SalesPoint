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
    let itemtasks = document.querySelectorAll('.item-task');
  
    //The form to submit
    let itemform = document.querySelector('form#itemform'); 
       
    //Needed variables
    let page, title, func, id, isValid=true, iteminputs = document.querySelectorAll('.itemAction');
  
    //Element that holds the title of the form
    const modalTitle = document.querySelector('#itemModal #modal-title');
    
    //All input checkboxes returns an HTML collection
    let Checks = document.querySelectorAll('.row-check');
  
    //Checked input checkboxes returns an HTMl collection
    let checked = document.querySelectorAll('input.row-check:checked');
  
    //Toggle Actions Enabled
    $('tr.True button[data-func="active"]').attr('disabled', true);
    $('tr.False button[data-func="archived"]').attr('disabled', true);
  
    //Sort table function
    $('table#itemTable').DataTable({
      "aaSorting": [],
      columnDefs: [{
      orderable: false,
      targets: [0,1,6,7,10],
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
        $('tr[data-class="itemrow"]').not('.'+filtered).css({'display': 'none'});
        $('tr[data-class="itemrow"].'+ filtered).css({display: 'table-row'});
      });
    });
  
  //tasks function for add, edit, copy
  itemtasks.forEach(function(task) {
    task.addEventListener('click', function(e){        
      //get the route      
      page = task.getAttribute('data-href');
      //get the title of the action
      title = task.getAttribute('data-title');
      //get the specific task
      func =  task.getAttribute('data-func');
      //set the title of the modal
      modalTitle.innerText = title         
  
      //if the task is edit or copy get the selected row information
      if (func != 'add')
      {
          if (func == 'edit' || func == 'archive')
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
          if (func == 'edit' || func == 'archive')
          {
           
            id = checked[0].closest('tr').getAttribute('id');
          }
          else
          {
            id = task.getAttribute('data-id');          
          }        
          document.querySelector('input[name="item_name"]').value = $('tr#' + id + ' td.item_name')[0].innerText;
          document.querySelector('input[name="price"]').value = $('tr#' + id + ' td.price')[0].innerText;
          document.querySelector('#item_cat').value = $('tr#' + id + ' td.category').attr('data-cat');
          $('#item_cat').change();
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
            if(func == "archived" || func == 'archive')
            {
              document.querySelector('input[name="offered"]').removeAttribute('checked');
            }
            else
            {
              document.querySelector('input[name="active"]').setAttribute('checked', 'checked');
            }     
            
            $(itemform).submit();        
          }            
        }
      });
    });  
  
   //Add/Edit a Categorey
  jQuery(itemform).on('submit', function(e){
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
    let active = document.querySelectorAll('.edit_active-offered')[0];
    active.addEventListener('change', function(e){
      if(e.target.checked){
        e.target.value = 1;
      }
      else{
        e.target.value = 0;
        e.target.removeAttribute('checked')
      }
    })

    $('.cancel').on('click', function(e){
        itemform.reset();
    });
  
        //Function to disable multi row select in table
    Checks.forEach(function(check){
      check.addEventListener('change', function(e){
        //if a row (checkbox) is checked
          if (e.target.checked)
          {
            //remove checked property from all checkboxes but (not) this checkbox
            $(Checks).not(e.target).prop("checked", false);
  
            //get the check input
            checked = document.querySelectorAll('input.row-check:checked');
          }
          else
          {
            //set checked input to an empty array           
            checked = document.querySelectorAll('input.row-check:checked');
          } 
      });
    });
  
  function loadElement(el){
    if($('.modal').hasClass('show'))
    {
      $('.modal').modal('hide');
    }
        location.reload();    
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
    fields.forEach(function(el){
      if (el.value == '' || /\S/.test(el.value) == false)
      {
        isValid = false;
      }     
    });    
  }
  
  //Shake if required fields are empty
  function noMatch(form){
    jQuery(form).parent().parent().addClass('animated shake');
     setTimeout(function(){
       jQuery(form).parent().parent().removeClass('animated shake');
     }, 1000);
   }
  
});