window.addEventListener('DOMContentLoaded', () => {

    const ra = '(\d{1,2}\/\d{1,2}\/\d{2,4}.\d{1,2}:\d{1,2}.?(\w{2}))';
    let isValid = true;

    $('.datetimepicker1').datetimepicker({
        // format: 'MM/DD/YYYY',
        maxDate: moment(),
        icons: {
            time: "fa fa-clock-o",
            date: "fa fa-calendar",
            up: "fa fa-chevron-up",
            down: "fa fa-chevron-down",
            previous: 'fa fa-chevron-left',
            next: 'fa fa-chevron-right',
            today: 'fa fa-screenshot',
            clear: 'fa fa-trash',
            close: 'fa fa-remove'
        }
     });

     $('.datetimepicker2').datetimepicker({
        // format: 'MM/DD/YYYY',
        maxDate: moment(),
        icons: {
            time: "fa fa-clock-o",
            date: "fa fa-calendar",
            up: "fa fa-chevron-up",
            down: "fa fa-chevron-down",
            previous: 'fa fa-chevron-left',
            next: 'fa fa-chevron-right',
            today: 'fa fa-screenshot',
            clear: 'fa fa-trash',
            close: 'fa fa-remove'
        }
     });

    $('#reportForm').on('submit', function(e){  
        e.preventDefault();      
        let form = $(this);
        let inputs = $(form).find('input, select').toArray();
        validate(inputs);
        if (!isValid){
            noMatch(form)
            isValid = true;
            return;
        }
        else
        {
            let d1 = new Date($('.datetimepicker1').val());
            let d2 = new Date($('.datetimepicker2').val());
            if(d1 > d2){
                Swal.fire({
                    type: 'error',
                    title: 'Date Mismatch',
                    text: 'From Date cannot be greater than To Date',
                    timer: 5000
                  });
                return;
            }
        }
        ajaxReports(form);

       
    })


    function ajaxReports(form){
        $.ajax({
            url: '/reports',
            type: 'POST',
            data: $(form).serialize(),
            success: function(resp){
                $('#holder').removeClass('zoomIn')
                $('#holder').addClass('zoomOut');
               
                if ($('#data').hasClass('zoomIn'))
                {
                    $('#data').removeClass('zoomIn')
                    $('#data').addClass('zoomOut')
                    setTimeout(function(){
                        $('#data').removeClass('zoomOut')
                        $('#data').addClass('zoomIn')      
                    }, 50) 

                              
                }
                $('#data').empty();                              
                $('#data').addClass('zoomIn');               
                $('#data').append(resp.data);
            }
        })
    }

    function validate(args){
        let fields = [];
        args.forEach(el => fields.push(el));
        fields.forEach(function(el){
            if(el.dataset.type != 'date')
            {
                if (el.value == '' || /\S/.test(el.value) == false)
                {
                    console.log(el);
                    isValid = false;
                }
            }
                else if (el.dataset.type == 'rate'){
                    str = el.value.replace(/\$|%/g,'')
                    if(!re.test(str)){
                        console.log(el);
                    isValid = false;
                    }
                }
                else if (el.dataset.type == 'date'){
                    if(!ra.test(el.value)){
                        console.log(el);
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

  // Create WYSIWYG functions for rich text editors
  $('.tools a').mousedown(function(e){
    e.preventDefault();
    let command = $(this).data('command');
    if(command == 'bold' || command == 'underline' || command == 'strikeThrough' || command == 'superscript'){
        document.execCommand($(this).data('command'), false, null);
    }
    if(command == 'backColor' || command == 'foreColor'){
      $(this).next().children('input').trigger('click');
        let input = $(this).next().children();      
        input.on('change', function(e){
        let val = $(input).val();
        document.execCommand(command, false, val);
      })
    }
    else if(command == 'heading'){
      $(this).parent().addClass('active');
      let headings = $(this).next().find('select');
       headings.on('change', function(e){
         let val = e.target.value;
         document.execCommand('formatBlock', false, val);
        $(this).parent().removeClass('active');
       });
    }
    if (command == 'fontSize' || command == 'fontName') {
        $(this).parent().addClass('active');
        let com = $(this).next().find('select');
        com.on('click change', function(e){
        let val = e.target.value;     
        document.execCommand(command, false, val);
        $(this).parent().removeClass('active');
      })   
    }
    else if (command == 'createlink') {
      url = prompt('Enter the link here: ', 'http:\/\/');
      document.execCommand($(this).data('command'), false, url);
    } 
    else if(command == 'insertImage'){
      $("#uploadsGallery").modal();
      $('.ftco-animate').addClass('fadeInUp ftco-animated')
      let check = $(this).next().find('input.form-check-input');
      let val;
	    check.on('change', function(e){
       val = $(this).val();          
      });     
      $('#insertImg').unbind('click').click(function (e) {
        placeCaretAtEnd(editDiv);
        document.execCommand(command, false, val);
        check.prop('checked',  false);
        placeCaretAtEnd(editDiv);        
      });
    }
    else
    {
      document.execCommand($(this).data('command'), false, null);
      } 
    });
});