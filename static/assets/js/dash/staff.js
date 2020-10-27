window.addEventListener('DOMContentLoaded', () => {
  let tasks = document.querySelectorAll('.staff-tasks');
  let page;
  let title;
  const modalTitle = document.querySelector('#modal-title');
  let form = document.querySelector('form#staff');

  tasks.forEach(function(task) {
        task.addEventListener('click', function(e){      
          page = task.getAttribute('data-href');
          title = task.getAttribute('data-title');
          modalTitle.innerText = title
          form.setAttribute('action', page);
        });
    }); 

  $('#cancel').on('click', function(e){
      form.reset();
  });

  jQuery(form).on('submit', function(e){
    e.preventDefault();
    let fname = document.querySelector('input[name="fname"]').value;
    let lname = document.querySelector('input[name="lname"]').value;
    let role = document.querySelector('#staff_role').value;
    let pos = document.querySelector('#staff_pos').value;
    if(role && pos && lname && fname != ''){
      ajaxforms(page, 'POST', form)
    }
    else{
      noMatch(form);
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


  function goToRegister(){
    window.location.href = '/register';
  }
function goToAdmin(){
  window.location.href='/admin';
  }
function goToLogin(){
  window.location.href ='/login';
  }
  function loadStaffTable(){
    document.querySelectorAll('.modal-backdrop')[0].remove();
    $('#staffModal').removeClass('show').css({'display': 'none'});
    
    
    $('#staff_table').load(document.URL +  '  #stafflist');
    
}
function clearPassFields(){
  $(document.querySelectorAll('input[type="password"]')).each(function(){$(this).val("");})    
  }
function clearEmailFields(){
  $(document.querySelectorAll('input[type="email"]')).each(function(){$(this).val("");})
  }
function unlock(url){
  window.location.href= url;
  }


  function noMatch(form){
   jQuery(form).parent().parent().addClass('animated shake');
    setTimeout(function(){
      jQuery(form).parent().parent().removeClass('animated shake');
    }, 1000);
  }

});


