
window.addEventListener('DOMContentLoaded', () => {
let url,  type, form, id;

 $('body').on('click', '.btn-bump', function(e){
    id = $(this).attr('data-id');
    url = '/orderticket/' + id;
    type = 'POST';
    form = id;

    ajaxforms(url, type, form);
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

  function reload(){
  location.reload();
  }
});