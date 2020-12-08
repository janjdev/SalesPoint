function scrollbtn(rightel, leftel, container, scrollW){

    $(document).on('click', $(rightel), function(event) {
        event.preventDefault();
        let currentScroll = $(container).get(0).scrollLeft;
        let scrollWidth = $(container).get(0).scrollWidth;
        if((currentScroll - scrollW) <= 0){
              return;
        }else{
              $(container).animate({
                  scrollLeft: scrollW+'px'
              }, "slow");
        }
      });
      
      $(document).on('click', $(leftel), function(event) {
        event.preventDefault();
        let currentScroll = $(container).get(0).scrollLeft;
        let scrollWidth = $(container).get(0).scrollWidth;
        if((scrollW + currentScroll) >= scrollWidth){
              return;
        }else{
              $(container).animate({
                  scrollLeft: scrollW+'px'
              }, "slow");
        }
      });

    }

scrollbtn(document.getElementById('nextdis'), document.getElementById('prevdis'), document.getElementById('discountsBody'), 50);
