
window.addEventListener('DOMContentLoaded', () => {
let url,  type, form, id, isValid=true;

 $(document).on('click', '.btn-bump', function(e){
    id = $(this).attr('data-id');
    url = '/orderticket/' + id;
    type = 'POST';
    form = id;

    ajaxforms(url, type, form);
});

$(document).on('click', '#searchticket', function(e){
  e.preventDefault();
  form = document.getElementById('ticketSearch');
  validate(form.querySelectorAll('input[name="open"]'))
  if (isValid)
  {
    $('#ticketSearch').trigger('submit');
  }
  else{
    noMatch(form);
    isValid=true;
  } 
});

$('#ticketSearch').on('submit', function(e){
  e.preventDefault();
  url = '/orderticket';
  type = 'POST';
  form = $(this);
  ajaxforms(url, type, form);
})

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
        title: response.title,
        text: response.message,
        timer: response.timer,
        onClose: callback
      })
      
    })
  }

  function validate(args){
    let fields = [];
    args.forEach(el => fields.push(el));
    console.log(fields);
    fields.forEach(function(el){
      if (el.value == '' || /\S/.test(el.value) == false)
      {
        isValid = false;
        console.log(el.value);
      }     
    });    

  }

  function noMatch(form){
    jQuery(form).parent().parent().addClass('animated shake');
     setTimeout(function(){
       jQuery(form).parent().parent().removeClass('animated shake');
     }, 1000);
   }

  function reload(){
    location.reload();
  }
});