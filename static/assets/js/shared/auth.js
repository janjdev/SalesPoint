
window.addEventListener('DOMContentLoaded', () => {

  let tasks = document.querySelectorAll('.tasks');
  let page;

  tasks.forEach(function(task) {
        task.addEventListener('click', function(e){      
          page = task.getAttribute('data-href');
          console.log(page);
        });
    });

    $("#myModal").on('shown.bs.modal', function () {
      $(this).find("input:visible:first").focus();
  });

  let form = document.querySelector('form#auth');

  $('#cancel').on('click', function(e){
      form.reset();
  });
  
  jQuery(form).on('submit', function(e){
    e.preventDefault();
    let val = document.querySelector('input[name="staffID"]').value;
    if(val != ''){
      ajaxforms(page, 'POST', form)
    }
    else{
      noMatch(form)
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


  function goToAdmin(){
    window.location.href='/admin';
  }


  function noMatch(form){
   jQuery(form).parent().parent().addClass('animated shake');
    setTimeout(function(){
      jQuery(form).parent().parent().removeClass('animated shake');
    }, 1000);
  }

});

