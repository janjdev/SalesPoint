window.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form#wizard');
    $(document).on('click', '#finished', function(e){
        e.preventDefault();
        ajaxforms('/first', 'POST', form)
    })

   
    $(document).on('click', 'button#savID', function(e){
        e.preventDefault();
        window.location.replace('/');
    });      
      
});

  function ajaxforms(url, type, form){
    $.ajax({
      url: url,
      type: type,
      data: $(form).serialize()
    })
    .done(function(response){        
      let callback = eval(response.callback)
      if(response.param)
      {            
        callback = callback(response.param)
      }
      $('#userID p#id').text(response.message) 
      $('#userID').modal('show');
    })
}