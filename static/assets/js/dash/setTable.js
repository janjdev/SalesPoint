window.addEventListener('DOMContentLoaded', () => {

    const multi = document.querySelector('#multiForm');
    let isValid = true;


//Sort the table
$('#tablesTable').DataTable({
    "aaSorting": [],
    columnDefs: [{
    orderable: false,
    targets: [0,1,2,7]
    }]
  });
  $('.dataTables_length').addClass('bs-select');  

jQuery(multi).on('submit', function(e){
    e.preventDefault();  
    validate(multi.querySelectorAll('inputs'))
    console.log(isValid);
    if(isValid){
    simpleAjaxforms('/table-multi-add/', 'POST', multi)
    }else{
      noMatch(multi);
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
  else if (el.dataset.type == 'rate'){
    if(!re.test(el.value)){
      isValid = false;
    }
  }
  else if (el.dataset.type == 'text'){
    if(!ra.test(el.value)){
      isValid = false;
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

}); //End of doc read function

//---------------Callbacks----------------------------------
function loadTable(){
$('#taxModal').modal('hide');
$('#taxRow').load(document.URL +  '  #tax_table');
}

function reload(){
location.reload();
}

