//Variable for dataTables
let cattable

window.addEventListener('DOMContentLoaded', () => {

  //--------------Menu Categories-------------------//

  //set the current tab
  $('a#menucat[data-toggle="tab"]').on('show.bs.tab', function(e) {
    localStorage.clear();
    localStorage.setItem('catTab', $(e.target).attr('href'));
  });
    let catTab = localStorage.getItem('catTab');
    if(catTab){
    $('#menuTabs a[href="' + catTab + '"]').tab('show');
    $('#menucat').addClass('active show');

}

  //Actions buttons or links
  // let cattasks = document.querySelectorAll('.cat-task');

  //The form to submit
  let catform = document.querySelector('form#catform');  
  
  //Needed variables
  let page, title, func, id, isValid=true, catinputs = document.querySelectorAll('.catAction');

  //Element that holds the title of the form
  const modalTitle = document.querySelector('#modal-title');
  
  

  //Checked input checkboxes returns an HTMl collection
  let checked = document.querySelectorAll('input.row-check:checked');

  //Toggle Actions Enabled
  $('tr.True button[data-func="active"]').attr('disabled', true);
  $('tr.False button[data-func="archived"]').attr('disabled', true);

  //Sort table function
  cattable = $('table#catTable').DataTable({
    "aaSorting": [],
    columnDefs: [{
    orderable: false,
    targets: [0,1,6],
    "scrollY": "10vh",
    "scrollCollapse": true,
    "scrollX": true
    }]
  });
  $('.dataTables_length').addClass('bs-select');

  //Filter table function
  document.querySelectorAll('.category-filter select').forEach(function(filter){
    filter.addEventListener('change', function(e){
      const filtered = e.target.selectedOptions[0].value;
      console.log(filtered);
      $('tr[data-class="cat"]').not('.'+filtered).toggle();
      $('tr[data-class="cat"].'+ filtered).css({display: 'table-row'});
    });
  });

//tasks function for add, edit, copy

 $(document).on('click', '.cat-task', function(e){
    //get the route      
    page = $(this).attr('data-href');
    //get the title of the action
    title = $(this).attr('data-title');
    //get the specific task
    func = $(this).attr('data-func');
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
        if (func == 'edit' || func == 'delete')
        {
         
          id = checked[0].closest('tr').getAttribute('id');
        }
        else
        {
          id =$(this).attr('data-id');          
        }        
        document.querySelector('input[name="cat_name"]').value = $('tr#' + id + ' td.name')[0].innerText;
        page = '/menu/edit_cat/' + id;  
        if (func == 'edit')
        {          
          document.querySelector('input[name="active"]').value = $('tr#' + id + ' td.is_active')[0].innerText;
          if ($('tr#' + id + ' td.is_active')[0].getAttribute('data-cat_active') == 'True' )
          {
            document.querySelector('input[name="active"]').checked;
          }
          else
          {
            document.querySelector('input[name="active"]').removeAttribute('checked');
          }
            
          $('#catModal').modal('show');
        }
        else
        { 
          if(func == 'archive')
          {
            document.querySelector('input[name="active"]').removeAttribute('checked');
          }
         if(func == "active")
          {
            document.querySelector('input[name="active"]').setAttribute('checked', 'checked');
          }
          if(func == 'delete')
          {
            let bput = document.createElement('input');
            bput.value = id;
            bput.setAttribute('name', func)
            catform.appendChild(bput);
          }     
          
          $(catform).trigger('submit');        
        }            
      }
    });
  

 //Add/Edit a Categorey
jQuery(catform).on('submit', function(e){
  e.preventDefault();    
  validate(catinputs);
  if(isValid){
    ajaxforms(page, 'POST', catform)
  }else{
    noMatch(catform);
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

      //Function to disable multi row select in table
  
    $(document).on('click','.row-check', function(e){
      //if a row (checkbox) is checked
        if ($(this).prop("checked", true))
        {
          //remove checked property from all checkboxes but (not) this checkbox
          $('.row-check').not($(this)).prop("checked", false);

          //get the check input
          checked = document.querySelectorAll('input.row-check:checked');
        }
        else
        {
          //set checked input to an empty array           
          checked = document.querySelectorAll('input.row-check:checked');
        } 
    });
  



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

$('.cancel').on('click', function(e){
  catform.reset();
});

//Shake if required fields are empty
function noMatch(form){
  jQuery(form).parent().parent().addClass('animated shake');
   setTimeout(function(){
     jQuery(form).parent().parent().removeClass('animated shake');
   }, 1000);
 }

});

function loadElement(){
  $('#staffModal').modal('hide');
  cattable.destroy();
  $('#tableC').load(document.URL +  '  #catTable');
  setTimeout(function(){
    cattable = $('table#catTable').DataTable({
      "aaSorting": [],
      columnDefs: [{
      orderable: false,
      targets: [0,1,6],
      "scrollY": "10vh",
      "scrollCollapse": true,
      "scrollX": true
      }]
    });
    $('.dataTables_length').addClass('bs-select');
  },550)
}