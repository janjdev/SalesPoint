window.addEventListener('DOMContentLoaded', () => {

  let isValid = true;

    const form = document.querySelector('form#wizard');
    $(document).on('click', '#finished', function(e){
        e.preventDefault();
        validate(form.querySelectorAll('input.dbAction'));
        console.log(isValid);
        if(isValid){        
        ajaxforms('/first', 'POST', form)
        }
        else{
          noMatch(form);
          isValid = true;
        }
    })


     //validate form fields - checks that fields are not empty
 function validate(args){
  let fields = [];
  args.forEach(el => fields.push(el));
  fields.forEach(function(el){
    if (el.value == '' || /\S/.test(el.value) == false)
    {
      isValid = false;
      console.log(el);
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

